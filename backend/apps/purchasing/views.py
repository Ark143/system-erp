from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from .models import Supplier, PurchaseRequisition, PurchaseRequisitionItem, PurchaseOrder, PurchaseOrderItem, GoodsReceipt, SupplierInvoice
from .serializers import SupplierSerializer, PurchaseRequisitionSerializer, PurchaseRequisitionItemSerializer, PurchaseOrderSerializer, PurchaseOrderItemSerializer, GoodsReceiptSerializer, SupplierInvoiceSerializer

class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'code', 'email']
    ordering_fields = ['name', 'created_at']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class PurchaseRequisitionViewSet(viewsets.ModelViewSet):
    queryset = PurchaseRequisition.objects.select_related('requester', 'approved_by').prefetch_related('items').all()
    serializer_class = PurchaseRequisitionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['pr_no', 'department']
    ordering_fields = ['created_at', 'required_date']

    def perform_create(self, serializer):
        serializer.save(requester=self.request.user)

    @transaction.atomic
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        pr = self.get_object()
        if pr.status not in (PurchaseRequisition.PR_STATUS_DRAFT, PurchaseRequisition.PR_STATUS_REJECTED):
            return Response({'detail': 'INVALID_STATUS'}, status=status.HTTP_400_BAD_REQUEST)
        pr.status = PurchaseRequisition.PR_STATUS_SUBMITTED
        pr.save(update_fields=['status', 'updated_at'])
        return Response({'status': pr.status})

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        pr = self.get_object()
        if pr.status != PurchaseRequisition.PR_STATUS_SUBMITTED:
            return Response({'detail': 'INVALID_STATUS'}, status=status.HTTP_400_BAD_REQUEST)
        pr.status = PurchaseRequisition.PR_STATUS_APPROVED
        pr.approved_by = request.user
        pr.save(update_fields=['status', 'approved_by', 'updated_at'])
        return Response({'status': pr.status})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        pr = self.get_object()
        if pr.status != PurchaseRequisition.PR_STATUS_SUBMITTED:
            return Response({'detail': 'INVALID_STATUS'}, status=status.HTTP_400_BAD_REQUEST)
        pr.status = PurchaseRequisition.PR_STATUS_REJECTED
        pr.save(update_fields=['status', 'updated_at'])
        return Response({'status': pr.status})

class PurchaseRequisitionItemViewSet(viewsets.ModelViewSet):
    queryset = PurchaseRequisitionItem.objects.select_related('pr', 'item').all()
    serializer_class = PurchaseRequisitionItemSerializer
    permission_classes = [permissions.IsAuthenticated]

class PurchaseOrderViewSet(viewsets.ModelViewSet):
    queryset = PurchaseOrder.objects.select_related('supplier', 'pr', 'created_by', 'approved_by').prefetch_related('items').all()
    serializer_class = PurchaseOrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['po_no', 'supplier__name']
    ordering_fields = ['po_date', 'created_at']

    def perform_create(self, serializer):
        po = serializer.save(created_by=self.request.user)
        self._recompute(po)

    @transaction.atomic
    def perform_update(self, serializer):
        po = serializer.save()
        self._recompute(po)

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        po = self.get_object()
        if po.status not in (PurchaseOrder.PO_STATUS_DRAFT, PurchaseOrder.PO_STATUS_REJECTED):
            return Response({'detail': 'INVALID_STATUS'}, status=status.HTTP_400_BAD_REQUEST)
        po.status = PurchaseOrder.PO_STATUS_SUBMITTED
        po.save(update_fields=['status', 'updated_at'])
        return Response({'status': po.status})

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        po = self.get_object()
        if po.status != PurchaseOrder.PO_STATUS_SUBMITTED:
            return Response({'detail': 'INVALID_STATUS'}, status=status.HTTP_400_BAD_REQUEST)
        po.status = PurchaseOrder.PO_STATUS_APPROVED
        po.approved_by = request.user
        po.save(update_fields=['status', 'approved_by', 'updated_at'])
        return Response({'status': po.status})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        po = self.get_object()
        if po.status != PurchaseOrder.PO_STATUS_SUBMITTED:
            return Response({'detail': 'INVALID_STATUS'}, status=status.HTTP_400_BAD_REQUEST)
        po.status = PurchaseOrder.PO_STATUS_REJECTED
        po.save(update_fields=['status', 'updated_at'])
        return Response({'status': po.status})

    def _recompute(self, po):
        items = po.items.all()
        po.total_amount = sum(i.line_total for i in items)
        po.tax_amount = po.total_amount * 0
        po.grand_total = po.total_amount + po.tax_amount
        po.save(update_fields=['total_amount', 'tax_amount', 'grand_total', 'updated_at'])

class PurchaseOrderItemViewSet(viewsets.ModelViewSet):
    queryset = PurchaseOrderItem.objects.select_related('purchase_order', 'item').all()
    serializer_class = PurchaseOrderItemSerializer
    permission_classes = [permissions.IsAuthenticated]

class GoodsReceiptViewSet(viewsets.ModelViewSet):
    queryset = GoodsReceipt.objects.select_related('purchase_order', 'created_by').all()
    serializer_class = GoodsReceiptSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['grn_no', 'purchase_order__po_no']
    ordering_fields = ['received_date']

class SupplierInvoiceViewSet(viewsets.ModelViewSet):
    queryset = SupplierInvoice.objects.select_related('supplier', 'purchase_order', 'created_by').all()
    serializer_class = SupplierInvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['invoice_no', 'supplier__name']
    ordering_fields = ['invoice_date']
