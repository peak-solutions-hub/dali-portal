# Coolify Deployment Setup Guide

This guide explains how to deploy DALI Portal apps from GitHub Container Registry (GHCR) to Coolify.

## Prerequisites

- ✅ Docker images pushed to GHCR (automated via GitHub Actions)
- ✅ Coolify instance running
- ✅ Access to Coolify dashboard

---

## Step 1: Make GHCR Images Public (Recommended)

### Option A: Public Images (Easier, No Auth)

1. Go to https://github.com/orgs/peak-solutions-hub/packages
2. For each package (`dali-portal`, `dali-admin`, `dali-backend`):
   - Click on the package
   - Go to "Package settings"
   - Scroll to "Danger Zone"
   - Click "Change visibility" → **Public**

**Benefit:** Coolify can pull without authentication.

### Option B: Private Images (More Secure)

If keeping images private, you'll need to configure Coolify with GitHub credentials.

---

## Step 2: Create New Service in Coolify

### For Each App (Portal, Admin, Backend):

1. **Login to Coolify Dashboard**
   - Navigate to your Coolify instance

2. **Create New Project** (if not exists)
   - Click "+ New" → "Project"
   - Name: `DALI Portal`

3. **Add New Resource**
   - Click "+ New" → "Resource"
   - Choose "Service" → "Docker Image"

4. **Configure Service:**

   **For Portal:**
   ```
   Service Name: dali-portal
   Docker Image: ghcr.io/peak-solutions-hub/dali-portal:latest
   Port: 3000
   ```

   **For Admin:**
   ```
   Service Name: dali-admin
   Docker Image: ghcr.io/peak-solutions-hub/dali-admin:latest
   Port: 3001
   ```

   **For Backend:**
   ```
   Service Name: dali-backend
   Docker Image: ghcr.io/peak-solutions-hub/dali-backend:latest
   Port: 8080
   ```

---

## Step 3: Configure Environment Variables

### Portal Environment Variables:
```env
# API Configuration
NEXT_PUBLIC_API_URL=https://api.yourdomain.com

# Database (if using direct connection)
DATABASE_URL=postgresql://user:password@host:5432/db

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

### Admin Environment Variables:
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
DATABASE_URL=postgresql://user:password@host:5432/db
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=https://admin.yourdomain.com
```

### Backend Environment Variables:
```env
DATABASE_URL=postgresql://user:password@host:5432/db
PORT=8080
NODE_ENV=production
JWT_SECRET=your-jwt-secret
```

---

## Step 4: Configure Domains

1. **In Coolify Service Settings:**
   - Go to "Domains" tab
   - Add your custom domain

2. **Domain Setup:**
   ```
   Portal: https://portal.yourdomain.com
   Admin:  https://admin.yourdomain.com
   API:    https://api.yourdomain.com
   ```

3. **Enable HTTPS:**
   - Coolify auto-provisions Let's Encrypt certificates
   - Toggle "Enable HTTPS" in domain settings

---

## Step 5: Enable Auto-Deploy on Image Update

### Method 1: Webhook (Recommended)

1. **In Coolify Service Settings:**
   - Go to "Webhooks" tab
   - Enable "Deploy on new image push"
   - Copy the webhook URL

2. **Add Webhook to GitHub Actions:**

   Update `.github/workflows/build-and-push-images.yaml`:
   ```yaml
   - name: Trigger Coolify deployment
     if: github.ref == 'refs/heads/main'
     run: |
       curl -X POST "${{ secrets.COOLIFY_WEBHOOK_PORTAL }}"
       curl -X POST "${{ secrets.COOLIFY_WEBHOOK_ADMIN }}"
       curl -X POST "${{ secrets.COOLIFY_WEBHOOK_BACKEND }}"
   ```

3. **Add Secrets to GitHub:**
   - Go to GitHub repo → Settings → Secrets → Actions
   - Add:
     - `COOLIFY_WEBHOOK_PORTAL`
     - `COOLIFY_WEBHOOK_ADMIN`
     - `COOLIFY_WEBHOOK_BACKEND`

### Method 2: Polling (Alternative)

