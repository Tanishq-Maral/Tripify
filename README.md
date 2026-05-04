# Tripifyyy

## Environment Workflow

Use separate API URLs for local development and production.

### Local Development

1. Copy `frontend/.env.development.example` to `frontend/.env.development`.
2. Keep this value for local work:

```env
VITE_API_URL=http://localhost:5000/api
```

3. Start backend and frontend in separate terminals:

```powershell
cd backend
npm install
npm run dev
```

```powershell
cd frontend
npm install
npm run dev
```

### Production (Vercel)

1. Do not commit secrets or production env files.
2. In Vercel Project Settings -> Environment Variables, set:

```env
VITE_API_URL=https://your-backend-domain.com/api
```

3. Redeploy after changing env variables.

## Notes

- Frontend uses `import.meta.env.VITE_API_URL` and falls back to `http://localhost:5000/api` for local safety.
- Static assets in `frontend/src/assets` should be imported in code (Vite bundles them into `dist/assets`).
