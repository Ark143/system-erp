from rest_framework import serializers
from .models import (
  Supplier,
  PurchaseRequisition,
  PurchaseRequisitionItem,
  PurchaseOrder,
  PurchaseOrderItem,
  GoodsReceipt,
  SupplierInvoice,
  GRNItem,
)

class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = ['id', 'code', 'name', 'email', 'phone', 'address', 'is_active', 'created_at']


class PurchaseRequisitionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PurchaseRequisition
        fields = ['id', 'pr_no', 'department', 'status', 'required_date', 'notes', 'requester', 'approved_by', 'created_at']


class PurchaseRequisitionItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = PurchaseRequisitionItem
        fields = ['id', 'pr', 'item', 'qty', 'unit_cost', 'line_total']


class PurchaseOrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = PurchaseOrder
        fields = ['id', 'po_no', 'supplier', 'pr', 'po_date', 'status', 'total_amount', 'tax_amount', 'grand_total', 'approved_by', 'created_by', 'created_at']


class PurchaseOrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = PurchaseOrderItem
        fields = ['id', 'purchase_order', 'item', 'qty', 'unit_cost', 'line_total']


class GoodsReceiptSerializer(serializers.ModelSerializer):
    class Meta:
        model = GoodsReceipt
        fields = ['id', 'grn_no', 'purchase_order', 'received_date', 'notes', 'created_by', 'created_at']


class SupplierInvoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupplierInvoice
        fields = ['id', 'invoice_no', 'supplier', 'purchase_order', 'invoice_date', 'created_by', 'created_at']


class GRNItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = GRNItem
        fields = ['id', 'grn', 'item', 'qty', 'unit_cost']
