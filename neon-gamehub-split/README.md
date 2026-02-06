# Neon GameHub (React JSX + Express) — 17 fájl (szétszedve)

Ez egy **működő** demo weboldal:
- **Cyber/neon dizájn**, sötét háttér + neon kék/lila
- **React + JSX** (build nélkül, Babel a böngészőben)
- **Express REST API** (JWT auth, GOTY, üzenőfal, heti téma, hírek RSS-ből, FreeToGame proxy)
- **Reszponzív**, Bootstrap 5-tel

## Telepítés
Node.js 18+ kell.

```bash
cd neon-gamehub-split
npm install
npm start
```

Megnyitás: http://localhost:3000

Fejlesztő mód:
```bash
npm run dev
```

## Admin belépés
- user: `admin`
- pass: `admin123`

## Fájlstruktúra (összesen 17)
**Backend (4)**
1. `server.js`
2. `package.json`
3. `README.md`
4. `.env.example`

**Frontend (13)**
5. `public/index.html`
6. `public/styles.css`
7. `public/main.jsx`
8. `public/App.jsx`
9. `public/lib/api.js`
10. `public/components/UI.jsx`
11. `public/components/Layout.jsx`
12. `public/components/HomeWidgets.jsx`
13. `public/pages/Home.jsx`
14. `public/pages/Games.jsx`
15. `public/pages/GOTY.jsx`
16. `public/pages/Wall.jsx`
17. `public/pages/Support.jsx`

## REST API végpontok
- Games: `GET /api/games`, `GET /api/games/:id`
- GOTY: `GET /api/goty`, `POST /api/goty` (admin)
- Messages: `GET /api/messages`, `POST /api/messages` (login kell → 401 ha nincs), `DELETE /api/messages/:id` (admin)
- Weekly topic: `GET /api/weekly-topics/current`, `POST /api/weekly-topics/current` (admin)
- News: `GET /api/news` (RSS aggregator)
- Support: `POST /api/support`
- Donate: `POST /api/donate`
- Auth: `POST /api/auth/register`, `POST /api/auth/login`

## Stripe fizetés a regisztrációhoz
A regisztráció Stripe Checkout-tal működik (test módban is). Állítsd be a `.env`-ben:
- `STRIPE_SECRET_KEY`
- opcionálisan: `STRIPE_AMOUNT_CENTS`, `STRIPE_CURRENCY`, `STRIPE_PRODUCT_NAME`, `STRIPE_BASE_URL`

Fizetés után a siker oldal automatikusan aktiválja a fiókot (`/#/register-success`).
