# Render Web Service Deployment Guide

This guide explains how to deploy your **DrishtiRakshak AI** application on **Render.com**'s completely free tier (**No credit card required**).

---

## Step 1: Push your project code to GitHub
Make sure all your latest files (including the newly created `render_deploy/` folder) are committed and pushed to your **GitHub repository**:
```bash
git add .
git commit -m "Add Render deployment configuration"
git push origin main
```

---

## Step 2: Create Free Database Services

### 1. Neon.tech (PostgreSQL Database)
1. Go to **[neon.tech](https://neon.tech/)**, sign up for a free account, and create a new project.
2. Select your Postgres version and name it (e.g. `drishtirakshak-db`).
3. Copy the **connection string** (looks like `postgresql://user:password@host/dbname?sslmode=require`). We will use this in the Render settings.

### 2. Qdrant Cloud (Vector Database)
1. Go to **[qdrant.tech](https://qdrant.tech/)**, click **Cloud**, sign up for a free account, and create a new cluster.
2. Copy the **Endpoint URL** (looks like `https://xxx.gcp.qdrant.io:6333`).
3. Under Access Keys, generate an **API Key** and copy it.

---

## Step 3: Deploy on Render.com

1. Go to **[render.com](https://render.com/)** and log in.
2. In the Render Dashboard, click the **New +** button in the top right and select **Web Service**.
3. Choose **Build and deploy from a Git repository** and connect your GitHub repository.
4. Set the Web Service Settings:
   - **Name**: `drishtirakshak-ai`
   - **Language**: **Docker** (very important!)
   - **Docker Path**: `render_deploy/Dockerfile`  <-- (Points to our custom Render configuration)
   - **Instance Type**: **Free** ($0/month)
5. Scroll down to **Environment Variables** and click **Add Environment Variable**. Add the following keys:
   
   | Key | Value | Description |
   | :--- | :--- | :--- |
   | `DATABASE_URL` | *Your Neon.tech Connection String* | PostgreSQL connection URL |
   | `QDRANT_HOST` | *Your Qdrant Cluster Endpoint URL (Remove the `https://` prefix)* | Qdrant host |
   | `QDRANT_API_KEY` | *Your Qdrant API Key* | Qdrant client authentication |
   | `SECRET_KEY` | `some-secure-production-secret-key-string-here` | Django production secret key |
   | `DEBUG` | `True` | Keep true for demo CORS validation |

6. Click **Create Web Service** at the bottom of the page.

---

## What Happens Next?
1. Render will fetch your code from GitHub and build the Docker image.
2. The build process will take about 3 to 6 minutes (installing Python packages, building React frontend).
3. Once completed, your console will show **"Live"** and provide you with a public URL (looks like `https://drishtirakshak-ai.onrender.com`).
4. Open the URL, and your fully working **DrishtiRakshak AI** app (including live dashboard and police console) will load in the browser!

*Note: In Render's free tier, the container will "go to sleep" if there is no traffic for 15 minutes. Visiting the URL again will wake it up automatically in about 30 seconds.*
