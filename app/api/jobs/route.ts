import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';

const DEFAULT_LIMIT = 12;

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServer();
    const { searchParams } = new URL(request.url);

    const search = searchParams.get('search')?.trim() || '';
    const category = searchParams.get('category')?.trim() || '';
    const opportunityType = searchParams.get('type')?.trim() || '';
    const sort = searchParams.get('sort')?.trim() || 'latest';
    const page = Math.max(1, Number.parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(48, Math.max(1, Number.parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT));
    const offset = (page - 1) * limit;

    let query = supabase
      .from('job_opportunities')
      .select('*, category:job_opportunity_categories(id, slug, name, description, icon, color, sort_order)', { count: 'exact' })
      .eq('status', 'published');

    if (category) {
      const { data: categoryRow } = await supabase
        .from('job_opportunity_categories')
        .select('id')
        .eq('slug', category)
        .eq('is_active', true)
        .maybeSingle();

      if (categoryRow?.id) {
        query = query.eq('category_id', categoryRow.id);
      }
    }

    if (opportunityType && opportunityType !== 'all') {
      query = query.eq('opportunity_type', opportunityType);
    }

    if (search) {
      const sanitized = search.replace(/,/g, ' ').replace(/\s+/g, ' ').trim();
      query = query.or(
        [
          `title.ilike.%${sanitized}%`,
          `summary.ilike.%${sanitized}%`,
          `description.ilike.%${sanitized}%`,
          `organization_name.ilike.%${sanitized}%`,
          `location.ilike.%${sanitized}%`,
        ].join(',')
      );
    }

    switch (sort) {
      case 'featured':
        query = query.order('featured', { ascending: false }).order('created_at', { ascending: false });
        break;
      case 'deadline':
        query = query.order('deadline_at', { ascending: true, nullsFirst: false }).order('created_at', { ascending: false });
        break;
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      case 'latest':
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }

    const { data: jobs, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: categories } = await supabase
      .from('job_opportunity_categories')
      .select('id, slug, name, description, icon, color, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    return NextResponse.json({
      jobs: jobs || [],
      categories: categories || [],
      total: count || 0,
      page,
      limit,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}