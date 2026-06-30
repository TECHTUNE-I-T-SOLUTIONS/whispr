-- Seed educational writing mastery games
-- These games teach specific writing principles without AI generation
-- Content is pre-built and can be expanded over time

-- Insert new game types
insert into public.chronicles_games (slug, title, description, game_type, audience, difficulty, is_offline_ready, is_ai_powered, is_published, config)
values
  -- Word Choice Wizard
  ('word_choice_wizard', 'Word Choice Wizard', 'Choose the most precise and effective word for each context. Learn vocabulary precision and impact.', 'word_choice', 'all', 'beginner', true, false, true, jsonb_build_object(
    'topic', 'vocabulary precision',
    'instruction', 'Select the word that best fits the context and creates the strongest impact.',
    'total_challenges', 10
  )),
  
  -- Sentence Structure Lab
  ('sentence_structure_lab', 'Sentence Structure Lab', 'Identify and understand different sentence structures and their effects on readers.', 'sentence_structure', 'all', 'beginner', true, false, true, jsonb_build_object(
    'topic', 'syntax awareness',
    'instruction', 'Identify the sentence structure and explain its effect.',
    'total_challenges', 10
  )),
  
  -- Tone Detective
  ('tone_detective', 'Tone Detective', 'Match sentences to their intended tone and audience. Master voice control in writing.', 'tone_matching', 'all', 'intermediate', true, false, true, jsonb_build_object(
    'topic', 'voice control',
    'instruction', 'Identify the tone of each sentence and match it to its intended audience.',
    'total_challenges', 10
  )),
  
  -- Show Don't Tell Studio
  ('show_dont_tell', 'Show, Don''t Tell Studio', 'Transform telling sentences into vivid showing ones. Master imagery and sensory details.', 'show_dont_tell', 'all', 'beginner', true, false, true, jsonb_build_object(
    'topic', 'imagery and sensory details',
    'instruction', 'Rewrite the telling sentence to show the scene instead of telling it.',
    'total_challenges', 10
  )),
  
  -- Metaphor Forge
  ('metaphor_forge', 'Metaphor Forge', 'Create powerful metaphors that deepen meaning and resonance.', 'metaphor_building', 'all', 'intermediate', true, false, true, jsonb_build_object(
    'topic', 'figurative language',
    'instruction', 'Create a metaphor that connects two unlike things in a meaningful way.',
    'total_challenges', 10
  )),
  
  -- Pacing Master
  ('pacing_master', 'Pacing Master', 'Arrange sentences to create different pacing effects. Control story rhythm.', 'pacing_control', 'all', 'intermediate', true, false, true, jsonb_build_object(
    'topic', 'story rhythm',
    'instruction', 'Arrange sentences to create the desired pacing effect.',
    'total_challenges', 10
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

-- Create game challenges table for pre-built content
create table if not exists public.chronicles_game_challenges (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.chronicles_games(id) on delete cascade,
  challenge_order integer not null,
  question text not null,
  context text,
  options jsonb not null default '[]'::jsonb,
  correct_answer text not null,
  explanation text not null,
  teaching_point text,
  difficulty text not null default 'beginner',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Seed Word Choice Wizard challenges
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
    (1, 'Which word creates the strongest image?', 'The _____ moon cast long shadows across the field.', 
     jsonb_build_array('bright', 'pale', 'luminous', 'shiny'), 
     'luminous',
     'Luminous suggests a soft, glowing quality that creates atmosphere, while bright/pale/shiny are more generic.',
     'Specific, sensory words create stronger imagery than generic ones.',
     'beginner'),
    (2, 'Choose the most precise verb:', 'She _____ down the street, avoiding eye contact with everyone.',
     jsonb_build_array('walked', 'hurried', 'moved', 'went'),
     'hurried',
     'Hurried implies urgency and purpose, while the others are too neutral for the context.',
     'Strong verbs carry more meaning and emotion than weak ones.',
     'beginner'),
    (3, 'Which adjective best conveys the mood?', 'The _____ silence filled the room after the argument.',
     jsonb_build_array('quiet', 'heavy', 'still', 'calm'),
     'heavy',
     'Heavy suggests emotional weight and tension, while the others don''t capture the aftermath of conflict.',
     'Adjectives should carry emotional weight and context.',
     'beginner'),
    (4, 'Select the most evocative word:', 'The old house had a _____ smell of books and dust.',
     jsonb_build_array('bad', 'strong', 'musty', 'old'),
     'musty',
     'Musty specifically describes the scent of old books and dust, creating a vivid sensory experience.',
     'Specific sensory words trigger reader memories and associations.',
     'beginner'),
    (5, 'Which word creates the best rhythm?', 'The river _____ through the valley, singing its ancient song.',
     jsonb_build_array('flowed', 'ran', 'moved', 'traveled'),
     'flowed',
     'Flowed has a soft, liquid sound that matches the gentle movement of a river.',
     'Word choice affects the musicality and rhythm of writing.',
     'intermediate')
) as t(challenge_order, question, context, options, correct_answer, explanation, teaching_point, difficulty)
where g.slug = 'word_choice_wizard'
on conflict do nothing;

-- Seed Tone Detective challenges
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
    (1, 'Identify the tone:', 'The data clearly indicates a significant decline in performance metrics over the past quarter.',
     jsonb_build_array('casual', 'formal', 'emotional', 'poetic'),
     'formal',
     'The sentence uses objective language and technical terminology typical of formal business communication.',
     'Formal tone uses objective language and avoids slang or emotional words.',
     'beginner'),
    (2, 'Identify the tone:', 'OMG, you won''t believe what happened! It was totally crazy!',
     jsonb_build_array('formal', 'casual', 'academic', 'somber'),
     'casual',
     'The sentence uses slang, abbreviations, and exclamation marks typical of casual conversation.',
     'Casual tone uses conversational language and informal expressions.',
     'beginner'),
    (3, 'Identify the tone:', 'The sunset painted the sky in shades of crimson and gold, whispering secrets of the day''s end.',
     jsonb_build_array('technical', 'poetic', 'abrupt', 'critical'),
     'poetic',
     'The sentence uses figurative language and sensory imagery typical of poetic writing.',
     'Poetic tone uses figurative language and sensory details.',
     'beginner'),
    (4, 'Which audience is this written for?', 'To assemble the product, insert tab A into slot B and secure with the provided screws.',
     jsonb_build_array('children', 'general readers', 'technical users', 'poetry lovers'),
     'technical users',
     'The language is instructional and precise, designed for someone following technical steps.',
     'Know your audience and adjust language complexity accordingly.',
     'intermediate'),
    (5, 'Identify the tone:', 'I must insist that you reconsider your position on this matter.',
     jsonb_build_array('friendly', 'demanding', 'uncertain', 'playful'),
     'demanding',
     'The use of "must insist" creates a firm, authoritative tone.',
     'Tone is conveyed through word choice and phrasing, not just content.',
     'intermediate')
) as t(challenge_order, question, context, options, correct_answer, explanation, teaching_point, difficulty)
where g.slug = 'tone_detective'
on conflict do nothing;

-- Seed Show Don't Tell challenges
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
    (1, 'Which option shows instead of tells?', 'Telling: He was nervous.',
     jsonb_build_array(
       'He felt nervous.',
       'His hands shook as he reached for the doorknob.',
       'He was a nervous person.',
       'He had butterflies in his stomach.'
     ),
     'His hands shook as he reached for the doorknob.',
     'This describes physical symptoms that the reader can visualize, rather than naming the emotion.',
     'Show physical reactions and behaviors instead of naming emotions.',
     'beginner'),
    (2, 'Which option shows instead of tells?', 'Telling: It was a beautiful day.',
     jsonb_build_array(
       'The weather was nice.',
       'Sunlight danced on the morning dew, and a gentle breeze carried the scent of blooming flowers.',
       'It was a very beautiful day indeed.',
       'The day had good weather.'
     ),
     'Sunlight danced on the morning dew, and a gentle breeze carried the scent of blooming flowers.',
     'This uses sensory details that let the reader experience the beauty.',
     'Use sensory details to create vivid scenes.',
     'beginner'),
    (3, 'Which option shows instead of tells?', 'Telling: She was angry.',
     jsonb_build_array(
       'She felt angry.',
       'Her jaw tightened and her eyes narrowed.',
       'She was an angry person.',
       'She had anger issues.'
     ),
     'Her jaw tightened and her eyes narrowed.',
     'Physical reactions show emotion without naming it.',
     'Describe facial expressions and body language to convey emotion.',
     'beginner'),
    (4, 'Which option shows instead of tells?', 'Telling: The room was messy.',
     jsonb_build_array(
       'The room was very messy.',
       'Clothes covered the floor, and books lay scattered across every surface.',
       'It was a messy room.',
       'The room needed cleaning.'
     ),
     'Clothes covered the floor, and books lay scattered across every surface.',
     'Specific details create a visual image of the mess.',
     'Be specific about what you see, not just that something exists.',
     'intermediate'),
    (5, 'Which option shows instead of tells?', 'Telling: He was tired.',
     jsonb_build_array(
       'He felt very tired.',
       'Dark circles hung under his eyes, and he rubbed them with the back of his hand.',
       'He was a tired person.',
       'He needed to sleep.'
     ),
     'Dark circles hung under his eyes, and he rubbed them with the back of his hand.',
     'Physical signs of fatigue are more powerful than stating the feeling.',
     'Show the physical evidence of internal states.',
     'intermediate')
) as t(challenge_order, question, context, options, correct_answer, explanation, teaching_point, difficulty)
where g.slug = 'show_dont_tell'
on conflict do nothing;

