from rest_framework import serializers
from apps.governance import models

class CompanyConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.CompanyConfig
        fields = '__all__'

class BranchSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Branch
        fields = '__all__'

class WarehouseSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Warehouse
        fields = '__all__'

class DecimalConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.DecimalConfig
        fields = '__all__'

class GLDefaultAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.GLDefaultAccount
        fields = '__all__'

class CurrencySerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Currency
        fields = '__all__'

class CurrencyExchangeRateSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.CurrencyExchangeRate
        fields = '__all__'

class FiscalPeriodSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.FiscalPeriod
        fields = '__all__'

class ModulePeriodLockSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.ModulePeriodLock
        fields = '__all__'

class StockBalanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.StockBalance
        fields = '__all__'

class InventoryJournalSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.InventoryJournal
        fields = '__all__'

class CycleCountSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.CycleCount
        fields = '__all__'

class CycleCountItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.CycleCountItem
        fields = '__all__'

class AuditTrailSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.AuditTrail
        fields = '__all__'

class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Role
        fields = '__all__'

class UserCompanyAssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.UserCompanyAssignment
        fields = '__all__'

class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Permission
        fields = '__all__'

class RolePermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.RolePermission
        fields = '__all__'

class ItemCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = models.ItemCategory
        fields = '__all__'

class InventoryCostLayerSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.InventoryCostLayer
        fields = '__all__'
