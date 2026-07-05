# Task: Resolve Login TypeError

## Root Cause
SimpleJWT token serializer expects standard User or compatible object; custom user portrayal causes 'User' object is not subscriptable during validation.

## Resolution
1. Inspect apps.users.views.login_view and custom User model definition.
2. Ensure token serializer uses the correct user field identifier (email) or provide a custom TokenObtainPairSerializer that reads USERNAME_FIELD from the custom user model.
3. Re-test login endpoint with curl and frontend.

## Verification
curl -s -X POST http://127.0.0.1:8001/api/auth/login/ -H "Content-Type: application/json" -d '{"email":"admin@example.com","password":"admin"}' returns JSON tokens.
