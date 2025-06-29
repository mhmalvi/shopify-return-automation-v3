-- Drop existing tables if they exist (in reverse dependency order)
DROP TABLE IF EXISTS billing_records CASCADE;
DROP TABLE IF EXISTS analytics_events CASCADE;
DROP TABLE IF EXISTS ai_suggestions CASCADE;
DROP TABLE IF EXISTS return_items CASCADE;
DROP TABLE IF EXISTS returns CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS merchants CASCADE;

-- Create merchants table first (no dependencies)
CREATE TABLE merchants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    shop_domain VARCHAR(255) UNIQUE NOT NULL,
    access_token TEXT NOT NULL,
    settings JSONB DEFAULT '{}',
    plan_type VARCHAR(20) DEFAULT 'starter' CHECK (plan_type IN ('starter', 'growth', 'pro')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create users table (depends on merchants)
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(merchant_id, email)
);

-- Create returns table (depends on merchants)
CREATE TABLE returns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
    shopify_order_id VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'requested' CHECK (status IN ('requested', 'approved', 'rejected', 'in_transit', 'completed')),
    reason TEXT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create return_items table (depends on returns)
CREATE TABLE return_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    return_id UUID REFERENCES returns(id) ON DELETE CASCADE,
    product_id VARCHAR(255) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    variant_id VARCHAR(255),
    quantity INTEGER NOT NULL DEFAULT 1,
    price DECIMAL(10,2) NOT NULL,
    action VARCHAR(20) DEFAULT 'refund' CHECK (action IN ('refund', 'exchange', 'store_credit')),
    exchange_product_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ai_suggestions table (depends on returns)
CREATE TABLE ai_suggestions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    return_id UUID REFERENCES returns(id) ON DELETE CASCADE,
    suggestion_type VARCHAR(20) NOT NULL CHECK (suggestion_type IN ('exchange', 'store_credit')),
    suggested_product_id VARCHAR(255),
    suggested_product_name VARCHAR(255),
    confidence_score DECIMAL(3,2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
    reasoning TEXT NOT NULL,
    accepted BOOLEAN DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create analytics_events table (depends on merchants)
CREATE TABLE analytics_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create billing_records table (depends on merchants)
CREATE TABLE billing_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
    plan_type VARCHAR(20) NOT NULL CHECK (plan_type IN ('starter', 'growth', 'pro')),
    usage_count INTEGER DEFAULT 0,
    stripe_customer_id VARCHAR(255),
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_returns_merchant_id ON returns(merchant_id);
CREATE INDEX idx_returns_status ON returns(status);
CREATE INDEX idx_returns_created_at ON returns(created_at);
CREATE INDEX idx_return_items_return_id ON return_items(return_id);
CREATE INDEX idx_ai_suggestions_return_id ON ai_suggestions(return_id);
CREATE INDEX idx_analytics_events_merchant_id ON analytics_events(merchant_id);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at);

-- Enable Row Level Security
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_records ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies (simplified for demo)
-- Merchants table policies
CREATE POLICY "Enable read access for authenticated users" ON merchants
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable insert for authenticated users" ON merchants
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for own records" ON merchants
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Users table policies
CREATE POLICY "Enable read access for users" ON users
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable insert for users" ON users
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Returns table policies
CREATE POLICY "Enable read access for returns" ON returns
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable insert for returns" ON returns
    FOR INSERT WITH CHECK (true); -- Allow public insert for customer portal

CREATE POLICY "Enable update for returns" ON returns
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Return items table policies
CREATE POLICY "Enable read access for return_items" ON return_items
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable insert for return_items" ON return_items
    FOR INSERT WITH CHECK (true); -- Allow public insert for customer portal

-- AI suggestions table policies
CREATE POLICY "Enable read access for ai_suggestions" ON ai_suggestions
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable insert for ai_suggestions" ON ai_suggestions
    FOR INSERT WITH CHECK (true); -- Allow system to insert suggestions

CREATE POLICY "Enable update for ai_suggestions" ON ai_suggestions
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Analytics events table policies
CREATE POLICY "Enable read access for analytics_events" ON analytics_events
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable insert for analytics_events" ON analytics_events
    FOR INSERT WITH CHECK (true); -- Allow system to insert events

-- Billing records table policies
CREATE POLICY "Enable read access for billing_records" ON billing_records
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable insert for billing_records" ON billing_records
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for billing_records" ON billing_records
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Insert demo data
-- Demo merchant
INSERT INTO merchants (id, shop_domain, access_token, settings, plan_type) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440000'::uuid,
    'demo-store.myshopify.com',
    'encrypted_demo_token_12345',
    '{"brand_color": "#1D4ED8", "logo_url": "/placeholder.svg?height=40&width=120", "return_policy": "We accept returns within 30 days of purchase."}'::jsonb,
    'growth'
);

-- Demo user
INSERT INTO users (merchant_id, email, role) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440000'::uuid,
    'admin@demo-store.com',
    'admin'
);

-- Demo returns
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
);

-- Demo return items
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
);

-- Demo AI suggestions
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
);

-- Demo analytics events
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
);

-- Demo billing record
INSERT INTO billing_records (merchant_id, plan_type, usage_count, current_period_start, current_period_end) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440000'::uuid,
    'growth',
    23,
    NOW() - INTERVAL '15 days',
    NOW() + INTERVAL '15 days'
);
