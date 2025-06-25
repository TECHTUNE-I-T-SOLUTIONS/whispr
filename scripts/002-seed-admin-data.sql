-- Seed data for Whispr admin system
-- Default password is 'whispr123' (will be hashed in the application)

INSERT INTO admin (username, email, password_hash, full_name, bio) VALUES 
('prayce', 'prayce@whispr.com', '$2b$12$placeholder_hash_will_be_replaced', 'Prayce', 'An amazing writer and poet who finds beauty in life''s quiet moments and transforms whispers into words that resonate with the soul.');

-- Get the admin ID for reference
DO $$
DECLARE
    admin_uuid UUID;
BEGIN
    SELECT id INTO admin_uuid FROM admin WHERE username = 'prayce';
    
    -- Insert sample blog posts
    INSERT INTO posts (title, content, excerpt, type, admin_id, status, featured, reading_time, tags, slug) VALUES 
    ('The Art of Silent Expression', 'In a world filled with noise, sometimes the most profound messages come through whispers. This blog explores the beauty of subtle communication and how silence can speak volumes in our daily interactions and creative expressions.

When we think about communication, we often focus on the loudest voices, the most dramatic gestures, the boldest statements. But there''s something profoundly beautiful about the quiet moments—the gentle touch, the knowing glance, the whispered word that carries more weight than a shouted declaration.

In my writing journey, I''ve discovered that the most powerful stories often emerge from these silent spaces. The pause between words, the breath before the verse, the moment of stillness before the storm of creativity breaks loose.

Silent expression isn''t about being quiet for the sake of it. It''s about understanding that sometimes, less truly is more. It''s about recognizing that in our increasingly noisy world, the ability to communicate with subtlety and grace has become a rare and precious skill.

Whether through poetry, prose, or simply the way we move through the world, we all have the capacity for this kind of gentle, powerful expression. It''s about listening as much as speaking, observing as much as performing, and finding the profound in the seemingly simple.', 'Exploring the beauty of subtle communication in our noisy world and how silence can speak volumes in creative expression.', 'blog', admin_uuid, 'published', true, 5, ARRAY['writing', 'communication', 'philosophy'], 'art-of-silent-expression'),
    
    ('Digital Minimalism in Creative Writing', 'As writers in the digital age, we often find ourselves overwhelmed by the constant stream of information, notifications, and digital distractions. This post discusses how embracing digital minimalism can enhance our creative process and help us reconnect with the pure joy of writing.

The concept of digital minimalism isn''t about rejecting technology entirely—it''s about being intentional with how we use it. For writers, this means creating boundaries that protect our creative space and mental clarity.

I''ve found that some of my best writing happens when I disconnect from the digital world and reconnect with the analog tools of our craft. There''s something magical about pen on paper, the scratch of graphite, the flow of ink that can''t be replicated by the click of keys.

But digital minimalism for writers goes beyond just choosing analog tools. It''s about:

- Creating distraction-free writing environments
- Setting boundaries with social media and online research
- Using technology intentionally rather than habitually
- Protecting our creative time from digital interruptions
- Finding balance between online promotion and offline creation

The goal isn''t to become a digital hermit, but to use technology as a tool that serves our creativity rather than hindering it.', 'How digital minimalism can enhance your creative writing process and help you reconnect with the pure joy of writing.', 'blog', admin_uuid, 'published', false, 7, ARRAY['writing', 'productivity', 'minimalism'], 'digital-minimalism-creative-writing'),
    
    ('Finding Your Voice in Poetry', 'Every poet has a unique voice waiting to be discovered. This journey of self-discovery through verse is both challenging and rewarding, requiring patience, practice, and a willingness to be vulnerable with words.

Finding your poetic voice isn''t about copying other poets or following rigid rules. It''s about discovering what you have to say and how you want to say it. It''s about understanding your own rhythms, your own way of seeing the world, your own relationship with language.

The journey begins with reading—lots of reading. Expose yourself to different poets, different styles, different eras. Notice what resonates with you and what doesn''t. Pay attention to the poets who make you think, "I wish I had written that," and try to understand what it is about their work that speaks to you.

But reading is just the beginning. The real work happens when you start writing—regularly, consistently, without judgment. Your voice will emerge through practice, through experimentation, through the willingness to write badly in order to eventually write well.

Some practical steps for finding your voice:

- Write every day, even if it''s just a few lines
- Experiment with different forms and styles
- Write about what matters to you personally
- Don''t worry about what others will think
- Trust your instincts about language and rhythm
- Be patient with the process

Remember, finding your voice is not a destination but a journey. Your voice will continue to evolve as you grow as a person and as a poet.', 'A comprehensive guide to discovering your unique poetic voice through practice, experimentation, and authentic self-expression.', 'blog', admin_uuid, 'published', false, 6, ARRAY['poetry', 'writing', 'creativity'], 'finding-voice-poetry');
    
    -- Insert sample poems
    INSERT INTO posts (title, content, excerpt, type, admin_id, status, featured, reading_time, tags, slug) VALUES 
    ('Whispers in the Wind', E'Soft whispers carried by the breeze,\nSecrets shared among the trees,\nIn silence, truth finds its way,\nThrough the quiet of the day.\n\nNo need for words so loud and clear,\nWhen whispers reach the listening ear,\nIn gentle tones, the heart can hear\nWhat matters most, what we hold dear.\n\nThe wind becomes our messenger,\nCarrying hopes we dare not speak,\nIn rustling leaves and swaying grass,\nThe answers that we always seek.\n\nSo listen close when breezes blow,\nFor in their song, the wise ones know,\nThat whispers hold more power true\nThan any shout could ever do.', 'A gentle poem about the power of quiet communication and finding truth in life''s subtle moments.', 'poem', admin_uuid, 'published', true, 2, ARRAY['nature', 'communication', 'peace'], 'whispers-in-the-wind'),
    
    ('Digital Dreams', E'In screens of light we lose ourselves,\nLike books forgotten on dusty shelves,\nYet in this glow, new stories birth,\nConnecting souls across the earth.\n\nPixels dance with human thought,\nCreating worlds that can''t be bought,\nIn digital dreams, we find our way,\nTo tomorrow from today.\n\nBut sometimes in the endless scroll,\nWe lose touch with our very soul,\nThe real world calls with gentle voice,\nReminding us we have a choice.\n\nTo balance screen with sky above,\nTo blend our digital life with love,\nFor in the end, what matters most\nIs not the platform or the post,\n\nBut human hearts that beat as one,\nWhether under digital sun\nOr in the warmth of face-to-face,\nConnection transcends time and space.', 'Exploring our complex relationship with technology and the search for authentic connection in the digital age.', 'poem', admin_uuid, 'published', false, 2, ARRAY['technology', 'modern life', 'connection'], 'digital-dreams'),
    
    ('The Writer''s Dawn', E'Before the world awakens bright,\nIn the quiet hours of early light,\nThe writer sits with pen in hand,\nCreating worlds, both strange and grand.\n\nWords flow like rivers to the sea,\nSetting captive thoughts free,\nIn dawn''s embrace, the stories grow,\nFrom whispered dreams to vibrant show.\n\nThe coffee steams, the page awaits,\nAs morning slowly opens gates\nTo realms where anything can be,\nWhere imagination runs free.\n\nThis sacred time, this holy hour,\nWhen creativity holds power,\nBefore the day''s demands take hold,\nNew stories wait to be told.\n\nSo here I sit in morning''s grace,\nWith words that time cannot erase,\nBuilding bridges, line by line,\nBetween your heart and mine.', 'A tribute to the sacred early morning writing ritual and the magic of creative solitude.', 'poem', admin_uuid, 'published', false, 3, ARRAY['writing', 'creativity', 'morning'], 'writers-dawn');

    -- Update published_at for published posts
    UPDATE posts SET published_at = created_at WHERE status = 'published';
END $$;
