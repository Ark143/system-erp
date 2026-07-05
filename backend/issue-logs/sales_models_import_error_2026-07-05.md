# Issue: Sales Models Import Error

## Summary
`sales/models.py` imported `Department` from `users.models`, which does not exist, causing `makemigrations` failure.

## User Story
As a developer, I want valid model imports so migrations generate successfully without broken cross-app references.

## Module
backend

## Status
resolved

## Resolution Task
1. Remove invalid cross-app import.
2. Replace with inline choice fields or valid references.
3. Re-run `makemigrations` and verify new migration is created.
