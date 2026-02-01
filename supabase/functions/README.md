# Supabase Edge Functions

## fetch-brand-logo

### Purpose
This edge function acts as a server-side proxy for the Brandfetch API to avoid CORS (Cross-Origin Resource Sharing) issues when fetching brand logos from the admin dashboard.

### Why We Need This
- Brandfetch API blocks direct browser requests (CORS policy)
- Edge functions run server-side, so no CORS restrictions
- Keeps API usage secure and controlled

### How It Works
1. Frontend calls our edge function with brand name
2. Edge function makes request to Brandfetch API
3. Edge function returns logo data to frontend
4. No CORS errors! ✅

### Deployment

#### Prerequisites
- Supabase CLI installed: `npm install -g supabase`
- Supabase account and project

#### Steps

1. **Login to Supabase CLI**
   ```bash
   supabase login
   ```

2. **Link to Your Project**
   ```bash
   # Get your project ref from Supabase dashboard (Settings > General)
   supabase link --project-ref YOUR_PROJECT_REF
   ```

3. **Deploy Function**
   ```bash
   supabase functions deploy fetch-brand-logo
   ```

4. **Verify Deployment**
   ```bash
   # Test the deployed function
   curl "https://YOUR_PROJECT_REF.supabase.co/functions/v1/fetch-brand-logo?query=ray-ban"
   ```

## Setting Up Brandfetch API Key

To use your Brandfetch API key for better rate limits and reliability:

### Method 1: Via Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard
2. Navigate to **Edge Functions** → **Manage secrets**
3. Click **Add new secret**
4. Name: `BRANDFETCH_API_KEY`
5. Value: `FabuqEicjs39ZXqRpK32ZhUPUsuflZeRT57DvH8kp9rqNmHawEEy0b7n6VG_FeKNOrj7Gp2-6x-CQnivTsjGgg`
6. Click **Save**

### Method 2: Via Supabase CLI

```bash
# Set the secret
supabase secrets set BRANDFETCH_API_KEY=FabuqEicjs39ZXqRpK32ZhUPUsuflZeRT57DvH8kp9rqNmHawEEy0b7n6VG_FeKNOrj7Gp2-6x-CQnivTsjGgg

# Verify it's set
supabase secrets list
```

### Method 3: Local Development

For local testing, create a `.env` file in `supabase/functions/fetch-brand-logo/`:

```
BRANDFETCH_API_KEY=FabuqEicjs39ZXqRpK32ZhUPUsuflZeRT57DvH8kp9rqNmHawEEy0b7n6VG_FeKNOrj7Gp2-6x-CQnivTsjGgg
```

**Note**: Add `.env` to `.gitignore` to avoid committing secrets!

### Verify API Key is Working

After setting the secret and redeploying:

1. Check edge function logs in Supabase Dashboard
2. You should NOT see: "BRANDFETCH_API_KEY not set" warning
3. Test a brand search in your admin dashboard
4. Logs should show: "Successfully fetched logo for: [brand name]"

### Benefits of Using API Key

- ✅ **Higher rate limits**: More requests per month
- ✅ **Better reliability**: Priority API access
- ✅ **More data**: Access to additional brand information
- ✅ **Faster responses**: Premium tier caching

### Troubleshooting

**API key not working?**
- Redeploy function after setting secret: `supabase functions deploy fetch-brand-logo`
- Check logs for authentication errors
- Verify key is correct in Supabase secrets

**Still seeing public API warning?**
- Function needs to be redeployed after secret is added
- Check that secret name is exactly: `BRANDFETCH_API_KEY`

### Environment Variables

The edge function uses the following secret:

- `BRANDFETCH_API_KEY` - Your Brandfetch API key for authenticated requests

**Setup:**
```bash
supabase secrets set BRANDFETCH_API_KEY=your_api_key_here
```

**Why it's needed:**
- Free public API has rate limits (1000 requests/month)
- Authenticated API provides higher limits and better reliability
- Optional but recommended for production use

### Testing Locally

1. **Start Supabase locally**
   ```bash
   supabase start
   ```

2. **Serve the function**
   ```bash
   supabase functions serve fetch-brand-logo
   ```

3. **Test it**
   ```bash
   curl "http://localhost:54321/functions/v1/fetch-brand-logo?query=oakley"
   ```

### Troubleshooting

**Function not found (404)**
- Make sure function is deployed: `supabase functions list`
- Redeploy: `supabase functions deploy fetch-brand-logo`

**CORS errors still happening**
- Check that `VITE_SUPABASE_URL` is set in your `.env` file
- Verify edge function URL is correct in `src/utils/brandfetch.ts`

**Brand not found errors**
- Check Brandfetch API status
- Try different brand names
- Use manual URL entry as fallback

### API Rate Limits

Brandfetch free tier:
- 1,000 requests/month
- No API key required
- Sufficient for admin usage

### Monitoring

View function logs in Supabase Dashboard:
1. Go to Edge Functions
2. Select `fetch-brand-logo`
3. View logs and invocations
