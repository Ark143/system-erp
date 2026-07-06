from rest_framework import serializers
from .models import (
    Supplier,
    PurchaseRequisition,
    PurchaseRequisitionItem,
    PurchaseOrder,
    PurchaseOrderItem,
    Quotation,
    QuotationItem,
    GoodsReceipt,
    SupplierInvoice,
    GRNItem,
)


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = ['id', 'code', 'name', 'email', 'phone', 'address', 'tin', 'is_active', 'created_at']


class PurchaseRequisitionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PurchaseRequisition
        fields = [
            'id', 'pr_no', 'department', 'status', 'required_date', 'notes',
            'requester', 'approved_by', 'created_at',
        ]


class PurchaseRequisitionItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = PurchaseRequisitionItem
        fields = ['id', 'pr', 'item', 'qty', 'unit_cost', 'line_total']


class PurchaseOrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = PurchaseOrder
        fields = [
            'id', 'po_no', 'supplier', 'supplier_tin', 'supplier_address', 'pr', 'po_date',
            'delivery_date', 'delivery_eta', 'uom', 'status',
            'total_amount', 'tax_amount', 'additional_charges', 'expense_gl_account', 'grand_total',
            'approved_by', 'created_by', 'created_at',
        ]


class PurchaseOrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = PurchaseOrderItem
        fields = ['id', 'purchase_order', 'item', 'qty', 'unit_cost', 'line_total']


class QuotationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Quotation
        fields = [
            'id', 'quotation_no', 'supplier', 'quotation_date', 'valid_until',
            'status', 'total_amount', 'tax_amount', 'grand_total',
            'terms', 'notes', 'approved_by', 'created_by', 'created_at',
        ]


class QuotationItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuotationItem
        fields = ['id', 'quotation', 'item', 'qty', 'unit_cost', 'line_total']


class GoodsReceiptSerializer(serializers.ModelSerializer):
    class Meta:
        model = GoodsReceipt
        fields = ['id', 'grn_no', 'purchase_order', 'received_date', 'notes', 'created_by', 'created_at']


class SupplierInvoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupplierInvoice
        fields = [
            'id', 'invoice_no', 'supplier', 'purchase_order', 'invoice_date', 'due_date', 'payment_term',
            'subtotal', 'tax_amount', 'withholding_tax', 'invoice_total', 'amount_paid', 'balance',
            'currency', 'notes', 'status', 'approved_by', 'created_by', 'created_at',
        ]


class GRNItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = GRNItem
        fields = ['id', 'grn', 'item', 'qty', 'unit_cost']
