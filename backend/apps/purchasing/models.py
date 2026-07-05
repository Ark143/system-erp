from django.db import models
from django.conf import settings
from apps.inventory.models import Item

class PurchaseQuotation(models.Model):
    STATUS_DRAFT = 'DRAFT'
    STATUS_SENT = 'SENT'
    STATUS_ACCEPTED = 'ACCEPTED'
    STATUS_REJECTED = 'REJECTED'
    STATUS_PO_CREATED = 'PO_CREATED'
    STATUS_CHOICES = [
        (STATUS_DRAFT, 'Draft'),
        (STATUS_SENT, 'Sent'),
        (STATUS_ACCEPTED, 'Accepted'),
        (STATUS_REJECTED, 'Rejected'),
        (STATUS_PO_CREATED, 'PO Created'),
    ]
    pq_no = models.CharField(max_length=30, unique=True, db_index=True)
    supplier = models.ForeignKey('purchasing.Supplier', on_delete=models.PROTECT, related_name='purchase_quotations')
    required_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_DRAFT)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='purchase_quotations')

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"PQ-{self.pq_no}"


class PurchaseQuotationItem(models.Model):
    quotation = models.ForeignKey('purchasing.PurchaseQuotation', on_delete=models.CASCADE, related_name='items')
    item = models.ForeignKey('inventory.Item', on_delete=models.PROTECT)
    qty = models.DecimalField(max_digits=10, decimal_places=2)
    unit_cost = models.DecimalField(max_digits=12, decimal_places=2)
    line_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    class Meta:
        indexes = [models.Index(fields=['quotation', 'item'])]

    def __str__(self):
        return f"{self.quotation.pq_no} - {self.item.sku}"


class GRNItem(models.Model):
    grn = models.ForeignKey('purchasing.GoodsReceipt', on_delete=models.CASCADE, related_name='items')
    item = models.ForeignKey('inventory.Item', on_delete=models.PROTECT)
    qty = models.DecimalField(max_digits=10, decimal_places=2)
    unit_cost = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        indexes = [models.Index(fields=['grn', 'item'])]

    def __str__(self):
        return f"{self.grn.grn_no} - {self.item.sku}"
