# GitHub Actions Deployment Setup

## ✅ Setup Complete!

Your Wasp app is now configured for automatic deployment via GitHub Actions.

## 🔑 Add Your Fly.io API Token to GitHub

**Your Fly.io API Token:**
```
fm2_lJPECAAAAAAACiIZxBDNzAzofQ5JXj7YneGkEBFFwrVodHRwczovL2FwaS5mbHkuaW8vdjGUAJLOABOa2x8Lk7lodHRwczovL2FwaS5mbHkuaW8vYWFhL3YxxDxv443Gt0vedsJpUhXEZd73i2HWiuDKsbFLKATwP5Nn/6vYEAYqWmQdGJMQ8fv7/+h8ZvJtYCHfiQU476DETsHyFggBwR2E/u28wJoDzBdHM57cb+wIn/pMsJwapDkfx9r+irJQFXRbbXd1CiyxMU9+DdQumnYZtBOFl59Za6TAaWR6dX61CLPlFwtBBMQgxqfKlYzMH7D2jFH8SNO6/1mGCH1I1SoKf0YbX07/NfA=,fm2_lJPETsHyFggBwR2E/u28wJoDzBdHM57cb+wIn/pMsJwapDkfx9r+irJQFXRbbXd1CiyxMU9+DdQumnYZtBOFl59Za6TAaWR6dX61CLPlFwtBBMQQS+QGQD/L6pXux38SMY2M18O5aHR0cHM6Ly9hcGkuZmx5LmlvL2FhYS92MZYEks5o5I6vzmjkkSUXzgAS1lwKkc4AEtZcxCCJZ/5Icz3wRmDpKvTz/4ytz50qFQWVlGOyMHbPfilSTQ==,fo1_x-RoXyBayskJ1SKvXJ0xQYW8WD3zg9IHoz4ZQhgmWqE
```

### 📋 Steps to Add Secret:

1. **Go to your GitHub repository**: https://github.com/92jks94/open-saas-postmarkr

2. **Navigate to Settings**:
   - Click **Settings** tab (top right)
   - Click **Secrets and variables** → **Actions** (left sidebar)

3. **Add the secret**:
   - Click **New repository secret** button
   - **Name:** `FLY_API_TOKEN`
   - **Secret:** Paste the token above
   - Click **Add secret**

## 🚀 How to Deploy

### Automatic Deployment
Push to your branch and GitHub Actions will deploy automatically:
```bash
git add .
git commit -m "feat: setup GitHub Actions deployment"
git push origin saas-template-nathan-now-postmarkr
```

### Manual Deployment
Trigger deployment manually from GitHub:
1. Go to **Actions** tab
2. Click **Deploy Wasp App to Fly.io** workflow
3. Click **Run workflow** button
4. Select branch and click **Run workflow**

## 📊 Monitor Deployment

Watch your deployment live:
1. Go to **Actions** tab: https://github.com/92jks94/open-saas-postmarkr/actions
2. Click on the running workflow
3. View real-time logs
4. Check deployment summary when complete

## 🌐 Your Apps

After successful deployment:
- **Server:** https://postmarkr-server-server.fly.dev
- **Client:** https://postmarkr-server-client.fly.dev
- **Health Check:** https://postmarkr-server-server.fly.dev/health

## 🔍 Useful Commands

```bash
# View server logs
flyctl logs -a postmarkr-server-server

# View client logs
flyctl logs -a postmarkr-server-client

# Check server status
flyctl status -a postmarkr-server-server

# Check client status
flyctl status -a postmarkr-server-client
```

## ⏱️ Expected Deployment Time

- **First deployment:** 6-8 minutes
- **Subsequent deployments:** 5-7 minutes
- **No changes:** 3-4 minutes

## ✅ What Changed

1. ✅ Created `.github/workflows/deploy.yml` with correct Wasp deployment
2. ✅ Verified `fly-server.toml` and `fly-client.toml` exist
3. ✅ Configured workflow to use `wasp deploy fly deploy`
4. ✅ Added health checks and deployment summaries

## 🎯 Key Differences from Previous Setup

| ❌ Old (Wrong) | ✅ New (Correct) |
|---------------|-----------------|
| `flyctl deploy` directly | `wasp deploy fly deploy` |
| Single app deployment | Deploys both server + client |
| Manual flyctl commands | Wasp handles everything |
| Complex multi-step | One simple command |

## 🆘 Troubleshooting

### Deployment fails
1. Check GitHub Actions logs for errors
2. Verify FLY_API_TOKEN secret is set correctly
3. Check Fly.io app status: `flyctl status -a postmarkr-server-server`

### Health check fails
1. Wait 2-3 minutes for apps to fully start
2. Check logs: `flyctl logs -a postmarkr-server-server`
3. Verify environment variables on Fly.io apps

### Need help?
- View logs in GitHub Actions
- Check Fly.io dashboard: https://fly.io/dashboard
- Run health check manually: `curl https://postmarkr-server-server.fly.dev/health/simple`

