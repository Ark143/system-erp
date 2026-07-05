from rest_framework import serializers
from .models import BlanketOrder, BlanketOrderItem, Quotation, SalesQuotationItem, Customer, SalesOrder, SalesOrderItem, Shipment, SalesInvoice

class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = ['id', 'code', 'name', 'email', 'phone', 'address', 'is_active', 'created_at', 'updated_at', 'created_by']
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by']

class SalesOrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = SalesOrder
        fields = ['id', 'order_no', 'customer', 'order_date', 'status', 'total_amount', 'tax_amount', 'grand_total', 'approved_by', 'created_at', 'created_by']
        read_only_fields = ['id', 'created_at', 'created_by', 'approved_by']

class SalesOrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = SalesOrderItem
        fields = ['id', 'sales_order', 'item', 'qty', 'unit_price', 'discount', 'line_total']
        read_only_fields = ['id']

class ShipmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shipment
        fields = ['id', 'shipment_no', 'sales_order', 'ship_date', 'notes', 'created_at', 'created_by']
        read_only_fields = ['id', 'created_at', 'created_by']

class SalesInvoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = SalesInvoice
        fields = ['id', 'invoice_no', 'sales_order', 'customer', 'invoice_date', 'created_at', 'created_by']
        read_only_fields = ['id', 'created_at', 'created_by']

class BlanketOrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = BlanketOrder
        fields = ['id', 'order_no', 'customer', 'start_date', 'end_date', 'status', 'notes', 'created_at', 'created_by']
        read_only_fields = ['id', 'created_at', 'created_by']

class BlanketOrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = BlanketOrderItem
        fields = ['id', 'blanket_order', 'item', 'qty', 'unit_price', 'delivered_qty']
        read_only_fields = ['id']

class QuotationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Quotation
        fields = ['id', 'quote_no', 'customer', 'quote_date', 'valid_until', 'status', 'total_amount', 'notes', 'created_at', 'created_by']
        read_only_fields = ['id', 'created_at', 'created_by']

class SalesQuotationItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = SalesQuotationItem
        fields = ['id', 'quotation', 'item', 'qty', 'unit_price', 'discount', 'line_total']
        read_only_fields = ['id']
