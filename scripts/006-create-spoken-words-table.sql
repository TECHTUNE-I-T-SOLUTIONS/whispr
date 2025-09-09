-- Create spoken_words table
create table public.spoken_words (
  id uuid not null default gen_random_uuid(),
  title character varying(255) not null,
  description text,
  type character varying(20) not null,
  media_id uuid not null,
  admin_id uuid null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint spoken_words_pkey primary key (id),
  constraint spoken_words_media_id_fkey foreign key (media_id) references media (id) on delete cascade,
  constraint spoken_words_admin_id_fkey foreign key (admin_id) references admin (id) on delete set null,
  constraint spoken_words_type_check check (
    (type)::text = any (
      array[
        ('audio'::character varying)::text,
        ('video'::character varying)::text
      ]
    )
  )
) tablespace pg_default;

-- Create indexes
create index if not exists idx_spoken_words_created_at on public.spoken_words using btree (created_at desc) tablespace pg_default;
create index if not exists idx_spoken_words_type on public.spoken_words using btree (type) tablespace pg_default;
create index if not exists idx_spoken_words_media_id on public.spoken_words using btree (media_id) tablespace pg_default;
create index if not exists idx_spoken_words_admin_id on public.spoken_words using btree (admin_id) tablespace pg_default;

-- Create trigger for updated_at
create trigger update_spoken_words_updated_at before
update on spoken_words for each row
execute function update_updated_at_column();

-- Create trigger for notifications
create trigger trigger_notify_spoken_word
after insert on spoken_words for each row
execute function notify_admin_event();

-- Enable RLS (Row Level Security)
alter table public.spoken_words enable row level security;

-- Create RLS policies
create policy "Enable read access for all users" on public.spoken_words
for select using (true);

create policy "Enable insert for authenticated users only" on public.spoken_words
for insert with check (auth.role() = 'authenticated');

create policy "Enable update for authenticated users only" on public.spoken_words
for update using (auth.role() = 'authenticated');

create policy "Enable delete for authenticated users only" on public.spoken_words
for delete using (auth.role() = 'authenticated');
