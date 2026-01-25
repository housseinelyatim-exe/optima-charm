# Deployment Guide

## Environment Variables

Before deploying, configure these environment variables in your hosting platform:

- `VITE_SUPABASE_PROJECT_ID`: Your Supabase project ID
- `VITE_SUPABASE_PUBLISHABLE_KEY`: Your Supabase publishable/anon key
- `VITE_SUPABASE_URL`: Your Supabase project URL

## Recommended Hosting Platforms

### Vercel (Recommended)
1. Connect your GitHub repository
2. Set environment variables in project settings
3. Deploy automatically on push to main

### Netlify
1. Connect your GitHub repository
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Set environment variables in site settings

### Build Locally
```bash
npm install
npm run build
```

The production files will be in the `dist/` directory.
