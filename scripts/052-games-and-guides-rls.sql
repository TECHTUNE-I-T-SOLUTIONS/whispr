-- RLS for Whispr mobile games + tutorials tables.

alter table public.chronicles_learning_modules enable row level security;
alter table public.chronicles_learning_sections enable row level security;
alter table public.chronicles_games enable row level security;
alter table public.chronicles_game_sessions enable row level security;
alter table public.chronicles_game_rounds enable row level security;
alter table public.chronicles_creator_game_progress enable row level security;
alter table public.chronicles_game_achievements enable row level security;
alter table public.chronicles_creator_game_achievements enable row level security;

create policy "Public can read published modules" on public.chronicles_learning_modules
for select using (is_published = true);

create policy "Public can read published sections" on public.chronicles_learning_sections
for select using (exists (
  select 1 from public.chronicles_learning_modules m
  where m.id = module_id and m.is_published = true
));

create policy "Public can read published games" on public.chronicles_games
for select using (is_published = true);

create policy "Creators can manage own sessions" on public.chronicles_game_sessions
for all using (exists (
  select 1 from public.chronicles_creators c
  where c.id = creator_id and c.user_id = auth.uid()
))
with check (exists (
  select 1 from public.chronicles_creators c
  where c.id = creator_id and c.user_id = auth.uid()
));

create policy "Creators can manage own rounds" on public.chronicles_game_rounds
for all using (exists (
  select 1 from public.chronicles_game_sessions s
  join public.chronicles_creators c on c.id = s.creator_id
  where s.id = session_id and c.user_id = auth.uid()
))
with check (exists (
  select 1 from public.chronicles_game_sessions s
  join public.chronicles_creators c on c.id = s.creator_id
  where s.id = session_id and c.user_id = auth.uid()
));

create policy "Creators can read own progress" on public.chronicles_creator_game_progress
for select using (exists (
  select 1 from public.chronicles_creators c
  where c.id = creator_id and c.user_id = auth.uid()
));

create policy "Creators can upsert own progress" on public.chronicles_creator_game_progress
for insert with check (exists (
  select 1 from public.chronicles_creators c
  where c.id = creator_id and c.user_id = auth.uid()
));

create policy "Creators can update own progress" on public.chronicles_creator_game_progress
for update using (exists (
  select 1 from public.chronicles_creators c
  where c.id = creator_id and c.user_id = auth.uid()
))
with check (exists (
  select 1 from public.chronicles_creators c
  where c.id = creator_id and c.user_id = auth.uid()
));

create policy "Public can read achievements" on public.chronicles_game_achievements
for select using (true);

create policy "Creators can read earned achievements" on public.chronicles_creator_game_achievements
for select using (exists (
  select 1 from public.chronicles_creators c
  where c.id = creator_id and c.user_id = auth.uid()
));
