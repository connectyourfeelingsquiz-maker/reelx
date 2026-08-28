-- Add to supabase/schema.sql or create a new migration

CREATE TABLE IF NOT EXISTS safety_page_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_user_id UUID REFERENCES auth.users(id),
    page_heading TEXT DEFAULT 'Emergency Safety',
    page_subtitle TEXT DEFAULT 'Safety link for: {link_name}',
    description TEXT DEFAULT 'Your location will only be shared when you tap the button.',
    action_button_text TEXT DEFAULT 'SHARE MY LOCATION',
    permission_help_text TEXT DEFAULT 'Tapping this button will request your browser''s location permission. Your precise location will be shared once with your authorized safety contact. You will not be tracked continuously.',
    privacy_footer_text TEXT DEFAULT 'This is a consent-based, one-time location share. No hidden tracking.',
    success_message TEXT DEFAULT 'Location shared successfully.',
    permission_denied_message TEXT DEFAULT 'Location permission is required to continue.',
    retry_button_text TEXT DEFAULT 'Try Again',
    continue_button_text TEXT DEFAULT 'Continue',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure only one row exists for global settings
CREATE UNIQUE INDEX IF NOT EXISTS idx_safety_page_settings_single_row ON safety_page_settings ((true));

ALTER TABLE safety_page_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage settings" ON safety_page_settings
    FOR ALL USING (auth.uid() IN (SELECT user_id FROM admin_profiles));

CREATE POLICY "Anyone can read settings" ON safety_page_settings
    FOR SELECT USING (true);

-- Insert default row if none exists
INSERT INTO safety_page_settings (page_heading) 
SELECT 'Emergency Safety' 
WHERE NOT EXISTS (SELECT 1 FROM safety_page_settings);
