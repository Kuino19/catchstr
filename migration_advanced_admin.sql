-- Migration: Advanced Admin Suite
-- Description: Adds tables for system settings, audit logs, and account suspension.

-- 1. Add is_suspended to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE;

-- 2. System Settings Table
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for system_settings
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can manage settings
CREATE POLICY "Admins can manage system_settings" ON system_settings
    FOR ALL
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true))
    WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- Policy: Everyone can read system_settings (for platform-wide configs like maintenance mode)
CREATE POLICY "Everyone can read system_settings" ON system_settings
    FOR SELECT
    USING (true);

-- 3. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    target_type TEXT, -- 'user', 'post', 'setting', etc.
    target_id UUID,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can read audit_logs
CREATE POLICY "Admins can read audit_logs" ON audit_logs
    FOR SELECT
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- Policy: Only system/admins can insert audit_logs
CREATE POLICY "Admins can insert audit_logs" ON audit_logs
    FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- 4. Initial Settings
INSERT INTO system_settings (key, value, description)
VALUES 
    ('maintenance_mode', 'false', 'When true, non-admin users will see a maintenance screen.'),
    ('announcement_banner', '{"text": "", "active": false}', 'Banner message displayed at the top of the social feed.'),
    ('support_email', '"support@catchstr.com"', 'The official support contact email.')
ON CONFLICT (key) DO NOTHING;
