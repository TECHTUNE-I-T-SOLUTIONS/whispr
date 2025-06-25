-- Update admin table for custom authentication (simplified)
ALTER TABLE admin 
ADD COLUMN IF NOT EXISTS security_question VARCHAR(255),
ADD COLUMN IF NOT EXISTS security_answer VARCHAR(255),
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS profile_image_url TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT TRUE;

-- Remove password reset columns if they exist
ALTER TABLE admin 
DROP COLUMN IF EXISTS password_reset_token,
DROP COLUMN IF EXISTS password_reset_expires,
DROP COLUMN IF EXISTS email_verification_token;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_username ON admin(username);
CREATE INDEX IF NOT EXISTS idx_admin_email ON admin(email);
CREATE INDEX IF NOT EXISTS idx_admin_is_active ON admin(is_active);
