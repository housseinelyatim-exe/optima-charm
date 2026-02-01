# Favicon Setup Instructions

⚠️ **IMPORTANT**: The website structure is ready, but the actual favicon image files are NOT yet generated. The site will reference these files, but they won't display correctly until you add them.

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

1. Verify all favicon files are in the `public/` folder
2. Deploy the updated code to Vercel
3. Test the favicon appears correctly in browsers
4. Clear browser cache if needed
5. Request re-indexing in Google Search Console (optional)
6. Wait 1-3 days for Google to update the favicon in search results

## Note on PWA Manifest

The `site.webmanifest` file references the `android-chrome-192x192.png` and `android-chrome-512x512.png` files. The PWA functionality will only work properly after these files are generated and added to the `public/` folder.

## Current Logo Location

The source logo is located at: `src/assets/optima-logo.png`
