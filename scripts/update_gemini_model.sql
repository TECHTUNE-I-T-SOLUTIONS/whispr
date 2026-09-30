-- Update the default AI model preference to use the latest Gemini model
-- This updates the existing prompt settings to use gemini-3.8-flash as the default

UPDATE public.chronicles_prompt_settings
SET ai_model_preference = 'gemini-3.8-flash'
WHERE ai_model_preference = 'gemini-3.5-pro';

-- If no rows were updated (settings don't exist yet), insert with the new default
INSERT INTO public.chronicles_prompt_settings (
  ai_auto_generation_enabled,
  ai_generation_frequency,
  ai_generation_schedule_time,
  ai_model_preference,
  allow_admin_edit_ai_prompts,
  default_challenge_type,
  default_evaluation_criteria,
  max_active_challenges,
  auto_end_challenges,
  auto_announce_winners,
  winner_announcement_delay_hours
)
SELECT
  false,
  'daily',
  '00:00:00',
  'gemini-3.8-flash',
  true,
  'daily',
  '{"integrity": 30, "sincerity": 30, "passion": 20, "engagement": 20}',
  3,
  true,
  true,
  24
WHERE NOT EXISTS (
  SELECT 1 FROM public.chronicles_prompt_settings
);
