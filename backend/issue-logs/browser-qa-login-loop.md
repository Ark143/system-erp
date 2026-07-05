Title: Browser QA login loop on localhost after backend migrations
User Story: Verify local development login and Master Data sidebar/module rendering.
Status: Resolved
Resolution: Resolved by fixing `backend/apps/users/serializers.py` and `backend/apps/users/views.py` so login returns a serialized `user` payload without assigning a dict to `AuditLog.user`. Backend login now returns HTTP 200 with `access`, `refresh`, and `user`. Verified via Django test client against `POST /api/auth/login/`.
