from django.db import migrations, models, connection


def populate_abbreviations(apps, schema_editor):
    CompanyConfig = apps.get_model('governance', 'CompanyConfig')
    rows = CompanyConfig.objects.all()
    # generate short-ish unique abbreviations
    existing = set(CompanyConfig.objects.values_list('abbreviation', flat=True))
    for r in rows:
        base = (r.company_name or '').split()[0][:5].upper()
        abbr = base
        suffix = 1
        while abbr in existing:
            abbr = base[: max(2, len(base) - 1)] + str(suffix)
            suffix += 1
        r.abbreviation = abbr
        r.save()


class Migration(migrations.Migration):
    dependencies = [
        ('governance', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='companyconfig',
            name='abbreviation',
            field=models.CharField(default='TEMP', max_length=5, unique=True),
            preserve_default=False,
        ),
        migrations.RunPython(populate_abbreviations, reverse_code=migrations.RunPython.noop),
    ]
