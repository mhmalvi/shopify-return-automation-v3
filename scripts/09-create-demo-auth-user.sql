-- Create demo merchant and user for testing
-- This script creates the necessary demo data for the Returns Automation platform

-- Insert demo merchant
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

-- Insert demo user
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

-- Insert some demo returns data
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
  '550e8400-e29b-41d4-a716-446655440010',
  '550e8400-e29b-41d4-a716-446655440000',
  '1001',
  'customer@example.com',
  'pending',
  'Defective item',
  '[{"id": "1", "title": "Premium Wireless Headphones", "quantity": 1, "price": "89.99"}]'::jsonb,
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '2 days'
),
(
  '550e8400-e29b-41d4-a716-446655440011',
  '550e8400-e29b-41d4-a716-446655440000',
  '1002',
  'john.doe@example.com',
  'approved',
  'Wrong size',
  '[{"id": "2", "title": "Cotton T-Shirt", "quantity": 2, "price": "25.99"}]'::jsonb,
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '3 days'
),
(
  '550e8400-e29b-41d4-a716-446655440012',
  '550e8400-e29b-41d4-a716-446655440000',
  '1003',
  'jane.smith@example.com',
  'completed',
  'Not as described',
  '[{"id": "3", "title": "Bluetooth Speaker", "quantity": 1, "price": "59.99"}]'::jsonb,
  NOW() - INTERVAL '10 days',
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
SELECT 'Demo merchant created:' as message, * FROM merchants WHERE id = '550e8400-e29b-41d4-a716-446655440000';
SELECT 'Demo user created:' as message, * FROM users WHERE id = '550e8400-e29b-41d4-a716-446655440001';
SELECT 'Demo returns created:' as message, COUNT(*) as count FROM returns WHERE merchant_id = '550e8400-e29b-41d4-a716-446655440000';
