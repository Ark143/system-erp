from django.db import models
from django.conf import settings

class Account(models.Model):
    ACCOUNT_TYPE_CHOICES = [
        ('ASSET', 'Asset'),
        ('LIABILITY', 'Liability'),
        ('EQUITY', 'Equity'),
        ('INCOME', 'Income'),
        ('EXPENSE', 'Expense'),
    ]
    ACCOUNT_NATURE_CHOICES = [
        ('DEBIT', 'Debit'),
        ('CREDIT', 'Credit'),
    ]
    code = models.CharField(max_length=20, unique=True, db_index=True)
    name = models.CharField(max_length=200)
    account_type = models.CharField(max_length=20, choices=ACCOUNT_TYPE_CHOICES)
    nature = models.CharField(max_length=10, choices=ACCOUNT_NATURE_CHOICES, default='DEBIT')
    parent = models.ForeignKey('self', on_delete=models.PROTECT, null=True, blank=True, related_name='children')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='accounts')

    class Meta:
        ordering = ['code']
        indexes = [models.Index(fields=['code', 'is_active'])]

    def __str__(self):
        return f"{self.code} - {self.name}"


class JournalEntry(models.Model):
    JE_STATUS_DRAFT = 'DRAFT'
    JE_STATUS_POSTED = 'POSTED'
    JE_STATUS_CANCELLED = 'CANCELLED'
    JE_STATUS_CHOICES = [
        (JE_STATUS_DRAFT, 'Draft'),
        (JE_STATUS_POSTED, 'Posted'),
        (JE_STATUS_CANCELLED, 'Cancelled'),
    ]
    je_no = models.CharField(max_length=30, unique=True, db_index=True)
    journal_date = models.DateField()
    status = models.CharField(max_length=20, choices=JE_STATUS_CHOICES, default=JE_STATUS_DRAFT)
    reference_type = models.CharField(max_length=30, blank=True)
    reference_id = models.CharField(max_length=50, blank=True, db_index=True)
    description = models.TextField(blank=True)
    total_debit = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    total_credit = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='journal_entries')
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_journal_entries')

    class Meta:
        ordering = ['-journal_date', '-created_at']
        indexes = [
            models.Index(fields=['status', 'journal_date']),
            models.Index(fields=['reference_type', 'reference_id']),
        ]

    def __str__(self):
        return f"JE-{self.je_no}"


class JournalEntryLine(models.Model):
    journal_entry = models.ForeignKey('accounting.JournalEntry', on_delete=models.CASCADE, related_name='lines')
    account = models.ForeignKey('accounting.Account', on_delete=models.PROTECT, related_name='entry_lines')
    description = models.CharField(max_length=200, blank=True)
    debit = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    credit = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['id']
        indexes = [models.Index(fields=['journal_entry', 'account'])]

    def __str__(self):
        return f"{self.journal_entry.je_no} - {self.account.code}"


class FiscalYear(models.Model):
    name = models.CharField(max_length=20, unique=True)
    start_date = models.DateField()
    end_date = models.DateField()
    is_closed = models.BooleanField(default=False)
    closed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-start_date']

    def __str__(self):
        return self.name
