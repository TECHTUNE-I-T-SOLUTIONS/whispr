-- Seed the real game catalog used by Whispr writing games.

insert into public.chronicles_games (
  slug,
  title,
  description,
  game_type,
  audience,
  difficulty,
  is_offline_ready,
  is_ai_powered,
  is_published,
  config
)
select
  t.slug,
  t.title,
  t.description,
  t.game_type,
  t.audience,
  t.difficulty,
  t.is_offline_ready,
  t.is_ai_powered,
  t.is_published,
  t.config
from (
  values
    ('poem_next_line', 'Poetry Continuation', 'Continue a poem line by line with tone and imagery.', 'poem_next_line', 'all', 'beginner', true, true, true, jsonb_build_object(
      'topic', 'poetry',
      'starter_prompt', 'A silver wind leans over the rooftops and the next line should feel lyrical.',
      'starter_hint', 'Think in image, rhythm and mood.',
      'starter_explanation', 'Stay emotionally and imagistically consistent.',
      'starter_options', jsonb_build_array(
        'Keep the image alive with a soft movement.',
        'Switch to a completely unrelated topic.',
        'Repeat the previous line without expansion.'
      )
    )),
    ('blog_next_line', 'Blog Builder', 'Build a blog post paragraph by paragraph with a practical voice.', 'blog_next_line', 'all', 'beginner', true, true, true, jsonb_build_object(
      'topic', 'blog writing',
      'starter_prompt', 'A smart blog intro explains why the topic matters before it teaches the reader.',
      'starter_hint', 'Be clear, practical and structured.',
      'starter_explanation', 'Blog writing should add value and move the idea forward.',
      'starter_options', jsonb_build_array(
        'Add one concrete detail that sharpens the point.',
        'Jump to a new topic without context.',
        'End the article immediately.'
      )
    )),
    ('guess_next_line', 'Guess the Next Line', 'Pick the best continuation from carefully designed options.', 'guess_next_line', 'all', 'beginner', true, true, true, jsonb_build_object(
      'topic', 'multiple choice reasoning',
      'starter_prompt', 'Which line best continues a calm and thoughtful opening?',
      'starter_hint', 'Choose the line that keeps the tone and logic aligned.',
      'starter_explanation', 'The right answer keeps the same voice and motion.',
      'starter_options', jsonb_build_array(
        'It keeps the mood steady and the imagery coherent.',
        'It changes the subject too abruptly.',
        'It makes the opening feel unfinished.'
      )
    )),
    ('midnight-poem-flow', 'Midnight Poem Flow', 'A darker poetic continuation game with moonlit imagery.', 'poem_next_line', 'all', 'intermediate', true, true, true, jsonb_build_object(
      'topic', 'night poetry',
      'theme', 'moonlit streets and quiet reflections',
      'starter_prompt', 'The city sleeps under a violet moon and the next line should deepen the atmosphere.',
      'starter_hint', 'Lean into texture, silence and image.',
      'starter_explanation', 'The line should extend the nocturnal mood instead of breaking it.',
      'starter_options', jsonb_build_array(
        'A lamp hums softly against the window glass.',
        'The poem suddenly becomes a technical manual.',
        'The voice leaves the scene entirely.'
      )
    )),
    ('garden-poem-walk', 'Garden Poem Walk', 'A gentle, sensory poem continuation about growth and movement.', 'poem_next_line', 'all', 'beginner', true, true, true, jsonb_build_object(
      'topic', 'nature poetry',
      'theme', 'gardens and growth',
      'starter_prompt', 'A small garden opens after the rain and the next line should feel alive.',
      'starter_hint', 'Use movement and scent.',
      'starter_explanation', 'The best line keeps the natural cadence flowing.',
      'starter_options', jsonb_build_array(
        'The basil leaves lift their faces to the light.',
        'The poem starts arguing with the reader.',
        'The scene is replaced by a city invoice.'
      )
    )),
    ('opinion-blog-builder', 'Opinion Blog Builder', 'A sharper blog continuation game for opinion pieces and commentary.', 'blog_next_line', 'all', 'intermediate', true, true, true, jsonb_build_object(
      'topic', 'opinion writing',
      'starter_prompt', 'A strong opinion blog opens with a clear claim and the next line should support it.',
      'starter_hint', 'Be direct, but still useful.',
      'starter_explanation', 'The next sentence should add evidence or nuance.',
      'starter_options', jsonb_build_array(
        'It gives a concrete reason the claim matters.',
        'It stops arguing and changes to unrelated gossip.',
        'It repeats the claim without adding anything.'
      )
    )),
    ('how-to-blog-builder', 'How-To Blog Builder', 'A practical blog continuation for tutorials and step-by-step posts.', 'blog_next_line', 'all', 'beginner', true, true, true, jsonb_build_object(
      'topic', 'tutorial writing',
      'starter_prompt', 'The guide introduces a helpful task and the next line should explain the first step.',
      'starter_hint', 'Stay instructional and clear.',
      'starter_explanation', 'A good tutorial line advances the steps logically.',
      'starter_options', jsonb_build_array(
        'It names the first action in plain language.',
        'It distracts the reader with a side story.',
        'It ends the tutorial before it starts.'
      )
    )),
    ('context-quiz-shift', 'Context Quiz Shift', 'A quiz game focused on preserving context across lines.', 'guess_next_line', 'all', 'intermediate', true, true, true, jsonb_build_object(
      'topic', 'context preservation',
      'starter_prompt', 'Which line best preserves the meaning of the sentence?',
      'starter_hint', 'Choose the option that preserves flow and logic.',
      'starter_explanation', 'The correct line respects both tone and context.',
      'starter_options', jsonb_build_array(
        'It continues the thought with a matching direction.',
        'It introduces an unrelated event without reason.',
        'It contradicts the opening premise.'
      )
    )),
    ('tone-match-quiz', 'Tone Match Quiz', 'A quiz game that asks you to match tone and style.', 'guess_next_line', 'all', 'beginner', true, true, true, jsonb_build_object(
      'topic', 'tone matching',
      'starter_prompt', 'Which line best matches the soft reflective tone?',
      'starter_hint', 'Look for a line that feels emotionally aligned.',
      'starter_explanation', 'Matching tone is more important than sounding clever.',
      'starter_options', jsonb_build_array(
        'It gently deepens the reflective mood.',
        'It sounds abrupt and overly technical.',
        'It breaks the emotional thread.'
      )
    ))
) as t(slug, title, description, game_type, audience, difficulty, is_offline_ready, is_ai_powered, is_published, config)
on conflict (slug) do update
set
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