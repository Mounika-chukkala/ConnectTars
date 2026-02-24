# How to Host ConnectTars

## Option 1: Vercel (Recommended - Best for Next.js) ⭐

Vercel is made by the Next.js team and offers the best integration.

### Steps:

1. **Push your code to GitHub** (if not already done)
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push -u origin main
   ```

2. **Sign up/Login to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with your GitHub account

3. **Import your repository**
   - Click "Add New..." → "Project"
   - Import your `ConnectTars` repository
   - Vercel will auto-detect Next.js settings

4. **Configure Environment Variables**
   In Vercel dashboard, go to your project → Settings → Environment Variables, add:
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   NEXT_PUBLIC_CONVEX_URL=your_convex_url
   CLERK_JWT_ISSUER_DOMAIN=your_clerk_jwt_issuer_domain
   ```

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your app will be live at `your-project.vercel.app`

6. **Configure Custom Domain (Optional)**
   - Go to Settings → Domains
   - Add your custom domain

### Vercel Features:
- ✅ Free tier (generous limits)
- ✅ Automatic deployments on git push
- ✅ Preview deployments for PRs
- ✅ Built-in CDN
- ✅ Zero configuration needed

---

## Option 2: Netlify

### Steps:

1. **Push code to GitHub**

2. **Sign up at [netlify.com](https://netlify.com)**

3. **Import repository**
   - Click "Add new site" → "Import an existing project"
   - Connect GitHub and select your repo

4. **Build settings** (auto-detected):
   - Build command: `npm run build`
   - Publish directory: `.next`

5. **Add Environment Variables**
   - Site settings → Environment variables
   - Add all your env variables

6. **Deploy**

---

## Option 3: Railway

### Steps:

1. **Sign up at [railway.app](https://railway.app)**

2. **Create new project** → "Deploy from GitHub repo"

3. **Select your repository**

4. **Add Environment Variables**
   - Variables tab → Add all env variables

5. **Deploy**
   - Railway auto-detects Next.js
   - Builds and deploys automatically

---

## Option 4: Render

### Steps:

1. **Sign up at [render.com](https://render.com)**

2. **Create new Web Service**
   - Connect GitHub repository
   - Select your repo

3. **Configure:**
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Environment: `Node`

4. **Add Environment Variables**
   - Environment tab → Add all variables

5. **Deploy**

---

## Required Environment Variables

Make sure you have these set in your hosting platform:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
CLERK_JWT_ISSUER_DOMAIN=https://your-clerk-domain.clerk.accounts.dev
```

---

## Post-Deployment Checklist

### 1. Update Clerk Settings
- Go to Clerk Dashboard → Domains
- Add your production domain (e.g., `your-app.vercel.app`)
- Update allowed origins

### 2. Update Convex Settings
- Go to Convex Dashboard → Settings
- Add your production URL to allowed origins (if needed)

### 3. Test Your App
- ✅ Sign up/Sign in works
- ✅ Messages send/receive
- ✅ Real-time updates work
- ✅ File uploads work

---

## Quick Deploy Commands (Vercel CLI)

If you prefer CLI:

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

---

## Cost Comparison

| Platform | Free Tier | Paid Plans |
|----------|-----------|------------|
| **Vercel** | ✅ Generous (100GB bandwidth) | $20/month |
| **Netlify** | ✅ Good (100GB bandwidth) | $19/month |
| **Railway** | ✅ $5 credit/month | $5+/month |
| **Render** | ✅ Limited (750 hours/month) | $7+/month |

**Recommendation:** Start with Vercel (best Next.js integration, easiest setup)

---

## Troubleshooting

### Build Fails
- Check environment variables are set correctly
- Ensure all dependencies are in `package.json`
- Check build logs for specific errors

### Environment Variables Not Working
- Make sure variables start with `NEXT_PUBLIC_` for client-side access
- Restart deployment after adding variables
- Check variable names match exactly (case-sensitive)

### Convex Connection Issues
- Verify `NEXT_PUBLIC_CONVEX_URL` is correct
- Check Convex dashboard for deployment status
- Ensure Clerk JWT template is configured

### Clerk Authentication Issues
- Add production domain to Clerk allowed origins
- Verify `CLERK_SECRET_KEY` is set correctly
- Check Clerk dashboard for any errors

---

## Need Help?

- Vercel Docs: https://vercel.com/docs
- Next.js Deployment: https://nextjs.org/docs/deployment
- Convex Deployment: https://docs.convex.dev/deployment
