# Tripify Deployment Guide: AWS EC2 + Vercel Frontend

This guide deploys your full stack:
- **Frontend**: Vercel (already deployed)
- **Backend**: AWS EC2 t2.micro (Express + socket.io)
- **Database**: MongoDB Atlas (free tier)

## Phase 1: MongoDB Atlas Setup

### Step 1.1 Create MongoDB Cluster
1. Go to https://www.mongodb.com/cloud/atlas and sign in / create account.
2. Click "Create a Deployment" → choose "Shared" (free tier).
3. Select AWS, any region (e.g., `us-east-1`), and create.
4. Wait ~5 minutes for the cluster to initialize.

### Step 1.2 Create Database User
1. In Atlas, go to **Database Access** (left sidebar).
2. Click **Add New Database User**.
3. Username: `tripify_user` (or any name)
4. Password: generate a strong one (save it).
5. Database User Privileges: **Atlas Admin** (for simplicity).
6. Click **Add User**.

### Step 1.3 Configure Network Access
1. Go to **Network Access** (left sidebar).
2. Click **Add IP Address**.
3. Select **Allow access from anywhere** (`0.0.0.0/0`).
4. Click **Confirm**.

### Step 1.4 Get Connection String
1. Go to **Clusters** (left sidebar).
2. Click **Connect** on your cluster.
3. Choose **Drivers** → **Node.js** → copy the connection string.
   - Format: `mongodb+srv://<username>:<password>@cluster.mongodb.net/?retryWrites=true&w=majority`
4. Replace `<username>` and `<password>` with your database user credentials.
5. **Save this string** — you'll need it in Step 4.

**Example:**
```
mongodb+srv://tripify_user:MySecurePassword123@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority
```

---

## Phase 2: AWS EC2 Instance Setup

### Step 2.1 Launch EC2 Instance
1. Go to https://console.aws.amazon.com/ec2/.
2. Click **Instances** (left sidebar) → **Launch Instances**.
3. **Name**: `tripify-backend`
4. **AMI**: Select **Ubuntu Server 24.04 LTS** (free tier eligible).
5. **Instance Type**: `t2.micro` (free tier eligible).
6. **Key Pair**: 
   - If you don't have one, click "Create new key pair".
   - Name: `tripify-key` (or any name).
   - Type: **RSA**.
   - Format: `.pem` (if on Mac/Linux) or `.ppk` (if on Windows with PuTTY).
   - Click **Create key pair** and **save the file** to your local machine securely.
7. **Security Group**: 
   - Click "Create security group".
   - Name: `tripify-sg`.
   - Add inbound rules:
     - **SSH**: Port 22, Source: `0.0.0.0/0` (or your IP only for security).
     - **HTTP**: Port 80, Source: `0.0.0.0/0`.
     - **HTTPS**: Port 443, Source: `0.0.0.0/0`.
  - **Do not open port 5000 publicly** if you are using Nginx, because Nginx will proxy traffic to `localhost:5000` on the instance itself.
  - Outbound: Allow all (default).
8. **Storage**: Keep default (8 GB gp3).
9. Click **Launch Instance**.
10. Wait ~1–2 minutes for the instance to start. Note the **Public IPv4 address** (e.g., `54.123.45.67`).

### Step 2.2 Connect to EC2 Instance

**On macOS / Linux:**
```bash
chmod 400 ~/path/to/tripify-key.pem
ssh -i ~/path/to/tripify-key.pem ubuntu@54.123.45.67
```

**On Windows (using PowerShell or WSL):**
```powershell
ssh -i C:\path\to\tripify-key.pem ubuntu@54.123.45.67
```

C:\Users\Admin\Downloads

**On Windows (using PuTTY):**
1. Open PuTTY.
2. Host: `54.123.45.67`
3. SSH → Auth → Private key file: select your `.ppk` file.
4. Click **Open**.

---

## Phase 3: Backend Deployment on EC2

