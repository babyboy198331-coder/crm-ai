# Deployment

## Current status (live)

Both services are deployed on Railway, in project **just-youthfulness**, from the GitHub repo `babyboy198331-coder/crm-ai`. Pushing to `main` auto-redeploys both.

| Service | Root dir | URL | Status |
|---|---|---|---|
| Postgres | — | internal only | Online |
| Backend (`crm-ai`) | `/backend` | https://crm-ai-production.up.railway.app | Online (health: `/health`) |
| Frontend (`independent-perfection`) | `/frontend` | https://independent-perfection-production-c08c.up.railway.app | Online |

Backend env vars: `DATABASE_URL` (from Postgres reference), `JWT_SECRET`, `OPENAI_API_KEY` / `OPENAI_BASE_URL` / `OPENAI_MODEL` (Groq), `PORT=4000`, `CORS_ORIGIN` (set to the frontend URL above).

Frontend env vars: `NEXT_PUBLIC_API_URL` (build arg, set to the backend URL above).

## Adding Cloudflare once you register a domain

Railway's free `*.up.railway.app` subdomains work fine for now. When you register a real domain (e.g. `yourcrm.com`), do this:

### 1. Add the domain to Cloudflare
1. Sign up / log in at https://dash.cloudflare.com
2. "Add a domain" → enter your domain → pick a plan (Free is fine)
3. Cloudflare gives you two nameservers (e.g. `xxx.ns.cloudflare.com`) — go to your domain registrar and replace the existing nameservers with those two
4. Wait for Cloudflare to detect the change (can take a few minutes to 24 hours)

### 2. Point subdomains at Railway
In Railway, for each service:
1. Go to the service → Settings → Networking → **Custom Domain**
2. Enter the subdomain you want, e.g. `app.yourcrm.com` for frontend, `api.yourcrm.com` for backend
3. Railway shows a CNAME target (something like `xxxx.up.railway.app`)

In Cloudflare DNS (for each subdomain):
1. Go to your domain → DNS → Add record
2. Type: `CNAME`, Name: `app` (or `api`), Target: the value Railway gave you
3. Proxy status: **Proxied** (orange cloud) — this routes traffic through Cloudflare, giving you free SSL, caching, and DDoS protection in front of Railway
4. Save

Repeat for both frontend (`app.yourcrm.com`) and backend (`api.yourcrm.com`).

### 3. Update env vars to match
Once the custom domains are live and verified in Railway (they'll show a green checkmark):
- Backend `CORS_ORIGIN` → `https://app.yourcrm.com`
- Frontend `NEXT_PUBLIC_API_URL` → `https://api.yourcrm.com`
- Redeploy both services after changing these (Railway → Deploy)

### 4. SSL/TLS settings in Cloudflare
- Go to SSL/TLS → Overview → set encryption mode to **Full** (or **Full (strict)** if Railway's cert validates, which it should)
- Go to SSL/TLS → Edge Certificates → enable **Always Use HTTPS**

### 5. Optional hardening
- Enable **Auto Minify** (JS/CSS/HTML) under Speed for minor perf gains
- Set up a **Page Rule** or **Cache Rule** if you want to cache static frontend assets at the edge
- Under Security, the default settings are fine for a small app — no changes needed unless you see abuse

That's it — Cloudflare sits in front of Railway as a DNS + proxy layer, Railway keeps handling the actual hosting/builds/deploys.
