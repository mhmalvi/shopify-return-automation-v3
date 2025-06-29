-- Check if tables exist and have data
SELECT 'merchants' as table_name, COUNT(*) as row_count FROM merchants
UNION ALL
SELECT 'returns' as table_name, COUNT(*) as row_count FROM returns
UNION ALL
SELECT 'return_items' as table_name, COUNT(*) as row_count FROM return_items
UNION ALL
SELECT 'ai_suggestions' as table_name, COUNT(*) as row_count FROM ai_suggestions;

-- Check specific merchant data
SELECT 'Demo merchant exists?' as check_type, 
       CASE WHEN COUNT(*) > 0 THEN 'YES' ELSE 'NO' END as result
FROM merchants 
WHERE id = '550e8400-e29b-41d4-a716-446655440000'::uuid;

-- Show all merchants
SELECT 'All merchants:' as info, id, shop_domain FROM merchants;

-- Show all returns
SELECT 'All returns:' as info, id, merchant_id, shopify_order_id, status FROM returns;
