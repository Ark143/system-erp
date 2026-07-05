from rest_framework import viewsets, permissions, filters
from .models import Supplier, PurchaseRequisition, PurchaseRequisitionItem, PurchaseOrder, PurchaseOrderItem, GoodsReceipt, SupplierInvoice, GRNItem
from .serializers import SupplierSerializer, PurchaseRequisitionSerializer, PurchaseRequisitionItemSerializer, PurchaseOrderSerializer, PurchaseOrderItemSerializer, GoodsReceiptSerializer, SupplierInvoiceSerializer, GRNItemSerializer

class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['code', 'name', 'email']
    ordering_fields = ['name', 'created_at']

class PurchaseRequisitionViewSet(viewsets.ModelViewSet):
    queryset = PurchaseRequisition.objects.all()
    serializer_class = PurchaseRequisitionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['pr_no', 'department']
    ordering_fields = ['-created_at']

class PurchaseRequisitionItemViewSet(viewsets.ModelViewSet):
    queryset = PurchaseRequisitionItem.objects.all()
    serializer_class = PurchaseRequisitionItemSerializer
    permission_classes = [permissions.IsAuthenticated]

class PurchaseOrderViewSet(viewsets.ModelViewSet):
    queryset = PurchaseOrder.objects.all()
    serializer_class = PurchaseOrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['po_no', 'supplier__code', 'supplier__name']
    ordering_fields = ['-po_date', '-created_at']

class PurchaseOrderItemViewSet(viewsets.ModelViewSet):
    queryset = PurchaseOrderItem.objects.all()
    serializer_class = PurchaseOrderItemSerializer
    permission_classes = [permissions.IsAuthenticated]

class GoodsReceiptViewSet(viewsets.ModelViewSet):
    queryset = GoodsReceipt.objects.all()
    serializer_class = GoodsReceiptSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['grn_no', 'purchase_order__po_no']
    ordering_fields = ['-received_date', '-created_at']

class SupplierInvoiceViewSet(viewsets.ModelViewSet):
    queryset = SupplierInvoice.objects.all()
    serializer_class = SupplierInvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['invoice_no', 'supplier__name']
    ordering_fields = ['-invoice_date', '-created_at']

class GRNItemViewSet(viewsets.ModelViewSet):
    queryset = GRNItem.objects.all()
    serializer_class = GRNItemSerializer
    permission_classes = [permissions.IsAuthenticated]
