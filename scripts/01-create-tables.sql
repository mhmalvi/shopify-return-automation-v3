-- Create merchants table first
CREATE TABLE IF NOT EXISTS merchants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    shop_domain VARCHAR(255) UNIQUE NOT NULL,
    access_token TEXT NOT NULL,
    settings JSONB DEFAULT '{}',
    plan_type VARCHAR(20) DEFAULT 'starter' CHECK (plan_type IN ('starter', 'growth', 'pro')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create users table (merchant staff)
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(merchant_id, email)
);

-- Create returns table
CREATE TABLE IF NOT EXISTS returns (
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

-- Create return_items table
CREATE TABLE IF NOT EXISTS return_items (
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

-- Create ai_suggestions table
CREATE TABLE IF NOT EXISTS ai_suggestions (
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

-- Create analytics_events table
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create billing_records table
CREATE TABLE IF NOT EXISTS billing_records (
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
CREATE INDEX IF NOT EXISTS idx_returns_merchant_id ON returns(merchant_id);
CREATE INDEX IF NOT EXISTS idx_returns_status ON returns(status);
CREATE INDEX IF NOT EXISTS idx_returns_created_at ON returns(created_at);
CREATE INDEX IF NOT EXISTS idx_return_items_return_id ON return_items(return_id);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_return_id ON ai_suggestions(return_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_merchant_id ON analytics_events(merchant_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);

-- Enable Row Level Security
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_records ENABLE ROW LEVEL SECURITY;
