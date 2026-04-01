const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function insertComments() {
  try {
    // First check how many comments exist for this post
    const { data: existingComments, error: checkError } = await supabase
      .from('chronicles_comments')
      .select('*')
      .eq('post_id', 'f8966533-7fa4-4b45-9f46-b49af86c21f6');

    if (checkError) {
      console.error('Error checking existing comments:', checkError);
      return;
    }

    console.log(`Existing comments for post: ${existingComments?.length || 0}`);
    if (existingComments && existingComments.length > 0) {
      console.log('Comments already exist:', existingComments);
      return;
    }

    // Insert the comments
    const { data, error } = await supabase
      .from('chronicles_comments')
      .insert([
        {
          id: '21d5b494-95a0-4c5f-be6f-12411ae69d91',
          post_id: 'f8966533-7fa4-4b45-9f46-b49af86c21f6',
          creator_id: '7c6c58dc-de3c-4faf-afe3-517749efa5cc',
          content: 'nice',
          parent_comment_id: null,
          likes_count: 0,
          replies_count: 0,
          status: 'approved',
          created_at: '2026-04-01 17:46:53.6277+00',
          updated_at: '2026-04-01 17:46:53.6277+00'
        },
        {
          id: '49e88c93-60c0-4c3d-aa63-9102f1362cc4',
          post_id: 'f8966533-7fa4-4b45-9f46-b49af86c21f6',
          creator_id: '7c6c58dc-de3c-4faf-afe3-517749efa5cc',
          content: 'nicee',
          parent_comment_id: null,
          likes_count: 0,
          replies_count: 0,
          status: 'approved',
          created_at: '2026-04-01 17:37:31.848162+00',
          updated_at: '2026-04-01 17:37:31.848162+00'
        }
      ])
      .select();

    if (error) {
      console.error('Error inserting comments:', error);
      return;
    }

    console.log('Comments inserted successfully:', data);

    // Verify they were inserted
    const { data: verifyComments, error: verifyError } = await supabase
      .from('chronicles_comments')
      .select('*')
      .eq('post_id', 'f8966533-7fa4-4b45-9f46-b49af86c21f6');

    console.log(`Verification - Total comments now: ${verifyComments?.length || 0}`);
    console.log('Verified comments:', verifyComments);
  } catch (error) {
    console.error('Script error:', error);
  }
}

insertComments();
