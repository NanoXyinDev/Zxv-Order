# ZxvCode Order v2

Private OTP + VPS NAT storefront for Vercel.

## Security changes
- Admin uses database-backed username/password.
- Passwords are verified with bcrypt and never stored plaintext.
- Admin authentication uses opaque server-side sessions in PostgreSQL.
- Session cookie is HttpOnly + SameSite=Strict + Secure by default.
- Old Bearer `ADMIN_TOKEN` flow is removed.
- VPS SSH passwords are encrypted with AES-256-GCM at rest.
- Inventory endpoint never returns SSH passwords.
- VPS can only enter inventory through successful SSH authentication.
- Direct `/api/vps/add` is disabled.
- OTP API key is server-side only.

## Environment

Generate a password hash:
`node scripts-generate-hash.js 'your-admin-password'`

Set:
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD_HASH`
- `POSTGRES_URL`
- `RUMAHOTP_API_KEY`
- `SESSION_SECRET` (reserved for future signed operations; use a long random value)
- `VPS_CRYPT_KEY` (long random secret; it is hashed to a 32-byte AES key)
- `COOKIE_SECURE=true`

Do not commit `.env` or credentials.

## Deploy
Install dependencies and deploy with Vercel. Provision Vercel Postgres/compatible `POSTGRES_URL` first.