-- Seed Sentence Structure Lab challenges
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
    (1, 'Identify the sentence structure:', 'The cat slept.',
     jsonb_build_array('simple', 'compound', 'complex', 'compound-complex'),
     'simple',
     'A simple sentence has one independent clause and no dependent clauses.',
     'Simple sentences are direct and powerful for emphasis.',
     'beginner'),
    (2, 'Identify the sentence structure:', 'The cat slept, and the dog barked.',
     jsonb_build_array('simple', 'compound', 'complex', 'compound-complex'),
     'compound',
     'A compound sentence has two independent clauses joined by a conjunction.',
     'Compound sentences balance related ideas.',
     'beginner'),
    (3, 'Identify the sentence structure:', 'Because it was raining, the cat slept inside.',
     jsonb_build_array('simple', 'compound', 'complex', 'compound-complex'),
     'complex',
     'A complex sentence has one independent clause and one or more dependent clauses.',
     'Complex sentences show relationships between ideas.',
     'beginner'),
    (4, 'What effect does this structure create?', 'Short. Punchy. Dramatic.',
     jsonb_build_array(
       'It creates confusion.',
       'It builds tension and emphasizes each idea.',
       'It makes the writing flow smoothly.',
       'It shows sophisticated vocabulary.'
     ),
     'It builds tension and emphasizes each idea.',
     'Short sentences create rhythm and emphasis.',
     'Vary sentence length to control pacing and emphasis.',
     'intermediate'),
    (5, 'Identify the sentence structure:', 'The cat slept because it was raining, and the dog barked at the thunder.',
     jsonb_build_array('simple', 'compound', 'complex', 'compound-complex'),
     'compound-complex',
     'A compound-complex sentence has at least two independent clauses and one dependent clause.',
     'Compound-complex sentences can express complex relationships.',
     'intermediate')
) as t(challenge_order, question, context, options, correct_answer, explanation, teaching_point, difficulty)
where g.slug = 'sentence_structure_lab'
on conflict do nothing;

-- Seed Metaphor Forge challenges
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
    (1, 'Which is the strongest metaphor?', 'Her voice was...',
     jsonb_build_array(
       'like a song.',
       'music in a noisy room.',
       'similar to singing.',
       'kind of like a melody.'
     ),
     'music in a noisy room',
     'This metaphor creates a specific image of something beautiful standing out from chaos.',
     'Strong metaphors create vivid, specific images.',
     'beginner'),
    (2, 'Which metaphor best conveys meaning?', 'Time is...',
     jsonb_build_array(
       'like a river.',
       'a thief that steals our moments.',
       'similar to money.',
       'kind of like water.'
     ),
     'a thief that steals our moments',
     'This metaphor conveys the feeling of loss and value associated with time.',
     'Metaphors should convey emotional truth, not just comparison.',
     'intermediate'),
    (3, 'Which metaphor is most effective?', 'His anger was...',
     jsonb_build_array(
       'like fire.',
       'a storm building inside him.',
       'similar to being mad.',
       'kind of like heat.'
     ),
     'a storm building inside him',
     'This suggests growing intensity and internal pressure.',
     'Effective metaphors capture the dynamic nature of emotions.',
     'intermediate'),
    (4, 'What makes this metaphor work?', 'Her hope was a fragile flower in winter.',
     jsonb_build_array(
       'It''s pretty.',
       'It contrasts beauty with harshness.',
       'It uses nature imagery.',
       'It rhymes.'
     ),
     'It contrasts beauty with harshness',
     'The contrast between delicate hope and harsh winter creates emotional resonance.',
     'Metaphors gain power from contrast and tension.',
     'intermediate'),
    (5, 'Which metaphor best fits the context?', 'The city at night was...',
     jsonb_build_array(
       'like a big place.',
       'a constellation of artificial stars.',
       'similar to a town.',
       'kind of bright.'
     ),
     'a constellation of artificial stars',
     'This captures both the visual beauty and the artificial nature of city lights.',
     'Metaphors should be contextually appropriate.',
     'advanced')
) as t(challenge_order, question, context, options, correct_answer, explanation, teaching_point, difficulty)
where g.slug = 'metaphor_forge'
on conflict do nothing;

