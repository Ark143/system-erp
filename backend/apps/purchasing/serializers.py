from rest_framework import serializers
from .models import PurchaseQuotation, PurchaseQuotationItem, GRNItem

class PurchaseQuotationSerializer(serializers.ModelSerializer):
    class Meta:
        model = PurchaseQuotation
        fields = ['id', 'pq_no', 'supplier', 'required_date', 'status', 'notes', 'created_at', 'created_by']
        read_only_fields = ['id', 'created_at', 'created_by']

class PurchaseQuotationItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = PurchaseQuotationItem
        fields = ['id', 'quotation', 'item', 'qty', 'unit_cost', 'line_total']
        read_only_fields = ['id']

class GRNItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = GRNItem
        fields = ['id', 'grn', 'item', 'qty', 'unit_cost']
        read_only_fields = ['id']
