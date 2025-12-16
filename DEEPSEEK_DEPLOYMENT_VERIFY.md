# Deploy & Verify DeepSeek Setup 🚀

## Step 1: Deploy to Production

Since your `DEEPSEEK_API_KEY` is already in Vercel, you just need to trigger a new deployment:

### Option A: Deploy via Vercel Dashboard (Easiest)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your **ecclesia** project
3. Go to the **Deployments** tab
4. Find the latest deployment
5. Click the **three dots (⋯)** menu
6. Click **Redeploy**
7. Wait for deployment to complete (usually 2-3 minutes)

### Option B: Deploy via Vercel CLI

```bash
# Make sure you're in the project directory
cd /path/to/ecclesia

# Deploy to production
vercel --prod
```

### Option C: Push to Git (if connected)

If your Vercel project is connected to Git:
```bash
git add .
git commit -m "Add DeepSeek API integration"
git push origin main
```
This will automatically trigger a deployment.

---

## Step 2: Verify DeepSeek is Working

### Method 1: Quick API Test (Recommended)

After deployment, visit this URL in your browser:
```
https://your-app.vercel.app/api/ai/test
```

**Expected Success Response:**
```json
{
  "success": true,
  "message": "DeepSeek API is working correctly!",
  "provider": "DeepSeek",
  "model": "deepseek-chat",
  "testResponse": "Prayer is a vital spiritual practice that allows us to communicate with God...",
  "timestamp": "2025-01-14T..."
}
```

**If you see an error:**
- Check that `DEEPSEEK_API_KEY` is set in Vercel
- Verify the deployment completed successfully
- Check Vercel function logs for errors

### Method 2: Use Verification Script

Run the verification script:
```bash
node scripts/verify-deepseek.js https://your-app.vercel.app
```

Replace `https://your-app.vercel.app` with your actual Vercel URL.

**Expected Output:**
```
🔍 Verifying DeepSeek API Setup...

Testing: https://your-app.vercel.app/api/ai/test

✅ SUCCESS! DeepSeek API is working correctly!

Provider: DeepSeek
Model: deepseek-chat
Message: DeepSeek API is working correctly!
Test Response Preview: Prayer is a vital spiritual practice that allows us to communicate with God...

✅ Your DeepSeek integration is ready to use!
```

### Method 3: Test in the UI (Full Integration Test)

1. **Login to your application**
   - Go to: `https://your-app.vercel.app/auth/login`
   - Login with your credentials

2. **Navigate to AI Coaching**
   - Go to Dashboard
   - Click on **"AI Coaching"** card
   - Or visit: `https://your-app.vercel.app/ai/coaching`

3. **Send a test question**
   - Try: "How can I grow in my prayer life?"
   - Or: "What does the Bible say about forgiveness?"

4. **Verify the response**
   - You should see a thoughtful, Bible-based response
   - Response should appear within 2-5 seconds
   - No error messages should appear

---

## Step 3: Check Vercel Function Logs

If something isn't working, check the logs:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Deployments** tab
4. Click on the latest deployment
5. Go to **Functions** tab
6. Click on `/api/ai/test` or `/api/ai/coaching`
7. Check for any errors

**What to look for:**
- ✅ No errors: Everything is working
- ❌ "DEEPSEEK_API_KEY not set": Environment variable not loaded
- ❌ "API key invalid": Check your API key
- ❌ "Rate limit exceeded": You've hit API limits (check DeepSeek dashboard)

---

## Step 4: Verify Environment Variable in Vercel

Make sure the environment variable is set correctly:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Verify `DEEPSEEK_API_KEY` exists
5. Check that it's enabled for **Production** environment
6. Make sure the value is correct (should start with `sk-`)

**Important:** After adding/updating environment variables, you **must** redeploy for changes to take effect!

---

## Troubleshooting

### Issue: Test endpoint returns "not configured"

**Solution:**
1. Verify `DEEPSEEK_API_KEY` is in Vercel environment variables
2. Make sure it's enabled for Production environment
3. Redeploy the application
4. Wait 2-3 minutes for deployment to complete

### Issue: API errors in logs

**Possible causes:**
1. **Invalid API key**: Verify your key is correct
2. **No credits**: Check your DeepSeek account has credits
3. **Rate limiting**: You've exceeded API limits
4. **Network issues**: Temporary API outage

**Solution:**
- Check your DeepSeek dashboard: https://platform.deepseek.com/usage
- Verify API key is active
- Try again after a few minutes

### Issue: Slow responses

**This is normal:**
- DeepSeek API can take 2-5 seconds per request
- First request might be slower (cold start)
- Subsequent requests should be faster

### Issue: Deployment failed

**Check:**
1. Build logs in Vercel Dashboard
2. Verify all dependencies are in `package.json`
3. Check for TypeScript/linting errors
4. Make sure environment variables don't have syntax errors

---

## Success Indicators

You'll know everything is working when:

✅ `/api/ai/test` returns `success: true`  
✅ Test script shows "SUCCESS"  
✅ AI Coaching chat responds to questions  
✅ No errors in Vercel function logs  
✅ Responses are thoughtful and Bible-based  

---

## Next Steps After Verification

Once verified, you can:

1. **Test all AI features:**
   - AI Coaching Chat (`/ai/coaching`)
   - Reading Plan Recommendations
   - AI Follow-up Generation

2. **Monitor usage:**
   - Check DeepSeek dashboard: https://platform.deepseek.com/usage
   - Monitor costs and usage patterns

3. **Optimize if needed:**
   - Adjust `max_tokens` in `lib/ai/openai.ts` if responses are too long/short
   - Change model if needed (`DEEPSEEK_MODEL` environment variable)

---

## Quick Reference

**Verification URL:**
```
https://your-app.vercel.app/api/ai/test
```

**DeepSeek Dashboard:**
- API Keys: https://platform.deepseek.com/api_keys
- Usage: https://platform.deepseek.com/usage
- Docs: https://platform.deepseek.com/docs

**Vercel Dashboard:**
- Project: https://vercel.com/dashboard
- Environment Variables: Settings → Environment Variables
- Function Logs: Deployments → [Latest] → Functions

---

**Ready to deploy?** Let me know when deployment is complete and we'll verify everything together! 🎉

