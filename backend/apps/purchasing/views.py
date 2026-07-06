from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.utils import timezone
from apps.sku_settings.models import allocate_doc_number
from .models import Supplier, PurchaseRequisition, PurchaseRequisitionItem, PurchaseOrder, PurchaseOrderItem, Quotation, QuotationItem, GoodsReceipt, SupplierInvoice, GRNItem
from .serializers import SupplierSerializer, PurchaseRequisitionSerializer, PurchaseRequisitionItemSerializer, PurchaseOrderSerializer, PurchaseOrderItemSerializer, QuotationSerializer, QuotationItemSerializer, GoodsReceiptSerializer, SupplierInvoiceSerializer, GRNItemSerializer
class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    permission_classes = [permissions.IsAuthenticated, ModuleRBAC("purchasing")]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['code', 'name', 'email']
    ordering_fields = ['name', 'created_at']
class PurchaseRequisitionViewSet(viewsets.ModelViewSet):
    queryset = PurchaseRequisition.objects.all()
    serializer_class = PurchaseRequisitionSerializer
    permission_classes = [permissions.IsAuthenticated, ModuleRBAC("purchasing")]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['pr_no', 'department']
    ordering_fields = ['-created_at']

    @transaction.atomic
    def perform_create(self, serializer):
        company_id = getattr(self.request.user, 'company_id', None)
        pr_no = allocate_doc_number('PR', 'PR', company_id=company_id, padding=4)
        serializer.save(pr_no=pr_no)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, ModuleRBAC("purchasing")])
    def submit(self, request, pk=None):
        pr = self.get_object()
        pr.status = PurchaseRequisition.PR_STATUS_SUBMITTED
        pr.save()
        return Response({'status': 'submitted'})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, ModuleRBAC("purchasing")])
    def approve(self, request, pk=None):
        pr = self.get_object()
        pr.status = PurchaseRequisition.PR_STATUS_APPROVED
        pr.approved_by = request.user
        pr.save()
        return Response({'status': 'approved'})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, ModuleRBAC("purchasing")])
    def reject(self, request, pk=None):
        pr = self.get_object()
        pr.status = PurchaseRequisition.PR_STATUS_REJECTED
        pr.save()
        return Response({'status': 'rejected'})
class PurchaseRequisitionItemViewSet(viewsets.ModelViewSet):
    queryset = PurchaseRequisitionItem.objects.all()
    serializer_class = PurchaseRequisitionItemSerializer
    permission_classes = [permissions.IsAuthenticated, ModuleRBAC("purchasing")]
class PurchaseOrderViewSet(viewsets.ModelViewSet):
    queryset = PurchaseOrder.objects.all()
    serializer_class = PurchaseOrderSerializer
    permission_classes = [permissions.IsAuthenticated, ModuleRBAC("purchasing")]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['po_no', 'supplier__code', 'supplier__name']
    ordering_fields = ['-po_date', '-created_at']

    @transaction.atomic
    def perform_create(self, serializer):
        company_id = getattr(self.request.user, 'company_id', None)
        po_no = allocate_doc_number('PO', 'PO', company_id=company_id, padding=4)
        serializer.save(po_no=po_no)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, ModuleRBAC("purchasing")])
    def submit(self, request, pk=None):
        order = self.get_object()
        order.status = PurchaseOrder.PO_STATUS_SUBMITTED
        order.save()
        return Response({'status': 'submitted'})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, ModuleRBAC("purchasing")])
    def approve(self, request, pk=None):
        order = self.get_object()
        order.status = PurchaseOrder.PO_STATUS_APPROVED
        order.approved_by = request.user
        order.save()
        return Response({'status': 'approved'})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, ModuleRBAC("purchasing")])
    def reject(self, request, pk=None):
        order = self.get_object()
        order.status = PurchaseOrder.PO_STATUS_REJECTED
        order.save()
        return Response({'status': 'rejected'})
class PurchaseOrderItemViewSet(viewsets.ModelViewSet):
    queryset = PurchaseOrderItem.objects.all()
    serializer_class = PurchaseOrderItemSerializer
    permission_classes = [permissions.IsAuthenticated, ModuleRBAC("purchasing")]
