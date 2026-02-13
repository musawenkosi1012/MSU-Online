# MSU Online - Hybrid Cloud Deployment Guide

This guide outlines how to host your **React Frontend** and **FastAPI Backend** in the cloud while keeping your **MySQL Database** securely on your local machine.

## 🏗️ Architecture Overview
*   **Frontend**: Hosted on Choreo / Vercel / Netlify (HTTPS).
*   **Backend**: Hosted on Choreo / Render / VPS (HTTPS).
*   **Database**: Local MySQL (Port Forwarded + SSL + IP Whitelisted).

---

## 🔒 1. Securing Your Local MySQL for the Cloud
Since your database is local, the cloud backend needs a "tunnel" to reach it.

### Step A: Expose Local MySQL ( Ngrok or Cloudflare Tunnel )
1.  **Install Ngrok**: `npm install -g ngrok`
2.  **Start Tunnel**: `ngrok tcp 2004` (Replace 2004 with your MySQL port).
3.  **Note the URL**: It will look like `tcp://0.tcp.ngrok.io:12345`.
4.  **Update .env**: Your `DATABASE_URL` will now be `mysql://root:password@0.tcp.ngrok.io:12345/msu_online`.

### Step B: IP Whitelisting
To prevent anyone else from connecting to your local MySQL:
1.  Find the **Outgoing IP Address** of your cloud backend (e.g., from Choreo or VPS logs).
2.  In MySQL, run:
    ```sql
    CREATE USER 'root'@'YOUR_BACKEND_IP' IDENTIFIED BY 'your_password';
    GRANT ALL PRIVILEGES ON msu_online.* TO 'root'@'YOUR_BACKEND_IP';
    FLUSH PRIVILEGES;
    ```

### Step C: Enable SSL (Optional but Recommended)
For true production security, enable SSL on your local MySQL and provide the `ca.pem` path in your `.env`:
`DB_SSL_CA="/app/certs/ca.pem"`

---

## 🚀 2. Backend Deployment (FastAPI)

### Environment Variables (.env)
Set these variables in your Cloud Provider's dashboard:
```env
DATABASE_URL="mysql://user:pass@tunnel-address:port/msu_online"
ALLOWED_ORIGINS="https://your-frontend-domain.com"
SECRET_KEY="your-super-long-random-secret"
USE_MOCK_LLM="false"
OPENAI_API_KEY="sk-..."
FIRE_CRAWL_API_KEY="fc-..."
```

### Deployment Commands
*   **Docker**: Use the provided `Dockerfile`.
*   **Direct**: `pip install -r requirements.txt` and `uvicorn app.main:app --host 0.0.0.0 --port 8080`

---

## 🌐 3. Frontend Deployment (React)

### Environment Variables (.env.production)
Create a `.env.production` file in the `frontend/` folder:
```env
VITE_API_BASE="https://your-backend-api.choreo.io"
```

### Build & Deploy
1.  Compile: `npm run build`
2.  Upload the `dist/` folder to your provider.

---

## 🛡️ 4. Security Checklist
- [ ] **Rate Limiting**: Enabled via `SlowAPI` (20 requests/min for health check, customizable per route).
- [ ] **JWT Auth**: Tokens expire in 1440 minutes (configurable in .env).
- [ ] **Password Hashing**: Done via `bcrypt` in `AuthService`.
- [ ] **CORS**: Domain-locked to `ALLOWED_ORIGINS`.
- [ ] **Database**: Tunneling + IP Whitelisting ensures your local data is not public.

---

## 📂 Project Structure
```text
MSU-Online/
├── backend/            # FastAPI Project
│   ├── app/           # Core Logic
│   ├── data/          # Local logs/cache
│   ├── .env           # Production Config
│   └── Dockerfile     # Cloud Build Script
├── frontend/           # React Project (Vite)
│   ├── src/           # Components/Hooks
│   ├── .env.production # Production API URL
│   └── dist/          # Optimized production build
└── DEPLOYMENT.md       # This file
```
