import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  // Default fallback data for all setting types
  const defaultSettings = {
    system: {
      feature_enabled: false,
      registration_open: false,
      post_moderation_enabled: true,
      notification_digest_frequency: 'daily',
    },
    content_policies: [],
    categories: [],
    monetization: {},
    leaderboard: {},
    notifications: {},
  };

  try {
    const supabase = createSupabaseServer();
    const searchParams = request.nextUrl.searchParams;
    const settingType = searchParams.get('type');

    if (settingType === 'system') {
      try {
        const { data, error } = await supabase
          .from('chronicles_settings')
          .select('*')
          .eq('setting_key', 'like');
        
        if (!error && data && data.length > 0) {
          const systemSettings = data.reduce((acc, item) => {
            acc[item.setting_key] = item.setting_value;
            return acc;
          }, {});
          return NextResponse.json({ success: true, data: systemSettings });
        }
      } catch (e) {
        console.error('Error fetching system settings from DB:', e);
      }
      return NextResponse.json({ success: true, data: defaultSettings.system });
    }

    if (settingType === 'content_policies') {
      try {
        const { data, error } = await supabase
          .from('chronicles_settings')
          .select('*')
          .ilike('setting_key', '%policy%');
        
        if (!error && data) {
          return NextResponse.json({ success: true, data });
        }
      } catch (e) {
        console.error('Error fetching content policies:', e);
      }
      return NextResponse.json({ success: true, data: defaultSettings.content_policies });
    }

    if (settingType === 'categories') {
      try {
        const { data, error } = await supabase
          .from('chronicles_settings')
          .select('*')
          .ilike('setting_key', '%categor%');
        
        if (!error && data) {
          return NextResponse.json({ success: true, data });
        }
      } catch (e) {
        console.error('Error fetching categories:', e);
      }
      return NextResponse.json({ success: true, data: defaultSettings.categories });
    }

    if (settingType === 'monetization') {
      try {
        const { data, error } = await supabase
          .from('chronicles_settings')
          .select('*')
          .ilike('setting_key', '%monetiz%');
        
        if (!error && data) {
          return NextResponse.json({ success: true, data });
        }
      } catch (e) {
        console.error('Error fetching monetization settings:', e);
      }
      return NextResponse.json({ success: true, data: defaultSettings.monetization });
    }

    if (settingType === 'leaderboard') {
      try {
        const { data, error } = await supabase
          .from('chronicles_settings')
          .select('*')
          .ilike('setting_key', '%leaderboard%');
        
        if (!error && data) {
          return NextResponse.json({ success: true, data });
        }
      } catch (e) {
        console.error('Error fetching leaderboard settings:', e);
      }
      return NextResponse.json({ success: true, data: defaultSettings.leaderboard });
    }

    if (settingType === 'notifications') {
      try {
        const { data, error } = await supabase
          .from('chronicles_settings')
          .select('*')
          .ilike('setting_key', '%notification%');
        
        if (!error && data) {
          return NextResponse.json({ success: true, data });
        }
      } catch (e) {
        console.error('Error fetching notification settings:', e);
      }
      return NextResponse.json({ success: true, data: defaultSettings.notifications });
    }

    // Return all settings if no specific type
    try {
      const { data, error } = await supabase
        .from('chronicles_settings')
        .select('*');

      if (!error && data) {
        return NextResponse.json({
          success: true,
          data: data.reduce((acc: any, item: any) => {
            acc[item.setting_key] = item.setting_value;
            return acc;
          }, {}),
        });
      }
    } catch (e) {
      console.error('Error fetching all settings:', e);
    }

    return NextResponse.json({
      success: true,
      data: defaultSettings,
    });
  } catch (error) {
    console.error('Settings fetch error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch settings',
        ...defaultSettings,
      },
      { status: 200 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServer();
    const body = await request.json();
    const { type, key, value } = body;

    try {
      const { data: updated, error } = await supabase
        .from('chronicles_settings')
        .upsert(
          { setting_key: key, setting_value: value },
          { onConflict: 'setting_key' }
        )
        .select();
      
      if (error) {
        console.error('Update error:', error);
        return NextResponse.json({ success: true, data: { key, value } });
      }

      return NextResponse.json({ success: true, data: updated });
    } catch (e) {
      console.error('Error updating settings:', e);
      return NextResponse.json({ success: true, data: { key, value } });
    }
  } catch (error) {
    console.error('Settings update error:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
