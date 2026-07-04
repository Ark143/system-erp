from django.db import models
from django.conf import settings

class Supplier(models.Model):
    SUPPLIER_TYPE_CHOICES = [
        ('COMPANY', 'Company'),
        ('INDIVIDUAL', 'Individual'),
    ]
    code = models.CharField(max_length=20, unique=True, db_index=True)
    name = models.CharField(max_length=200)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    tin = models.CharField(max_length=30, blank=True)
    supplier_type = models.CharField(max_length=20, choices=SUPPLIER_TYPE_CHOICES, default='COMPANY')
    payment_terms = models.IntegerField(default=30, help_text='Days')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='purchasing_suppliers')

    class Meta:
        ordering = ['name']
        indexes = [models.Index(fields=['code', 'is_active'])]

    def __str__(self):
        return f"{self.code} - {self.name}"


class PurchaseRequisition(models.Model):
    PR_STATUS_DRAFT = 'DRAFT'
    PR_STATUS_SUBMITTED = 'SUBMITTED'
    PR_STATUS_APPROVED = 'APPROVED'
    PR_STATUS_REJECTED = 'REJECTED'
    PR_STATUS_PO_CREATED = 'PO_CREATED'
    PR_STATUS_CANCELLED = 'CANCELLED'
    PR_STATUS_CHOICES = [
        (PR_STATUS_DRAFT, 'Draft'),
        (PR_STATUS_SUBMITTED, 'Submitted'),
        (PR_STATUS_APPROVED, 'Approved'),
        (PR_STATUS_REJECTED, 'Rejected'),
        (PR_STATUS_PO_CREATED, 'PO Created'),
        (PR_STATUS_CANCELLED, 'Cancelled'),
    ]
    pr_no = models.CharField(max_length=30, unique=True, db_index=True)
    requester = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='purchase_requisitions')
    department = models.CharField(max_length=30, blank=True)
    required_date = models.DateField()
    status = models.CharField(max_length=20, choices=PR_STATUS_CHOICES, default=PR_STATUS_DRAFT)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_prs')

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
    PO_STATUS_RECEIVED = 'RECEIVED'
    PO_STATUS_CANCELLED = 'CANCELLED'
    PO_STATUS_CHOICES = [
        (PO_STATUS_DRAFT, 'Draft'),
        (PO_STATUS_SUBMITTED, 'Submitted'),
        (PO_STATUS_APPROVED, 'Approved'),
        (PO_STATUS_REJECTED, 'Rejected'),
        (PO_STATUS_RECEIVED, 'Received'),
        (PO_STATUS_CANCELLED, 'Cancelled'),
    ]
    po_no = models.CharField(max_length=30, unique=True, db_index=True)
    supplier = models.ForeignKey('purchasing.Supplier', on_delete=models.PROTECT, related_name='purchase_orders')
    pr = models.ForeignKey('purchasing.PurchaseRequisition', on_delete=models.PROTECT, null=True, blank=True, related_name='purchase_orders')
    po_date = models.DateField()
    expected_delivery = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=PO_STATUS_CHOICES, default=PO_STATUS_DRAFT)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    grand_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='purchase_orders')
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_purchase_orders')

    class Meta:
        ordering = ['-po_date', '-created_at']
        indexes = [
            models.Index(fields=['supplier', 'status', 'po_date']),
            models.Index(fields=['created_by', 'status']),
        ]

    def __str__(self):
        return f"PO-{self.po_no}"


class PurchaseOrderItem(models.Model):
    purchase_order = models.ForeignKey('purchasing.PurchaseOrder', on_delete=models.CASCADE, related_name='items')
    item = models.ForeignKey('inventory.Item', on_delete=models.PROTECT)
    qty = models.DecimalField(max_digits=10, decimal_places=2)
    unit_cost = models.DecimalField(max_digits=12, decimal_places=2)
    discount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    line_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    class Meta:
        indexes = [models.Index(fields=['purchase_order', 'item'])]

    def __str__(self):
        return f"{self.purchase_order.po_no} - {self.item.sku}"


class GoodsReceipt(models.Model):
    GR_STATUS_PENDING = 'PENDING'
    GR_STATUS_PARTIAL = 'PARTIAL'
    GR_STATUS_RECEIVED = 'RECEIVED'
    GR_STATUS_RETURNED = 'RETURNED'
    GR_STATUS_CHOICES = [
        (GR_STATUS_PENDING, 'Pending'),
        (GR_STATUS_PARTIAL, 'Partial'),
        (GR_STATUS_RECEIVED, 'Received'),
        (GR_STATUS_RETURNED, 'Returned'),
    ]
    purchase_order = models.ForeignKey('purchasing.PurchaseOrder', on_delete=models.PROTECT, related_name='grns')
    grn_no = models.CharField(max_length=30, unique=True, db_index=True)
    received_date = models.DateField()
    status = models.CharField(max_length=20, choices=GR_STATUS_CHOICES, default=GR_STATUS_PENDING)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        ordering = ['-received_date', '-created_at']

    def __str__(self):
        return f"GRN-{self.grn_no}"


class SupplierInvoice(models.Model):
    SI_STATUS_DRAFT = 'DRAFT'
    SI_STATUS_SUBMITTED = 'SUBMITTED'
    SI_STATUS_PAID = 'PAID'
    SI_STATUS_OVERDUE = 'OVERDUE'
    SI_STATUS_CANCELLED = 'CANCELLED'
    SI_STATUS_CHOICES = [
        (SI_STATUS_DRAFT, 'Draft'),
        (SI_STATUS_SUBMITTED, 'Submitted'),
        (SI_STATUS_PAID, 'Paid'),
        (SI_STATUS_OVERDUE, 'Overdue'),
        (SI_STATUS_CANCELLED, 'Cancelled'),
    ]
    invoice_no = models.CharField(max_length=30, unique=True, db_index=True)
    supplier = models.ForeignKey('purchasing.Supplier', on_delete=models.PROTECT, related_name='invoices')
    purchase_order = models.ForeignKey('purchasing.PurchaseOrder', on_delete=models.PROTECT, null=True, blank=True, related_name='invoices')
    invoice_date = models.DateField()
    due_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=SI_STATUS_CHOICES, default=SI_STATUS_DRAFT)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    grand_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    outstanding = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='supplier_invoices')

    class Meta:
        ordering = ['-invoice_date', '-created_at']
        indexes = [
            models.Index(fields=['supplier', 'status', 'invoice_date']),
            models.Index(fields=['outstanding']),
        ]

    def __str__(self):
        return f"PI-{self.invoice_no}"
