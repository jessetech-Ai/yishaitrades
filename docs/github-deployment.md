# Deploying YishaiEdge to GitHub (Step by Step)

This guide walks you through pushing the project to GitHub and getting it live on GitHub Pages with automatic deployments.

---

## Prerequisites

- A [GitHub account](https://github.com/join)
- [Git](https://git-scm.com/downloads) installed locally
- [Node.js 20+](https://nodejs.org) installed locally

---

## Step 1 — Create a GitHub repository

1. Go to https://github.com/new
2. Name it (e.g. `yishaiedge`)
3. Leave it empty (do **not** add a README, .gitignore, or license — they already exist here)
4. Click **Create repository**

---

## Step 2 — Push your code

From the project folder, run:

```bash
git init
git add .
git commit -m "Initial commit: YishaiEdge trading journal"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/yishaiedge.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

---

## Step 3 — Enable GitHub Pages

1. Open your repo on GitHub
2. Go to **Settings** → **Pages**
3. Under **Build and deployment** → **Source**, choose **GitHub Actions**

That's it. The included workflow (`.github/workflows/deploy.yml`) will run automatically.

---

## Step 4 — Watch it deploy

1. Go to the **Actions** tab in your repo
2. You'll see the **Deploy YishaiEdge to GitHub Pages** workflow running
3. When it finishes (green check), your site is live at:

```
https://YOUR_USERNAME.github.io/yishaiedge/
```

The URL also appears in **Settings → Pages** after the first successful deploy.

---

## Step 5 — Future updates

Every time you push to `main`, the site rebuilds and redeploys automatically:

```bash
git add .
git commit -m "Add new feature"
git push
```

You can also manually re-run the deploy from **Actions → Deploy YishaiEdge to GitHub Pages → Run workflow**.

---

## Optional — Google Sign-In on the live site

1. In [Google Cloud Console](https://console.cloud.google.com/apis/credentials), create a **Web application** OAuth Client ID.
2. Add `https://YOUR_USERNAME.github.io` to **Authorized JavaScript origins**.
3. In your repo: **Settings → Secrets and variables → Actions → New repository secret**
   - Name: `VITE_GOOGLE_CLIENT_ID`
   - Value: your client ID
4. Re-run the deploy workflow.

---

## Optional — Custom domain (yishaiedge.com)

1. Repo → **Settings → Pages → Custom domain** → enter `yishaiedge.com` → Save.
2. At your DNS registrar, add these A records for the apex domain:
   ```
   185.199.108.153
   185.199.109.153
   185.199.110.153
   185.199.111.153
   ```
   And a CNAME for `www` → `YOUR_USERNAME.github.io`
3. Wait for DNS to propagate, then enable **Enforce HTTPS** in Pages settings.

---

## Troubleshooting

| Problem | Fix |
|--------|-----|
| Workflow fails on `npm ci` | Ensure `package-lock.json` is committed |
| 404 after deploy | Confirm Pages **Source** is set to **GitHub Actions** |
| Blank page | Hard refresh (Ctrl+Shift+R); single-file build avoids path issues |
| Google button missing | Set the `VITE_GOOGLE_CLIENT_ID` secret and redeploy |

---

*Because this project builds to a single self-contained `index.html` (via `vite-plugin-singlefile`), it works on GitHub Pages without any base-path configuration.*
