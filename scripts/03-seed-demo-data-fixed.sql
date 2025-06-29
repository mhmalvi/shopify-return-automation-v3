-- Insert demo merchant (using a fixed UUID for consistency)
INSERT INTO merchants (id, shop_domain, access_token, settings, plan_type) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440000'::uuid,
    'demo-store.myshopify.com',
    'encrypted_demo_token_12345',
    '{"brand_color": "#1D4ED8", "logo_url": "/placeholder.svg?height=40&width=120", "return_policy": "We accept returns within 30 days of purchase."}'::jsonb,
    'growth'
) ON CONFLICT (shop_domain) DO UPDATE SET
    settings = EXCLUDED.settings,
    plan_type = EXCLUDED.plan_type;

-- Insert demo user
INSERT INTO users (merchant_id, email, role) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440000'::uuid,
    'admin@demo-store.com',
    'admin'
) ON CONFLICT (merchant_id, email) DO NOTHING;

-- Insert demo returns
INSERT INTO returns (id, merchant_id, shopify_order_id, customer_email, status, reason, total_amount) VALUES 
(
    '660e8400-e29b-41d4-a716-446655440001'::uuid,
    '550e8400-e29b-41d4-a716-446655440000'::uuid,
    '12345',
    'customer@example.com',
    'requested',
    'Item too small',
    29.99
),
(
    '660e8400-e29b-41d4-a716-446655440002'::uuid,
    '550e8400-e29b-41d4-a716-446655440000'::uuid,
    '12346',
    'another@example.com',
    'approved',
    'Defective item',
    59.99
),
(
    '660e8400-e29b-41d4-a716-446655440003'::uuid,
    '550e8400-e29b-41d4-a716-446655440000'::uuid,
    '12347',
    'third@example.com',
    'completed',
    'Wrong color',
    39.99
) ON CONFLICT (id) DO NOTHING;

-- Insert demo return items
INSERT INTO return_items (return_id, product_id, product_name, variant_id, quantity, price, action, exchange_product_id) VALUES 
(
    '660e8400-e29b-41d4-a716-446655440001'::uuid,
    'prod_123',
    'Premium Cotton T-Shirt',
    'var_123_m_blue',
    1,
    29.99,
    'exchange',
    'var_123_l_blue'
),
(
    '660e8400-e29b-41d4-a716-446655440002'::uuid,
    'prod_456',
    'Denim Jeans',
    'var_456_32_dark',
    1,
    59.99,
    'refund',
    NULL
),
(
    '660e8400-e29b-41d4-a716-446655440003'::uuid,
    'prod_789',
    'Summer Dress',
    'var_789_m_red',
    1,
    39.99,
    'exchange',
    'var_789_m_blue'
) ON CONFLICT DO NOTHING;

-- Insert demo AI suggestions
INSERT INTO ai_suggestions (return_id, suggestion_type, suggested_product_id, suggested_product_name, confidence_score, reasoning, accepted) VALUES 
(
    '660e8400-e29b-41d4-a716-446655440001'::uuid,
    'exchange',
    'var_123_l_blue',
    'Premium Cotton T-Shirt - Size L / Blue',
    0.92,
    'Based on your return reason "too small", we recommend trying the same item in a larger size.',
    true
),
(
    '660e8400-e29b-41d4-a716-446655440003'::uuid,
    'exchange',
    'var_789_m_blue',
    'Summer Dress - Size M / Blue',
    0.87,
    'Customer mentioned wrong color. Blue is a popular alternative for this style.',
    null
) ON CONFLICT DO NOTHING;

-- Insert demo analytics events
INSERT INTO analytics_events (merchant_id, event_type, event_data) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440000'::uuid,
    'return_created',
    '{"return_id": "660e8400-e29b-41d4-a716-446655440001", "reason": "Item too small", "total_amount": 29.99, "items_count": 1}'::jsonb
),
(
    '550e8400-e29b-41d4-a716-446655440000'::uuid,
    'ai_suggestion_generated',
    '{"return_id": "660e8400-e29b-41d4-a716-446655440001", "confidence_score": 0.92, "suggestion_type": "exchange"}'::jsonb
),
(
    '550e8400-e29b-41d4-a716-446655440000'::uuid,
    'return_status_updated',
    '{"return_id": "660e8400-e29b-41d4-a716-446655440002", "old_status": "requested", "new_status": "approved"}'::jsonb
) ON CONFLICT DO NOTHING;

-- Insert demo billing record
INSERT INTO billing_records (merchant_id, plan_type, usage_count, current_period_start, current_period_end) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440000'::uuid,
    'growth',
    23,
    NOW() - INTERVAL '15 days',
    NOW() + INTERVAL '15 days'
) ON CONFLICT DO NOTHING;
