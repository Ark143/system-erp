from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db import transaction
from django.db.models import F, Sum, Q
from apps.users.rbac import ModuleRBAC
from .models import Category, Item, StockMove, Warehouse, InventorySettings
from .serializers import CategorySerializer, ItemSerializer, StockMoveSerializer, WarehouseSerializer, InventorySettingsSerializer


def is_admin_or_manager(user):
    return getattr(user, 'role', None) in ('ADMIN', 'MANAGER')


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated, ModuleRBAC("inventory")]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']

    def get_permissions(self):
        if self.request.method in ('POST', 'PUT', 'PATCH', 'DELETE'):
            return [permissions.IsAdminUser()]
        return super().get_permissions()


class ItemViewSet(viewsets.ModelViewSet):
    queryset = Item.objects.select_related('category', 'created_by').all()
    serializer_class = ItemSerializer
    permission_classes = [permissions.IsAuthenticated, ModuleRBAC("inventory")]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['sku', 'name']
    ordering_fields = ['sku', 'name', 'qty_on_hand', 'created_at']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @transaction.atomic
    def perform_update(self, serializer):
        instance = serializer.save()
        if instance.is_active is False:
            instance.qty_on_hand = 0
            instance.save(update_fields=['qty_on_hand'])

    @action(detail=True, methods=['post'])
    def adjust(self, request, pk=None):
        item = self.get_object()
        move_type = request.data.get('move_type')
        qty = request.data.get('qty')
        reference = request.data.get('reference', '')
        notes = request.data.get('notes', '')
        if move_type not in ('IN', 'OUT'):
            return Response({'detail': 'INVALID_MOVE_TYPE'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            qty = float(qty)
        except (TypeError, ValueError):
            return Response({'detail': 'INVALID_QTY'}, status=status.HTTP_400_BAD_REQUEST)
        if qty <= 0:
            return Response({'detail': 'QTY_MUST_BE_POSITIVE'}, status=status.HTTP_400_BAD_REQUEST)
        if move_type == 'OUT' and float(item.qty_on_hand) < qty:
            return Response({'detail': 'INSUFFICIENT_STOCK'}, status=status.HTTP_400_BAD_REQUEST)
        StockMove.objects.create(item=item, move_type=move_type, qty=qty, reference=reference, notes=notes, created_by=request.user)
        if move_type == 'IN':
            Item.objects.filter(pk=item.pk).update(qty_on_hand=F('qty_on_hand') + qty)
        else:
            Item.objects.filter(pk=item.pk).update(qty_on_hand=F('qty_on_hand') - qty)
        item.refresh_from_db()
        return Response(ItemSerializer(item, context={'request': request}).data)


class StockMoveViewSet(viewsets.ModelViewSet):
    queryset = StockMove.objects.select_related('item', 'created_by').all()
    serializer_class = StockMoveSerializer
    permission_classes = [permissions.IsAuthenticated, ModuleRBAC("inventory")]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['item__sku', 'item__name', 'reference', 'source_warehouse', 'target_warehouse', 'warehouse']
    ordering_fields = ['created_at', 'qty', 'move_type']

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['required_warehouse_fields'] = True
        return ctx

    def get_queryset(self):
        qs = super().get_queryset()
        wh = self.request.query_params.get('warehouse')
        source = self.request.query_params.get('source_warehouse')
        target = self.request.query_params.get('target_warehouse')
        item_id = self.request.query_params.get('item')
        move_type = self.request.query_params.get('move_type')
        ref = self.request.query_params.get('reference')
        start = self.request.query_params.get('start_date')
        end = self.request.query_params.get('end_date')
        if wh:
            qs = qs.filter(Q(warehouse=wh) | Q(source_warehouse=wh) | Q(target_warehouse=wh))
        if source:
            qs = qs.filter(source_warehouse=source)
        if target:
            qs = qs.filter(target_warehouse=target)
        if item_id:
            qs = qs.filter(item_id=item_id)
        if move_type in StockMove.MOVE_TYPE_CHOICES:
            qs = qs.filter(move_type=move_type)
        if ref:
            qs = qs.filter(reference__icontains=ref)
        if start:
            from django.utils.dateparse import parse_date as _parse_date
            _start = _parse_date(start)
            if _start:
                qs = qs.filter(created_at__date__gte=_start)
        if end:
            from django.utils.dateparse import parse_date as _parse_date
            _end = _parse_date(end)
            if _end:
                qs = qs.filter(created_at__date__lte=_end)
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class WarehouseViewSet(viewsets.ModelViewSet):
    queryset = Warehouse.objects.all()
    serializer_class = WarehouseSerializer
    permission_classes = [permissions.IsAuthenticated, ModuleRBAC("inventory")]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["code", "name", "branch", "address", "contact_person"]
    ordering_fields = ["code", "name", "created_at", "status"]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class InventorySettingsViewSet(viewsets.ModelViewSet):
    queryset = InventorySettings.objects.filter(is_active=True)
    serializer_class = InventorySettingsSerializer
    permission_classes = [permissions.IsAuthenticated, ModuleRBAC("inventory")]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ["-updated_at"]

    def get_queryset(self):
        qs = super().get_queryset()
        company = self.request.query_params.get('company')
        if company:
            qs = qs.filter(company_id=company)
        return qs


class InventoryJournalView(APIView):
    permission_classes = [permissions.IsAuthenticated, ModuleRBAC("inventory")]

    def get(self, request):
        item_id = request.query_params.get('item')
        move_type = request.query_params.get('move_type')
        ref = request.query_params.get('reference')
        start = request.query_params.get('start_date')
        end = request.query_params.get('end_date')
        summary_only = request.query_params.get('summary_only') in ('1', 'true', 'yes')

        qs = StockMove.objects.select_related('item', 'created_by').all()

        if item_id:
            qs = qs.filter(item_id=item_id)
        if move_type in ('IN', 'OUT'):
            qs = qs.filter(move_type=move_type)
        if ref:
            qs = qs.filter(reference__icontains=ref)
        if start:
            from django.utils.dateparse import parse_date as _parse_date
            _start = _parse_date(start)
            if _start:
                qs = qs.filter(created_at__date__gte=_start)
        if end:
            from django.utils.dateparse import parse_date as _parse_date
            _end = _parse_date(end)
            if _end:
                qs = qs.filter(created_at__date__lte=_end)

        qs = qs.order_by('item__sku', 'created_at', 'id')

        running_balance = {}
        rows = []
        total_in = 0.0
        total_out = 0.0
        for move in qs:
            item = move.item
            key = item.pk
            balance_after = float(getattr(item, 'qty_on_hand') or 0)
            delta = float(move.qty or 0)
            if move.move_type == 'IN':
                total_in += delta
            else:
                total_out += delta

            previous = running_balance.get(key) if key in running_balance else (balance_after - (delta if move.move_type == 'IN' else -delta))
            balance = float(previous) + (delta if move.move_type == 'IN' else -delta)
            running_balance[key] = balance

            rows.append({
                'id': move.pk,
                'created_at': move.created_at,
                'item_id': item.pk,
                'sku': item.sku,
                'item_name': item.name,
                'uom': item.uom,
                'warehouse': item.warehouse,
                'move_type': move.move_type,
                'qty': delta,
                'reference': move.reference or '',
                'notes': move.notes or '',
                'created_by': getattr(move.created_by, 'email', None),
                'balance_after': balance,
            })

        item_summary = []
        seen = {}
        for r in rows:
            if r['item_id'] not in seen:
                seen[r['item_id']] = {
                    'item_id': r['item_id'],
                    'sku': r['sku'],
                    'item_name': r['item_name'],
                    'uom': r['uom'],
                    'warehouse': r['warehouse'],
                    'opening': 0.0,
                    'in_qty': 0.0,
                    'out_qty': 0.0,
                    'closing': 0.0,
                }
            row_summary = seen[r['item_id']]
            if r['move_type'] == 'IN':
                row_summary['in_qty'] += r['qty']
            else:
                row_summary['out_qty'] += r['qty']

        final = []
        for summary in seen.values():
            first_balance = next((r['balance_after'] for r in rows if r['item_id'] == summary['item_id']), 0.0)
            opening = first_balance - (summary['in_qty'] - summary['out_qty'])
            closing = next((r['balance_after'] for r in reversed(rows) if r['item_id'] == summary['item_id']), opening)
            summary['opening'] = opening
            summary['closing'] = closing
            summary['net_qty'] = summary['in_qty'] - summary['out_qty']
            final.append(summary)

        summary_payload = {
            'transaction_count': len(rows),
            'total_in': total_in,
            'total_out': total_out,
            'net_qty': total_in - total_out,
            'item_count': len(final),
        }

        payload = {
            'summary': summary_payload,
            'items': final,
            'rows': rows,
        }
        if summary_only:
            payload['rows'] = []
        return Response(payload)


class StockBalancesReportView(APIView):
    permission_classes = [permissions.IsAuthenticated, ModuleRBAC("inventory")]

    def get(self, request):
        include_history = request.query_params.get('include_history') in ('1', 'true', 'yes')
        item_id = request.query_params.get('item')
        warehouse = request.query_params.get('warehouse')
        qs = StockMove.objects.select_related('item', 'created_by').all()
        if item_id:
            qs = qs.filter(item_id=item_id)
        if warehouse:
            qs = qs.filter(item__warehouse=warehouse)
        qs = qs.order_by('item__sku', 'created_at', 'id')

        running_balance = {}
        rows = []
        total_in = 0.0
        total_out = 0.0
        for move in qs:
            item = move.item
            key = item.pk
            balance_after = float(getattr(item, 'qty_on_hand') or 0)
            delta = float(move.qty or 0)
            if move.move_type == 'IN':
                total_in += delta
            else:
                total_out += delta

            previous = running_balance.get(key) if key in running_balance else (balance_after - (delta if move.move_type == 'IN' else -delta))
            balance = float(previous) + (delta if move.move_type == 'IN' else -delta)
            running_balance[key] = balance

            rows.append({
                'id': move.pk,
                'created_at': move.created_at,
                'item_id': item.pk,
                'sku': item.sku,
                'item_name': item.name,
                'uom': item.uom,
                'warehouse': item.warehouse,
                'move_type': move.move_type,
                'qty': delta,
                'reference': move.reference or '',
                'notes': move.notes or '',
                'created_by': getattr(move.created_by, 'email', None),
                'balance_after': balance,
            })

        items = []
        seen = {}
        for r in rows:
            if r['item_id'] not in seen:
                seen[r['item_id']] = {
                    'item_id': r['item_id'],
                    'sku': r['sku'],
                    'item_name': r['item_name'],
                    'uom': r['uom'],
                    'warehouse': r['warehouse'],
                    'opening': 0.0,
                    'in_qty': 0.0,
                    'out_qty': 0.0,
                    'closing': 0.0,
                }
            s = seen[r['item_id']]
            if r['move_type'] == 'IN':
                s['in_qty'] += r['qty']
            else:
                s['out_qty'] += r['qty']

        for s in seen.values():
            first_balance = next((r['balance_after'] for r in rows if r['item_id'] == s['item_id']), 0.0)
            opening = first_balance - (s['in_qty'] - s['out_qty'])
            closing = next((r['balance_after'] for r in reversed(rows) if r['item_id'] == s['item_id']), opening)
            s['opening'] = opening
            s['closing'] = closing
            s['net_qty'] = s['in_qty'] - s['out_qty']
            items.append(s)

        summary = {
            'transaction_count': len(rows),
            'total_in': total_in,
            'total_out': total_out,
            'net_qty': total_in - total_out,
            'item_count': len(items),
        }

        payload = {
            'summary': summary,
            'items': items,
            'rows': rows,
        }
        if not include_history:
            payload['rows'] = []
        return Response(payload)
