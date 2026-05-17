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

function optionalText(value: unknown) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { admin } = await requireAuthFromRequest(request);
    const { id } = await params;
    const supabase = createSupabaseServer();

    let query = supabase
      .from('job_opportunities')
      .select('*, category:job_opportunity_categories(id, slug, name, description, icon, color, sort_order), creator:created_by_admin_id(id, username, full_name, avatar_url)')
      .eq('id', id);

    if (admin.id !== SUPER_ADMIN_ID) {
      query = query.eq('created_by_admin_id', admin.id);
    }

    const { data, error } = await query.single();

    if (error || !data) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
    }

    return NextResponse.json(data);
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

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { admin } = await requireAuthFromRequest(request);
    const { id } = await params;
    const supabase = createSupabaseServer();
    const body = await request.json();

    let existingQuery = supabase.from('job_opportunities').select('*').eq('id', id);
    if (admin.id !== SUPER_ADMIN_ID) {
      existingQuery = existingQuery.eq('created_by_admin_id', admin.id);
    }

    const { data: existing, error: existingError } = await existingQuery.single();
    if (existingError || !existing) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
    }

    const categoryId = await resolveCategoryId(supabase, body.category_id || body.category_slug || existing.category_id);
    if (!categoryId) {
      return NextResponse.json({ error: 'Valid category is required' }, { status: 400 });
    }

    const title = (body.title || existing.title || '').trim();
    const summary = (body.summary || existing.summary || '').trim();
    const description = (body.description || existing.description || '').trim();
    const organizationName = (body.organization_name || existing.organization_name || '').trim();
    const applicationUrl = (body.application_url || existing.application_url || '').trim();
    const status = body.status || existing.status || 'draft';

    const updateData = {
      category_id: categoryId,
      title,
      slug: body.slug?.trim() || existing.slug || buildSlug(title),
      summary,
      description,
      organization_name: organizationName,
      organization_website: optionalText(body.organization_website) ?? existing.organization_website ?? null,
      opportunity_type: body.opportunity_type || existing.opportunity_type || 'job',
      location: optionalText(body.location) ?? existing.location ?? null,
      remote_type: body.remote_type || existing.remote_type || 'any',
      compensation: optionalText(body.compensation) ?? existing.compensation ?? null,
      application_url: applicationUrl,
      source_url: optionalText(body.source_url) ?? existing.source_url ?? null,
      contact_email: optionalText(body.contact_email) ?? existing.contact_email ?? null,
      image_url: optionalText(body.image_url) ?? existing.image_url ?? null,
      image_alt: optionalText(body.image_alt) ?? existing.image_alt ?? title,
      tags: Array.isArray(body.tags) ? body.tags : existing.tags || [],
      requirements: Array.isArray(body.requirements) ? body.requirements : existing.requirements || [],
      benefits: Array.isArray(body.benefits) ? body.benefits : existing.benefits || [],
      featured: typeof body.featured === 'boolean' ? body.featured : Boolean(existing.featured),
      status,
      deadline_at: optionalText(body.deadline_at) ?? existing.deadline_at ?? null,
      published_at: status === 'published' ? (existing.published_at || new Date().toISOString()) : existing.published_at,
    };

    let updateQuery = supabase.from('job_opportunities').update(updateData).eq('id', id);
    if (admin.id !== SUPER_ADMIN_ID) {
      updateQuery = updateQuery.eq('created_by_admin_id', admin.id);
    }

    const { data, error } = await updateQuery.select('*, category:job_opportunity_categories(id, slug, name, description, icon, color, sort_order), creator:created_by_admin_id(id, username, full_name, avatar_url)').single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
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

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { admin } = await requireAuthFromRequest(request);
    const { id } = await params;
    const supabase = createSupabaseServer();

    let deleteQuery = supabase.from('job_opportunities').delete().eq('id', id);
    if (admin.id !== SUPER_ADMIN_ID) {
      deleteQuery = deleteQuery.eq('created_by_admin_id', admin.id);
    }

    const { error } = await deleteQuery;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
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