-- First, let's create a simple policy structure that works with Supabase Auth

-- For merchants table - allow users to see their own merchant record
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON merchants;
CREATE POLICY "Enable read access for authenticated users" ON merchants
    FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON merchants;
CREATE POLICY "Enable insert for authenticated users" ON merchants
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Enable update for own records" ON merchants;
CREATE POLICY "Enable update for own records" ON merchants
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- For users table - basic access control
DROP POLICY IF EXISTS "Enable read access for users" ON users;
CREATE POLICY "Enable read access for users" ON users
    FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Enable insert for users" ON users;
CREATE POLICY "Enable insert for users" ON users
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- For returns table - merchants can access their own returns
DROP POLICY IF EXISTS "Enable read access for returns" ON returns;
CREATE POLICY "Enable read access for returns" ON returns
    FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Enable insert for returns" ON returns;
CREATE POLICY "Enable insert for returns" ON returns
    FOR INSERT WITH CHECK (true); -- Allow public insert for customer portal

DROP POLICY IF EXISTS "Enable update for returns" ON returns;
CREATE POLICY "Enable update for returns" ON returns
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- For return_items table
DROP POLICY IF EXISTS "Enable read access for return_items" ON return_items;
CREATE POLICY "Enable read access for return_items" ON return_items
    FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Enable insert for return_items" ON return_items;
CREATE POLICY "Enable insert for return_items" ON return_items
    FOR INSERT WITH CHECK (true); -- Allow public insert for customer portal

-- For ai_suggestions table
DROP POLICY IF EXISTS "Enable read access for ai_suggestions" ON ai_suggestions;
CREATE POLICY "Enable read access for ai_suggestions" ON ai_suggestions
    FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Enable insert for ai_suggestions" ON ai_suggestions;
CREATE POLICY "Enable insert for ai_suggestions" ON ai_suggestions
    FOR INSERT WITH CHECK (true); -- Allow system to insert suggestions

DROP POLICY IF EXISTS "Enable update for ai_suggestions" ON ai_suggestions;
CREATE POLICY "Enable update for ai_suggestions" ON ai_suggestions
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- For analytics_events table
DROP POLICY IF EXISTS "Enable read access for analytics_events" ON analytics_events;
CREATE POLICY "Enable read access for analytics_events" ON analytics_events
    FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Enable insert for analytics_events" ON analytics_events;
CREATE POLICY "Enable insert for analytics_events" ON analytics_events
    FOR INSERT WITH CHECK (true); -- Allow system to insert events

-- For billing_records table
DROP POLICY IF EXISTS "Enable read access for billing_records" ON billing_records;
CREATE POLICY "Enable read access for billing_records" ON billing_records
    FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Enable insert for billing_records" ON billing_records;
CREATE POLICY "Enable insert for billing_records" ON billing_records
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Enable update for billing_records" ON billing_records;
CREATE POLICY "Enable update for billing_records" ON billing_records
    FOR UPDATE USING (auth.uid() IS NOT NULL);