-- Seed Pacing Master challenges
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
    (1, 'Arrange for fast pacing:', 'Options: 1) He ran. 2) Fast. 3) Heart pounding. 4) Breath came in gasps.',
     jsonb_build_array('1-2-3-4', '2-3-1-4', '3-4-1-2', '4-3-2-1'),
     '2-3-1-4',
     'Starting with short fragments creates immediate tension, followed by action.',
     'Short sentences and fragments create fast pacing.',
     'beginner'),
    (2, 'Arrange for slow pacing:', 'Options: 1) The river flowed slowly. 2) Over smooth stones. 3) Through the ancient valley. 4) Where time seemed to stand still.',
     jsonb_build_array('1-2-3-4', '4-3-2-1', '2-1-3-4', '3-4-1-2'),
     '1-2-3-4',
     'Complete sentences with descriptive details create a leisurely flow.',
     'Longer sentences with details create slow, contemplative pacing.',
     'beginner'),
    (3, 'Which creates tension?', 'A) The door opened. B) The door creaked open, inch by inch.',
     jsonb_build_array('A creates more tension', 'B creates more tension', 'Both create equal tension', 'Neither creates tension'),
     'B creates more tension',
     'Specific details (creaked, inch by inch) slow down the moment and build anticipation.',
     'Specific details can slow down time and build tension.',
     'intermediate'),
    (4, 'Which creates urgency?', 'A) He needed to leave. B) He had to go. Now.',
     jsonb_build_array('A creates more urgency', 'B creates more urgency', 'Both create equal urgency', 'Neither creates urgency'),
     'B creates more urgency',
     'Short, fragmented sentences mimic racing thoughts and immediate action.',
     'Fragments and short sentences convey urgency and panic.',
     'intermediate'),
    (5, 'Arrange for building tension:', 'Options: 1) Silence. 2) Then, a sound. 3) Faint at first. 4) Growing louder.',
     jsonb_build_array('1-2-3-4', '4-3-2-1', '2-1-3-4', '3-4-1-2'),
     '1-2-3-4',
     'Starting with silence, then introducing gradual change builds suspense.',
     'Pacing can build tension through gradual change.',
     'advanced')
) as t(challenge_order, question, context, options, correct_answer, explanation, teaching_point, difficulty)
where g.slug = 'pacing_master'
on conflict do nothing;

-- Create indexes for performance
create index if not exists idx_chronicles_game_challenges_game on public.chronicles_game_challenges(game_id, challenge_order);
create index if not exists idx_chronicles_game_challenges_active on public.chronicles_game_challenges(is_active);

-- Add comment
comment on table public.chronicles_game_challenges is 'Pre-built educational challenges for writing mastery games. These challenges teach specific writing principles without requiring AI generation.';

