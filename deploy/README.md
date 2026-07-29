# Deploy - bankmini

Instruksi singkat menjalankan bankmini (backend + frontend) di server menggunakan PM2 dan Nginx.

## 1. Clone repo

```bash
git clone https://github.com/Bagassap/bankmini.git
cd bankmini
```

## 2. Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
cd ..
```

## 3. Konfigurasi environment

Buat `backend/.env` dan `frontend/.env.local` (tidak ikut di-commit ke repo) sesuai kebutuhan masing-masing project (database URL, JWT secret, API base URL, dll).

## 4. Build

```bash
cd backend && npm run build
cd ../frontend && npm run build
cd ..
```

## 5. Jalankan dengan PM2

```bash
pm2 start deploy/ecosystem.config.js
pm2 save
```

- `bankmini-api` menjalankan backend dari `backend/dist/src/main.js` (port 3001)
- `bankmini-web` menjalankan frontend dengan `npm start` (port 3000)

## 6. Nginx

Salin `deploy/nginx-bankmini.conf` ke `/etc/nginx/sites-available/`, buat symlink ke `sites-enabled/`, lalu reload:

```bash
sudo cp deploy/nginx-bankmini.conf /etc/nginx/sites-available/bankmini
sudo ln -s /etc/nginx/sites-available/bankmini /etc/nginx/sites-enabled/bankmini
sudo nginx -t && sudo systemctl reload nginx
```
