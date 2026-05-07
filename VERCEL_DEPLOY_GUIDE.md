# Deploy GitHub Readme Stats to Vercel

## Prerequisites
- Vercel account (free tier works)
- GitHub Personal Access Token (PAT)

## Step 1: Get GitHub PAT
1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select scopes:
   - `public_repo` (for public repo stats)
   - `read:user` (for user info)
   - Optional: `repo` (for private repo stats if needed)
4. Generate and copy the token

## Step 2: Configure the Code

Your fork is at: https://github.com/RahulRachhoya/github-readme-stats

The code is ready at: `/tmp/github-readme-stats`

## Step 3: Deploy

### Option A: One-click Deploy (Easy)
1. Go to: https://vercel.com/new
2. Import your fork: `RahulRachhoya/github-readme-stats`
3. Add Environment Variable:
   - Name: `PAT_1`
   - Value: `YOUR_GITHUB_TOKEN_HERE`
4. Deploy

### Option B: CLI Deploy (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
cd /tmp/github-readme-stats
vercel --prod

# Set environment variable
vercel env add PAT_1
```

## Step 4: Update Your Profile README

After deployment, your URL will be something like:
```
https://github-readme-stats-XXX.vercel.app
```

Update `/home/rahul/github-profile/README.md` with:
```markdown
<img src="https://YOUR_VERCEL_URL/api?username=RahulRachhoya&show_icons=true&theme=github_dark" />
<img src="https://YOUR_VERCEL_URL/api/top-langs/?username=RahulRachhoya&layout=compact&theme=github_dark" />
```

## Benefits of Self-Hosted
- ✅ No rate limits
- ✅ Always fast
- ✅ Private repos supported (with PAT)
- ✅ You control the service
