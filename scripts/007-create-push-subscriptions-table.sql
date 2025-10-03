-- Create push notification subscriptions table
create table public.push_subscriptions (
  id uuid default gen_random_uuid() primary key,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  ip_address inet,
  browser_info jsonb,
  subscribed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  last_active_at timestamp with time zone default timezone('utc'::text, now()),
  is_active boolean default true,
  user_id uuid, -- Optional: link to user if authenticated
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes for better performance
create index if not exists idx_push_subscriptions_endpoint on public.push_subscriptions using btree (endpoint);
create index if not exists idx_push_subscriptions_user_id on public.push_subscriptions using btree (user_id);
create index if not exists idx_push_subscriptions_is_active on public.push_subscriptions using btree (is_active);
create index if not exists idx_push_subscriptions_created_at on public.push_subscriptions using btree (created_at desc);

-- Create trigger to update updated_at column
create or replace function update_push_subscriptions_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger update_push_subscriptions_updated_at
  before update on push_subscriptions
  for each row
  execute function update_push_subscriptions_updated_at();

-- Enable Row Level Security
alter table public.push_subscriptions enable row level security;

-- Create policies for push subscriptions
create policy "Enable read access for authenticated users only" on public.push_subscriptions
  for select using (auth.role() = 'authenticated');

create policy "Enable insert for authenticated users only" on public.push_subscriptions
  for insert with check (auth.role() = 'authenticated');

create policy "Enable update for authenticated users only" on public.push_subscriptions
  for update using (auth.role() = 'authenticated');

create policy "Enable delete for authenticated users only" on public.push_subscriptions
  for delete using (auth.role() = 'authenticated');

-- Allow anonymous users to manage their own subscriptions (for public users)
create policy "Enable anonymous subscription management" on public.push_subscriptions
  for all using (true);
