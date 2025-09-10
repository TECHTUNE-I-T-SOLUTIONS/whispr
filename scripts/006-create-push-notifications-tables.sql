-- Push Notifications History Table
-- This table stores all sent push notifications for admin review and analytics

create table public.push_notifications (
  id uuid not null default gen_random_uuid (),
  title text not null,
  body text not null,
  url text,
  type text not null default 'manual',
  icon text,
  image text,
  actions jsonb,
  sent_count integer not null default 0,
  sent_by text not null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint push_notifications_pkey primary key (id)
) TABLESPACE pg_default;

-- Push Notification Drafts Table
-- This table stores draft notifications that admins can save and edit later

create table public.push_notification_drafts (
  id uuid not null default gen_random_uuid (),
  title text,
  body text,
  url text,
  type text default 'manual',
  icon text,
  image text,
  actions jsonb,
  created_by text not null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint push_notification_drafts_pkey primary key (id)
) TABLESPACE pg_default;

create table public.push_notifications (
  id uuid not null default gen_random_uuid (),
  title text not null,
  body text not null,
  url text,
  type text not null default 'manual',
  icon text,
  image text,
  actions jsonb,
  sent_count integer not null default 0,
  sent_by text not null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint push_notifications_pkey primary key (id)
) TABLESPACE pg_default;

-- Push Notification Drafts Table
-- This table stores draft notifications that admins can save and edit later

create table public.push_notification_drafts (
  id uuid not null default gen_random_uuid (),
  title text,
  body text,
  url text,
  type text default 'manual',
  icon text,
  image text,
  actions jsonb,
  created_by text not null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint push_notification_drafts_pkey primary key (id)
) TABLESPACE pg_default;

-- Indexes for better performance
create index IF not exists idx_push_notifications_type on public.push_notifications using btree (type) TABLESPACE pg_default;
create index IF not exists idx_push_notifications_sent_by on public.push_notifications using btree (sent_by) TABLESPACE pg_default;
create index IF not exists idx_push_notifications_created_at on public.push_notifications using btree (created_at desc) TABLESPACE pg_default;

create index IF not exists idx_push_notification_drafts_created_by on public.push_notification_drafts using btree (created_by) TABLESPACE pg_default;
create index IF not exists idx_push_notification_drafts_created_at on public.push_notification_drafts using btree (created_at desc) TABLESPACE pg_default;

-- Updated trigger for push_notifications table
create or replace function update_push_notifications_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger update_push_notifications_updated_at BEFORE
update on push_notifications for EACH row
execute FUNCTION update_push_notifications_updated_at();

-- Updated trigger for push_notification_drafts table
create or replace function update_push_notification_drafts_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger update_push_notification_drafts_updated_at BEFORE
update on push_notification_drafts for EACH row
execute FUNCTION update_push_notification_drafts_updated_at();

-- Row Level Security (RLS) policies
alter table public.push_notifications enable row level security;
alter table public.push_notification_drafts enable row level security;

-- Policies for push_notifications (admin only access)
create policy "Allow admin access to push_notifications" on public.push_notifications
  for all using (auth.jwt() ->> 'role' = 'admin');

-- Policies for push_notification_drafts (admin only access)
create policy "Allow admin access to push_notification_drafts" on public.push_notification_drafts
  for all using (auth.jwt() ->> 'role' = 'admin');

-- Grant necessary permissions
grant all on public.push_notifications to authenticated;
grant all on public.push_notification_drafts to authenticated;

-- Notification trigger for push notifications
-- This trigger creates admin notifications when manual push notifications are created
create or replace function notify_admins_of_push_notification()
returns trigger as $$
begin
  -- Only create notifications for manual push notifications
  if new.type = 'manual' then
    -- Insert notification for all admins
    insert into public.notifications (
      admin_id,
      type,
      title,
      message,
      read,
      created_at
    )
    select
      a.id,
      'push_notification'::varchar(50),
      'New Push Notification Created'::varchar(255),
      'A new push notification "' || new.title || '" has been created and is ready to be sent.'::text,
      false,
      new.created_at
    from public.admin a;
  end if;

  return new;
end;
$$ language plpgsql;

-- Create trigger for push notifications
create trigger notify_admins_on_push_notification
  after insert on public.push_notifications
  for each row
  execute function notify_admins_of_push_notification();

-- Notification trigger for push notification drafts
-- This trigger creates admin notifications when push notification drafts are created
create or replace function notify_admins_of_push_notification_draft()
returns trigger as $$
begin
  -- Insert notification for all admins
  insert into public.notifications (
    admin_id,
    type,
    title,
    message,
    read,
    created_at
  )
  select
    a.id,
    'push_notification_draft'::varchar(50),
    'New Push Notification Draft Created'::varchar(255),
    'A new push notification draft "' || coalesce(new.title, 'Untitled') || '" has been created.'::text,
    false,
    new.created_at
  from public.admin a;

  return new;
end;
$$ language plpgsql;

-- Create trigger for push notification drafts
create trigger notify_admins_on_push_notification_draft
  after insert on public.push_notification_drafts
  for each row
  execute function notify_admins_of_push_notification_draft();
