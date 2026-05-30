# ⚡ YishaiEdge — Trading Journal & Performance Analytics

A professional, local-first trading journal for forex, stock, and crypto traders. Log trades, analyze performance, journal your psychology, and discover your edge — all in a fast, single-page web app.

![Built with React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7-646cff?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)

---

## ✨ Features

- **Trade logging** with inline validation, live P&L preview, status tracking, and emotion/discipline ratings
- **Performance analytics** — win rate, profit factor, expectancy, drawdown, R-multiple distribution, win-rate trend
- **Calendar heatmap** with daily and weekly P&L
- **Trading journal** with mood tracking, lessons, and custom prompts
- **Playbook** for documenting strategies with rule checklists
- **Goals** tracking with live progress
- **AI Insights** — auto-generated pattern detection and coaching
- **Tools** — position sizer, R:R calculator, expectancy calculator
- **Connections** — auto-sync from MT5 (REST bridge) and TradingView (webhook relay)
- **Auth gate** — email/password + Google sign-in (configurable)
- **CSV & PDF export**, encrypted backups, multi-account support
- **Keyboard shortcuts**, mobile-responsive, dark UI

---

## 🚀 Quick Start (Local Development)

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server
npm run dev

# 3. Open http://localhost:5173
```

### Build for production

```bash
npm run build      # outputs to dist/
npm run preview    # preview the production build locally
```

---

## 📦 Deploy to GitHub Pages (Automatic)

This repo includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that **automatically builds and deploys** the app to GitHub Pages on every push to `main`.

### One-time setup

1. **Create a GitHub repository** and push this project:

   ```bash
   git init
   git add .
   git commit -m "Initial commit: YishaiEdge"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```

2. **Enable GitHub Pages:**
   - Go to your repo on GitHub → **Settings** → **Pages**
   - Under **Build and deployment** → **Source**, select **GitHub Actions**

3. **Done!** Every push to `main` now triggers a build and deploy. Your site will be live at:

   ```
   https://YOUR_USERNAME.github.io/YOUR_REPO/
   ```

   You can also trigger a deploy manually from the **Actions** tab → **Deploy YishaiEdge to GitHub Pages** → **Run workflow**.

> 💡 **Why it just works:** This project uses `vite-plugin-singlefile`, which inlines all JS and CSS into a single `index.html`. There are no separate asset files, so there are **no broken paths** on GitHub Pages — even in a subdirectory. No `base` path configuration needed.

---

## 🔐 Optional: Enable Real Google Sign-In

The app ships with a Google demo login. To enable the real Google button:

1. Create an OAuth 2.0 **Web application** Client ID in the [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Add your GitHub Pages URL to **Authorized JavaScript origins**, e.g.:
   - `https://YOUR_USERNAME.github.io`
3. Add the client ID as a **repository secret**:
   - Repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**
   - Name: `VITE_GOOGLE_CLIENT_ID`
   - Value: your `...apps.googleusercontent.com` client ID
4. Re-run the deploy workflow.

For local development, copy `.env.example` to `.env` and set the value.

See `docs/oauth-and-encryption.md` for full details.

---

## 🌐 Custom Domain (e.g. yishaiedge.com)

1. Deploy to GitHub Pages (above).
2. Repo → **Settings** → **Pages** → **Custom domain** → enter `yishaiedge.com`.
3. At your domain registrar, add DNS records:
   - **A records** pointing to GitHub Pages IPs:
     `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - Or a **CNAME** record for `www` → `YOUR_USERNAME.github.io`
4. GitHub auto-provisions HTTPS once DNS propagates.

---

## 🖥️ Alternative Hosts

The `dist/` folder is a fully static single-file site — deploy it anywhere:

| Host | How |
|------|-----|
| **Vercel** | Import repo → framework: Vite → deploy |
| **Netlify** | Drag `dist/` folder, or connect repo (build: `npm run build`, publish: `dist`) |
| **Cloudflare Pages** | Connect repo (build: `npm run build`, output: `dist`) |
| **Any static host** | Upload the contents of `dist/` |

---

## 📁 Project Structure

```
src/
├── components/   # Reusable UI (Sidebar, Topbar, Modal, TradeForm, etc.)
├── pages/        # Dashboard, Trades, Analytics, Calendar, Journal, etc.
├── lib/          # Calculations, storage, auth, CSV/PDF, connections, crypto
├── hooks/        # Keyboard shortcuts
└── App.tsx       # App shell & routing
docs/             # Production backend schema, API spec, deployment, OAuth guides
.github/workflows/deploy.yml   # GitHub Pages CI/CD
```

---

## 🛠️ Going to Production (SaaS Backend)

This app is local-first (data in your browser). To make it a multi-user SaaS, see:

- `docs/postgres-schema.sql` — database schema
- `docs/api-spec.md` — REST API contract
- `docs/deployment.md` — backend deployment guide
- `docs/oauth-and-encryption.md` — auth & encryption

---

## 📄 License

MIT — see [LICENSE](./LICENSE).

---

*YishaiEdge — Your edge, journaled.*
