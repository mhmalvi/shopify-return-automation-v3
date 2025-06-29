-- Comprehensive check of demo data
SELECT 'MERCHANTS' as table_name, 'Demo merchant check' as description;
SELECT 
    id,
    shop_domain,
    plan_type,
    settings->>'shop_name' as shop_name,
    created_at
FROM merchants 
WHERE shop_domain ILIKE '%demo%';

SELECT 'RETURNS' as table_name, 'Demo returns check' as description;
SELECT 
    r.id,
    r.shopify_order_id,
    r.customer_email,
    r.status,
    r.reason,
    r.total_amount,
    r.created_at,
    COUNT(ri.id) as item_count,
    COUNT(ai.id) as ai_suggestion_count
FROM returns r
LEFT JOIN return_items ri ON r.id = ri.return_id
LEFT JOIN ai_suggestions ai ON r.id = ai.return_id
WHERE r.merchant_id = '550e8400-e29b-41d4-a716-446655440000'::uuid
GROUP BY r.id, r.shopify_order_id, r.customer_email, r.status, r.reason, r.total_amount, r.created_at
ORDER BY r.created_at DESC;

SELECT 'RETURN_ITEMS' as table_name, 'Demo return items check' as description;
SELECT 
    ri.id,
    ri.product_name,
    ri.action,
    ri.price,
    ri.quantity,
    r.shopify_order_id
FROM return_items ri
JOIN returns r ON ri.return_id = r.id
WHERE r.merchant_id = '550e8400-e29b-41d4-a716-446655440000'::uuid;

SELECT 'AI_SUGGESTIONS' as table_name, 'Demo AI suggestions check' as description;
SELECT 
    ai.id,
    ai.suggestion_type,
    ai.suggested_product_name,
    ai.confidence_score,
    ai.accepted,
    r.shopify_order_id
FROM ai_suggestions ai
JOIN returns r ON ai.return_id = r.id
WHERE r.merchant_id = '550e8400-e29b-41d4-a716-446655440000'::uuid;

-- Summary metrics (fixed ROUND function)
SELECT 'SUMMARY' as table_name, 'Demo data summary' as description;
SELECT 
    COUNT(DISTINCT r.id) as total_returns,
    COUNT(DISTINCT CASE WHEN ri.action = 'exchange' THEN r.id END) as exchange_returns,
    CAST(
        CASE 
            WHEN COUNT(DISTINCT r.id) > 0 
            THEN (COUNT(DISTINCT CASE WHEN ri.action = 'exchange' THEN r.id END)::float / COUNT(DISTINCT r.id)) * 100 
            ELSE 0 
        END AS DECIMAL(5,2)
    ) as exchange_rate_percent,
    COUNT(ai.id) as total_ai_suggestions,
    COUNT(CASE WHEN ai.accepted = true THEN 1 END) as accepted_suggestions,
    CAST(
        CASE 
            WHEN COUNT(ai.id) > 0 
            THEN (COUNT(CASE WHEN ai.accepted = true THEN 1 END)::float / COUNT(ai.id)) * 100 
            ELSE 0 
        END AS DECIMAL(5,2)
    ) as ai_acceptance_rate_percent,
    SUM(CASE WHEN ri.action = 'exchange' THEN r.total_amount ELSE 0 END) as revenue_saved
FROM returns r
LEFT JOIN return_items ri ON r.id = ri.return_id
LEFT JOIN ai_suggestions ai ON r.id = ai.return_id
WHERE r.merchant_id = '550e8400-e29b-41d4-a716-446655440000'::uuid;
