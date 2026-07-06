from django.db import migrations, models


def set_single_company(apps, schema_editor):
    CompanyConfig = apps.get_model('governance', 'CompanyConfig')
    rows = list(CompanyConfig.objects.all())
    if rows:
        rows[0].company_name = rows[0].company_name or 'DEFAULT'
        rows[0].abbreviation = rows[0].abbreviation or 'DFT'
        rows[0].save()


class Migration(migrations.Migration):
    dependencies = [
        ('governance', '0002_add_companyconfig_abbreviation'),
    ]

    operations = [
        migrations.AddField(
            model_name='companyconfig',
            name='auto_company_id',
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name='companyconfig',
            name='parent_company',
            field=models.ForeignKey(blank=True, null=True, on_delete=models.SET_NULL, related_name='subsidiaries', to='governance.companyconfig'),
        ),
        migrations.AddField(
            model_name='companyconfig',
            name='is_group',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='companyconfig',
            name='legal_name',
            field=models.CharField(blank=True, default='', max_length=255),
        ),
        migrations.AddField(
            model_name='companyconfig',
            name='trade_name',
            field=models.CharField(blank=True, default='', max_length=255),
        ),
        migrations.AddField(
            model_name='companyconfig',
            name='company_type',
            field=models.CharField(blank=True, default='', max_length=64),
        ),
        migrations.AddField(
            model_name='companyconfig',
            name='registration_number',
            field=models.CharField(blank=True, default='', max_length=128),
        ),
        migrations.AddField(
            model_name='companyconfig',
            name='date_of_incorporation',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='companyconfig',
            name='country',
            field=models.CharField(default='US', max_length=64),
        ),
        migrations.AddField(
            model_name='companyconfig',
            name='state',
            field=models.CharField(blank=True, default='', max_length=64),
        ),
        migrations.AddField(
            model_name='companyconfig',
            name='city',
            field=models.CharField(blank=True, default='', max_length=64),
        ),
        migrations.AddField(
            model_name='companyconfig',
            name='address',
            field=models.TextField(blank=True, default=''),
        ),
        migrations.AddField(
            model_name='companyconfig',
            name='phone',
            field=models.CharField(blank=True, default='', max_length=20),
        ),
        migrations.AddField(
            model_name='companyconfig',
            name='email',
            field=models.EmailField(blank=True, default='', max_length=255),
        ),
        migrations.AddField(
            model_name='companyconfig',
            name='website',
            field=models.URLField(blank=True, default=''),
        ),
        migrations.AddField(
            model_name='companyconfig',
            name='timezone',
            field=models.CharField(blank=True, default='UTC', max_length=32),
        ),
        migrations.AddField(
            model_name='companyconfig',
            name='default_bank_account',
            field=models.CharField(blank=True, default='', max_length=64),
        ),
        migrations.AddField(
            model_name='companyconfig',
            name='default_cash_account',
            field=models.CharField(blank=True, default='', max_length=64),
        ),
        migrations.AddField(
            model_name='companyconfig',
            name='default_receivable_account',
            field=models.CharField(blank=True, default='', max_length=64),
        ),
        migrations.AddField(
            model_name='companyconfig',
            name='default_payable_account',
            field=models.CharField(blank=True, default='', max_length=64),
        ),
        migrations.AddField(
            model_name='companyconfig',
            name='default_stock_warehouse',
            field=models.ForeignKey(blank=True, null=True, on_delete=models.SET_NULL, related_name='default_stock_companies', to='governance.warehouse'),
        ),
        migrations.AddField(
            model_name='companyconfig',
            name='default_manufacturing_warehouse',
            field=models.ForeignKey(blank=True, null=True, on_delete=models.SET_NULL, related_name='default_manufacturing_companies', to='governance.warehouse'),
        ),
        migrations.RunPython(set_single_company, migrations.RunPython.noop),
    ]
