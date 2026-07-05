from rest_framework import viewsets, permissions
from apps.users.rbac import ModuleRBAC
from apps.governance import models, serializers
from rest_framework.permissions import IsAuthenticated
_governance_perms = [permissions.IsAuthenticated, ModuleRBAC('governance')]
class CompanyConfigViewSet(viewsets.ModelViewSet):
    queryset = models.CompanyConfig.objects.all()
    serializer_class = serializers.CompanyConfigSerializer
    permission_classes = _governance_perms
class BranchViewSet(viewsets.ModelViewSet):
    queryset = models.Branch.objects.all()
    serializer_class = serializers.BranchSerializer
    permission_classes = _governance_perms
class WarehouseViewSet(viewsets.ModelViewSet):
    queryset = models.Warehouse.objects.all()
    serializer_class = serializers.WarehouseSerializer
    permission_classes = _governance_perms
class DecimalConfigViewSet(viewsets.ModelViewSet):
    queryset = models.DecimalConfig.objects.all()
    serializer_class = serializers.DecimalConfigSerializer
    permission_classes = _governance_perms
class GLDefaultAccountViewSet(viewsets.ModelViewSet):
    queryset = models.GLDefaultAccount.objects.all()
    serializer_class = serializers.GLDefaultAccountSerializer
    permission_classes = _governance_perms
class CurrencyViewSet(viewsets.ModelViewSet):
    queryset = models.Currency.objects.all()
    serializer_class = serializers.CurrencySerializer
    permission_classes = _governance_perms
class CurrencyExchangeRateViewSet(viewsets.ModelViewSet):
    queryset = models.CurrencyExchangeRate.objects.all()
    serializer_class = serializers.CurrencyExchangeRateSerializer
    permission_classes = _governance_perms
class FiscalPeriodViewSet(viewsets.ModelViewSet):
    queryset = models.FiscalPeriod.objects.all()
    serializer_class = serializers.FiscalPeriodSerializer
    permission_classes = _governance_perms
class ModulePeriodLockViewSet(viewsets.ModelViewSet):
    queryset = models.ModulePeriodLock.objects.all()
    serializer_class = serializers.ModulePeriodLockSerializer
    permission_classes = _governance_perms
class StockBalanceViewSet(viewsets.ModelViewSet):
    queryset = models.StockBalance.objects.all()
    serializer_class = serializers.StockBalanceSerializer
    permission_classes = _governance_perms
class InventoryJournalViewSet(viewsets.ModelViewSet):
    queryset = models.InventoryJournal.objects.all()
    serializer_class = serializers.InventoryJournalSerializer
    permission_classes = _governance_perms
class CycleCountViewSet(viewsets.ModelViewSet):
    queryset = models.CycleCount.objects.all()
    serializer_class = serializers.CycleCountSerializer
    permission_classes = _governance_perms
class CycleCountItemViewSet(viewsets.ModelViewSet):
    queryset = models.CycleCountItem.objects.all()
    serializer_class = serializers.CycleCountItemSerializer
    permission_classes = _governance_perms
class AuditTrailViewSet(viewsets.ModelViewSet):
    queryset = models.AuditTrail.objects.all()
    serializer_class = serializers.AuditTrailSerializer
    permission_classes = _governance_perms
class RoleViewSet(viewsets.ModelViewSet):
    queryset = models.Role.objects.all()
    serializer_class = serializers.RoleSerializer
    permission_classes = _governance_perms
class UserCompanyAssignmentViewSet(viewsets.ModelViewSet):
    queryset = models.UserCompanyAssignment.objects.all()
    serializer_class = serializers.UserCompanyAssignmentSerializer
    permission_classes = _governance_perms
class PermissionViewSet(viewsets.ModelViewSet):
    queryset = models.Permission.objects.all()
    serializer_class = serializers.PermissionSerializer
    permission_classes = _governance_perms
class RolePermissionViewSet(viewsets.ModelViewSet):
    queryset = models.RolePermission.objects.all()
    serializer_class = serializers.RolePermissionSerializer
    permission_classes = _governance_perms
class ItemCategoryViewSet(viewsets.ModelViewSet):
    queryset = models.ItemCategory.objects.all()
    serializer_class = serializers.ItemCategorySerializer
    permission_classes = _governance_perms
class InventoryCostLayerViewSet(viewsets.ModelViewSet):
    queryset = models.InventoryCostLayer.objects.all()
    serializer_class = serializers.InventoryCostLayerSerializer
    permission_classes = _governance_perms
__all__ = [
    'CompanyConfigViewSet',
    'BranchViewSet',
    'WarehouseViewSet',
    'DecimalConfigViewSet',
    'GLDefaultAccountViewSet',
    'CurrencyViewSet',
    'CurrencyExchangeRateViewSet',
    'FiscalPeriodViewSet',
    'ModulePeriodLockViewSet',
    'StockBalanceViewSet',
    'InventoryJournalViewSet',
    'CycleCountViewSet',
    'CycleCountItemViewSet',
    'AuditTrailViewSet',
    'RoleViewSet',
    'UserCompanyAssignmentViewSet',
    'PermissionViewSet',
    'RolePermissionViewSet',
    'ItemCategoryViewSet',
    'InventoryCostLayerViewSet',
]