-- Add more challenges for existing games (10 challenges per game)
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
    (6, 'Which word creates the strongest emotional impact?', 'The _____ child looked up at the sky.',
     jsonb_build_array('small', 'tiny', 'little', 'diminutive'),
     'diminutive',
     'Diminutive suggests vulnerability and fragility, creating more emotional resonance.',
     'Word choice affects emotional impact and reader empathy.',
     'intermediate'),
    (7, 'Choose the most precise word:', 'The _____ wind blew through the trees.',
     jsonb_build_array('strong', 'powerful', 'fierce', 'gusty'),
     'fierce',
     'Fierce suggests aggression and intensity, while the others are more generic.',
     'Specific verbs and adjectives create clearer images.',
     'beginner'),
    (8, 'Which word best fits the formal context?', 'The committee reached a _____ decision.',
     jsonb_build_array('good', 'sound', 'nice', 'great'),
     'sound',
     'Sound is the standard formal term for a well-reasoned decision.',
     'Formal contexts require precise, standard vocabulary.',
     'intermediate'),
    (9, 'Select the most evocative adjective:', 'The _____ sunset painted the horizon.',
     jsonb_build_array('red', 'crimson', 'bloody', 'pink'),
     'crimson',
     'Crimson suggests depth and richness, while red is too basic.',
     'Specific color words create more vivid imagery.',
     'beginner'),
    (10, 'Which word creates the best rhythm?', 'The waves _____ against the shore.',
     jsonb_build_array('hit', 'crashed', 'moved', 'went'),
     'crashed',
     'Crashed has a hard, percussive sound that mimics the action.',
     'Word choice affects the musicality of writing.',
     'intermediate')
) as t(challenge_order, question, context, options, correct_answer, explanation, teaching_point, difficulty)
where g.slug = 'word_choice_wizard'
on conflict do nothing;

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
    (6, 'Identify the tone:', 'Your request has been processed and will be reviewed within 5-7 business days.',
     jsonb_build_array('casual', 'formal', 'emotional', 'poetic'),
     'formal',
     'Uses bureaucratic language typical of official communications.',
     'Formal tone avoids contractions and uses precise terminology.',
     'beginner'),
    (7, 'Identify the tone:', 'Hey! What''s up? Long time no see!',
     jsonb_build_array('formal', 'casual', 'academic', 'somber'),
     'casual',
     'Uses informal greetings and conversational style.',
     'Casual tone includes slang and informal expressions.',
     'beginner'),
    (8, 'Which audience is this for?', 'The protagonist''s journey symbolizes the universal struggle for identity.',
     jsonb_build_array('children', 'general readers', 'academic audience', 'casual readers'),
     'academic audience',
     'Uses literary analysis terminology appropriate for academic discussion.',
     'Academic writing uses specialized terminology and formal structure.',
     'advanced'),
    (9, 'Identify the tone:', 'I regret to inform you that your application was not successful.',
     jsonb_build_array('casual', 'formal', 'emotional', 'poetic'),
     'formal',
     'Uses polite, indirect language typical of formal rejections.',
     'Formal tone uses indirect language to maintain politeness.',
     'intermediate'),
    (10, 'Which tone is most appropriate?', 'Writing to a friend about a party.',
     jsonb_build_array('formal', 'casual', 'academic', 'technical'),
     'casual',
     'Friends expect informal, conversational language.',
     'Match tone to your audience and relationship.',
     'beginner')
) as t(challenge_order, question, context, options, correct_answer, explanation, teaching_point, difficulty)
where g.slug = 'tone_detective'
on conflict do nothing;

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
    (6, 'Which option shows instead of tells?', 'Telling: She was happy.',
     jsonb_build_array(
       'She felt happy.',
       'Her eyes sparkled and she couldn''t stop smiling.',
       'She was a happy person.',
       'She had happiness.'
     ),
     'Her eyes sparkled and she couldn''t stop smiling.',
     'Physical expressions show emotion without naming it.',
     'Describe the physical signs of emotions.',
     'beginner'),
    (7, 'Which option shows instead of tells?', 'Telling: It was cold.',
     jsonb_build_array(
       'The weather was cold.',
       'Her breath formed clouds in the air, and she shivered.',
       'It was very cold outside.',
       'The temperature was low.'
     ),
     'Her breath formed clouds in the air, and she shivered.',
     'Sensory details let the reader experience the cold.',
     'Use sensory details to create immersive scenes.',
     'beginner'),
    (8, 'Which option shows instead of tells?', 'Telling: He was scared.',
     jsonb_build_array(
       'He felt scared.',
       'His knees trembled and his mouth went dry.',
       'He was a scared person.',
       'He had fear.'
     ),
     'His knees trembled and his mouth went dry.',
     'Physical reactions show fear more powerfully than stating it.',
     'Show the body''s response to emotions.',
     'intermediate'),
    (9, 'Which option shows instead of tells?', 'Telling: The food was delicious.',
     jsonb_build_array(
       'The food tasted good.',
       'The flavors exploded on her tongue, and she closed her eyes in delight.',
       'It was very delicious food.',
       'The meal was tasty.'
     ),
     'The flavors exploded on her tongue, and she closed her eyes in delight.',
     'Sensory description creates a vivid experience.',
     'Describe the sensory experience of food.',
     'intermediate'),
    (10, 'Which option shows instead of tells?', 'Telling: The room was quiet.',
     jsonb_build_array(
       'The room was very quiet.',
       'The only sound was the clock ticking on the wall.',
       'It was a quiet room.',
       'There was no noise.'
     ),
     'The only sound was the clock ticking on the wall.',
     'Specific sounds create a sense of quiet through contrast.',
     'Show what''s present, not just what''s absent.',
     'advanced')
) as t(challenge_order, question, context, options, correct_answer, explanation, teaching_point, difficulty)
where g.slug = 'show_dont_tell'
on conflict do nothing;

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
    (6, 'Identify the sentence structure:', 'Although she was tired, she finished the project.',
     jsonb_build_array('simple', 'compound', 'complex', 'compound-complex'),
     'complex',
     'One independent clause and one dependent clause.',
     'Complex sentences show cause and effect relationships.',
     'beginner'),
    (7, 'What effect does this structure create?', 'The wind howled. The trees bent. The rain fell.',
      jsonb_build_array(
        'It creates confusion.',
        'It builds intensity and rhythm.',
        'It makes the writing flow smoothly.',
        'It shows sophisticated vocabulary.'
      ),
      'It builds intensity and rhythm.',
      'Short, parallel sentences create rhythm and emphasis.',
      'Focus on rhythm through parallel structure.',
      'intermediate'),
    (8, 'Identify the sentence structure:', 'She studied hard, but she failed the test, so she was disappointed.',
     jsonb_build_array('simple', 'compound', 'complex', 'compound-complex'),
     'compound-complex',
     'Multiple independent clauses with dependent clause.',
     'Compound-complex sentences express complex sequences.',
     'advanced'),
    (9, 'Which structure creates the most emphasis?', 'The answer was simple: work harder.',
     jsonb_build_array(
       'The answer was simple because she needed to work harder.',
       'The answer, which was simple, was that she needed to work harder.',
       'The answer was simple: work harder.',
       'Because the answer was simple, she needed to work harder.'
     ),
     'The answer was simple: work harder.',
     'A colon creates emphasis and draws attention.',
     'Use punctuation to control emphasis and pacing.',
     'intermediate'),
    (10, 'What effect does this structure create?', 'Long, flowing sentences with multiple clauses connected by commas and conjunctions create a sense of...',
     jsonb_build_array(
       'urgency and tension.',
       'leisurely flow and contemplation.',
       'confusion and chaos.',
       'excitement and energy.'
     ),
     'leisurely flow and contemplation.',
     'Long sentences slow down reading and create a relaxed pace.',
     'Long sentences affect pacing.',
     'advanced')
) as t(challenge_order, question, context, options, correct_answer, explanation, teaching_point, difficulty)
where g.slug = 'sentence_structure_lab'
on conflict do nothing;

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
    (6, 'Which metaphor is most effective?', 'His memories were...',
     jsonb_build_array(
       'like old photographs.',
       'faded photographs in a dusty album.',
       'similar to pictures.',
       'kind of like photos.'
     ),
     'faded photographs in a dusty album',
     'This creates a specific, nostalgic image.',
     'Specific details make metaphors more powerful.',
     'intermediate'),
    (7, 'What makes this metaphor work?', 'Her laughter was sunshine breaking through clouds.',
     jsonb_build_array(
       'It''s happy.',
       'It contrasts darkness with light.',
       'It uses weather imagery.',
       'It rhymes.'
     ),
     'It contrasts darkness with light',
     'The contrast creates emotional resonance.',
     'Metaphors gain power from contrast.',
     'intermediate'),
    (8, 'Which metaphor best fits?', 'The internet is...',
     jsonb_build_array(
       'like a big computer.',
       'a vast ocean of information.',
       'similar to technology.',
       'kind of like a network.'
     ),
     'a vast ocean of information',
     'This captures both the scale and the exploratory nature of the internet.',
     'Metaphors should capture the essential nature of the subject.',
     'advanced'),
    (9, 'Which metaphor conveys the right emotion?', 'His guilt was...',
     jsonb_build_array(
       'like a heavy stone.',
       'a weight he carried everywhere.',
       'similar to being bad.',
       'kind of like a burden.'
     ),
     'a weight he carried everywhere',
     'This suggests constant presence and inescapability.',
     'Metaphors should convey emotional truth.',
     'intermediate'),
    (10, 'What makes this metaphor weak?', 'Her love was like a flower.',
     jsonb_build_array(
       'It''s too cliché.',
       'It''s not accurate.',
       'It''s too complex.',
       'It doesn''t make sense.'
     ),
     'It''s too cliché',
     'Overused metaphors lose their power.',
     'Avoid clichés and create fresh comparisons.',
     'advanced')
) as t(challenge_order, question, context, options, correct_answer, explanation, teaching_point, difficulty)
where g.slug = 'metaphor_forge'
on conflict do nothing;

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
    (6, 'Which creates the slowest pacing?', 'A) The old man walked. B) The old man walked slowly, carefully placing one foot before the other.',
     jsonb_build_array('A creates slower pacing', 'B creates slower pacing', 'Both create equal pacing', 'Neither creates slow pacing'),
     'B creates slower pacing',
     'More details and longer phrases slow down reading.',
     'Details slow down the reading pace.',
     'beginner'),
    (7, 'Which creates the fastest pacing?', 'A) Gunshots rang out. B) Suddenly, there were gunshots.',
     jsonb_build_array('A creates faster pacing', 'B creates faster pacing', 'Both create equal pacing', 'Neither creates fast pacing'),
     'A creates faster pacing',
     'Direct action without setup creates immediate impact.',
     'Direct statements create urgency.',
     'intermediate'),
    (8, 'Arrange for dramatic reveal:', 'Options: 1) The door opened. 2) She stood there. 3) Covered in blood. 4) Smiling.',
     jsonb_build_array('1-2-3-4', '4-3-2-1', '2-1-3-4', '1-2-4-3'),
     '1-2-3-4',
     'Building up to the shocking detail creates maximum impact.',
     'Pacing controls the timing of reveals.',
     'advanced'),
    (9, 'Which creates suspense?', 'A) She opened the box. B) Her hand trembled as she reached for the box.',
     jsonb_build_array('A creates more suspense', 'B creates more suspense', 'Both create equal suspense', 'Neither creates suspense'),
     'B creates more suspense',
     'Focusing on the action before the event builds anticipation.',
     'Focus on the approach, not just the action.',
     'intermediate'),
    (10, 'Arrange for calm resolution:', 'Options: 1) Peace returned. 2) The storm passed. 3) Sunlight warmed the earth. 4) Birds began to sing.',
     jsonb_build_array('1-2-3-4', '4-3-2-1', '2-1-3-4', '3-4-1-2'),
     '2-3-4-1',
     'Gradual progression from storm to peace creates resolution.',
     'Pacing can mirror emotional arcs.',
     'advanced')
) as t(challenge_order, question, context, options, correct_answer, explanation, teaching_point, difficulty)
where g.slug = 'pacing_master'
on conflict do nothing;

