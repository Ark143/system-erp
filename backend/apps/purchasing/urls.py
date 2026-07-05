from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PurchaseQuotationViewSet, PurchaseQuotationItemViewSet, SupplierViewSet, GRNItemViewSet

router = DefaultRouter()
router.register('purchase-quotations', PurchaseQuotationViewSet, basename='purchasequotation')
router.register('purchase-quotation-items', PurchaseQuotationItemViewSet, basename='purchasequotationitem')
router.register('suppliers', SupplierViewSet, basename='supplier')
router.register('grn-items', GRNItemViewSet, basename='grnitem')

urlpatterns = [
    path('', include(router.urls)),
]
