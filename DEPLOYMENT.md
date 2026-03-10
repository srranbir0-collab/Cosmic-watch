# 🚀 Cosmic Watch - Pterodactyl Deployment Guide

## Prerequisites
- Pterodactyl Panel access.
- **Node.js 18+** environment (Select `ghcr.io/pterodactyl/yolks:nodejs_18` or similar in Startup settings).
- **MySQL Database** (Credentials provided in `.env.example`).

## Step-by-Step Deployment

### 1. Upload Files
1. Navigate to the **File Manager** in your Pterodactyl server.
2. Upload all project files. Ensure `package.json`, `startup.sh`, `server.ts`, and `prisma/` folder are at the root.
3. **Important**: Do not upload `node_modules`. The startup script handles installation.

### 2. Configure Environment
1. Create a new file named `.env`.
2. Copy the contents of `.env.example` into `.env`.
3. Fill in your keys:
   - `NASA_API_KEY`: Get from [api.nasa.gov](https://api.nasa.gov).
   - `API_KEY`: Your Google Gemini API Key.
   - `JWT_SECRET` / `REFRESH_SECRET`: Generate random strings.
4. **Database**: The `.env.example` already contains your specific host, user, and password. Ensure they are correct in your `.env` file.

### 3. Startup Configuration
1. Go to the **Startup** tab in Pterodactyl.
2. Set **Startup Command** to: 
   ```bash
   bash startup.sh
   ```
3. Ensure the Docker Image is set to Node.js 18 or higher.

### 4. Launch
1. Go to the **Console** tab.
2. Click **Start**.
3. The first launch will take longer as it:
   - Installs dependencies.
   - Generates the Prisma Client.
   - Applies database migrations (creates tables).
   - Builds the frontend assets (`dist` folder).
4. Watch the console. You should see: `🌌 Cosmic Watch Server Online on 0.0.0.0:xxxx`.

## How It Works
- **Zero-Friction Script**: `startup.sh` handles everything. It even URL-encodes your complex database password automatically to prevent connection errors.
- **Unified Server**: The backend (Express) is configured to serve the frontend static files (`dist`) automatically in production, so you only need one running process.
- **Database**: The project is configured for MySQL to match your hosting environment.

## Troubleshooting
- **Database Connection Error**: Check the Console. If you see auth errors, verify the password in `.env` matches exactly `jyqk=JbmdYf@tvjnn=BOSi.G`.
- **White Screen / 404**: Ensure the build step completed successfully in the console logs. The `dist` folder must exist.
- **Memory Issues**: If the process crashes during build, your container might have low RAM. You can build locally (`npm run build`) and upload the `dist` folder manually, then remove `npm run build` from `startup.sh`.
