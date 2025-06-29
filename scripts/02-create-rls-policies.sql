-- RLS Policies for merchants table
CREATE POLICY "Merchants can view own data" ON merchants
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Merchants can update own data" ON merchants
    FOR UPDATE USING (auth.uid()::text = id::text);

-- RLS Policies for users table
CREATE POLICY "Users can view own merchant data" ON users
    FOR SELECT USING (
        merchant_id IN (
            SELECT id FROM merchants WHERE auth.uid()::text = id::text
        )
    );

CREATE POLICY "Admins can manage users" ON users
    FOR ALL USING (
        merchant_id IN (
            SELECT m.id FROM merchants m
            JOIN users u ON u.merchant_id = m.id
            WHERE auth.uid()::text = m.id::text AND u.role = 'admin'
        )
    );

-- RLS Policies for returns table
CREATE POLICY "Merchants can view own returns" ON returns
    FOR SELECT USING (
        merchant_id IN (
            SELECT id FROM merchants WHERE auth.uid()::text = id::text
        )
    );

CREATE POLICY "Merchants can manage own returns" ON returns
    FOR ALL USING (
        merchant_id IN (
            SELECT id FROM merchants WHERE auth.uid()::text = id::text
        )
    );

-- RLS Policies for return_items table
CREATE POLICY "Merchants can view own return items" ON return_items
    FOR SELECT USING (
        return_id IN (
            SELECT r.id FROM returns r
            JOIN merchants m ON r.merchant_id = m.id
            WHERE auth.uid()::text = m.id::text
        )
    );

CREATE POLICY "Merchants can manage own return items" ON return_items
    FOR ALL USING (
        return_id IN (
            SELECT r.id FROM returns r
            JOIN merchants m ON r.merchant_id = m.id
            WHERE auth.uid()::text = m.id::text
        )
    );

-- RLS Policies for ai_suggestions table
CREATE POLICY "Merchants can view own AI suggestions" ON ai_suggestions
    FOR SELECT USING (
        return_id IN (
            SELECT r.id FROM returns r
            JOIN merchants m ON r.merchant_id = m.id
            WHERE auth.uid()::text = m.id::text
        )
    );

CREATE POLICY "Merchants can manage own AI suggestions" ON ai_suggestions
    FOR ALL USING (
        return_id IN (
            SELECT r.id FROM returns r
            JOIN merchants m ON r.merchant_id = m.id
            WHERE auth.uid()::text = m.id::text
        )
    );

-- RLS Policies for analytics_events table
CREATE POLICY "Merchants can view own analytics" ON analytics_events
    FOR SELECT USING (
        merchant_id IN (
            SELECT id FROM merchants WHERE auth.uid()::text = id::text
        )
    );

CREATE POLICY "System can insert analytics" ON analytics_events
    FOR INSERT WITH CHECK (true);

-- RLS Policies for billing_records table
CREATE POLICY "Merchants can view own billing" ON billing_records
    FOR SELECT USING (
        merchant_id IN (
            SELECT id FROM merchants WHERE auth.uid()::text = id::text
        )
    );

CREATE POLICY "System can manage billing" ON billing_records
    FOR ALL WITH CHECK (true);
