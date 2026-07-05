from django.db import models
from django.conf import settings
class PaymentEntry(models.Model):
    PAYMENT_TYPE_PAYMENT = 'PAYMENT'
    PAYMENT_TYPE_RECEIPT = 'RECEIPT'
    PAYMENT_TYPE_ADVANCE = 'ADVANCE'
    PAYMENT_TYPE_CHOICES = [
        (PAYMENT_TYPE_PAYMENT, 'Payment'),
        (PAYMENT_TYPE_RECEIPT, 'Receipt'),
        (PAYMENT_TYPE_ADVANCE, 'Employee Advance'),
    ]
    STATUS_DRAFT = 'DRAFT'
    STATUS_SUBMITTED = 'SUBMITTED'
    STATUS_CANCELLED = 'CANCELLED'
    STATUS_CHOICES = [
        (STATUS_DRAFT, 'Draft'),
        (STATUS_SUBMITTED, 'Submitted'),
        (STATUS_CANCELLED, 'Cancelled'),
    ]
    pe_no = models.CharField(max_length=30, unique=True, db_index=True)
    payment_type = models.CharField(max_length=20, choices=PAYMENT_TYPE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_DRAFT)
    payment_date = models.DateField()
    paid_to = models.CharField(max_length=200)
    account = models.ForeignKey('accounting.Account', on_delete=models.PROTECT, related_name='payment_entries')
    amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    currency = models.CharField(max_length=3, default='USD')
    reference = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='payment_entries')

    class Meta:
        ordering = ['-payment_date', '-created_at']

    def __str__(self):
        return f"PE-{self.pe_no}"


class BankReconciliation(models.Model):
    STATUS_DRAFT = 'DRAFT'
    STATUS_COMPLETED = 'COMPLETED'
    STATUS_CHOICES = [
        (STATUS_DRAFT, 'Draft'),
        (STATUS_COMPLETED, 'Completed'),
    ]
    recon_no = models.CharField(max_length=30, unique=True, db_index=True)
    account = models.ForeignKey('accounting.Account', on_delete=models.PROTECT, related_name='reconciliations')
    recon_date = models.DateField()
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_DRAFT)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='reconciliations')

    class Meta:
        ordering = ['-recon_date', '-created_at']

    def __str__(self):
        return f"RECON-{self.recon_no}"


class BankReconciliationLine(models.Model):
    reconciliation = models.ForeignKey('accounting.BankReconciliation', on_delete=models.CASCADE, related_name='lines')
    journal_entry = models.ForeignKey('accounting.JournalEntry', on_delete=models.PROTECT, related_name='reconciliation_lines')
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    cleared = models.BooleanField(default=False)

    class Meta:
        indexes = [models.Index(fields=['reconciliation', 'journal_entry'])]

    def __str__(self):
        return f"{self.reconciliation.recon_no} - {self.journal_entry.je_no}"
