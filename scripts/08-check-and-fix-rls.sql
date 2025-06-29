-- Check current RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';

-- Temporarily disable RLS for testing (DO NOT USE IN PRODUCTION)
ALTER TABLE merchants DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE returns DISABLE ROW LEVEL SECURITY;
ALTER TABLE return_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE ai_suggestions DISABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE billing_records DISABLE ROW LEVEL SECURITY;

-- Check if data is visible now
SELECT 'merchants' as table_name, count(*) as count FROM merchants
UNION ALL
SELECT 'users', count(*) FROM users
UNION ALL
SELECT 'returns', count(*) FROM returns
UNION ALL
SELECT 'return_items', count(*) FROM return_items
UNION ALL
SELECT 'ai_suggestions', count(*) FROM ai_suggestions;

-- Check specific merchant data
SELECT 
  r.id,
  r.shopify_order_id,
  r.customer_email,
  r.status,
  r.reason,
  r.total_amount,
  COUNT(ri.id) as item_count,
  COUNT(ai.id) as suggestion_count
FROM returns r
LEFT JOIN return_items ri ON r.id = ri.return_id
LEFT JOIN ai_suggestions ai ON r.id = ai.return_id
WHERE r.merchant_id = '550e8400-e29b-41d4-a716-446655440000'
GROUP BY r.id, r.shopify_order_id, r.customer_email, r.status, r.reason, r.total_amount;
