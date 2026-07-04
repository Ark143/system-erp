from rest_framework import serializers
from .models import Customer, SalesOrder, SalesOrderItem, Shipment, SalesInvoice

class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = ['id', 'code', 'name', 'email', 'phone', 'address', 'tin', 'customer_type', 'credit_limit', 'is_active', 'created_at', 'updated_at', 'created_by']
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by']

class SalesOrderItemSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source='item.name', read_only=True)
    item_sku = serializers.CharField(source='item.sku', read_only=True)
    uom = serializers.CharField(source='item.uom', read_only=True)

    class Meta:
        model = SalesOrderItem
        fields = ['id', 'sales_order', 'item', 'item_name', 'item_sku', 'uom', 'qty', 'unit_price', 'discount', 'line_total']
        read_only_fields = ['id', 'line_total']

    def validate(self, attrs):
        qty = attrs.get('qty')
        unit_price = attrs.get('unit_price')
        if qty is None or qty <= 0:
            raise serializers.ValidationError('INVALID_QTY')
        if unit_price is None or unit_price < 0:
            raise serializers.ValidationError('INVALID_PRICE')
        return attrs

class SalesOrderSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    items = SalesOrderItemSerializer(many=True)

    class Meta:
        model = SalesOrder
        fields = ['id', 'order_no', 'customer', 'customer_name', 'order_date', 'delivery_date', 'status', 'notes', 'total_amount', 'tax_amount', 'grand_total', 'created_at', 'created_by', 'items']
        read_only_fields = ['id', 'order_no', 'created_at', 'total_amount', 'tax_amount', 'grand_total']

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        so = SalesOrder.objects.create(**validated_data)
        for item_data in items_data:
            SalesOrderItem.objects.create(sales_order=so, **item_data)
        return so

class ShipmentSerializer(serializers.ModelSerializer):
    sales_order_no = serializers.CharField(source='sales_order.order_no', read_only=True)

    class Meta:
        model = Shipment
        fields = ['id', 'sales_order', 'sales_order_no', 'shipment_no', 'ship_date', 'status', 'notes', 'created_at', 'created_by']
        read_only_fields = ['id', 'shipment_no', 'created_at', 'created_by']

class SalesInvoiceSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)

    class Meta:
        model = SalesInvoice
        fields = ['id', 'invoice_no', 'sales_order', 'customer', 'customer_name', 'invoice_date', 'due_date', 'status', 'subtotal', 'tax', 'grand_total', 'outstanding', 'notes', 'created_at', 'updated_at', 'created_by']
        read_only_fields = ['id', 'invoice_no', 'created_at', 'updated_at', 'created_by']
