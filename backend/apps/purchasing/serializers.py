from rest_framework import serializers
from .models import Supplier, PurchaseRequisition, PurchaseRequisitionItem, PurchaseOrder, PurchaseOrderItem, GoodsReceipt, SupplierInvoice

class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = ['id', 'code', 'name', 'email', 'phone', 'address', 'tin', 'supplier_type', 'payment_terms', 'is_active', 'created_at', 'updated_at', 'created_by']
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by']

class PurchaseRequisitionItemSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source='item.name', read_only=True)
    item_sku = serializers.CharField(source='item.sku', read_only=True)

    class Meta:
        model = PurchaseRequisitionItem
        fields = ['id', 'pr', 'item', 'item_name', 'item_sku', 'qty', 'unit_cost', 'line_total']
        read_only_fields = ['id', 'pr', 'line_total']

class PurchaseRequisitionSerializer(serializers.ModelSerializer):
    requester_name = serializers.CharField(source='requester.get_full_name', read_only=True)
    items = PurchaseRequisitionItemSerializer(many=True)

    class Meta:
        model = PurchaseRequisition
        fields = ['id', 'pr_no', 'requester', 'requester_name', 'department', 'required_date', 'status', 'notes', 'created_at', 'updated_at', 'approved_by', 'items']
        read_only_fields = ['id', 'pr_no', 'created_at', 'updated_at', 'approved_by']

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        pr = PurchaseRequisition.objects.create(**validated_data)
        for item_data in items_data:
            PurchaseRequisitionItem.objects.create(pr=pr, **item_data)
        return pr

class PurchaseOrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = PurchaseOrderItem
        fields = ['id', 'purchase_order', 'item', 'qty', 'unit_cost', 'discount', 'line_total']
        read_only_fields = ['id', 'purchase_order', 'line_total']

class PurchaseOrderSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    items = PurchaseOrderItemSerializer(many=True)

    class Meta:
        model = PurchaseOrder
        fields = ['id', 'po_no', 'supplier', 'supplier_name', 'pr', 'po_date', 'expected_delivery', 'status', 'total_amount', 'tax_amount', 'grand_total', 'notes', 'created_at', 'updated_at', 'created_by', 'approved_by', 'items']
        read_only_fields = ['id', 'po_no', 'created_at', 'updated_at', 'created_by', 'approved_by']

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        po = PurchaseOrder.objects.create(**validated_data)
        for item_data in items_data:
            PurchaseOrderItem.objects.create(purchase_order=po, **item_data)
        return po

class GoodsReceiptSerializer(serializers.ModelSerializer):
    purchase_order_no = serializers.CharField(source='purchase_order.po_no', read_only=True)

    class Meta:
        model = GoodsReceipt
        fields = ['id', 'purchase_order', 'purchase_order_no', 'grn_no', 'received_date', 'status', 'notes', 'created_at', 'created_by']
        read_only_fields = ['id', 'grn_no', 'created_at', 'created_by']

class SupplierInvoiceSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)

    class Meta:
        model = SupplierInvoice
        fields = ['id', 'invoice_no', 'supplier', 'supplier_name', 'purchase_order', 'invoice_date', 'due_date', 'status', 'subtotal', 'tax', 'grand_total', 'outstanding', 'notes', 'created_at', 'updated_at', 'created_by']
        read_only_fields = ['id', 'invoice_no', 'created_at', 'updated_at', 'created_by']
