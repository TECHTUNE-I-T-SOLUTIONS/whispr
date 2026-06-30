-- Seed non-AI powered games (poem next line, blog next line, guess next line)
-- These games use pre-built content without AI generation
-- Games can be resumed where left off via chronicles_game_sessions

-- Insert non-AI games
insert into public.chronicles_games (slug, title, description, game_type, audience, difficulty, is_offline_ready, is_ai_powered, is_published, config)
values
  -- Poem Next Line (Non-AI)
  ('poem_next_line_classic', 'Classic Poetry Continuation', 'Continue classic poems line by line using pre-built prompts. Master poetic flow and imagery.', 'poem_next_line', 'all', 'beginner', true, false, true, jsonb_build_object(
    'topic', 'classic poetry',
    'instruction', 'Choose the best line to continue the poem based on tone, rhythm, and imagery.',
    'total_challenges', 15,
    'can_resume', true
  )),
  
  -- Blog Next Line (Non-AI)
  ('blog_next_line_classic', 'Classic Blog Builder', 'Build blog posts paragraph by paragraph using pre-built content. Master practical writing.', 'blog_next_line', 'all', 'beginner', true, false, true, jsonb_build_object(
    'topic', 'blog writing',
    'instruction', 'Choose the best continuation for the blog post based on clarity and value.',
    'total_challenges', 15,
    'can_resume', true
  )),
  
  -- Guess Next Line (Non-AI)
  ('guess_next_line_classic', 'Classic Line Guessing', 'Guess the best continuation from carefully designed options. Test your literary intuition.', 'guess_next_line', 'all', 'beginner', true, false, true, jsonb_build_object(
    'topic', 'literary reasoning',
    'instruction', 'Select the line that best continues the passage in tone and logic.',
    'total_challenges', 15,
    'can_resume', true
  )),
  
  -- Advanced Poetry Continuation
  ('poem_next_line_advanced', 'Advanced Poetry Flow', 'Continue complex poems with sophisticated imagery and themes.', 'poem_next_line', 'all', 'intermediate', true, false, true, jsonb_build_object(
    'topic', 'advanced poetry',
    'instruction', 'Choose the line that maintains poetic complexity and emotional depth.',
    'total_challenges', 15,
    'can_resume', true
  )),
  
  -- Advanced Blog Writing
  ('blog_next_line_advanced', 'Advanced Blog Craft', 'Build sophisticated blog posts with advanced structure and voice.', 'blog_next_line', 'all', 'intermediate', true, false, true, jsonb_build_object(
    'topic', 'advanced blogging',
    'instruction', 'Choose the continuation that demonstrates advanced writing technique.',
    'total_challenges', 15,
    'can_resume', true
  ))
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  game_type = excluded.game_type,
  audience = excluded.audience,
  difficulty = excluded.difficulty,
  is_offline_ready = excluded.is_offline_ready,
  is_ai_powered = excluded.is_ai_powered,
  is_published = excluded.is_published,
  config = excluded.config,
  updated_at = now();

-- Seed challenges for Classic Poetry Continuation
insert into public.chronicles_game_challenges (game_id, challenge_order, question, context, options, correct_answer, explanation, teaching_point, difficulty)
select 
  g.id,
  t.challenge_order,
  t.question,
  t.context,
  t.options,
  t.correct_answer,
  t.explanation,
  t.teaching_point,
  t.difficulty
