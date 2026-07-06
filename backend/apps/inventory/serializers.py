from rest_framework import serializers
from .models import Category, Item, StockMove, Warehouse, InventorySettings

class InventorySettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = InventorySettings
        fields = [
            'id', 'company', 'item_naming_method', 'default_item_group', 'default_valuation_method', 'default_uom',
            'default_warehouse', 'sample_retention_warehouse', 'allow_negative_stock', 'allow_negative_stock_per_batch',
            'over_delivery_percentage', 'over_transfer_percentage', 'role_allowed_to_over_deliver',
            'allow_edit_rate_quantity_in_stock_transactions', 'auto_insert_item_price', 'auto_re_order',
            'enable_stock_reservation', 'auto_reserve_stock', 'use_reservation_agent_for_validation',
            'is_active', 'updated_at', 'updated_by'
        ]
        read_only_fields = ['id', 'updated_at', 'updated_by']

class WarehouseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Warehouse
        fields = [
            'id', 'code', 'name', 'address', 'warehouse_type', 'branch', 'parent',
            'cost_center', 'profit_center', 'gl_account', 'contact_person', 'email', 'phone',
            'status', 'is_active', 'created_at', 'updated_at', 'created_by'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by']

class CategorySerializer(serializers.ModelSerializer):
    item_count = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'is_active', 'created_at', 'updated_at', 'item_count']
        read_only_fields = ['id', 'created_at', 'updated_at', 'item_count']

    def get_item_count(self, obj):
        try:
            return obj.items.count()
        except Exception:
            return 0

class ItemSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = Item
        fields = [
            'id', 'sku', 'name', 'category', 'category_name', 'uom', 'warehouse', 'qty_on_hand', 'reorder_level', 'unit_cost', 'selling_price',
            'purchase_gl_account', 'sales_gl_account', 'default_warehouse', 'item_tax', 'withholding_tax',
            'uom_conversion_rate', 'cost_center', 'profit_center',
            'is_fixed_asset', 'is_inventory_item', 'is_purchase_item', 'is_sales_item', 'is_service',
            'is_active', 'created_at', 'updated_at', 'created_by'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by', 'qty_on_hand']

class StockMoveSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source='item.name', read_only=True)
    item_sku = serializers.CharField(source='item.sku', read_only=True)
    warehouse = serializers.CharField(source='item.warehouse', read_only=True)
    source_warehouse = serializers.CharField(default='MAIN', required=False)
    target_warehouse = serializers.CharField(default='MAIN', required=False)

    class Meta:
        model = StockMove
        fields = ['id', 'item', 'item_name', 'item_sku', 'warehouse', 'source_warehouse', 'target_warehouse', 'move_type', 'qty', 'reference', 'notes', 'created_at', 'created_by']
        read_only_fields = ['id', 'created_at', 'created_by']