### Step 3.1 Update System and Install Dependencies
Once connected to EC2, run:

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y curl git
```

### Step 3.2 Install Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

### Step 3.3 Install PM2 (Process Manager)
```bash
sudo npm install -g pm2
pm2 startup
```

### Step 3.4 Clone Your Repository
```bash
cd /opt
sudo git clone https://github.com/YOUR_GITHUB_USERNAME/tripify.git
sudo chown -R ubuntu:ubuntu /opt/tripify
cd /opt/tripify/backend
```

**If you don't have GitHub repo yet:**
```bash
# Option A: Manual upload via SCP (from your local machine)
scp -i ~/path/to/tripify-key.pem -r ~/path/to/backend ubuntu@54.123.45.67:/opt/tripify/backend

# Option B: Initialize Git and push repo later
cd /opt/tripify/backend
npm install
npm run build
```

### Step 3.5 Install Backend Dependencies
```bash
cd /opt/tripify/backend
npm install --omit=dev
npm run build
```

### Step 3.6 Create Environment File
```bash
cat > /opt/tripify/backend/.env << 'EOF'
MONGO_URI=mongodb+srv://tripify_user:MySecurePassword123@cluster0.abcde.mongodb.net/tripify?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_key_here_change_this
PORT=5000
NODE_ENV=production
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_firebase_admin_client_email
FIREBASE_PRIVATE_KEY="your_firebase_private_key_with_newlines"
EOF
```

**Replace:**
- `MONGO_URI`: your connection string from Step 1.4.
- `JWT_SECRET`: any long random string (e.g., generate at https://generate-random.org/).
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY`: only needed if you use Google/Firebase login through `backend/src/controllers/firebaseAuthController.ts`.
- For `FIREBASE_PRIVATE_KEY`, keep the value in quotes and preserve the newline escapes. In Vercel or shell envs, store it with `\n` between lines; the backend converts `\n` back to real newlines automatically.

**Where to get Firebase values:**
1. Open Firebase Console → Project settings → Service accounts.
2. Click **Generate new private key**.
3. The downloaded JSON contains the values you need:
  - `project_id` → `FIREBASE_PROJECT_ID`
  - `client_email` → `FIREBASE_CLIENT_EMAIL`
  - `private_key` → `FIREBASE_PRIVATE_KEY`

If you are **not** using Firebase/Google login in production, you can leave these three variables out. The email/password auth and trips/chat features will still work.

**Verify the file:**
```bash
cat /opt/tripify/backend/.env
```

### Step 3.7 Start Backend with PM2
```bash
pm2 start /opt/tripify/backend/dist/server.js --name "tripify-backend"
pm2 save
```

**Verify it's running:**
```bash
pm2 status
pm2 logs tripify-backend
```

You should see:
```
Server running on port 5000
```

---

## Phase 4: Nginx Reverse Proxy

