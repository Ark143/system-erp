from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CustomerViewSet, BlanketOrderViewSet, BlanketOrderItemViewSet, QuotationViewSet, SalesQuotationItemViewSet, SalesOrderViewSet, SalesOrderItemViewSet, ShipmentViewSet, SalesInvoiceViewSet

router = DefaultRouter()
router.register('customers', CustomerViewSet, basename='customer')
router.register('blanket-orders', BlanketOrderViewSet, basename='blanketorder')
router.register('blanket-order-items', BlanketOrderItemViewSet, basename='blanketorderitem')
router.register('quotations', QuotationViewSet, basename='quotation')
router.register('quotation-items', SalesQuotationItemViewSet, basename='quotationitem')
router.register('sales-orders', SalesOrderViewSet, basename='salesorder')
router.register('sales-order-items', SalesOrderItemViewSet, basename='salesorderitem')
router.register('shipments', ShipmentViewSet, basename='shipment')
router.register('sales-invoices', SalesInvoiceViewSet, basename='salesinvoice')

urlpatterns = [
    path('', include(router.urls)),
]
