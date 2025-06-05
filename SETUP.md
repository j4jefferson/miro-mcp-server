# Complete Setup Guide

This guide will walk you through setting up the Miro MCP Server from scratch.

## Step 1: Cloudflare Account Setup

### 1.1 Create Cloudflare Account
1. Go to [cloudflare.com](https://cloudflare.com) and sign up
2. Complete email verification
3. Navigate to your dashboard

### 1.2 Get Account Details
1. In your Cloudflare dashboard, look in the right sidebar for **Account ID**
2. Copy this value - you'll need it later

### 1.3 Create API Token
1. Go to **My Profile** → **API Tokens**
2. Click **Create Token**
3. Use **Custom token** and set these permissions:
   - **Account** - `Cloudflare Workers:Edit`
   - **Account** - `Account Settings:Read`
   - **Zone** - `Zone Settings:Read`
   - **Zone** - `Zone:Read`
4. Set **Account Resources** to `Include - All accounts`
5. Click **Continue to summary**, then **Create Token**
6. **Important**: Copy the token and store it securely

## Step 2: Miro Developer Account

### 2.1 Create Miro Developer Account
1. Go to [developers.miro.com](https://developers.miro.com)
2. Sign in with your Miro account or create one
3. Accept the developer terms

### 2.2 Create New App
1. Click **Create new app**
2. Choose **Build an app with Miro APIs**
3. Fill in app details:
   - **App name**: `Your Project MCP Server`
   - **Description**: `MCP server for meeting preparation and collaboration`
4. Click **Create app**

### 2.3 Configure App Settings
1. In your app dashboard, go to **App settings**
2. Note your **Client ID** and **Client secret**
3. Under **Redirect URIs**, add: `https://miro-mcp-server.YOUR_SUBDOMAIN.workers.dev/oauth/callback`
   - Note: You'll update this with your actual worker URL after deployment
4. Under **Scopes**, ensure you have:
   - `boards:read`
   - `boards:write`
5. Save settings

## Step 3: GitHub Repository Setup

### 3.1 Fork or Clone Repository
```bash
# Option A: Fork via GitHub web interface
# Go to https://github.com/j4jefferson/miro-mcp-server and click Fork

# Option B: Clone to create your own repository
git clone https://github.com/j4jefferson/miro-mcp-server.git
cd miro-mcp-server
# Then create your own repository and push to it
```

### 3.2 Set Repository Secrets
1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** for each of these:

```
CLOUDFLARE_API_TOKEN=your_api_token_from_step_1.3
CLOUDFLARE_ACCOUNT_ID=your_account_id_from_step_1.2
MIRO_CLIENT_ID=your_client_id_from_step_2.3
MIRO_CLIENT_SECRET=your_client_secret_from_step_2.3
```

## Step 4: Deploy

### 4.1 Trigger Deployment
1. Make any small change to trigger deployment (e.g., edit README.md)
2. Commit and push to `main` branch:
```bash
git add .
git commit -m "Initial deployment"
git push origin main
```

### 4.2 Monitor Deployment
1. Go to **Actions** tab in your GitHub repository
2. Watch the deployment workflow
3. Once complete, note the worker URL from the logs

### 4.3 Update Miro Redirect URI
1. Go back to your Miro app settings
2. Update the redirect URI with your actual worker URL:
   `https://your-actual-worker-url.workers.dev/oauth/callback`
3. Save settings

## Step 5: Test Authorization

### 5.1 Complete OAuth Flow
1. Visit `https://your-worker-url.workers.dev/auth`
2. Click the authorization link
3. Complete Miro OAuth process
4. You should see "Authorization Successful!"

### 5.2 Test MCP Server
```bash
# Health check
curl https://your-worker-url.workers.dev/health

# Should return: {"status":"healthy","timestamp":"..."}
```

## Step 6: Connect to Claude

Once your MCP server is deployed and authorized, you can use it with Claude to create and manage your meeting preparation boards!

## Troubleshooting

### Common Issues

**Deployment fails with "Unauthorized"**
- Check that your Cloudflare API token has the correct permissions
- Verify the account ID matches your Cloudflare account

**OAuth fails with "Invalid redirect URI"**
- Ensure the redirect URI in Miro exactly matches your worker URL
- Make sure there are no trailing slashes or extra characters

**"No access token found" error**
- Complete the OAuth flow by visiting `/auth` endpoint
- Check that the authorization was successful

**Worker not found**
- Check GitHub Actions logs for deployment errors
- Verify your Cloudflare account has Workers enabled

### Getting Help

If you encounter issues:
1. Check the GitHub Actions logs for deployment errors
2. Review Cloudflare Workers logs in your dashboard
3. Verify all secrets are set correctly in GitHub
4. Test each endpoint individually

---

**You're all set!** Your Miro MCP server should now be ready to help with meeting preparation and board management.