### Step 4.1 Install Nginx
```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Step 4.2 Configure Nginx to Proxy to Backend
```bash
sudo tee /etc/nginx/sites-available/tripify << 'EOF'
server {
    listen 80;
    server_name _;

    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF
```

This proxy setup is correct for your app:
- Public traffic hits Nginx on port 80/443.
- Nginx forwards requests to the Express server on `localhost:5000`.
- The `Upgrade` and `Connection` headers are included, so socket.io/WebSocket traffic can pass through.
- Because the backend is only listening on localhost, port 5000 does not need to be exposed in the EC2 security group.

### Step 4.3 Enable Site and Test Nginx
```bash
sudo ln -sf /etc/nginx/sites-available/tripify /etc/nginx/sites-enabled/tripify
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

---

## Phase 5: Test Backend

### Step 5.1 Test Locally on EC2
```bash
curl http://localhost:5000/api/trips
```

You should get a response (likely an empty array `[]` or an error if no trips exist yet).

### Step 5.2 Test from Your Local Machine
```bash
curl http://54.123.45.67/api/trips
```

Replace `54.123.45.67` with your EC2 **Public IPv4 address**.

---

## Phase 6: Update Frontend on Vercel

### Step 6.1 Update Frontend .env for Production
In `frontend/.env.production` (or the Vercel env dashboard), add:

```
VITE_API_URL=http://54.123.45.67
```

**Or use a domain** if you have one (see Phase 7).

### Step 6.2 Update CORS in Backend
Edit `backend/src/app.ts` and update the CORS origin:

```typescript
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "https://your-frontend-domain.vercel.app"
    ],
    credentials: true,
  })
);
```

Rebuild and restart backend:
```bash
cd /opt/tripify/backend
npm run build
pm2 restart tripify-backend
```

### Step 6.3 Redeploy Frontend
1. In your repo, update `frontend/.env.production` with `VITE_API_URL`.
2. Commit and push to GitHub.
3. Vercel auto-redeploys, or manually trigger a deployment.

---

## Phase 7: (Optional) Custom Domain + SSL

### Option A: Use Elastic IP (Free, but still need domain)
```bash
# On AWS EC2 Dashboard
# Elastic IPs → Allocate new address
# Associate with your tripify-backend instance
```

### Option B: Use Free SSL with Let's Encrypt + Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot certonly --nginx -d your-domain.com
```

Then update Nginx config with SSL cert paths.

### Option C: Use Cloudflare + Nameservers (Easiest)
1. Get a free domain (Freenom, or buy one).
2. Add to Cloudflare (free tier).
3. Point Cloudflare nameservers to your domain registrar.
4. In Cloudflare DNS, add an A record pointing to your EC2 Elastic IP.
5. Enable Full SSL in Cloudflare settings.

---

## Phase 8: End-to-End Testing

### Step 8.1 Test Signup / Login
1. Open your Vercel frontend URL.
2. Try to sign up with email + password.
3. Check backend logs on EC2:
   ```bash
   pm2 logs tripify-backend
   ```
4. Verify user was created in MongoDB Atlas (go to Collections and check the `users` collection).

### Step 8.2 Test Create Trip
1. After login, create a new trip.
2. Check backend logs and MongoDB for the trip document.

### Step 8.3 Test Group Chat
1. Create / join a trip and send a message.
2. Verify the message appears in real-time (socket.io).
3. Check MongoDB `messages` collection for the message document.

---

## Phase 9: Maintenance & Monitoring

### Monitor Backend Logs
```bash
pm2 logs tripify-backend --lines 50
```

### Restart Backend (if needed)
```bash
pm2 restart tripify-backend
```

### Auto-Restart on System Reboot
```bash
pm2 save
sudo env PATH=$PATH:/usr/bin /usr/local/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

### Update Backend Code (if using Git)
```bash
cd /opt/tripify/backend
git pull origin main
npm install --omit=dev
npm run build
pm2 restart tripify-backend
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Backend not responding | `pm2 logs tripify-backend` — check for errors |
| 502 Bad Gateway from Nginx | Ensure PM2 backend is running: `pm2 status` |
| CORS error on frontend | Update CORS origin in `app.ts` to include frontend URL |
| MongoDB connection fails | Verify MONGO_URI, IP whitelist, and user credentials in Atlas |
| Slow startup | t2.micro may cold-start slowly; consider t2.small after 12 months |
| High CPU/Memory | Monitor with `top` or `pm2 monit`; upgrade instance if needed |

---

## Summary of URLs & Credentials to Save

```
EC2 Public IPv4:     54.123.45.67 (example)
Backend URL:         http://54.123.45.67
Frontend URL:        https://your-frontend.vercel.app
MongoDB URI:         mongodb+srv://tripify_user:PASSWORD@cluster0.xxx.mongodb.net/?retryWrites=true&w=majority
JWT_SECRET:          your_jwt_secret_key
EC2 Key File:        ~/tripify-key.pem (keep safe!)
```

---

## Next Steps
1. Follow Phase 1–5 in order.
2. Test backend locally, then from your local machine.
3. Complete Phase 6 to point frontend to backend.
4. Run Phase 8 end-to-end tests.
5. (Optional) Phase 7 for custom domain & SSL.

Good luck! 🚀
