# Issue: Inventory Migration Duplication

## Summary
Duplicate `0001_initial.py` detected in `inventory/migrations`, causing migration conflict and failed `makemigrations`.

## User Story
As a maintainer, I want clean unique initial migrations per app so schema generation does not fail.

## Module
backend

## Status
resolved

## Resolution Task
1. Delete duplicate migration file.
2. Create placeholder migration dependent on `0001_initial`.
3. If additional conflicts exist, drop schema and rebuild initial migrations across all apps.
4. Run `python manage.py makemigrations` and `python manage.py migrate`.