-- Add new game types
insert into public.chronicles_games (slug, title, description, game_type, audience, difficulty, is_offline_ready, is_ai_powered, is_published, config)
values
  -- Dialogue Dynamics
  ('dialogue_dynamics', 'Dialogue Dynamics', 'Master the art of writing natural, engaging dialogue that reveals character and advances plot.', 'dialogue_writing', 'all', 'intermediate', true, false, true, jsonb_build_object(
    'topic', 'dialogue craft',
    'instruction', 'Identify effective dialogue techniques and common pitfalls.',
    'total_challenges', 10
  )),
  
  -- Character Development
  ('character_development', 'Character Development Lab', 'Create compelling, multi-dimensional characters with depth and motivation.', 'character_building', 'all', 'intermediate', true, false, true, jsonb_build_object(
    'topic', 'character creation',
    'instruction', 'Identify effective character development techniques.',
    'total_challenges', 10
  )),
  
  -- Setting the Scene
  ('setting_scene', 'Setting the Scene', 'Create immersive settings that support story and mood.', 'setting_craft', 'all', 'beginner', true, false, true, jsonb_build_object(
    'topic', 'world building',
    'instruction', 'Learn to create vivid, functional settings.',
    'total_challenges', 10
  )),
  
  -- Point of View Mastery
  ('pov_mastery', 'Point of View Mastery', 'Understand and master different narrative perspectives and their effects.', 'pov_control', 'all', 'intermediate', true, false, true, jsonb_build_object(
    'topic', 'narrative perspective',
    'instruction', 'Identify POV types and their appropriate uses.',
    'total_challenges', 10
  )),
  
  -- Plot Structure
  ('plot_structure', 'Plot Structure Architect', 'Understand story structure and create compelling narratives.', 'plot_building', 'all', 'beginner', true, false, true, jsonb_build_object(
    'topic', 'narrative structure',
    'instruction', 'Identify plot elements and their functions.',
    'total_challenges', 10
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

-- Seed Dialogue Dynamics challenges
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
    (1, 'Which dialogue is most natural?', 'A) "I am very angry at you," he said angrily. B) "I can''t believe you did that," he said.',
     jsonb_build_array('A is more natural', 'B is more natural', 'Both are equally natural', 'Neither is natural'),
     'B is more natural',
     'Real people don''t announce their emotions; they show them through what they say.',
     'Dialogue should sound like real speech, not emotion announcements.',
     'beginner'),
    (2, 'Which dialogue reveals character?', 'A) "Hello," she said. B) "Another day, another disappointment," she sighed.',
     jsonb_build_array('A reveals more character', 'B reveals more character', 'Both reveal character equally', 'Neither reveals character'),
     'B reveals more character',
     'The second line reveals attitude and worldview.',
     'Dialogue should reveal character, not just convey information.',
     'intermediate'),
    (3, 'Which dialogue advances plot?', 'A) "The weather is nice." B) "We need to leave before they find us."',
     jsonb_build_array('A advances plot', 'B advances plot', 'Both advance plot', 'Neither advances plot'),
     'B advances plot',
     'The second line introduces stakes and urgency.',
     'Dialogue should move the story forward.',
     'beginner'),
    (4, 'Which dialogue has subtext?', 'A) "I hate you." B) "I wish you well... elsewhere."',
     jsonb_build_array('A has subtext', 'B has subtext', 'Both have subtext', 'Neither has subtext'),
     'B has subtext',
     'The second line says one thing but means another.',
     'Subtext adds depth and realism to dialogue.',
     'advanced'),
    (5, 'Which dialogue tag is best?', 'A) "Hello," he said. B) "Hello," he ejaculated.',
     jsonb_build_array('A is better', 'B is better', 'Both are equally good', 'Neither is good'),
     'A is better',
     'Simple tags like "said" are invisible to readers.',
     'Use simple dialogue tags; let the dialogue do the work.',
     'beginner'),
    (6, 'Which dialogue creates tension?', 'A) "Please pass the salt." B) "If you touch that salt, you''ll regret it."',
     jsonb_build_array('A creates tension', 'B creates tension', 'Both create tension', 'Neither creates tension'),
     'B creates tension',
     'The second line introduces threat and conflict.',
     'Dialogue can create tension through what''s said and how.',
     'intermediate'),
    (7, 'Which dialogue shows relationship?', 'A) "How are you?" "Fine." B) "Still mad?" "Always."',
     jsonb_build_array('A shows relationship', 'B shows relationship', 'Both show relationship', 'Neither shows relationship'),
     'B shows relationship',
     'The second exchange reveals history and dynamic.',
     'Dialogue should reveal relationships between characters.',
     'intermediate'),
    (8, 'Which dialogue is most efficient?', 'A) "I am going to go to the store to buy some milk because we are out of milk." B) "Out of milk. Going to the store."',
     jsonb_build_array('A is more efficient', 'B is more efficient', 'Both are equally efficient', 'Neither is efficient'),
     'B is more efficient',
     'Real speech is often fragmented and efficient.',
     'Dialogue should be concise and realistic.',
     'beginner'),
    (9, 'Which dialogue has voice?', 'A) "I don''t like this." B) "This ain''t sitting right with me, chief."',
     jsonb_build_array('A has more voice', 'B has more voice', 'Both have equal voice', 'Neither has voice'),
     'B has more voice',
     'The second line has distinctive speech patterns.',
     'Each character should have a unique voice.',
     'advanced'),
    (10, 'Which dialogue avoids exposition?', 'A) "As you know, our father died five years ago." B) "Five years. Still miss him."',
     jsonb_build_array('A avoids exposition', 'B avoids exposition', 'Both avoid exposition', 'Neither avoids exposition'),
     'B avoids exposition',
     'The second line conveys information naturally.',
     'Avoid "as you know" exposition in dialogue.',
     'advanced')
) as t(challenge_order, question, context, options, correct_answer, explanation, teaching_point, difficulty)
where g.slug = 'dialogue_dynamics'
on conflict do nothing;

-- Seed Character Development challenges
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
    (1, 'What makes a character compelling?', 'A) They are perfect. B) They have flaws.',
     jsonb_build_array('A is more compelling', 'B is more compelling', 'Both are equally compelling', 'Neither is compelling'),
     'B is more compelling',
     'Flaws make characters relatable and interesting.',
     'Compelling characters have flaws and weaknesses.',
     'beginner'),
    (2, 'What is character motivation?', 'A) What they do. B) Why they do it.',
     jsonb_build_array('A is motivation', 'B is motivation', 'Both are motivation', 'Neither is motivation'),
     'B is motivation',
     'Motivation is the driving force behind actions.',
     'Understanding motivation is key to character development.',
     'beginner'),
    (3, 'What creates character depth?', 'A) Physical description. B) Internal conflict.',
     jsonb_build_array('A creates depth', 'B creates depth', 'Both create depth', 'Neither creates depth'),
     'B creates depth',
     'Internal conflict adds complexity and realism.',
     'Depth comes from internal struggles and contradictions.',
     'intermediate'),
    (4, 'What is a character arc?', 'A) Their backstory. B) Their emotional journey.',
     jsonb_build_array('A is character arc', 'B is character arc', 'Both are character arc', 'Neither is character arc'),
     'B is character arc',
     'An arc is about change and growth.',
     'Character arcs show transformation over time.',
     'beginner'),
    (5, 'What makes dialogue reveal character?', 'A) What they say. B) How they say it.',
     jsonb_build_array('A reveals character', 'B reveals character', 'Both reveal character', 'Neither reveals character'),
     'B reveals character',
     'Word choice and speech patterns reveal personality.',
     'Voice and word choice are key to character revelation.',
     'intermediate'),
    (6, 'What is a foil character?', 'A) The hero. B) A character who contrasts with another.',
     jsonb_build_array('A is a foil', 'B is a foil', 'Both are foils', 'Neither is a foil'),
     'B is a foil',
     'A foil highlights traits by contrast.',
     'Foils reveal character through comparison.',
     'advanced'),
    (7, 'What creates character consistency?', 'A) Repeating the same actions. B) Staying true to established traits.',
     jsonb_build_array('A creates consistency', 'B creates consistency', 'Both create consistency', 'Neither creates consistency'),
     'B creates consistency',
     'Consistency means actions align with established personality.',
     'Characters should act in ways that fit their established traits.',
     'intermediate'),
    (8, 'What is a round character?', 'A) A fat character. B) A complex, multi-dimensional character.',
     jsonb_build_array('A is a round character', 'B is a round character', 'Both are round characters', 'Neither is a round character'),
     'B is a round character',
     'Round characters have depth and complexity.',
     'Round characters are complex and developed.',
     'beginner'),
    (9, 'What creates character empathy?', 'A) Making them likable. B) Making them understandable.',
     jsonb_build_array('A creates empathy', 'B creates empathy', 'Both create empathy', 'Neither creates empathy'),
     'B creates empathy',
     'Understanding creates empathy more than likability.',
     'Readers empathize with characters they understand, even if they don''t like them.',
     'advanced'),
    (10, 'What is character backstory?', 'A) Their future plans. B) Their history before the story.',
     jsonb_build_array('A is backstory', 'B is backstory', 'Both are backstory', 'Neither is backstory'),
     'B is backstory',
     'Backstory is what happened before the main story.',
     'Backstory informs character without overwhelming the present.',
     'beginner')
) as t(challenge_order, question, context, options, correct_answer, explanation, teaching_point, difficulty)
where g.slug = 'character_development'
on conflict do nothing;

