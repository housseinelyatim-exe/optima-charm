#!/bin/bash

echo "🔐 Setting up Supabase secrets..."
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed"
    echo "Install it with: npm install -g supabase"
    exit 1
fi

# Set Brandfetch API key
echo "📝 Setting BRANDFETCH_API_KEY..."
supabase secrets set BRANDFETCH_API_KEY=FabuqEicjs39ZXqRpK32ZhUPUsuflZeRT57DvH8kp9rqNmHawEEy0b7n6VG_FeKNOrj7Gp2-6x-CQnivTsjGgg

echo ""
echo "✅ Secrets configured!"
echo ""
echo "Next steps:"
echo "1. Deploy the edge function: supabase functions deploy fetch-brand-logo"
echo "2. Test in your admin dashboard"
echo ""
echo "📊 View secrets: supabase secrets list"
