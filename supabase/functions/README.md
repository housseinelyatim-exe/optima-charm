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

### Environment Variables

No environment variables needed! The function uses Brandfetch's public API.

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
