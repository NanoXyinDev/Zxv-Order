# ZxvCode Store Release v3

Release marketplace untuk OTP dan VPS NAT dengan clean routes, akun user, wallet saldo, QRIS deposit live, dan admin dashboard.

## Routes
- `/` Store
- `/login` Login
- `/register` Register
- `/admin` Admin

## Environment Variables
- `RUMAHOTP_API_KEY`
- `VPS_CRYPT_KEY`
- `GITHUB_TOKEN`
- `GITHUB_REPO=NanoXyinDev/Zxv-Order`
- `GITHUB_USERS_PATH=users.json`
- `GITHUB_BRANCH=main`
- `COOKIE_SECURE=true`
- Vercel Postgres variables (`POSTGRES_*`) dari storage/database yang terhubung ke project.

## GitHub users.json
Format:
```json
{
  "users": [
    {
      "username": "owner@example.com",
      "password_hash": "$2b$12$...",
      "role": "owner",
      "active": true
    }
  ]
}
```

Register user baru menulis record ke `users.json`. Password tidak disimpan plaintext.

## Payment
Deposit memakai RumahOTP QRIS. Server membuat invoice, browser melakukan polling status secara berkala, dan saldo user hanya dikreditkan sekali setelah status sukses.

## Wallet
- Saldo user disimpan di PostgreSQL.
- OTP order memotong saldo setelah harga diverifikasi server-side dari pricelist RumahOTP.
- Cancel/expired OTP mengembalikan saldo sekali.
- VPS order memotong saldo dan menandai inventory sebagai sold secara conditional.

## Security
- API key hanya di server.
- Session HttpOnly.
- Password GitHub users.json memakai hash.
- Password VPS terenkripsi AES-256-GCM.
- VPS hanya masuk stock setelah SSH check berhasil.
