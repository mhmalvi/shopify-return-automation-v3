-- Create demo auth user script
-- This script creates the demo user in Supabase Auth and related tables

-- First, let's ensure we have the demo merchant
INSERT INTO merchants (id, shop_domain, name, webhook_verified, created_at, updated_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'demo-store.myshopify.com',
  'Demo Store',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  shop_domain = EXCLUDED.shop_domain,
  name = EXCLUDED.name,
  updated_at = NOW();

-- Create the demo user in the users table
-- Note: The actual auth user needs to be created through Supabase Auth API
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
  '660e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440000',
  '5555555555555',
  'customer@example.com',
  'pending',
  'Item doesn''t fit',
  '[{"id": "2222222222222", "title": "Premium T-Shirt", "variant_title": "Large / Blue", "quantity": 1, "reason": "Too large"}]'::jsonb,
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '2 days'
),
(
  '660e8400-e29b-41d4-a716-446655440002',
  '550e8400-e29b-41d4-a716-446655440000',
  '5555555555556',
  'customer2@example.com',
  'approved',
  'Defective item',
  '[{"id": "2222222222223", "title": "Cotton Hoodie", "variant_title": "Medium / Gray", "quantity": 1, "reason": "Hole in fabric"}]'::jsonb,
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '3 days'
),
(
  '660e8400-e29b-41d4-a716-446655440003',
  '550e8400-e29b-41d4-a716-446655440000',
  '5555555555557',
  'customer3@example.com',
  'completed',
  'Wrong color',
  '[{"id": "2222222222224", "title": "Summer Dress", "variant_title": "Small / Red", "quantity": 1, "reason": "Ordered blue, received red"}]'::jsonb,
  NOW() - INTERVAL '10 days',
  NOW() - INTERVAL '1 day'
);

-- Verify the data was inserted
SELECT 'Demo merchant created:' as message, * FROM merchants WHERE shop_domain = 'demo-store.myshopify.com';
SELECT 'Demo user created:' as message, * FROM users WHERE email = 'admin@demo-store.com';
SELECT 'Demo returns created:' as message, COUNT(*) as count FROM returns WHERE merchant_id = '550e8400-e29b-41d4-a716-446655440000';
