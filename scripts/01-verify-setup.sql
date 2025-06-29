-- Verify all tables were created
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('merchants', 'users', 'returns', 'return_items', 'ai_suggestions', 'analytics_events', 'billing_records')
ORDER BY tablename;

-- Check if demo data was inserted
SELECT 'merchants' as table_name, count(*) as record_count FROM merchants
UNION ALL
SELECT 'users' as table_name, count(*) as record_count FROM users
UNION ALL
SELECT 'returns' as table_name, count(*) as record_count FROM returns
UNION ALL
SELECT 'return_items' as table_name, count(*) as record_count FROM return_items
UNION ALL
SELECT 'ai_suggestions' as table_name, count(*) as record_count FROM ai_suggestions
UNION ALL
SELECT 'analytics_events' as table_name, count(*) as record_count FROM analytics_events
UNION ALL
SELECT 'billing_records' as table_name, count(*) as record_count FROM billing_records;

-- Test a simple join to verify relationships work
SELECT 
    r.id as return_id,
    r.customer_email,
    r.reason,
    r.status,
    ri.product_name,
    ri.action,
    ai.suggested_product_name,
    ai.confidence_score
FROM returns r
LEFT JOIN return_items ri ON r.id = ri.return_id
LEFT JOIN ai_suggestions ai ON r.id = ai.return_id
WHERE r.merchant_id = '550e8400-e29b-41d4-a716-446655440000'::uuid
ORDER BY r.created_at DESC;
