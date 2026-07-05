from rest_framework import viewsets
from apps.governance import models, serializers

class CompanyConfigViewSet(viewsets.ModelViewSet):
    queryset = models.CompanyConfig.objects.all()
    serializer_class = serializers.CompanyConfigSerializer

class BranchViewSet(viewsets.ModelViewSet):
    queryset = models.Branch.objects.all()
    serializer_class = serializers.BranchSerializer

class WarehouseViewSet(viewsets.ModelViewSet):
    queryset = models.Warehouse.objects.all()
    serializer_class = serializers.WarehouseSerializer

class DecimalConfigViewSet(viewsets.ModelViewSet):
    queryset = models.DecimalConfig.objects.all()
    serializer_class = serializers.DecimalConfigSerializer

class GLDefaultAccountViewSet(viewsets.ModelViewSet):
    queryset = models.GLDefaultAccount.objects.all()
    serializer_class = serializers.GLDefaultAccountSerializer

class CurrencyViewSet(viewsets.ModelViewSet):
    queryset = models.Currency.objects.all()
    serializer_class = serializers.CurrencySerializer

class CurrencyExchangeRateViewSet(viewsets.ModelViewSet):
    queryset = models.CurrencyExchangeRate.objects.all()
    serializer_class = serializers.CurrencyExchangeRateSerializer

class FiscalPeriodViewSet(viewsets.ModelViewSet):
    queryset = models.FiscalPeriod.objects.all()
    serializer_class = serializers.FiscalPeriodSerializer

class ModulePeriodLockViewSet(viewsets.ModelViewSet):
    queryset = models.ModulePeriodLock.objects.all()
    serializer_class = serializers.ModulePeriodLockSerializer

class StockBalanceViewSet(viewsets.ModelViewSet):
    queryset = models.StockBalance.objects.all()
    serializer_class = serializers.StockBalanceSerializer

class InventoryJournalViewSet(viewsets.ModelViewSet):
    queryset = models.InventoryJournal.objects.all()
    serializer_class = serializers.InventoryJournalSerializer

class CycleCountViewSet(viewsets.ModelViewSet):
    queryset = models.CycleCount.objects.all()
    serializer_class = serializers.CycleCountSerializer

class CycleCountItemViewSet(viewsets.ModelViewSet):
    queryset = models.CycleCountItem.objects.all()
    serializer_class = serializers.CycleCountItemSerializer

class AuditTrailViewSet(viewsets.ModelViewSet):
    queryset = models.AuditTrail.objects.all()
    serializer_class = serializers.AuditTrailSerializer

class RoleViewSet(viewsets.ModelViewSet):
    queryset = models.Role.objects.all()
    serializer_class = serializers.RoleSerializer

class UserCompanyAssignmentViewSet(viewsets.ModelViewSet):
    queryset = models.UserCompanyAssignment.objects.all()
    serializer_class = serializers.UserCompanyAssignmentSerializer

class PermissionViewSet(viewsets.ModelViewSet):
    queryset = models.Permission.objects.all()
    serializer_class = serializers.PermissionSerializer

class RolePermissionViewSet(viewsets.ModelViewSet):
    queryset = models.RolePermission.objects.all()
    serializer_class = serializers.RolePermissionSerializer

class ItemCategoryViewSet(viewsets.ModelViewSet):
    queryset = models.ItemCategory.objects.all()
    serializer_class = serializers.ItemCategorySerializer

class InventoryCostLayerViewSet(viewsets.ModelViewSet):
    queryset = models.InventoryCostLayer.objects.all()
    serializer_class = serializers.InventoryCostLayerSerializer
