from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.utils import timezone
from .models import Customer, SalesOrder, SalesOrderItem, Shipment, SalesInvoice
from .serializers import CustomerSerializer, SalesOrderSerializer, SalesOrderItemSerializer, ShipmentSerializer, SalesInvoiceSerializer

class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'code', 'email']
    ordering_fields = ['name', 'created_at']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class SalesOrderViewSet(viewsets.ModelViewSet):
    queryset = SalesOrder.objects.select_related('customer', 'created_by', 'approved_by').prefetch_related('items').all()
    serializer_class = SalesOrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['order_no', 'customer__name']
    ordering_fields = ['order_date', 'created_at']

    @transaction.atomic
    def perform_create(self, serializer):
        so = serializer.save(created_by=self.request.user)
        self._recompute(so)

    @transaction.atomic
    def perform_update(self, serializer):
        so = serializer.save()
        self._recompute(so)

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        so = self.get_object()
        if so.status not in (SalesOrder.SO_STATUS_DRAFT, SalesOrder.SO_STATUS_REJECTED):
            return Response({'detail': 'INVALID_STATUS'}, status=status.HTTP_400_BAD_REQUEST)
        so.status = SalesOrder.SO_STATUS_SUBMITTED
        so.save(update_fields=['status', 'updated_at'])
        return Response({'status': so.status})

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        so = self.get_object()
        if so.status != SalesOrder.SO_STATUS_SUBMITTED:
            return Response({'detail': 'INVALID_STATUS'}, status=status.HTTP_400_BAD_REQUEST)
        so.status = SalesOrder.SO_STATUS_APPROVED
        so.approved_by = request.user
        so.save(update_fields=['status', 'approved_by', 'updated_at'])
        return Response({'status': so.status})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        so = self.get_object()
        if so.status != SalesOrder.SO_STATUS_SUBMITTED:
            return Response({'detail': 'INVALID_STATUS'}, status=status.HTTP_400_BAD_REQUEST)
        so.status = SalesOrder.SO_STATUS_REJECTED
        so.save(update_fields=['status', 'updated_at'])
        return Response({'status': so.status})

    def _recompute(self, so):
        items = so.items.all()
        so.total_amount = sum(i.line_total for i in items)
        so.tax_amount = so.total_amount * 0
        so.grand_total = so.total_amount + so.tax_amount
        so.save(update_fields=['total_amount', 'tax_amount', 'grand_total', 'updated_at'])

class SalesOrderItemViewSet(viewsets.ModelViewSet):
    queryset = SalesOrderItem.objects.select_related('sales_order', 'item').all()
    serializer_class = SalesOrderItemSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['sales_order__order_no', 'item__sku']

class ShipmentViewSet(viewsets.ModelViewSet):
    queryset = Shipment.objects.select_related('sales_order', 'created_by').all()
    serializer_class = ShipmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['shipment_no', 'sales_order__order_no']
    ordering_fields = ['ship_date']

class SalesInvoiceViewSet(viewsets.ModelViewSet):
    queryset = SalesInvoice.objects.select_related('sales_order', 'customer', 'created_by').all()
    serializer_class = SalesInvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['invoice_no', 'customer__name']
    ordering_fields = ['invoice_date']