class QuotationViewSet(viewsets.ModelViewSet):
    queryset = Quotation.objects.all().select_related('supplier', 'approved_by', 'created_by')
    serializer_class = QuotationSerializer
    permission_classes = [permissions.IsAuthenticated, ModuleRBAC("purchasing")]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['quotation_no', 'supplier__name']
    ordering_fields = ['-quotation_date', '-created_at']

    @transaction.atomic
    def perform_create(self, serializer):
        company_id = getattr(self.request.user, 'company_id', None)
        quotation_no = allocate_doc_number('QUO', 'QUO', company_id=company_id, padding=4)
        serializer.save(quotation_no=quotation_no)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, ModuleRBAC("purchasing")])
    def submit(self, request, pk=None):
        quotation = self.get_object()
        quotation.status = Quotation.QUOTATION_STATUS_SUBMITTED
        quotation.save()
        return Response({'status': 'submitted'})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, ModuleRBAC("purchasing")])
    def approve(self, request, pk=None):
        quotation = self.get_object()
        quotation.status = Quotation.QUOTATION_STATUS_APPROVED
        quotation.approved_by = request.user
        quotation.save()
        return Response({'status': 'approved'})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, ModuleRBAC("purchasing")])
    def reject(self, request, pk=None):
        quotation = self.get_object()
        quotation.status = Quotation.QUOTATION_STATUS_REJECTED
        quotation.save()
        return Response({'status': 'rejected'})
class QuotationItemViewSet(viewsets.ModelViewSet):
    queryset = QuotationItem.objects.all().select_related('quotation', 'item')
    serializer_class = QuotationItemSerializer
    permission_classes = [permissions.IsAuthenticated, ModuleRBAC("purchasing")]
class GoodsReceiptViewSet(viewsets.ModelViewSet):
    queryset = GoodsReceipt.objects.all()
    serializer_class = GoodsReceiptSerializer
    permission_classes = [permissions.IsAuthenticated, ModuleRBAC("purchasing")]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['grn_no', 'purchase_order__po_no']
    ordering_fields = ['-received_date', '-created_at']

    @transaction.atomic
    def perform_create(self, serializer):
        company_id = getattr(self.request.user, 'company_id', None)
        grn_no = allocate_doc_number('GRN', 'GRN', company_id=company_id, padding=4)
        serializer.save(grn_no=grn_no)
class SupplierInvoiceViewSet(viewsets.ModelViewSet):
    queryset = SupplierInvoice.objects.all().select_related('supplier', 'purchase_order', 'created_by')
    serializer_class = SupplierInvoiceSerializer
    permission_classes = [permissions.IsAuthenticated, ModuleRBAC("purchasing")]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['invoice_no', 'supplier__name']
    ordering_fields = ['-invoice_date', '-created_at']

    @transaction.atomic
    def perform_create(self, serializer):
        company_id = getattr(self.request.user, 'company_id', None)
        invoice_no = allocate_doc_number('PI', 'PI', company_id=company_id, padding=4)
        serializer.save(invoice_no=invoice_no)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, ModuleRBAC("purchasing")])
    def submit(self, request, pk=None):
        pi = self.get_object()
        pi.status = SupplierInvoice.INVOICE_STATUS_SUBMITTED
        pi.save()
        return Response({'status': 'submitted'})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, ModuleRBAC("purchasing")])
    def approve(self, request, pk=None):
        pi = self.get_object()
        pi.status = SupplierInvoice.INVOICE_STATUS_APPROVED
        pi.approved_by = request.user
        pi.save()
        return Response({'status': 'approved'})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, ModuleRBAC("purchasing")])
    def reject(self, request, pk=None):
        pi = self.get_object()
        pi.status = SupplierInvoice.INVOICE_STATUS_REJECTED
        pi.save()
        return Response({'status': 'rejected'})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, ModuleRBAC("purchasing")])
    def mark_paid(self, request, pk=None):
        pi = self.get_object()
        pi.status = SupplierInvoice.INVOICE_STATUS_PAID
        pi.save()
        return Response({'status': 'paid'})
class GRNItemViewSet(viewsets.ModelViewSet):
    queryset = GRNItem.objects.all()
    serializer_class = GRNItemSerializer
    permission_classes = [permissions.IsAuthenticated, ModuleRBAC("purchasing")]