-- Seed Setting the Scene challenges
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
    (1, 'Which setting description is most immersive?', 'A) The room was old. B) Dust motes danced in shafts of light that pierced the cracked windows.',
     jsonb_build_array('A is more immersive', 'B is more immersive', 'Both are equally immersive', 'Neither is immersive'),
     'B is more immersive',
     'Specific sensory details create a vivid image.',
     'Use sensory details to create immersive settings.',
     'beginner'),
    (2, 'What should setting do?', 'A) Just be background. B) Support mood and theme.',
     jsonb_build_array('A is setting''s role', 'B is setting''s role', 'Both are setting''s role', 'Neither is setting''s role'),
     'B is setting''s role',
     'Setting should enhance the story, not just exist.',
     'Setting should support mood, theme, and character.',
     'beginner'),
    (3, 'Which setting reveals character?', 'A) A generic house. B) A house filled with books and cat hair.',
     jsonb_build_array('A reveals character', 'B reveals character', 'Both reveal character', 'Neither reveals character'),
     'B reveals character',
     'Details about setting reveal character traits.',
     'Setting can reveal character through details.',
     'intermediate'),
    (4, 'What is atmospheric setting?', 'A) A place with weather. B) A setting that creates mood.',
     jsonb_build_array('A is atmospheric', 'B is atmospheric', 'Both are atmospheric', 'Neither is atmospheric'),
     'B is atmospheric',
     'Atmospheric setting creates emotional tone.',
     'Atmosphere comes from how setting is described.',
     'intermediate'),
    (5, 'Which setting creates tension?', 'A) A sunny beach. B) A dark alley with flickering lights.',
     jsonb_build_array('A creates tension', 'B creates tension', 'Both create tension', 'Neither creates tension'),
     'B creates tension',
     'Dark, uncertain settings create unease.',
     'Setting choices affect story tension.',
     'beginner'),
    (6, 'What is sensory setting?', 'A) A setting you can see. B) A setting you can see, hear, smell, touch, taste.',
     jsonb_build_array('A is sensory', 'B is sensory', 'Both are sensory', 'Neither is sensory'),
     'B is sensory',
     'Sensory setting engages multiple senses.',
     'Engage all five senses for immersive settings.',
     'beginner'),
    (7, 'Which setting supports the theme of isolation?', 'A) A busy city street. B) A remote cabin in winter.',
     jsonb_build_array('A supports isolation', 'B supports isolation', 'Both support isolation', 'Neither supports isolation'),
     'B supports isolation',
     'Remote, harsh setting reinforces isolation theme.',
     'Setting should reinforce story themes.',
     'intermediate'),
    (8, 'What is dynamic setting?', 'A) A setting that never changes. B) A setting that changes with the story.',
     jsonb_build_array('A is dynamic', 'B is dynamic', 'Both are dynamic', 'Neither is dynamic'),
     'B is dynamic',
     'Dynamic setting evolves with the narrative.',
     'Setting can change to reflect story progress.',
     'advanced'),
    (9, 'Which setting description is most efficient?', 'A) The room was small, old, dark, and smelled bad. B) The cramped room smelled of decay.',
     jsonb_build_array('A is more efficient', 'B is more efficient', 'Both are equally efficient', 'Neither is efficient'),
     'B is more efficient',
     'Specific words convey more than lists of adjectives.',
     'Use precise, evocative language instead of lists.',
     'intermediate'),
    (10, 'What is symbolic setting?', 'A) A realistic place. B) A setting that represents abstract ideas.',
     jsonb_build_array('A is symbolic', 'B is symbolic', 'Both are symbolic', 'Neither is symbolic'),
     'B is symbolic',
     'Symbolic settings represent themes or ideas.',
     'Setting can operate on symbolic levels.',
     'advanced')
) as t(challenge_order, question, context, options, correct_answer, explanation, teaching_point, difficulty)
where g.slug = 'setting_scene'
on conflict do nothing;

