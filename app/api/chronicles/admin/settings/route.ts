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
        // Fetch one row from chronicles_system_settings (singleton row) and merge with chronicles_settings values
        const { data: sysData, error: sysError } = await supabase
          .from('chronicles_system_settings')
          .select('*')
          .limit(1)
          .maybeSingle();

        const { data: kvData, error: kvError } = await supabase
          .from('chronicles_settings')
          .select('setting_key, setting_value')
          .in('setting_key', [
            'max_posts_per_day',
            'min_content_length',
            'require_email_verification',
            'allow_anonymous_comments',
            'auto_publish_delay_seconds',
            'feature_enabled',
            'registration_open',
            'maintenance_message'
          ]);

        const kvMap: Record<string, any> = {};
        if (!kvError && Array.isArray(kvData)) {
          kvData.forEach((row: any) => { kvMap[row.setting_key] = row.setting_value; });
        }

        const merged = {
          feature_enabled: kvMap.feature_enabled === 'true' || false,
          registration_open: kvMap.registration_open === 'true' || false,
          max_posts_per_day: parseInt(kvMap.max_posts_per_day) || defaultSettings.system.max_posts_per_day,
          min_content_length: parseInt(kvMap.min_content_length) || defaultSettings.system.min_content_length,
          require_email_verification: kvMap.require_email_verification === 'true' || false,
          allow_anonymous_comments: kvMap.allow_anonymous_comments === 'true' || false,
          auto_publish_delay_seconds: parseInt(kvMap.auto_publish_delay_seconds) || 0,
          maintenance_mode: sysData?.maintenance_mode === true || false,
          maintenance_message: kvMap.maintenance_message || null,
        };

        return NextResponse.json({ success: true, data: merged });
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
    const { type, key, value, data } = body;

    try {
      // Support individual key updates (legacy) or type-based batch updates
      if (type === 'system' && data && typeof data === 'object') {
        const results: any[] = [];

        // Handle maintenance_mode (stored in chronicles_system_settings singleton)
        if (typeof data.maintenance_mode !== 'undefined') {
          // Try to find existing row
          const { data: existing, error: findErr } = await supabase
            .from('chronicles_system_settings')
            .select('*')
            .limit(1)
            .maybeSingle();

          if (findErr) {
            console.error('Error finding system settings row:', findErr);
          }

          if (existing && existing.id) {
            const { data: upd, error: updErr } = await supabase
              .from('chronicles_system_settings')
              .update({ maintenance_mode: data.maintenance_mode, updated_at: new Date().toISOString() })
              .eq('id', existing.id)
              .select()
              .single();

            if (updErr) throw updErr;
            results.push(upd);
          } else {
            const { data: ins, error: insErr } = await supabase
              .from('chronicles_system_settings')
              .insert({ maintenance_mode: data.maintenance_mode })
              .select()
              .single();

            if (insErr) throw insErr;
            results.push(ins);
          }
        }

        // Maintain maintenance_message (stored in chronicles_settings)
        if (typeof data.maintenance_message !== 'undefined') {
          const { data: msgUpdated, error: msgErr } = await supabase
            .from('chronicles_settings')
            .upsert({ setting_key: 'maintenance_message', setting_value: String(data.maintenance_message) }, { onConflict: 'setting_key' })
            .select()
            .single();

          if (msgErr) throw msgErr;
          results.push(msgUpdated);
        }

        // Other system settings: store as chronicle key-values
        const keysToStore = ['feature_enabled','registration_open','max_posts_per_day','min_content_length','require_email_verification','allow_anonymous_comments','auto_publish_delay_seconds'];
        for (const k of keysToStore) {
          if (typeof (data as any)[k] !== 'undefined') {
            const val = String((data as any)[k]);
            const { data: updatedKV, error: kvErr } = await supabase
              .from('chronicles_settings')
              .upsert({ setting_key: k, setting_value: val }, { onConflict: 'setting_key' })
              .select()
              .single();

            if (kvErr) throw kvErr;
            results.push(updatedKV);
          }
        }

        return NextResponse.json({ success: true, data: results });
      }

      // Legacy single key update
      if (key) {
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
      }

      console.error('Invalid update payload:', body);
      return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
    } catch (e) {
      console.error('Error updating settings:', e);
      return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
    }
  } catch (error) {
    console.error('Settings update error:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
