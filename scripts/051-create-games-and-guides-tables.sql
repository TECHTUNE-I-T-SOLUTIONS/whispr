-- Whispr mobile expansion: games, progress tracking, and guides/tutorials
-- Run this in Supabase after the core Chronicles schema.

create table if not exists public.chronicles_learning_modules (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  summary text,
  content_type text not null default 'tutorial', -- tutorial | guide | faq | article
  audience text not null default 'all', -- poet | blogger | all
  topic text,
  difficulty text not null default 'beginner', -- beginner | intermediate | advanced
  estimated_read_time integer default 5,
  cover_image_url text,
  is_ai_supported boolean not null default true,
  is_published boolean not null default true,
  created_by uuid references public.chronicles_creators(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chronicles_learning_sections (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.chronicles_learning_modules(id) on delete cascade,
  title text not null,
  body text not null,
  order_index integer not null default 0,
  media_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.chronicles_games (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  game_type text not null, -- poem_next_line | blog_next_line | guess_next_line | mixed
  audience text not null default 'all',
  difficulty text not null default 'beginner',
  is_offline_ready boolean not null default true,
  is_ai_powered boolean not null default true,
  is_published boolean not null default true,
  config jsonb not null default '{}'::jsonb,
  cover_image_url text,
  created_by uuid references public.chronicles_creators(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chronicles_game_sessions (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.chronicles_games(id) on delete cascade,
  creator_id uuid not null references public.chronicles_creators(id) on delete cascade,
  mode text not null default 'practice', -- practice | challenge | streak
  status text not null default 'active', -- active | completed | abandoned
  score integer not null default 0,
  streak_count integer not null default 0,
  correct_answers integer not null default 0,
  incorrect_answers integer not null default 0,
  total_rounds integer not null default 0,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.chronicles_game_rounds (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chronicles_game_sessions(id) on delete cascade,
  prompt text not null,
  prompt_type text not null, -- poem | blog | choose_next | mixed
  expected_answer text,
  user_answer text,
  is_correct boolean,
  explanation text,
  ai_hint text,
  options jsonb not null default '[]'::jsonb,
  points_awarded integer not null default 0,
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.chronicles_creator_game_progress (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.chronicles_creators(id) on delete cascade,
  game_id uuid not null references public.chronicles_games(id) on delete cascade,
  best_score integer not null default 0,
  total_score integer not null default 0,
  best_streak integer not null default 0,
  attempts_count integer not null default 0,
  completed_sessions integer not null default 0,
  last_played_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (creator_id, game_id)
);

create table if not exists public.chronicles_game_achievements (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  icon text,
  points_reward integer not null default 0,
  condition_type text not null, -- sessions | streak | score | mastery
  condition_value integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.chronicles_creator_game_achievements (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.chronicles_creators(id) on delete cascade,
  achievement_id uuid not null references public.chronicles_game_achievements(id) on delete cascade,
  earned_at timestamptz not null default now(),
  unique (creator_id, achievement_id)
);

create index if not exists idx_chronicles_learning_modules_audience on public.chronicles_learning_modules(audience, is_published);
create index if not exists idx_chronicles_games_type on public.chronicles_games(game_type, is_published);
create index if not exists idx_chronicles_game_sessions_creator on public.chronicles_game_sessions(creator_id, started_at desc);
create index if not exists idx_chronicles_game_rounds_session on public.chronicles_game_rounds(session_id, order_index);
create index if not exists idx_chronicles_creator_game_progress_creator on public.chronicles_creator_game_progress(creator_id, game_id);
