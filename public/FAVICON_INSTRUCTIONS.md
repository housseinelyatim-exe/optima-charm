# Favicon Setup Instructions

## Required Favicon Files

The following favicon files need to be added to the `public` folder:

1. `favicon.ico` - 32x32 pixels (classic favicon)
2. `favicon-16x16.png` - 16x16 pixels
3. `favicon-32x32.png` - 32x32 pixels
4. `apple-touch-icon.png` - 180x180 pixels (for iOS/Safari)
5. `android-chrome-192x192.png` - 192x192 pixels
6. `android-chrome-512x512.png` - 512x512 pixels
7. `og-image.png` - 1200x630 pixels (for social media sharing)

## How to Generate Favicons

### Method 1: Using favicon.io (Recommended)

1. Go to https://favicon.io/favicon-converter/
2. Upload the Optima logo from `src/assets/optima-logo.png`
3. Download the generated favicon package
4. Extract all files to the `public` folder

### Method 2: Using RealFaviconGenerator

1. Go to https://realfavicongenerator.net/
2. Upload the Optima logo from `src/assets/optima-logo.png`
3. Customize settings for each platform
4. Download and extract to the `public` folder

## After Adding Favicons

1. Deploy the updated code to Vercel
2. Clear browser cache
3. Request re-indexing in Google Search Console (optional)
4. Wait 1-3 days for Google to update the favicon in search results

## Current Logo Location

The source logo is located at: `src/assets/optima-logo.png`
