# SEO Setup Guide

## Google Search Console Setup

### 1. Submit Sitemap

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Select property: `optima-optique.com`
3. Click **Sitemaps** in left menu
4. Enter sitemap URL: `https://optima-optique.com/sitemap.xml`
5. Click **Submit**

### 2. Request Indexing for Unindexed Pages

For each page showing "Not indexed":

1. Go to **URL Inspection**
2. Enter the URL
3. Click **Request Indexing**
4. Wait 1-3 days for Google to crawl

### 3. Fix Redirect Issues

All redirects should be 301 (permanent) not 302 (temporary).

Check with:
```bash
curl -I https://optima-optique.com
```

## Structured Data Testing

Test structured data with:
- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Schema.org Validator](https://validator.schema.org/)

## Monitoring

### Check Indexing Status
- Google Search Console → Pages
- Should see 7+ pages indexed within 2 weeks

### Check Rich Snippets
- Google Search: `site:optima-optique.com`
- Look for stars, prices, breadcrumbs in results

## Best Practices

1. **Update sitemap** when adding new products/categories
2. **Request indexing** for new important pages
3. **Monitor Core Web Vitals** in Search Console
4. **Fix mobile usability issues** promptly
5. **Keep content fresh** - update products regularly

## Canonical URLs

Every page should have a canonical URL:
```html
<link rel="canonical" href="https://optima-optique.com/page-url" />
```

## Meta Tags Checklist

- ✅ Title (50-60 characters)
- ✅ Description (150-160 characters)
- ✅ Canonical URL
- ✅ Open Graph tags
- ✅ Twitter cards
- ✅ Structured data (JSON-LD)

## Common Issues

### Pages Not Indexing
- Check robots.txt not blocking
- Ensure no `noindex` meta tag
- Submit sitemap
- Request indexing
- Add internal links

### Duplicate Content
- Use canonical tags
- Avoid URL parameters
- Consistent URL structure

### Slow Indexing
- Improve page speed
- Add more internal links
- Update content regularly
- Build backlinks
