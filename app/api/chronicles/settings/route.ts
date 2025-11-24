import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createSupabaseServer } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
  try {
    const supabase = createSupabaseServer();

    // Get all settings
    const { data, error } = await supabase
      .from('chronicles_settings')
      .select('*');

    if (error && error.code !== 'PGRST116') {
      console.error('Settings fetch error:', error);
    }

    // Convert array to object format that the page expects
    const settings: Record<string, any> = {
      feature_enabled: 'true',
      registration_open: 'true',
      max_posts_per_day: '5',
      min_content_length: '100',
      require_email_verification: 'true',
      allow_anonymous_comments: 'false',
      auto_publish_delay_seconds: '0',
    };

    // Override with database values
    if (data && Array.isArray(data)) {
      data.forEach((item: any) => {
        const key = item.setting_key;
        const value = item.setting_value;
        settings[key] = value;
      });
    }

    // Convert to proper types for the frontend
    const typedSettings = {
      feature_enabled: settings.feature_enabled === 'true',
      registration_open: settings.registration_open === 'true',
      max_posts_per_day: parseInt(settings.max_posts_per_day) || 5,
      min_content_length: parseInt(settings.min_content_length) || 100,
      require_email_verification: settings.require_email_verification === 'true',
      allow_anonymous_comments: settings.allow_anonymous_comments === 'true',
      auto_publish_delay_seconds: parseInt(settings.auto_publish_delay_seconds) || 0,
    };

    return NextResponse.json(typedSettings);
  } catch (error) {
    console.error('Settings API error:', error);
    // Return default settings on error
    return NextResponse.json({
      feature_enabled: true,
      registration_open: true,
      max_posts_per_day: 5,
      min_content_length: 100,
      require_email_verification: true,
      allow_anonymous_comments: false,
      auto_publish_delay_seconds: 0,
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const serverClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Handle cookie setting errors
            }
          },
        },
      }
    );

    const body = await req.json();

    // Get current admin user from session
    let adminUserId: string | null = null;
    try {
      const { data: { user } } = await serverClient.auth.getUser();
      console.log('Session user:', user);
      if (user) {
        adminUserId = user.id;
        console.log('Admin user found from session:', adminUserId);
      } else {
        console.log('No user in session, trying to get from auth.users table');
        // Try to get the admin user from the database
        const supabase = createSupabaseServer();
        const { data: adminData } = await supabase
          .from('admin')
          .select('user_id')
          .limit(1)
          .single();
        
        if (adminData?.user_id) {
          adminUserId = adminData.user_id;
          console.log('Admin user ID from admin table:', adminUserId);
        }
      }
    } catch (err) {
      console.log('Error getting user:', err);
      // Try to get the first admin from the admin table as fallback
      try {
        const supabase = createSupabaseServer();
        const { data: adminData } = await supabase
          .from('admin')
          .select('user_id')
          .limit(1)
          .single();
        
        if (adminData?.user_id) {
          adminUserId = adminData.user_id;
          console.log('Admin user ID from fallback admin table lookup:', adminUserId);
        }
      } catch (fallbackErr) {
        console.log('Fallback admin lookup also failed');
      }
    }

    // Use service role client for database operations
    const supabase = createSupabaseServer();

    // Descriptions for each setting
    const settingDescriptions: Record<string, string> = {
      feature_enabled: 'Enable or disable the entire Chronicles feature platform',
      registration_open: 'Allow new users to register for Chronicles',
      max_posts_per_day: 'Maximum number of posts a creator can publish per day',
      min_content_length: 'Minimum character length required for post content',
      require_email_verification: 'Require email verification before allowing posts',
      allow_anonymous_comments: 'Allow anonymous users to comment on posts',
      auto_publish_delay_seconds: 'Delay before automatically publishing scheduled posts (in seconds)',
    };

    // Handle either single setting or batch settings
    const settingsToUpdate = body.setting_key 
      ? [{ 
          setting_key: body.setting_key, 
          setting_value: String(body.setting_value),
          description: body.description || settingDescriptions[body.setting_key] || null
        }]
      : Object.entries(body).map(([key, value]: [string, any]) => ({
          setting_key: key,
          setting_value: String(value),
          description: settingDescriptions[key] || null
        }));

    // Update each setting
    const results = [];
    for (const setting of settingsToUpdate) {
      const { data, error } = await supabase
        .from('chronicles_settings')
        .upsert({
          setting_key: setting.setting_key,
          setting_value: setting.setting_value,
          description: setting.description,
          updated_by: adminUserId, // Will have user ID if found
          updated_at: new Date().toISOString(),
        }, { onConflict: 'setting_key' })
        .select()
        .single();

      if (error) {
        console.error(`Failed to update ${setting.setting_key}:`, error);
        throw error;
      }
      results.push(data);
    }

    console.log('Settings updated successfully with admin ID:', adminUserId, results);
    return NextResponse.json({ success: true, updated: results, adminId: adminUserId });
  } catch (error) {
    console.error('Settings update error:', error);
    return NextResponse.json({ error: 'Failed to update settings', details: String(error) }, { status: 400 });
  }
}
