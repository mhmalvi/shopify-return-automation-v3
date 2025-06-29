-- Create demo merchant if it doesn't exist
INSERT INTO merchants (id, shop_domain, name, access_token, webhook_verified, created_at, updated_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'demo-store.myshopify.com',
  'Demo Store',
  'demo_access_token',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  shop_domain = EXCLUDED.shop_domain,
  name = EXCLUDED.name,
  updated_at = NOW();

-- Create demo user if it doesn't exist
INSERT INTO users (id, email, merchant_id, role, created_at, updated_at)
VALUES (
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

-- Create some demo returns data
INSERT INTO returns (id, merchant_id, order_id, customer_email, status, reason, items, created_at, updated_at)
VALUES 
(
  '550e8400-e29b-41d4-a716-446655440010',
  '550e8400-e29b-41d4-a716-446655440000',
  '5000000001',
  'customer@example.com',
  'pending',
  'Item arrived damaged',
  '[{"id": "12345678901234567890", "name": "Premium Wireless Headphones", "quantity": 1, "reason": "Damaged"}]'::jsonb,
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '2 days'
),
(
  '550e8400-e29b-41d4-a716-446655440011',
  '550e8400-e29b-41d4-a716-446655440000',
  '5000000002',
  'john.doe@example.com',
  'approved',
  'Wrong size ordered',
  '[{"id": "12345678901234567891", "name": "Running Shoes", "quantity": 1, "reason": "Wrong size"}]'::jsonb,
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '3 days'
),
(
  '550e8400-e29b-41d4-a716-446655440012',
  '550e8400-e29b-41d4-a716-446655440000',
  '5000000003',
  'jane.smith@example.com',
  'completed',
  'Not as described',
  '[{"id": "12345678901234567892", "name": "Bluetooth Speaker", "quantity": 1, "reason": "Not as described"}]'::jsonb,
  NOW() - INTERVAL '10 days',
  NOW() - INTERVAL '1 day'
) ON CONFLICT (id) DO NOTHING;

-- Verify the data was inserted
SELECT 'Demo merchant created:' as message, * FROM merchants WHERE id = '550e8400-e29b-41d4-a716-446655440000';
SELECT 'Demo user created:' as message, * FROM users WHERE id = '550e8400-e29b-41d4-a716-446655440001';
SELECT 'Demo returns created:' as message, COUNT(*) as count FROM returns WHERE merchant_id = '550e8400-e29b-41d4-a716-446655440000';
