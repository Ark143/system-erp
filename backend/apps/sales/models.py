from django.db import models
from django.conf import settings

class Customer(models.Model):
    CUSTOMER_TYPE_CHOICES = [
        ('COMPANY', 'Company'),
        ('INDIVIDUAL', 'Individual'),
    ]
    code = models.CharField(max_length=20, unique=True, db_index=True)
    name = models.CharField(max_length=200)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    tin = models.CharField(max_length=30, blank=True)
    customer_type = models.CharField(max_length=20, choices=CUSTOMER_TYPE_CHOICES, default='COMPANY')
    credit_limit = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='sales_customers')

    class Meta:
        ordering = ['name']
        indexes = [models.Index(fields=['code', 'is_active'])]

    def __str__(self):
        return f"{self.code} - {self.name}"


class SalesOrder(models.Model):
    SO_STATUS_DRAFT = 'DRAFT'
    SO_STATUS_SUBMITTED = 'SUBMITTED'
    SO_STATUS_APPROVED = 'APPROVED'
    SO_STATUS_REJECTED = 'REJECTED'
    SO_STATUS_COMPLETED = 'COMPLETED'
    SO_STATUS_CANCELLED = 'CANCELLED'
    SO_STATUS_CHOICES = [
        (SO_STATUS_DRAFT, 'Draft'),
        (SO_STATUS_SUBMITTED, 'Submitted'),
        (SO_STATUS_APPROVED, 'Approved'),
        (SO_STATUS_REJECTED, 'Rejected'),
        (SO_STATUS_COMPLETED, 'Completed'),
        (SO_STATUS_CANCELLED, 'Cancelled'),
    ]
    order_no = models.CharField(max_length=30, unique=True, db_index=True)
    customer = models.ForeignKey('sales.Customer', on_delete=models.PROTECT, related_name='sales_orders')
    order_date = models.DateField()
    delivery_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=SO_STATUS_CHOICES, default=SO_STATUS_DRAFT)
    notes = models.TextField(blank=True)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    grand_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='sales_orders')
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_sales_orders')

    class Meta:
        ordering = ['-order_date', '-created_at']
        indexes = [
            models.Index(fields=['customer', 'status', 'order_date']),
            models.Index(fields=['created_by', 'status']),
        ]

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
    SHIP_STATUS_PENDING = 'PENDING'
    SHIP_STATUS_PARTIAL = 'PARTIAL'
    SHIP_STATUS_DELIVERED = 'DELIVERED'
    SHIP_STATUS_RETURNED = 'RETURNED'
    SHIP_STATUS_CHOICES = [
        (SHIP_STATUS_PENDING, 'Pending'),
        (SHIP_STATUS_PARTIAL, 'Partial'),
        (SHIP_STATUS_DELIVERED, 'Delivered'),
        (SHIP_STATUS_RETURNED, 'Returned'),
    ]
    sales_order = models.ForeignKey('sales.SalesOrder', on_delete=models.PROTECT, related_name='shipments')
    shipment_no = models.CharField(max_length=30, unique=True, db_index=True)
    ship_date = models.DateField()
    status = models.CharField(max_length=20, choices=SHIP_STATUS_CHOICES, default=SHIP_STATUS_PENDING)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        ordering = ['-ship_date', '-created_at']

    def __str__(self):
        return f"SHIP-{self.shipment_no}"


class SalesInvoice(models.Model):
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
    sales_order = models.ForeignKey('sales.SalesOrder', on_delete=models.PROTECT, related_name='invoices')
    customer = models.ForeignKey('sales.Customer', on_delete=models.PROTECT, related_name='invoices')
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
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='sales_invoices')

    class Meta:
        ordering = ['-invoice_date', '-created_at']
        indexes = [
            models.Index(fields=['customer', 'status', 'invoice_date']),
            models.Index(fields=['outstanding']),
        ]

    def __str__(self):
        return f"SI-{self.invoice_no}"
