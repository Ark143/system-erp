from django.db import migrations, models


def ensure_php_base(apps, schema_editor):
    Currency = apps.get_model('accounting', 'Currency')
    php = Currency.objects.filter(code='PHP').first()
    if not php:
        php = Currency.objects.create(code='PHP', name='Philippine Peso', symbol='₱', is_active=True, is_base=True)
    else:
        php.is_base = True
        php.save()
        Currency.objects.exclude(pk=php.pk).update(is_base=False)


class Migration(migrations.Migration):
    dependencies = [
        ('accounting', '0003_currency_exchangerate_gldefaultaccount'),
    ]

    operations = [
        migrations.AddField(
            model_name='currency',
            name='is_base',
            field=models.BooleanField(default=False),
        ),
        migrations.RunPython(
            ensure_php_base,
            migrations.RunPython.noop,
        ),
    ]
