from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SupplierViewSet, PurchaseRequisitionViewSet, PurchaseRequisitionItemViewSet, PurchaseOrderViewSet, PurchaseOrderItemViewSet, GoodsReceiptViewSet, SupplierInvoiceViewSet

router = DefaultRouter()
router.register('suppliers', SupplierViewSet, basename='supplier')
router.register('purchase-requisitions', PurchaseRequisitionViewSet, basename='purchaserequisition')
router.register('pr-items', PurchaseRequisitionItemViewSet, basename='pritem')
router.register('purchase-orders', PurchaseOrderViewSet, basename='purchaseorder')
router.register('po-items', PurchaseOrderItemViewSet, basename='poitem')
router.register('grns', GoodsReceiptViewSet, basename='grn')
router.register('supplier-invoices', SupplierInvoiceViewSet, basename='supplierinvoice')

urlpatterns = [
    path('', include(router.urls)),
]
