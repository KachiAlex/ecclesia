# Vercel Environment Variables Setup

After deployment, you **MUST** set these environment variables in Vercel Dashboard for your app to work.

## Step 1: Go to Vercel Dashboard

1. Visit: https://vercel.com/dashboard
2. Click on your project: **ecclesia**
3. Go to **Settings** → **Environment Variables**

## Step 2: Add Environment Variables

Add each of these variables:

### Required Variables

1. **NEXT_PUBLIC_FIREBASE_PROJECT_ID**
   - Value: `ecclesia-2025`
   - Environment: Production, Preview, Development

2. **FIREBASE_ADMIN_PROJECT_ID**
   - Value: `ecclesia-2025`
   - Environment: Production, Preview, Development

3. **FIREBASE_PROJECT_ID**
   - Value: `ecclesia-2025`
   - Environment: Production, Preview, Development

4. **NEXTAUTH_URL**
   - Value: `https://ecclesia-anns2c9j8-onyedikachi-akomas-projects.vercel.app` (or your custom domain)
   - Environment: Production
   - For Preview: Use the preview URL shown in deployment
   - For Development: `http://localhost:3000`

5. **NEXTAUTH_SECRET**
   - Value: `5BTVRwmH1+tfYdaXI2YGvpzREuUi7CofKqeX5M5aXBY=`
   - Environment: Production, Preview, Development

6. **FIREBASE_SERVICE_ACCOUNT**
   - Value: (Paste the entire JSON file as a single-line string)
   - To get single-line: Open `firebase-service-account.json`, copy all content, remove all newlines
   - Or use this command: `node -e "console.log(JSON.stringify(require('./firebase-service-account.json')))"`
   - Environment: Production, Preview, Development

### Optional Variables

7. **OPENAI_API_KEY** (if using AI features)
   - Value: Your OpenAI API key
   - Environment: Production, Preview, Development

8. **NODE_ENV**
   - Value: `production`
   - Environment: Production

## Step 3: Convert Service Account to Single Line

Run this command to get the single-line JSON:

```bash
node -e "console.log(JSON.stringify(require('./firebase-service-account.json')))"
```

Copy the output and paste it as the value for `FIREBASE_SERVICE_ACCOUNT`.

## Step 4: Redeploy

After adding environment variables:

1. Go to **Deployments** tab
2. Click the **three dots** (⋯) on the latest deployment
3. Click **Redeploy**
4. Or trigger a new deployment: `vercel --prod`

## Step 5: Verify

After redeployment, visit your app URL and test:
- Login functionality
- API routes
- Firestore connections

## Troubleshooting

### App Still Not Working?

1. **Check Environment Variables**: Make sure all are set correctly
2. **Check Deployment Logs**: Go to Deployment → View Function Logs
3. **Check Firestore**: Ensure Firestore is enabled in Firebase Console
4. **Check Service Account**: Verify JSON is valid and properly formatted

### Common Issues

- **"Firebase not initialized"**: Check `FIREBASE_SERVICE_ACCOUNT` is set correctly
- **"Unauthorized"**: Check `NEXTAUTH_SECRET` matches
- **"Invalid project ID"**: Check `FIREBASE_PROJECT_ID` variables

## Quick Command Reference

```bash
# Get service account as single line
node -e "console.log(JSON.stringify(require('./firebase-service-account.json')))"

# Redeploy
vercel --prod

# View logs
vercel logs

# List deployments
vercel ls
```

