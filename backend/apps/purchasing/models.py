from django.db import models
from django.conf import settings
from apps.inventory.models import Item


class Supplier(models.Model):
    code = models.CharField(max_length=30, unique=True, db_index=True)
    name = models.CharField(max_length=200)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    tin = models.CharField(max_length=50, blank=True, default='')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='purchasing_suppliers')

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class PurchaseRequisition(models.Model):
    PR_STATUS_DRAFT = 'DRAFT'
    PR_STATUS_SUBMITTED = 'SUBMITTED'
    PR_STATUS_APPROVED = 'APPROVED'
    PR_STATUS_REJECTED = 'REJECTED'
    PR_STATUS_CHOICES = [
        (PR_STATUS_DRAFT, 'Draft'),
        (PR_STATUS_SUBMITTED, 'Submitted'),
        (PR_STATUS_APPROVED, 'Approved'),
        (PR_STATUS_REJECTED, 'Rejected'),
    ]
    pr_no = models.CharField(max_length=30, unique=True, db_index=True)
    department = models.CharField(max_length=100)
    status = models.CharField(max_length=20, choices=PR_STATUS_CHOICES, default=PR_STATUS_DRAFT)
    required_date = models.DateField()
    notes = models.TextField(blank=True)
    requester = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='purchase_requisitions')
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_purchase_requisitions')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"PR-{self.pr_no}"


class PurchaseRequisitionItem(models.Model):
    pr = models.ForeignKey('purchasing.PurchaseRequisition', on_delete=models.CASCADE, related_name='items')
    item = models.ForeignKey('inventory.Item', on_delete=models.PROTECT)
    qty = models.DecimalField(max_digits=10, decimal_places=2)
    unit_cost = models.DecimalField(max_digits=12, decimal_places=2)
    line_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    class Meta:
        indexes = [models.Index(fields=['pr', 'item'])]

    def __str__(self):
        return f"{self.pr.pr_no} - {self.item.sku}"


class PurchaseOrder(models.Model):
    PO_STATUS_DRAFT = 'DRAFT'
    PO_STATUS_SUBMITTED = 'SUBMITTED'
    PO_STATUS_APPROVED = 'APPROVED'
    PO_STATUS_REJECTED = 'REJECTED'
    PO_STATUS_CHOICES = [
        (PO_STATUS_DRAFT, 'Draft'),
        (PO_STATUS_SUBMITTED, 'Submitted'),
        (PO_STATUS_APPROVED, 'Approved'),
        (PO_STATUS_REJECTED, 'Rejected'),
    ]
    po_no = models.CharField(max_length=30, unique=True, db_index=True)
    supplier = models.ForeignKey('purchasing.Supplier', on_delete=models.PROTECT, related_name='purchase_orders')
    supplier_tin = models.CharField(max_length=50, blank=True, default='')
    supplier_address = models.TextField(blank=True, default='')
    pr = models.ForeignKey('purchasing.PurchaseRequisition', on_delete=models.PROTECT, null=True, blank=True, related_name='purchase_orders')
    po_date = models.DateField()
    delivery_date = models.DateField(null=True, blank=True)
    delivery_eta = models.DateField(null=True, blank=True)
    uom = models.CharField(max_length=30, blank=True, default='')
    status = models.CharField(max_length=20, choices=PO_STATUS_CHOICES, default=PO_STATUS_DRAFT)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    additional_charges = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    expense_gl_account = models.CharField(max_length=100, blank=True, default='')
    grand_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_purchase_orders')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='purchase_orders')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-po_date', '-created_at']

    def __str__(self):
        return f"PO-{self.po_no}"


class PurchaseOrderItem(models.Model):
    purchase_order = models.ForeignKey('purchasing.PurchaseOrder', on_delete=models.CASCADE, related_name='items')
    item = models.ForeignKey('inventory.Item', on_delete=models.PROTECT)
    qty = models.DecimalField(max_digits=10, decimal_places=2)
    unit_cost = models.DecimalField(max_digits=12, decimal_places=2)
    line_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    class Meta:
        indexes = [models.Index(fields=['purchase_order', 'item'])]

    def __str__(self):
        return f"{self.purchase_order.po_no} - {self.item.sku}"


