-- Create demo merchant
INSERT INTO merchants (
  id,
  shop_domain,
  name,
  access_token,
  webhook_verified,
  created_at,
  updated_at
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'demo-store.myshopify.com',
  'Demo Store',
  'demo_access_token_12345',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  shop_domain = EXCLUDED.shop_domain,
  name = EXCLUDED.name,
  access_token = EXCLUDED.access_token,
  webhook_verified = EXCLUDED.webhook_verified,
  updated_at = NOW();

-- Create demo user
INSERT INTO users (
  id,
  email,
  merchant_id,
  role,
  created_at,
  updated_at
) VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  'admin@demo-store.com',
  '550e8400-e29b-41d4-a716-446655440000',
  'admin',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  merchant_id = EXCLUDED.merchant_id,
  role = EXCLUDED.role,
  updated_at = NOW();

-- Create some demo returns
INSERT INTO returns (
  id,
  merchant_id,
  order_id,
  customer_email,
  status,
  reason,
  items,
  created_at,
  updated_at
) VALUES 
(
  '660e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440000',
  '1001',
  'customer@example.com',
  'pending',
  'Item damaged during shipping',
  '[{"id": "1", "title": "Premium T-Shirt", "quantity": 1, "price": "29.99", "reason": "damaged"}]'::jsonb,
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '2 days'
),
(
  '660e8400-e29b-41d4-a716-446655440002',
  '550e8400-e29b-41d4-a716-446655440000',
  '1002',
  'customer2@example.com',
  'approved',
  'Wrong size ordered',
  '[{"id": "2", "title": "Cotton Hoodie", "quantity": 1, "price": "69.99", "reason": "wrong_size"}]'::jsonb,
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '1 day'
),
(
  '660e8400-e29b-41d4-a716-446655440003',
  '550e8400-e29b-41d4-a716-446655440000',
  '1003',
  'customer3@example.com',
  'completed',
  'Product not as described',
  '[{"id": "3", "title": "Wireless Headphones", "quantity": 1, "price": "89.99", "reason": "not_as_described"}]'::jsonb,
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '1 day'
)
ON CONFLICT (id) DO UPDATE SET
  merchant_id = EXCLUDED.merchant_id,
  order_id = EXCLUDED.order_id,
  customer_email = EXCLUDED.customer_email,
  status = EXCLUDED.status,
  reason = EXCLUDED.reason,
  items = EXCLUDED.items,
  updated_at = NOW();

-- Verify the data was inserted
SELECT 'Demo data created successfully' as message;
SELECT COUNT(*) as merchant_count FROM merchants WHERE shop_domain = 'demo-store.myshopify.com';
SELECT COUNT(*) as user_count FROM users WHERE email = 'admin@demo-store.com';
SELECT COUNT(*) as returns_count FROM returns WHERE merchant_id = '550e8400-e29b-41d4-a716-446655440000';
