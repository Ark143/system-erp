# Issue: Full DB Schema Migration Conflicts

## Summary
Cross-app dependencies and stale migration history caused persistent migration conflicts across inventory and related apps.

## User Story
As a maintainer, I want a consistent migration state across all apps so `migrate` applies cleanly without dependency errors.

## Module
backend

## Status
resolved

## Resolution Task
1. Export a backup if needed.
2. Reset migration state by dropping DB schema public and removing migration files.
3. Recreate migrations with `makemigrations`.
4. Apply all migrations with `migrate` and confirm via `showmigrations`.
