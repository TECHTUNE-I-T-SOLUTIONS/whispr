import { type NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';
import { requireAuthFromRequest } from '@/lib/auth-server';

const SUPER_ADMIN_ID = '8ac41ab5-c544-4068-a628-426593a2d4e2';

function buildSlug(title: string) {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  return `${base}-${Date.now().toString(36)}`;
}

async function resolveCategoryId(supabase: ReturnType<typeof createSupabaseServer>, categoryIdOrSlug: string) {
  if (!categoryIdOrSlug) return null;

  if (categoryIdOrSlug.match(/^[0-9a-f-]{36}$/i)) {
    return categoryIdOrSlug;
  }

  const { data } = await supabase
    .from('job_opportunity_categories')
    .select('id')
    .eq('slug', categoryIdOrSlug)
    .eq('is_active', true)
    .maybeSingle();

  return data?.id || null;
}

export async function GET(request: NextRequest) {
  try {
    const { admin } = await requireAuthFromRequest(request);
    const supabase = createSupabaseServer();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim() || '';
    const status = searchParams.get('status') || 'all';

    let query = supabase
      .from('job_opportunities')
      .select('*, category:job_opportunity_categories(id, slug, name, description, icon, color, sort_order), creator:created_by_admin_id(id, username, full_name, avatar_url)');

    if (admin.id !== SUPER_ADMIN_ID) {
      query = query.eq('created_by_admin_id', admin.id);
    }

    if (status !== 'all') {
      query = query.eq('status', status);
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

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: categories } = await supabase
      .from('job_opportunity_categories')
      .select('id, slug, name, description, icon, color, sort_order, is_active')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    return NextResponse.json({ jobs: data || [], categories: categories || [] });
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { admin } = await requireAuthFromRequest(request);
    const supabase = createSupabaseServer();
    const body = await request.json();

    const categoryId = await resolveCategoryId(supabase, body.category_id || body.category_slug || '');
    if (!categoryId) {
      return NextResponse.json({ error: 'Valid category is required' }, { status: 400 });
    }

    const title = (body.title || '').trim();
    const summary = (body.summary || '').trim();
    const description = (body.description || '').trim();
    const organizationName = (body.organization_name || '').trim();
    const applicationUrl = (body.application_url || '').trim();

    if (!title || !summary || !description || !organizationName || !applicationUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const status = body.status || 'draft';
    const slug = body.slug?.trim() || buildSlug(title);

    const payload = {
      category_id: categoryId,
      created_by_admin_id: admin.id,
      title,
      slug,
      summary,
      description,
      organization_name: organizationName,
      organization_website: body.organization_website?.trim() || null,
      opportunity_type: body.opportunity_type || 'job',
      location: body.location?.trim() || null,
      remote_type: body.remote_type || 'any',
      compensation: body.compensation?.trim() || null,
      application_url: applicationUrl,
      source_url: body.source_url?.trim() || null,
      contact_email: body.contact_email?.trim() || null,
      image_url: body.image_url?.trim() || null,
      image_alt: body.image_alt?.trim() || title,
      tags: Array.isArray(body.tags) ? body.tags : [],
      requirements: Array.isArray(body.requirements) ? body.requirements : [],
      benefits: Array.isArray(body.benefits) ? body.benefits : [],
      featured: Boolean(body.featured),
      status,
      deadline_at: body.deadline_at || null,
      published_at: status === 'published' ? new Date().toISOString() : null,
    };

    const { data, error } = await supabase.from('job_opportunities').insert(payload).select('*, category:job_opportunity_categories(id, slug, name, description, icon, color, sort_order)').single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}