from rest_framework import serializers
from .models import Category, Item, StockMove

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class ItemSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = Item
        fields = ['id', 'sku', 'name', 'category', 'category_name', 'uom', 'warehouse', 'qty_on_hand', 'reorder_level', 'unit_cost', 'selling_price', 'is_active', 'created_at', 'updated_at', 'created_by']
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by', 'qty_on_hand']

class StockMoveSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source='item.name', read_only=True)
    item_sku = serializers.CharField(source='item.sku', read_only=True)

    class Meta:
        model = StockMove
        fields = ['id', 'item', 'item_name', 'item_sku', 'move_type', 'qty', 'reference', 'notes', 'created_at', 'created_by']
        read_only_fields = ['id', 'created_at', 'created_by']
