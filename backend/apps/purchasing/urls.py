from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
  SupplierViewSet,
  PurchaseRequisitionViewSet,
  PurchaseRequisitionItemViewSet,
  PurchaseOrderViewSet,
  PurchaseOrderItemViewSet,
  QuotationViewSet,
  QuotationItemViewSet,
  GoodsReceiptViewSet,
  SupplierInvoiceViewSet,
  GRNItemViewSet,
)

router = DefaultRouter()
router.register('suppliers', SupplierViewSet, basename='supplier')
router.register('purchase-requisitions', PurchaseRequisitionViewSet, basename='purchaserequisition')
router.register('purchase-requisition-items', PurchaseRequisitionItemViewSet, basename='purchaserequisitionitem')
router.register('purchase-orders', PurchaseOrderViewSet, basename='purchaseorder')
router.register('purchase-order-items', PurchaseOrderItemViewSet, basename='purchaseorderitem')
router.register('quotations', QuotationViewSet, basename='quotation')
router.register('quotation-items', QuotationItemViewSet, basename='quotationitem')
router.register('grn', GoodsReceiptViewSet, basename='goodsreceipt')
router.register('supplier-invoices', SupplierInvoiceViewSet, basename='supplierinvoice')
router.register('grn-items', GRNItemViewSet, basename='grnitem')

urlpatterns = [
    path('', include(router.urls)),
]
