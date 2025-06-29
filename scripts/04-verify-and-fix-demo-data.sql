-- Check if demo merchant exists
SELECT id, shop_domain, settings FROM merchants WHERE shop_domain ILIKE '%demo-store%';

-- If the merchant doesn't exist, let's insert it with the correct domain
INSERT INTO merchants (id, shop_domain, access_token, settings, plan_type) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440000'::uuid,
    'demo-store.myshopify.com',
    'encrypted_demo_token_12345',
    '{"brand_color": "#1D4ED8", "logo_url": "/placeholder.svg?height=40&width=120", "return_policy": "We accept returns within 30 days of purchase.", "shop_name": "Demo Store"}'::jsonb,
    'growth'
) ON CONFLICT (id) DO UPDATE SET
    shop_domain = EXCLUDED.shop_domain,
    settings = EXCLUDED.settings;

-- Verify the merchant exists
SELECT 'Merchant found:' as status, id, shop_domain FROM merchants WHERE shop_domain = 'demo-store.myshopify.com';

-- Check if we have any demo returns
SELECT 'Returns count:' as status, COUNT(*) as count FROM returns WHERE merchant_id = '550e8400-e29b-41d4-a716-446655440000'::uuid;
