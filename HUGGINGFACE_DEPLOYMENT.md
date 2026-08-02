# Hugging Face Spaces Deployment Guide

This guide describes how to push and deploy your **DrishtiRakshak AI** application to your free Hugging Face Space (which runs on **16 GB RAM** and **2 vCPUs** for free).

---

## Prerequisites
1. You have created a Space on Hugging Face (e.g. named `drishtirakshak-ai`) and selected **Docker** (Blank template) as the SDK.
2. Git is installed on your local computer.
3. Hugging Face Git credentials (your account token or password).

---

## Step-by-Step Deployment

### 1. Clone your Hugging Face Space Repository
Create a temporary folder on your desktop, open terminal/command prompt, and clone the empty repository that Hugging Face created for your Space:
```bash
git clone https://huggingface.co/spaces/krishnayak07/YOUR_SPACE_NAME
cd YOUR_SPACE_NAME
```
*(Replace `YOUR_SPACE_NAME` with the exact name of the Space you created, e.g., `drishtirakshak-ai`).*

### 2. Copy the Files into the Clone
Copy the following folders and files from your project workspace into this newly cloned repository folder:
- Copy the `backend/` folder.
- Copy the `frontend/` folder.
- Copy the `hf_deploy/` folder.
- Copy `hf_deploy/Dockerfile` and paste it directly into the **root** of the cloned repository folder (Hugging Face expects the `Dockerfile` to be in the root directory).

Your cloned repository folder structure should look like this:
```text
YOUR_SPACE_NAME/
├── backend/
├── frontend/
├── hf_deploy/
│   ├── nginx.conf
│   └── supervisord.conf
└── Dockerfile         <-- (Copied from hf_deploy/Dockerfile)
```

### 3. Edit Dockerfile paths (Important)
Since you moved the `Dockerfile` from the `hf_deploy/` folder to the root directory, open the `Dockerfile` in the root directory and verify the config paths are relative:
Ensure lines pointing to `hf_deploy` look like this:
```dockerfile
# Copy configuration files
COPY hf_deploy/ /app/hf_deploy/
```
*(Our generated Dockerfile already uses these correct relative paths!)*

### 4. Commit and Push the Files to Hugging Face
Run the following commands inside the cloned folder to upload your code:
```bash
git add .
git commit -m "Deploying DrishtiRakshak AI unified stack"
git push
```
*Note: If prompted for your password during `git push`, use your **Hugging Face Access Token** (which you can generate for free in your Hugging Face Profile under Settings -> Access Tokens).*

---

## Building & Launching
Once the push succeeds:
1. Open your Space page in your browser (`https://huggingface.co/spaces/krishnayak07/YOUR_SPACE_NAME`).
2. Hugging Face will automatically detect the `Dockerfile` and start building the container image.
3. The build process will take about 3 to 5 minutes to download dependencies and build the React app.
4. Once done, the status changes to **Running**, and your full **DrishtiRakshak AI Dashboard** will load directly in the browser!
