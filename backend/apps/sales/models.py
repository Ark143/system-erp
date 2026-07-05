from django.db import models
from django.conf import settings
from apps.inventory.models import Item

class BlanketOrder(models.Model):
    STATUS_DRAFT = 'DRAFT'
    STATUS_ACTIVE = 'ACTIVE'
    STATUS_CLOSED = 'CLOSED'
    STATUS_CHOICES = [
        (STATUS_DRAFT, 'Draft'),
        (STATUS_ACTIVE, 'Active'),
        (STATUS_CLOSED, 'Closed'),
    ]
    order_no = models.CharField(max_length=30, unique=True, db_index=True)
    customer = models.ForeignKey('sales.Customer', on_delete=models.PROTECT, related_name='blanket_orders')
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_DRAFT)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='blanket_orders')

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"BO-{self.order_no}"


class Quotation(models.Model):
    STATUS_DRAFT = 'DRAFT'
    STATUS_SENT = 'SENT'
    STATUS_ACCEPTED = 'ACCEPTED'
    STATUS_REJECTED = 'REJECTED'
    STATUS_CHOICES = [
        (STATUS_DRAFT, 'Draft'),
        (STATUS_SENT, 'Sent'),
        (STATUS_ACCEPTED, 'Accepted'),
        (STATUS_REJECTED, 'Rejected'),
    ]
    quote_no = models.CharField(max_length=30, unique=True, db_index=True)
    customer = models.ForeignKey('sales.Customer', on_delete=models.PROTECT, related_name='quotations')
    quote_date = models.DateField()
    valid_until = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_DRAFT)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='quotations')

    class Meta:
        ordering = ['-quote_date', '-created_at']

    def __str__(self):
        return f"QT-{self.quote_no}"


class SalesQuotationItem(models.Model):
    quotation = models.ForeignKey('sales.Quotation', on_delete=models.CASCADE, related_name='items')
    item = models.ForeignKey('inventory.Item', on_delete=models.PROTECT)
    qty = models.DecimalField(max_digits=10, decimal_places=2)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    discount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    line_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    class Meta:
        indexes = [models.Index(fields=['quotation', 'item'])]

    def __str__(self):
        return f"{self.quotation.quote_no} - {self.item.sku}"


class BlanketOrderItem(models.Model):
    blanket_order = models.ForeignKey('sales.BlanketOrder', on_delete=models.CASCADE, related_name='items')
    item = models.ForeignKey('inventory.Item', on_delete=models.PROTECT)
    qty = models.DecimalField(max_digits=10, decimal_places=2)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    delivered_qty = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    class Meta:
        indexes = [models.Index(fields=['blanket_order', 'item'])]


class Customer(models.Model):
    code = models.CharField(max_length=30, unique=True, db_index=True)
    name = models.CharField(max_length=200)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='sales_customers')

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class SalesOrder(models.Model):
    SO_STATUS_DRAFT = 'DRAFT'
    SO_STATUS_SUBMITTED = 'SUBMITTED'
    SO_STATUS_APPROVED = 'APPROVED'
    SO_STATUS_REJECTED = 'REJECTED'
    SO_STATUS_CHOICES = [
        (SO_STATUS_DRAFT, 'Draft'),
        (SO_STATUS_SUBMITTED, 'Submitted'),
        (SO_STATUS_APPROVED, 'Approved'),
        (SO_STATUS_REJECTED, 'Rejected'),
    ]
    order_no = models.CharField(max_length=30, unique=True, db_index=True)
    customer = models.ForeignKey('sales.Customer', on_delete=models.PROTECT, related_name='sales_orders')
    order_date = models.DateField()
    status = models.CharField(max_length=20, choices=SO_STATUS_CHOICES, default=SO_STATUS_DRAFT)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    grand_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_sales_orders')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='sales_orders')

    class Meta:
        ordering = ['-order_date', '-created_at']

    def __str__(self):
        return f"SO-{self.order_no}"


class SalesOrderItem(models.Model):
    sales_order = models.ForeignKey('sales.SalesOrder', on_delete=models.CASCADE, related_name='items')
    item = models.ForeignKey('inventory.Item', on_delete=models.PROTECT)
    qty = models.DecimalField(max_digits=10, decimal_places=2)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    discount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    line_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    class Meta:
        indexes = [models.Index(fields=['sales_order', 'item'])]

    def __str__(self):
        return f"{self.sales_order.order_no} - {self.item.sku}"


class Shipment(models.Model):
    shipment_no = models.CharField(max_length=30, unique=True, db_index=True)
    sales_order = models.ForeignKey('sales.SalesOrder', on_delete=models.PROTECT, related_name='shipments')
    ship_date = models.DateField()
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='shipments')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-ship_date', '-created_at']

    def __str__(self):
        return f"SH-{self.shipment_no}"


class SalesInvoice(models.Model):
    invoice_no = models.CharField(max_length=30, unique=True, db_index=True)
    sales_order = models.ForeignKey('sales.SalesOrder', on_delete=models.PROTECT, related_name='invoices')
    customer = models.ForeignKey('sales.Customer', on_delete=models.PROTECT, related_name='sales_invoices')
    invoice_date = models.DateField()
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='sales_invoices')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-invoice_date', '-created_at']

    def __str__(self):
        return f"SI-{self.invoice_no}"