from public.chronicles_games g
cross join lateral (
  values
    (1, 'Which line best continues this poem?', 'The sun dipped below the horizon, painting the sky in shades of fire.', 
     jsonb_build_array('And the stars began to twinkle above.', 'The world fell into an endless sleep.', 'Shadows stretched across the quiet land.'), 
     'Shadows stretched across the quiet land.',
     'This option maintains the visual imagery of the sunset and transitions naturally to the evening.',
     'Poetic continuity requires maintaining imagery and mood.',
     'beginner'),
    (2, 'Choose the best continuation:', 'A gentle breeze whispered through the trees, carrying secrets of the forest.', 
     jsonb_build_array('The trees remained silent and unmoving.', 'Leaves danced in response to the wind\'s song.', 'The forest became completely still.'), 
     'Leaves danced in response to the wind\'s song.',
     'Personification and movement continue the poetic imagery established in the first line.',
     'Consistent personification creates cohesive poetic voice.',
     'beginner'),
    (3, 'Which line flows best?', 'The river carved its path through stone, patient and unyielding in its journey.', 
     jsonb_build_array('Suddenly it stopped flowing entirely.', 'Time itself seemed to bend around its course.', 'The water turned cold and dark.'), 
     'Time itself seemed to bend around its course.',
     'This elevates the metaphor to a philosophical level while maintaining the river imagery.',
     'Poetry often uses concrete images to explore abstract concepts.',
     'beginner'),
    (4, 'Select the best poetic continuation:', 'Her laughter rang like silver bells, echoing through the empty halls.', 
     jsonb_build_array('The halls remained completely silent.', 'Memories stirred in the dusty corners.', 'The sound was harsh and jarring.'), 
     'Memories stirred in the dusty corners.',
     'This connects the auditory imagery to emotional resonance and memory.',
     'Poetry weaves together sensory details and emotional meaning.',
     'beginner'),
    (5, 'Choose the line that maintains the mood:', 'The old house stood silent, its windows like eyes watching the passing years.', 
     jsonb_build_array('Children ran through its open doors.', 'Time had etched stories into every weathered board.', 'The house was brand new and bright.'), 
     'Time had etched stories into every weathered board.',
     'This continues the personification and melancholic mood established in the first line.',
     'Consistent mood is essential for poetic coherence.',
     'beginner'),
    (6, 'Which line best continues the imagery?', 'Stars scattered across the velvet night, diamonds on an endless canvas.', 
     jsonb_build_array('The sun suddenly rose above the horizon.', 'Each one held the dreams of distant worlds.', 'The sky was completely empty and black.'), 
     'Each one held the dreams of distant worlds.',
     'This extends the celestial metaphor while adding emotional depth.',
     'Metaphors can be layered to create rich poetic meaning.',
     'intermediate'),
    (7, 'Select the most poetic continuation:', 'The ocean breathed in rhythm with the tide, ancient and eternal.', 
     jsonb_build_array('It stopped moving completely.', 'Sailors feared its unpredictable nature.', 'Its depths held secrets older than memory.'), 
     'Its depths held secrets older than memory.',
     'This continues the personification while adding mystery and depth.',
     'Personification works best when it reveals character or mystery.',
     'intermediate'),
    (8, 'Choose the line that best fits:', 'Autumn leaves fell like golden tears, mourning the passing of summer.', 
     jsonb_build_array('Spring flowers began to bloom immediately.', 'The earth prepared for winter\'s embrace.', 'The trees remained green and full.'), 
     'The earth prepared for winter\'s embrace.',
     'This maintains the seasonal metaphor and emotional tone.',
     'Seasonal imagery often carries emotional resonance in poetry.',
     'beginner'),
    (9, 'Which line continues the poetic flow?', 'The candle flickered in the darkness, a small flame against the void.', 
     jsonb_build_array('The room was filled with bright sunlight.', 'Hope burned stubbornly within its glow.', 'The flame died out instantly.'), 
     'Hope burned stubbornly within its glow.',
     'This transforms the literal image into a metaphor for resilience.',
     'Poetry often uses literal images as metaphors for abstract concepts.',
     'intermediate'),
    (10, 'Select the best continuation:', 'The mountain stood as silent witness, watching empires rise and fall.', 
     jsonb_build_array('It crumbled into dust immediately.', 'Its peaks touched the very heavens.', 'The mountain was small and insignificant.'), 
     'Its peaks touched the very heavens.',
     'This elevates the mountain to a cosmic scale, matching its role as witness to history.',
     'Scale and perspective are powerful tools in poetic imagery.',
     'intermediate')
) as t(challenge_order, question, context, options, correct_answer, explanation, teaching_point, difficulty)
where g.slug = 'poem_next_line_classic'
on conflict do nothing;

-- Seed challenges for Classic Blog Builder
insert into public.chronicles_game_challenges (game_id, challenge_order, question, context, options, correct_answer, explanation, teaching_point, difficulty)
select 
  g.id,
  t.challenge_order,
  t.question,
  t.context,
  t.options,
  t.correct_answer,
  t.explanation,
  t.teaching_point,
  t.difficulty
