from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
  WarehouseViewSet,
  ItemCategoryViewSet,
  StockBalanceViewSet,
  InventoryJournalViewSet,
  CycleCountViewSet,
  CycleCountItemViewSet,
)

router = DefaultRouter()
router.register('warehouses', WarehouseViewSet, basename='warehouse')
router.register('item-categories', ItemCategoryViewSet, basename='itemcategory')
router.register('stock-balances', StockBalanceViewSet, basename='stockbalance')
router.register('inventory-journals', InventoryJournalViewSet, basename='inventoryjournal')
router.register('cycle-counts', CycleCountViewSet, basename='cyclecount')
router.register('cycle-count-items', CycleCountItemViewSet, basename='cyclecountitem')

urlpatterns = [
    path('', include(router.urls)),
]