1. **In Coolify Service Settings:**
   - Go to "Auto Deploy" tab
   - Enable "Check for new images"
   - Set polling interval (e.g., 5 minutes)

**Note:** Polling is slower but requires no webhook setup.

---

## Step 6: Configure Health Checks

1. **In Coolify Service Settings:**
   - Go to "Health Checks" tab
   - Enable health checks

2. **Configure:**
   ```
   Health Check Path: /api/health (or / for Next.js apps)
   Interval: 30s
   Timeout: 3s
   Retries: 3
   ```

---

## Step 7: Deploy

1. **Initial Deployment:**
   - Click "Deploy" button in Coolify
   - Wait for image pull and container start (~1-2 minutes)

2. **Verify Deployment:**
   - Check logs in Coolify dashboard
   - Visit your domain
   - Test functionality

---

## Deployment Flow

```
┌─────────────────────────────────────────────────────────┐
│ Developer pushes to main branch                         │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ GitHub Actions:                                         │
│  1. Runs tests & lint                                   │
│  2. Builds Docker images                                │
│  3. Pushes to GHCR                                      │
│  4. Triggers Coolify webhook                            │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ Coolify:                                                │
│  1. Receives webhook                                    │
│  2. Pulls latest image from GHCR                        │
│  3. Stops old container                                 │
│  4. Starts new container                                │
│  5. Updates routing                                     │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ New version live! 🚀                                    │
└─────────────────────────────────────────────────────────┘
```

---

## Authentication for Private Images (If Needed)

If you keep images private:

1. **Create GitHub Personal Access Token (PAT):**
   - Go to GitHub → Settings → Developer settings → Personal access tokens
   - Create token with `read:packages` scope
   - Copy the token

2. **Add to Coolify:**
   - In service settings → "Registry Credentials"
   - Registry: `ghcr.io`
   - Username: Your GitHub username
   - Password: Your PAT token

---

## Troubleshooting

### Image Pull Errors
```bash
# Check if image is accessible
docker pull ghcr.io/peak-solutions-hub/dali-portal:latest

# If 401/403: Check registry auth in Coolify
```

### Port Already in Use
- Change port mapping in Coolify service settings
- Ensure no port conflicts with other services

### Environment Variables Not Working
- Check variable names (Next.js requires `NEXT_PUBLIC_` prefix for client-side)
- Restart service after adding new variables

### Webhook Not Triggering
- Verify webhook URL is correct
- Check GitHub Actions logs for webhook call
- Test webhook manually with curl

---

## Monitoring & Logs

1. **View Logs:**
   - Coolify dashboard → Service → "Logs" tab
   - Real-time log streaming

2. **Metrics:**
   - CPU/Memory usage visible in dashboard
   - Set up alerts for high resource usage

3. **Deployment History:**
   - Track all deployments in "Deployments" tab
   - Rollback to previous version if needed

---

## Rollback Procedure

If something goes wrong:

1. **Quick Rollback:**
   ```bash
   # In Coolify, change image tag
   ghcr.io/peak-solutions-hub/dali-portal:main-abc1234
   ```

2. **Deploy previous version:**
   - Find previous commit SHA in GitHub
   - Update image tag in Coolify
   - Click "Deploy"

---

## Best Practices

✅ **Use separate environments:**
- `main` branch → Production
- `develop` branch → Staging

✅ **Monitor first deployment:**
- Watch logs for errors
- Test all critical paths

✅ **Enable health checks:**
- Coolify auto-restarts failed containers

✅ **Set resource limits:**
- Prevent one app from consuming all resources

✅ **Use secrets for sensitive data:**
- Never commit credentials
- Use Coolify's secret management

---

## Next Steps

1. ✅ Push code to trigger first build
2. ✅ Create services in Coolify
3. ✅ Configure domains
4. ✅ Set environment variables
5. ✅ Enable webhooks
6. ✅ Test deployment
7. ✅ Monitor and iterate

---

## Support Resources

- **Coolify Docs:** https://coolify.io/docs
- **GHCR Docs:** https://docs.github.com/packages/working-with-a-github-packages-registry/working-with-the-container-registry
- **Turborepo Docs:** https://turbo.build/repo/docs
- **Next.js Deployment:** https://nextjs.org/docs/deployment
