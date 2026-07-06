from django.db import models, transaction
from django.conf import settings


class DocumentControlSetting(models.Model):
    PREFIX_CHOICES = [
        ('PO', 'Purchase Order'),
        ('PR', 'Purchase Requisition'),
        ('QUO', 'Purchase Quotation'),
        ('GRN', 'Goods Receipt'),
        ('PI', 'Supplier Invoice'),
        ('SO', 'Sales Order'),
        ('SI', 'Sales Invoice'),
        ('SH', 'Shipment'),
        ('JE', 'Journal Entry'),
        ('PE', 'Payment Entry'),
        ('BR', 'Bank Reconciliation'),
        ('BQ', 'Sales Quotation'),
        ('BO', 'Blanket Order'),
    ]
    STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('INACTIVE', 'Inactive'),
    ]
    company = models.ForeignKey('governance.CompanyConfig', on_delete=models.SET_NULL, null=True, blank=True, related_name='doc_control_settings')
    prefix = models.CharField(max_length=10, choices=PREFIX_CHOICES)
    series_code = models.CharField(max_length=20, help_text='Static series code/prefix shown to users, e.g. PO, SO, PI.')
    padding = models.PositiveIntegerField(default=4, help_text='Zero-padding width, e.g. 4 = 0001.')
    current_number = models.PositiveIntegerField(default=0, help_text='Last issued number for this series.')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    note = models.CharField(max_length=120, blank=True, default='')
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='doc_control_updates')
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['company', 'prefix', 'status']),
            models.Index(fields=['prefix', 'status']),
        ]
        unique_together = ('company', 'prefix')

    def __str__(self):
        label = self.company_id or 'Global'
        return f'{self.series_code} - {label}'

    def next_number_display(self):
        width = self.padding or 4
        return f'{self.series_code}-{str(self.current_number + 1).zfill(width)}'

    def allocate_number(self):
        width = self.padding or 4
        self.current_number = (self.current_number or 0) + 1
        return f'{self.series_code}-{str(self.current_number).zfill(width)}'


def allocate_doc_number(prefix, series_code, company_id=None, padding=4):
    with transaction.atomic():
        setting = (
            DocumentControlSetting.objects
            .select_for_update()
            .filter(prefix=prefix, status='ACTIVE')
            .filter(models.Q(company_id=company_id) | models.Q(company__isnull=True))
            .order_by('-company_id')
            .first()
        )
        if not setting:
            setting = DocumentControlSetting.objects.create(
                company_id=company_id,
                prefix=prefix,
                series_code=series_code or prefix,
                padding=padding,
                current_number=0,
            )
        number = setting.allocate_number()
        setting.save(update_fields=['current_number', 'updated_at'])
        return number