from public.chronicles_games g
cross join lateral (
  values
    (1, 'Which sentence best continues this blog intro?', 'In today\'s fast-paced world, productivity is more important than ever.', 
     jsonb_build_array('Productivity doesn\'t actually matter at all.', 'Let\'s explore five practical strategies to boost your daily output.', 'I\'m going to tell you about my cat.'), 
     'Let\'s explore five practical strategies to boost your daily output.',
     'This delivers on the promise of the intro and provides clear value to the reader.',
     'Blog intros should promise value and then deliver on that promise.',
     'beginner'),
    (2, 'Choose the best continuation:', 'Remote work has transformed how we think about office culture and collaboration.', 
     jsonb_build_array('Office culture is completely dead now.', 'Here are three ways to build strong team connections across distances.', 'Nobody likes working from home anyway.'), 
     'Here are three ways to build strong team connections across distances.',
     'This addresses the topic raised and provides actionable insights.',
     'Blog posts should address reader concerns with practical solutions.',
     'beginner'),
    (3, 'Which sentence flows best?', 'Learning a new language opens doors to different cultures and perspectives.', 
     jsonb_build_array('It\'s actually a waste of time to learn languages.', 'The journey requires patience, consistency, and the right approach.', 'Everyone should speak English only.'), 
     'The journey requires patience, consistency, and the right approach.',
     'This acknowledges the challenge while setting up practical advice.',
     'Good blog writing balances inspiration with realistic expectations.',
     'beginner'),
    (4, 'Select the best blog continuation:', 'Healthy eating doesn\'t have to mean sacrificing flavor or enjoyment.', 
     jsonb_build_array('All healthy food tastes terrible.', 'Let\'s discover delicious recipes that nourish your body.', 'You should never eat anything you enjoy.'), 
     'Let\'s discover delicious recipes that nourish your body.',
     'This reframes the topic positively and leads into practical content.',
     'Blog posts should reframe challenges as opportunities.',
     'beginner'),
    (5, 'Choose the line that maintains blog voice:', 'Financial planning might seem intimidating, but it\'s essential for long-term security.', 
     jsonb_build_array('Money doesn\'t matter at all.', 'We\'ll break down the basics into simple, manageable steps.', 'Only rich people need to plan finances.'), 
     'We\'ll break down the basics into simple, manageable steps.',
     'This reassures the reader and promises accessible content.',
     'Blog writing should reduce reader anxiety about complex topics.',
     'beginner'),
    (6, 'Which line best continues?', 'Social media has changed how we connect, communicate, and consume information.', 
     jsonb_build_array('All social media is evil and should be banned.', 'Understanding these changes helps us navigate digital life more intentionally.', 'Nothing has actually changed in the world.'), 
     'Understanding these changes helps us navigate digital life more intentionally.',
     'This provides a balanced perspective and practical value.',
     'Blog posts should offer nuanced perspectives rather than absolutes.',
     'intermediate'),
    (7, 'Select the most appropriate continuation:', 'Mental health awareness has grown significantly in recent years, yet stigma remains.', 
     jsonb_build_array('Stigma doesn\'t exist anymore.', 'Open conversations and education are key to creating supportive environments.', 'Mental health isn\'t important.'), 
     'Open conversations and education are key to creating supportive environments.',
     'This acknowledges progress while identifying work still needed.',
     'Blog posts on sensitive topics should balance realism with hope.',
     'intermediate'),
    (8, 'Choose the line that fits blog style:', 'Technology evolves rapidly, and staying current can feel overwhelming.', 
     jsonb_build_array('Technology never changes at all.', 'Focus on fundamentals that adapt to changing tools and platforms.', 'Give up on technology entirely.'), 
     'Focus on fundamentals that adapt to changing tools and platforms.',
     'This provides timeless advice rather than chasing trends.',
     'Valuable blog content focuses on principles over fleeting trends.',
     'intermediate'),
    (9, 'Which sentence continues the blog effectively?', 'Creative blocks affect everyone, from beginners to experienced professionals.', 
     jsonb_build_array('Only beginners get creative blocks.', 'Practical techniques can help you overcome these obstacles and find flow.', 'Creative blocks are permanent and unsolvable.'), 
     'Practical techniques can help you overcome these obstacles and find flow.',
     'This validates the reader\'s experience and offers solutions.',
     'Blog posts should validate reader struggles while providing hope.',
     'beginner'),
    (10, 'Select the best blog continuation:', 'Sustainable living starts with small, consistent choices rather than dramatic changes.', 
     jsonb_build_array('You must change everything at once to be sustainable.', 'Let\'s explore simple habits that make a meaningful environmental impact.', 'Sustainability is impossible for regular people.'), 
     'Let\'s explore simple habits that make a meaningful environmental impact.',
     'This makes the topic accessible and actionable.',
     'Blog content should lower barriers to action.',
     'beginner')
) as t(challenge_order, question, context, options, correct_answer, explanation, teaching_point, difficulty)
where g.slug = 'blog_next_line_classic'
on conflict do nothing;

