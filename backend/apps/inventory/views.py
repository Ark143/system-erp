from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.db.models import F
from apps.users.rbac import ModuleRBAC
from .models import Category, Item, StockMove
from .serializers import CategorySerializer, ItemSerializer, StockMoveSerializer
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
class StockMoveViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = StockMove.objects.select_related('item', 'created_by').all()
    serializer_class = StockMoveSerializer
    permission_classes = [permissions.IsAuthenticated, ModuleRBAC("inventory")]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['item__sku', 'item__name', 'reference']
    ordering_fields = ['created_at']