class Quotation(models.Model):
    QUOTATION_STATUS_DRAFT = 'DRAFT'
    QUOTATION_STATUS_SUBMITTED = 'SUBMITTED'
    QUOTATION_STATUS_APPROVED = 'APPROVED'
    QUOTATION_STATUS_REJECTED = 'REJECTED'
    QUOTATION_STATUS_CHOICES = [
        (QUOTATION_STATUS_DRAFT, 'Draft'),
        (QUOTATION_STATUS_SUBMITTED, 'Submitted'),
        (QUOTATION_STATUS_APPROVED, 'Approved'),
        (QUOTATION_STATUS_REJECTED, 'Rejected'),
    ]
    quotation_no = models.CharField(max_length=30, unique=True, db_index=True)
    supplier = models.ForeignKey('purchasing.Supplier', on_delete=models.PROTECT, related_name='quotations')
    quotation_date = models.DateField()
    valid_until = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=QUOTATION_STATUS_CHOICES, default=QUOTATION_STATUS_DRAFT)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    grand_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    terms = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_quotations')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='purchasing_quotations')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-quotation_date', '-created_at']

    def __str__(self):
        return f"QUO-{self.quotation_no}"


class QuotationItem(models.Model):
    quotation = models.ForeignKey('purchasing.Quotation', on_delete=models.CASCADE, related_name='items')
    item = models.ForeignKey('inventory.Item', on_delete=models.PROTECT)
    qty = models.DecimalField(max_digits=10, decimal_places=2)
    unit_cost = models.DecimalField(max_digits=12, decimal_places=2)
    line_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    class Meta:
        indexes = [models.Index(fields=['quotation', 'item'])]

    def __str__(self):
        return f"{self.quotation.quotation_no} - {self.item.sku}"


class GoodsReceipt(models.Model):
    grn_no = models.CharField(max_length=30, unique=True, db_index=True)
    purchase_order = models.ForeignKey('purchasing.PurchaseOrder', on_delete=models.PROTECT, related_name='grns')
    received_date = models.DateField()
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='goods_receipts')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-received_date', '-created_at']

    def __str__(self):
        return f"GRN-{self.grn_no}"


class SupplierInvoice(models.Model):
    INVOICE_STATUS_DRAFT = 'DRAFT'
    INVOICE_STATUS_SUBMITTED = 'SUBMITTED'
    INVOICE_STATUS_APPROVED = 'APPROVED'
    INVOICE_STATUS_POSTED = 'POSTED'
    INVOICE_STATUS_PAID = 'PAID'
    INVOICE_STATUS_REJECTED = 'REJECTED'
    INVOICE_STATUS_CHOICES = [
        (INVOICE_STATUS_DRAFT, 'Draft'),
        (INVOICE_STATUS_SUBMITTED, 'Submitted'),
        (INVOICE_STATUS_APPROVED, 'Approved'),
        (INVOICE_STATUS_POSTED, 'Posted'),
        (INVOICE_STATUS_PAID, 'Paid'),
        (INVOICE_STATUS_REJECTED, 'Rejected'),
    ]

    invoice_no = models.CharField(max_length=30, unique=True, db_index=True)
    supplier = models.ForeignKey('purchasing.Supplier', on_delete=models.PROTECT, related_name='invoices')
    purchase_order = models.ForeignKey('purchasing.PurchaseOrder', on_delete=models.PROTECT, null=True, blank=True, related_name='supplier_invoices')
    invoice_date = models.DateField()
    due_date = models.DateField(null=True, blank=True)
    payment_term = models.CharField(max_length=50, blank=True, default='Net 30')
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    withholding_tax = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    invoice_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    currency = models.CharField(max_length=10, default='PHP')
    notes = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=INVOICE_STATUS_CHOICES, default=INVOICE_STATUS_DRAFT)
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_supplier_invoices')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='supplier_invoices')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-invoice_date', '-created_at']

    def __str__(self):
        return f"PI-{self.invoice_no}"


class GRNItem(models.Model):
    grn = models.ForeignKey('purchasing.GoodsReceipt', on_delete=models.CASCADE, related_name='items')
    item = models.ForeignKey('inventory.Item', on_delete=models.PROTECT)
    qty = models.DecimalField(max_digits=10, decimal_places=2)
    unit_cost = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        indexes = [models.Index(fields=['grn', 'item'])]

    def __str__(self):
        return f"{self.grn.grn_no} - {self.item.sku}"