-- Seed challenges for Classic Line Guessing
insert into public.chronicles_game_challenges (game_id, challenge_order, question, context, options, correct_answer, explanation, teaching_point, difficulty)
select 
  g.id,
  t.challenge_order,
  t.question,
  t.context,
  t.options,
  t.correct_answer,
  t.explanation,
  t.teaching_point,
  t.difficulty
from public.chronicles_games g
cross join lateral (
  values
    (1, 'Which line best continues this passage?', 'The old bookstore smelled of dust and memories, shelves groaning under the weight of countless stories.', 
     jsonb_build_array('The books were all brand new.', 'Each volume held a world waiting to be discovered.', 'The store was completely empty.'), 
     'Each volume held a world waiting to be discovered.',
     'This maintains the atmospheric and nostalgic tone of the opening.',
     'Continuations should match the mood and imagery of the original passage.',
     'beginner'),
    (2, 'Choose the best continuation:', 'She walked through the garden at dawn, when the world was still and full of possibility.', 
     jsonb_build_array('The garden was dead and brown.', 'Dew glistened on petals like scattered diamonds.', 'It was noisy and crowded.'), 
     'Dew glistened on petals like scattered diamonds.',
     'This uses simile to enhance the imagery while maintaining the peaceful mood.',
     'Literary devices like simile should enhance, not distract from, the mood.',
     'beginner'),
    (3, 'Which line flows best?', 'The city never truly slept; its pulse beat in the rhythm of traffic and distant voices.', 
     jsonb_build_array('The city was completely silent and abandoned.', 'Neon signs painted the darkness in electric dreams.', 'Everyone in the city was asleep.'), 
     'Neon signs painted the darkness in electric dreams.',
     'This continues the personification while adding vivid visual imagery.',
     'Consistent use of literary devices creates coherent prose.',
     'beginner'),
    (4, 'Select the best continuation:', 'His hands, weathered by years of labor, told stories of hard work and quiet dedication.', 
     jsonb_build_array('His hands were soft and smooth.', 'They had shaped more than just wood and stone.', 'He had never worked a day in his life.'), 
     'They had shaped more than just wood and stone.',
     'This elevates the literal description to metaphorical meaning.',
     'Good writing often uses literal details to suggest deeper meaning.',
     'intermediate'),
    (5, 'Choose the line that maintains the tone:', 'The letter arrived on a Tuesday, unexpected and heavy with unspoken words.', 
     jsonb_build_array('The letter was a happy birthday card.', 'Her fingers trembled as she broke the wax seal.', 'She threw it away without reading.'), 
     'Her fingers trembled as she broke the wax seal.',
     'This builds tension and emotional weight consistent with the opening.',
     'Tone consistency is crucial for maintaining reader engagement.',
     'beginner'),
    (6, 'Which line best continues?', 'The storm gathered slowly, clouds darkening the sky like an approaching thought.', 
     jsonb_build_array('The sky was perfectly clear and sunny.', 'Thunder cracked the silence, announcing nature\'s power.', 'The storm was actually very small.'), 
     'Thunder cracked the silence, announcing nature\'s power.',
     'This continues the metaphor while adding auditory and dramatic elements.',
     'Metaphors can be extended through multiple sensory details.',
     'intermediate'),
    (7, 'Select the most appropriate continuation:', 'In the quiet of the library, she found not just books, but a sanctuary.', 
     jsonb_build_array('The library was loud and chaotic.', 'Time seemed to slow among the whispering pages.', 'She hated being in the library.'), 
     'Time seemed to slow among the whispering pages.',
     'This extends the sanctuary metaphor with temporal imagery.',
     'Metaphors can be layered to create rich, immersive prose.',
     'intermediate'),
    (8, 'Choose the line that fits the style:', 'The musician closed his eyes, and the melody seemed to flow through him rather than from him.', 
     jsonb_build_array('He was reading sheet music carefully.', 'Each note carried emotion beyond what words could express.', 'The music was terrible and off-key.'), 
     'Each note carried emotion beyond what words could express.',
     'This elevates the musical description to emotional and philosophical territory.',
     'Descriptive writing often bridges the concrete and the abstract.',
     'intermediate'),
    (9, 'Which sentence continues effectively?', 'The child looked up at the stars, eyes wide with the wonder only the young can truly know.', 
     jsonb_build_array('The child was bored and wanted to go inside.', 'The universe seemed to whisper secrets in that ancient light.', 'The child was actually an adult.'), 
     'The universe seemed to whisper secrets in that ancient light.',
     'This connects the child\'s perspective to cosmic imagery.',
     'Perspective and imagery work together to create meaning.',
     'beginner'),
    (10, 'Select the best continuation:', 'The bridge spanned the river like a promise of connection between two separate worlds.', 
     jsonb_build_array('The bridge was ugly and broken.', 'Below, the water carried stories from distant mountains to the sea.', 'The bridge was very short.'), 
     'Below, the water carried stories from distant mountains to the sea.',
     'This extends the metaphor while adding narrative depth.',
     'Metaphors gain power when supported by contextual details.',
     'intermediate')
) as t(challenge_order, question, context, options, correct_answer, explanation, teaching_point, difficulty)
where g.slug = 'guess_next_line_classic'
on conflict do nothing;

