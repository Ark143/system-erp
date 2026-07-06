from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, ItemViewSet, StockMoveViewSet, WarehouseViewSet, InventorySettingsViewSet, InventoryJournalView, StockBalancesReportView

router = DefaultRouter()
router.register('categories', CategoryViewSet, basename='category')
router.register('items', ItemViewSet, basename='item')
router.register('stock-moves', StockMoveViewSet, basename='stockmove')
router.register('warehouses', WarehouseViewSet, basename='warehouse')
router.register('settings', InventorySettingsViewSet, basename='inventory-settings')

urlpatterns = [
    path('', include(router.urls)),
    path('journal/', InventoryJournalView.as_view(), name='inventory-journal'),
    path('stock-balances/', StockBalancesReportView.as_view(), name='inventory-stock-balances'),
]
