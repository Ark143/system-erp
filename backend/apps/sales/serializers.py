from rest_framework import serializers
from .models import BlanketOrder, BlanketOrderItem, Quotation, SalesQuotationItem

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
