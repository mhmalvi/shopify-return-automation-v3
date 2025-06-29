-- Delete existing demo data first to avoid conflicts
DELETE FROM ai_suggestions WHERE return_id IN (
    SELECT id FROM returns WHERE merchant_id = '550e8400-e29b-41d4-a716-446655440000'::uuid
);
DELETE FROM return_items WHERE return_id IN (
    SELECT id FROM returns WHERE merchant_id = '550e8400-e29b-41d4-a716-446655440000'::uuid
);
DELETE FROM returns WHERE merchant_id = '550e8400-e29b-41d4-a716-446655440000'::uuid;
DELETE FROM users WHERE merchant_id = '550e8400-e29b-41d4-a716-446655440000'::uuid;
DELETE FROM merchants WHERE id = '550e8400-e29b-41d4-a716-446655440000'::uuid;

-- Insert demo merchant
INSERT INTO merchants (id, shop_domain, access_token, settings, plan_type, created_at, updated_at) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440000'::uuid,
    'demo-store.myshopify.com',
    'encrypted_demo_token_12345',
    '{"brand_color": "#1D4ED8", "logo_url": "/placeholder.svg?height=40&width=120", "return_policy": "We accept returns within 30 days of purchase.", "shop_name": "Demo Store"}'::jsonb,
    'growth',
    NOW(),
    NOW()
);

-- Insert demo user
INSERT INTO users (id, merchant_id, email, role, created_at) VALUES 
(
    gen_random_uuid(),
    '550e8400-e29b-41d4-a716-446655440000'::uuid,
    'admin@demo-store.com',
    'admin',
    NOW()
);

-- Insert demo returns with explicit IDs
INSERT INTO returns (id, merchant_id, shopify_order_id, customer_email, status, reason, total_amount, created_at, updated_at) VALUES 
(
    '660e8400-e29b-41d4-a716-446655440001'::uuid,
    '550e8400-e29b-41d4-a716-446655440000'::uuid,
    '12345',
    'customer@example.com',
    'requested',
    'Item too small',
    29.99,
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days'
),
(
    '660e8400-e29b-41d4-a716-446655440002'::uuid,
    '550e8400-e29b-41d4-a716-446655440000'::uuid,
    '12346',
    'another@example.com',
    'approved',
    'Defective item',
    59.99,
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
),
(
    '660e8400-e29b-41d4-a716-446655440003'::uuid,
    '550e8400-e29b-41d4-a716-446655440000'::uuid,
    '12347',
    'third@example.com',
    'completed',
    'Wrong color',
    39.99,
    NOW() - INTERVAL '3 hours',
    NOW() - INTERVAL '3 hours'
);

-- Insert demo return items
INSERT INTO return_items (id, return_id, product_id, product_name, variant_id, quantity, price, action, exchange_product_id, created_at) VALUES 
(
    gen_random_uuid(),
    '660e8400-e29b-41d4-a716-446655440001'::uuid,
    'prod_123',
    'Premium Cotton T-Shirt',
    'var_123_m_blue',
    1,
    29.99,
    'exchange',
    'var_123_l_blue',
    NOW() - INTERVAL '2 days'
),
(
    gen_random_uuid(),
    '660e8400-e29b-41d4-a716-446655440002'::uuid,
    'prod_456',
    'Denim Jeans',
    'var_456_32_dark',
    1,
    59.99,
    'refund',
    NULL,
    NOW() - INTERVAL '1 day'
),
(
    gen_random_uuid(),
    '660e8400-e29b-41d4-a716-446655440003'::uuid,
    'prod_789',
    'Summer Dress',
    'var_789_m_red',
    1,
    39.99,
    'exchange',
    'var_789_m_blue',
    NOW() - INTERVAL '3 hours'
);

-- Insert demo AI suggestions
INSERT INTO ai_suggestions (id, return_id, suggestion_type, suggested_product_id, suggested_product_name, confidence_score, reasoning, accepted, created_at) VALUES 
(
    gen_random_uuid(),
    '660e8400-e29b-41d4-a716-446655440001'::uuid,
    'exchange',
    'var_123_l_blue',
    'Premium Cotton T-Shirt - Size L / Blue',
    0.92,
    'Based on your return reason "too small", we recommend trying the same item in a larger size.',
    true,
    NOW() - INTERVAL '2 days'
),
(
    gen_random_uuid(),
    '660e8400-e29b-41d4-a716-446655440003'::uuid,
    'exchange',
    'var_789_m_blue',
    'Summer Dress - Size M / Blue',
    0.87,
    'Customer mentioned wrong color. Blue is a popular alternative for this style.',
    null,
    NOW() - INTERVAL '3 hours'
);

-- Insert demo analytics events
INSERT INTO analytics_events (id, merchant_id, event_type, event_data, created_at) VALUES 
(
    gen_random_uuid(),
    '550e8400-e29b-41d4-a716-446655440000'::uuid,
    'return_created',
    '{"return_id": "660e8400-e29b-41d4-a716-446655440001", "reason": "Item too small", "total_amount": 29.99, "items_count": 1}'::jsonb,
    NOW() - INTERVAL '2 days'
),
(
    gen_random_uuid(),
    '550e8400-e29b-41d4-a716-446655440000'::uuid,
    'ai_suggestion_generated',
    '{"return_id": "660e8400-e29b-41d4-a716-446655440001", "confidence_score": 0.92, "suggestion_type": "exchange"}'::jsonb,
    NOW() - INTERVAL '2 days'
),
(
    gen_random_uuid(),
    '550e8400-e29b-41d4-a716-446655440000'::uuid,
    'return_status_updated',
    '{"return_id": "660e8400-e29b-41d4-a716-446655440002", "old_status": "requested", "new_status": "approved"}'::jsonb,
    NOW() - INTERVAL '1 day'
);

-- Insert demo billing record
INSERT INTO billing_records (id, merchant_id, plan_type, usage_count, current_period_start, current_period_end, created_at, updated_at) VALUES 
(
    gen_random_uuid(),
    '550e8400-e29b-41d4-a716-446655440000'::uuid,
    'growth',
    23,
    NOW() - INTERVAL '15 days',
    NOW() + INTERVAL '15 days',
    NOW(),
    NOW()
);

-- Verify the data was inserted
SELECT 'VERIFICATION - Data inserted successfully!' as status;
SELECT 'Merchants:' as table_name, COUNT(*) as count FROM merchants WHERE id = '550e8400-e29b-41d4-a716-446655440000'::uuid;
SELECT 'Returns:' as table_name, COUNT(*) as count FROM returns WHERE merchant_id = '550e8400-e29b-41d4-a716-446655440000'::uuid;
SELECT 'Return Items:' as table_name, COUNT(*) as count FROM return_items ri 
JOIN returns r ON ri.return_id = r.id 
WHERE r.merchant_id = '550e8400-e29b-41d4-a716-446655440000'::uuid;
SELECT 'AI Suggestions:' as table_name, COUNT(*) as count FROM ai_suggestions ai 
JOIN returns r ON ai.return_id = r.id 
WHERE r.merchant_id = '550e8400-e29b-41d4-a716-446655440000'::uuid;
