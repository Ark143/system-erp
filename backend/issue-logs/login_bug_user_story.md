# User Story: Fix Login JWT Flow

As a user,
I want to authenticate with email and password to receive access/refresh tokens,
So that I can access protected ERP endpoints.

## Acceptance Criteria
- POST /api/auth/login/ returns 200 with { access, refresh, user } on valid credentials.
- Invalid credentials return 401 with detail.
- Existing superuser credentials work after migration.
