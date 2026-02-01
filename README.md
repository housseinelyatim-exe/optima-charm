# Optima Optique - Website

Optima Optique is an optical store located in Le Krib, Siliana, Tunisia, offering quality eyewear, elegant frames, and optical lenses.

## Project info

**Website**: https://optima-optique.com/

## Favicon Setup

This project uses custom favicons for Optima Optique branding. The favicon files should be placed in the `public` folder.

To generate favicons from the logo:
1. Visit https://favicon.io/favicon-converter/
2. Upload `src/assets/optima-logo.png`
3. Download and extract to `public/` folder

See `public/FAVICON_INSTRUCTIONS.md` for detailed instructions.

## How can I edit this code?

There are several ways of editing your application.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

The project is deployed on Vercel. Any changes pushed to the main branch will automatically trigger a deployment.

## Brandfetch Integration

This project uses Brandfetch API to automatically fetch brand logos. 

### How it works:
1. Admin enters brand name (e.g., "Ray-Ban")
2. System searches Brandfetch database
3. Official logo is automatically retrieved
4. No manual logo hunting required!

### Features:
- ✅ Auto-fetch official brand logos
- ✅ No API key required for basic usage
- ✅ Fallback to manual URL entry
- ✅ Always up-to-date logos

### Note:
Brandfetch API has a free tier with generous limits. For production use with high traffic, consider their paid plans.

## Supabase Edge Functions

This project uses Supabase Edge Functions for server-side operations.

### Deploy Edge Functions

To deploy the `fetch-brand-logo` edge function:

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy the function
supabase functions deploy fetch-brand-logo
```

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

### Edge Function: fetch-brand-logo

**Purpose:** Proxy for Brandfetch API to avoid CORS issues

**Endpoint:** `https://YOUR_PROJECT_REF.supabase.co/functions/v1/fetch-brand-logo`

**Parameters:**
- `query` (string): Brand name or domain to search

**Example:**
```bash
curl "https://YOUR_PROJECT_REF.supabase.co/functions/v1/fetch-brand-logo?query=ray-ban"
```

**Response:**
```json
{
  "name": "Ray-Ban",
  "domain": "ray-ban.com",
  "logoUrl": "https://asset.brandfetch.io/..."
}
```

### Local Development

To test edge functions locally:

```bash
# Start local Supabase
supabase start

# Serve functions locally
supabase functions serve fetch-brand-logo

# Test locally
curl "http://localhost:54321/functions/v1/fetch-brand-logo?query=ray-ban"
```
