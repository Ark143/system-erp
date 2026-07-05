from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'companies', views.CompanyConfigViewSet)
router.register(r'branches', views.BranchViewSet)
router.register(r'warehouses', views.WarehouseViewSet)
router.register(r'decimal-configs', views.DecimalConfigViewSet)
router.register(r'gl-default-accounts', views.GLDefaultAccountViewSet)
router.register(r'currencies', views.CurrencyViewSet)
router.register(r'exchange-rates', views.CurrencyExchangeRateViewSet)
router.register(r'fiscal-periods', views.FiscalPeriodViewSet)
router.register(r'module-period-locks', views.ModulePeriodLockViewSet)
router.register(r'stock-balances', views.StockBalanceViewSet)
router.register(r'inventory-journals', views.InventoryJournalViewSet)
router.register(r'cycle-counts', views.CycleCountViewSet)
router.register(r'cycle-count-items', views.CycleCountItemViewSet)
router.register(r'audit-trails', views.AuditTrailViewSet)
router.register(r'roles', views.RoleViewSet)
router.register(r'company-users', views.UserCompanyAssignmentViewSet)
router.register(r'permissions', views.PermissionViewSet)
router.register(r'role-permissions', views.RolePermissionViewSet)
router.register(r'item-categories', views.ItemCategoryViewSet)
router.register(r'inventory-cost-layers', views.InventoryCostLayerViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
