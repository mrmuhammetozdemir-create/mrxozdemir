# Test Credentials

## Admin Account
- Email: ipatarazi@gmail.com
- Password: As537273
- URL: /admin

## Test User Account
- Email: testuser@test.com
- Password: Test1234!
- URL: /auth (login) → /panel (dashboard)

## Auth Mechanism
- Admin: httpOnly cookie (admin_token) + Bearer token support
- Users: httpOnly cookie (session_token)
- withCredentials: true on all frontend API calls