-- Seed POV Mastery challenges
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
    (1, 'Identify the POV:', 'I walked down the street and saw the dog.',
     jsonb_build_array('First person', 'Second person', 'Third person limited', 'Third person omniscient'),
     'First person',
     'Uses "I" pronoun, narrator is a character.',
     'First person uses "I" and is limited to one character''s perspective.',
     'beginner'),
    (2, 'Identify the POV:', 'She walked down the street and saw the dog. She wondered if it was hungry.',
     jsonb_build_array('First person', 'Second person', 'Third person limited', 'Third person omniscient'),
     'Third person limited',
     'Uses "she" but limited to her thoughts.',
     'Third person limited follows one character but uses "he/she".',
     'beginner'),
    (3, 'Identify the POV:', 'She walked down the street. The dog was hungry, though she didn''t know it.',
     jsonb_build_array('First person', 'Second person', 'Third person limited', 'Third person omniscient'),
     'Third person omniscient',
     'Narrator knows things the character doesn''t.',
     'Omniscient POV knows everything about all characters.',
     'intermediate'),
    (4, 'Which POV creates the most intimacy?', 'A) First person. B) Third person.',
     jsonb_build_array('A creates more intimacy', 'B creates more intimacy', 'Both create equal intimacy', 'Neither creates intimacy'),
     'A creates more intimacy',
     'First person puts readers directly in the character''s mind.',
     'POV choice affects reader intimacy with characters.',
     'beginner'),
    (5, 'Which POV offers the most flexibility?', 'A) First person. B) Third person omniscient.',
     jsonb_build_array('A offers more flexibility', 'B offers more flexibility', 'Both offer equal flexibility', 'Neither offers flexibility'),
     'B offers more flexibility',
     'Omniscient can access any character and any information.',
     'Different POVs offer different advantages and limitations.',
     'intermediate'),
    (6, 'What is POV consistency?', 'A) Using multiple POVs. B) Staying in one POV throughout.',
     jsonb_build_array('A is POV consistency', 'B is POV consistency', 'Both are POV consistency', 'Neither is POV consistency'),
     'B is POV consistency',
     'Consistency means not accidentally switching POVs.',
     'Maintain consistent POV to avoid reader confusion.',
     'beginner'),
    (7, 'What is head-hopping?', 'A) Describing heads. B) Switching POVs within a scene.',
     jsonb_build_array('A is head-hopping', 'B is head-hopping', 'Both are head-hopping', 'Neither is head-hopping'),
     'B is head-hopping',
     'Head-hopping is switching between characters'' thoughts.',
     'Avoid head-hopping to maintain POV clarity.',
     'advanced'),
    (8, 'Which POV is best for mystery?', 'A) First person. B) Third person limited.',
     jsonb_build_array('A is best for mystery', 'B is best for mystery', 'Both are equally good', 'Neither is good for mystery'),
     'B is best for mystery',
     'Third person limited can withhold information while first person cannot.',
     'POV choice affects what information readers have.',
     'intermediate'),
    (9, 'What is unreliable narrator?', 'A) A narrator who lies. B) A narrator whose perception is flawed.',
     jsonb_build_array('A is unreliable', 'B is unreliable', 'Both are unreliable', 'Neither is unreliable'),
     'B is unreliable',
     'Unreliable narrators have biased or limited perspectives.',
     'Unreliable narrators add complexity and intrigue.',
     'advanced'),
    (10, 'Which POV creates the most distance?', 'A) First person. B) Third person objective.',
     jsonb_build_array('A creates more distance', 'B creates more distance', 'Both create equal distance', 'Neither creates distance'),
     'B creates more distance',
     'Objective POV reports without accessing thoughts.',
     'POV choice affects emotional distance from characters.',
     'advanced')
) as t(challenge_order, question, context, options, correct_answer, explanation, teaching_point, difficulty)
where g.slug = 'pov_mastery'
on conflict do nothing;