-- Enable RLS on chronicles_game_challenges if not already enabled
alter table public.chronicles_game_challenges enable row level security;

-- Create RLS policies for game challenges
create policy "Public can view active game challenges" on public.chronicles_game_challenges 
for select using (is_active = true);

create policy "Admins can manage game challenges" on public.chronicles_game_challenges 
for all using (true) with check (true);

-- Create function to resume game session
create or replace function public.resume_game_session(p_creator_id uuid, p_game_id uuid)
returns jsonb as $$
declare
  v_session record;
  v_progress record;
begin
  -- Check for existing active session
  select * into v_session
  from public.chronicles_game_sessions
  where creator_id = p_creator_id
    and game_id = p_game_id
    and status = 'active'
  order by started_at desc
  limit 1;
  
  if found then
    -- Return existing session with completed rounds
    return jsonb_build_object(
      'session_id', v_session.id,
      'resumed', true,
      'score', v_session.score,
      'streak_count', v_session.streak_count,
      'correct_answers', v_session.correct_answers,
      'incorrect_answers', v_session.incorrect_answers,
      'total_rounds', v_session.total_rounds,
      'started_at', v_session.started_at,
      'completed_rounds', (
        select jsonb_agg(jsonb_build_object(
          'round_id', r.id,
          'order_index', r.order_index,
          'prompt', r.prompt,
          'user_answer', r.user_answer,
          'is_correct', r.is_correct,
          'points_awarded', r.points_awarded
        ))
        from public.chronicles_game_rounds r
        where r.session_id = v_session.id
        order by r.order_index
      )
    );
  else
    -- Get creator progress for this game
    select * into v_progress
    from public.chronicles_creator_game_progress
    where creator_id = p_creator_id
      and game_id = p_game_id;
    
    -- Return progress info without active session
    return jsonb_build_object(
      'resumed', false,
      'best_score', coalesce(v_progress.best_score, 0),
      'total_score', coalesce(v_progress.total_score, 0),
      'best_streak', coalesce(v_progress.best_streak, 0),
      'attempts_count', coalesce(v_progress.attempts_count, 0),
      'completed_sessions', coalesce(v_progress.completed_sessions, 0),
      'last_played_at', v_progress.last_played_at
    );
  end if;
end;
$$ language plpgsql security definer;

-- Grant execute permission on resume function
grant execute on function public.resume_game_session to authenticated, anon;