-- Seed Plot Structure challenges
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
    (1, 'What is the inciting incident?', 'A) The climax. B) The event that starts the story.',
     jsonb_build_array('A is inciting incident', 'B is inciting incident', 'Both are inciting incident', 'Neither is inciting incident'),
     'B is inciting incident',
     'The inciting incident disrupts the status quo.',
     'The inciting incident launches the main story.',
     'beginner'),
    (2, 'What is the climax?', 'A) The beginning. B) The point of highest tension.',
     jsonb_build_array('A is climax', 'B is climax', 'Both are climax', 'Neither is climax'),
     'B is climax',
     'The climax is the peak of conflict and tension.',
     'The climax is where the main conflict reaches its peak.',
     'beginner'),
    (3, 'What is rising action?', 'A) Events after the climax. B) Events building toward the climax.',
     jsonb_build_array('A is rising action', 'B is rising action', 'Both are rising action', 'Neither is rising action'),
     'B is rising action',
     'Rising action builds tension and develops conflict.',
     'Rising action escalates the story toward the climax.',
     'beginner'),
    (4, 'What is the resolution?', 'A) The introduction. B) The aftermath of the climax.',
     jsonb_build_array('A is resolution', 'B is resolution', 'Both are resolution', 'Neither is resolution'),
     'B is resolution',
     'Resolution shows the aftermath and ties up loose ends.',
     'Resolution provides closure after the climax.',
     'beginner'),
    (5, 'What creates conflict?', 'A) Everyone agreeing. B) Characters wanting opposing things.',
     jsonb_build_array('A creates conflict', 'B creates conflict', 'Both create conflict', 'Neither creates conflict'),
     'B creates conflict',
     'Conflict comes from opposing desires or goals.',
     'Conflict drives story through opposing forces.',
     'beginner'),
    (6, 'What is a subplot?', 'A) The main story. B) A secondary story running alongside the main.',
     jsonb_build_array('A is subplot', 'B is subplot', 'Both are subplot', 'Neither is subplot'),
     'B is subplot',
     'Subplots support or contrast with the main plot.',
     'Subplots add depth and complexity to stories.',
     'intermediate'),
    (7, 'What is pacing in plot?', 'A) How fast the story moves. B) The order of events.',
     jsonb_build_array('A is pacing', 'B is pacing', 'Both are pacing', 'Neither is pacing'),
     'A is pacing',
     'Pacing controls the speed of story progression.',
     'Pacing affects reader engagement and tension.',
     'intermediate'),
    (8, 'What is a plot twist?', 'A) Expected event. B) Surprising but logical revelation.',
     jsonb_build_array('A is plot twist', 'B is plot twist', 'Both are plot twist', 'Neither is plot twist'),
     'B is plot twist',
     'Plot twists surprise but should feel inevitable in hindsight.',
     'Good plot twists are surprising yet logical.',
     'advanced'),
    (9, 'What is the midpoint?', 'A) The end. B) A major shift at the story''s center.',
     jsonb_build_array('A is midpoint', 'B is midpoint', 'Both are midpoint', 'Neither is midpoint'),
     'B is midpoint',
     'The midpoint shifts the story into higher stakes.',
     'The midpoint raises stakes and changes direction.',
     'intermediate'),
    (10, 'What is denouement?', 'A) The climax. B) The final resolution and tying up of loose ends.',
     jsonb_build_array('A is denouement', 'B is denouement', 'Both are denouement', 'Neither is denouement'),
     'B is denouement',
     'Denouement provides final closure after the climax.',
     'Denouement is the final settling of the story.',
     'advanced')
) as t(challenge_order, question, context, options, correct_answer, explanation, teaching_point, difficulty)
where g.slug = 'plot_structure'
on conflict do nothing;

-- Enable RLS on chronicles_game_challenges
alter table public.chronicles_game_challenges enable row level security;

-- RLS Policies for chronicles_game_challenges
-- Allow all users (including anonymous) to read published game challenges
create policy "Allow read access to all users for game challenges"
  on public.chronicles_game_challenges
  for select
  using (true);

-- Allow authenticated users to insert game session progress (via API)
create policy "Allow insert for authenticated users"
  on public.chronicles_game_challenges
  for insert
  with check (auth.uid() is not null);

-- Allow service role to manage all challenges
create policy "Allow service role full access"
  on public.chronicles_game_challenges
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Ensure RLS is enabled on chronicles_games
alter table public.chronicles_games enable row level security;

-- RLS Policies for chronicles_games
-- Allow all users to read published games
create policy "Allow read access to published games"
  on public.chronicles_games
  for select
  using (is_published = true);

-- Allow service role to manage games
create policy "Allow service role full access to games"
  on public.chronicles_games
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Ensure RLS is enabled on chronicles_game_sessions
alter table public.chronicles_game_sessions enable row level security;

-- RLS Policies for chronicles_game_sessions
-- Allow users to read their own sessions
create policy "Allow users to read own game sessions"
  on public.chronicles_game_sessions
  for select
  using (auth.uid() = creator_id);

-- Allow authenticated users to create their own sessions
create policy "Allow users to create own game sessions"
  on public.chronicles_game_sessions
  for insert
  with check (auth.uid() = creator_id);

-- Allow users to update their own sessions
create policy "Allow users to update own game sessions"
  on public.chronicles_game_sessions
  for update
  using (auth.uid() = creator_id)
  with check (auth.uid() = creator_id);

-- Allow service role full access
create policy "Allow service role full access to sessions"
  on public.chronicles_game_sessions
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Ensure RLS is enabled on chronicles_game_rounds
alter table public.chronicles_game_rounds enable row level security;

-- RLS Policies for chronicles_game_rounds
-- Allow users to read rounds from their own sessions
create policy "Allow users to read own game rounds"
  on public.chronicles_game_rounds
  for select
  using (
    exists (
      select 1 from public.chronicles_game_sessions
      where chronicles_game_sessions.id = chronicles_game_rounds.session_id
      and chronicles_game_sessions.creator_id = auth.uid()
    )
  );

-- Allow users to insert rounds for their own sessions
create policy "Allow users to insert own game rounds"
  on public.chronicles_game_rounds
  for insert
  with check (
    exists (
      select 1 from public.chronicles_game_sessions
      where chronicles_game_sessions.id = chronicles_game_rounds.session_id
      and chronicles_game_sessions.creator_id = auth.uid()
    )
  );

-- Allow users to update their own rounds
create policy "Allow users to update own game rounds"
  on public.chronicles_game_rounds
  for update
  using (
    exists (
      select 1 from public.chronicles_game_sessions
      where chronicles_game_sessions.id = chronicles_game_rounds.session_id
      and chronicles_game_sessions.creator_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.chronicles_game_sessions
      where chronicles_game_sessions.id = chronicles_game_rounds.session_id
      and chronicles_game_sessions.creator_id = auth.uid()
    )
  );

-- Allow service role full access
create policy "Allow service role full access to rounds"
  on public.chronicles_game_rounds
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Ensure RLS is enabled on chronicles_creator_game_progress
alter table public.chronicles_creator_game_progress enable row level security;

-- RLS Policies for chronicles_creator_game_progress
-- Allow users to read their own progress
create policy "Allow users to read own game progress"
  on public.chronicles_creator_game_progress
  for select
  using (creator_id = auth.uid());

-- Allow users to insert their own progress
create policy "Allow users to insert own game progress"
  on public.chronicles_creator_game_progress
  for insert
  with check (creator_id = auth.uid());

-- Allow users to update their own progress
create policy "Allow users to update own game progress"
  on public.chronicles_creator_game_progress
  for update
  using (creator_id = auth.uid())
  with check (creator_id = auth.uid());

-- Allow service role full access
create policy "Allow service role full access to progress"
  on public.chronicles_creator_game_progress
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Ensure RLS is enabled on chronicles_game_challenges (in case it wasn't enabled earlier)
alter table public.chronicles_game_challenges enable row level security;
