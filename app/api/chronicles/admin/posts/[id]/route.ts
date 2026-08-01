import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createSupabaseServer();
    const { id: postId } = await params;

    console.log('GET request for post:', postId);

    // Try to fetch from chronicles_posts first
    let { data: post, error: postError } = await supabase
      .from('chronicles_posts')
      .select(`
        *,
        chronicles_creators (
          id,
          pen_name,
          email,
          profile_image_url
        )
      `)
      .eq('id', postId)
      .single();

    let postType = 'chronicles';
    console.log('chronicles_posts query result:', { post: !!post, error: !!postError, errorMessage: postError?.message });

    // If not found, try chain_entry_posts
    if (postError || !post) {
      ({ data: post, error: postError } = await supabase
        .from('chronicles_chain_entry_posts')
        .select(`
          *,
          chronicles_creators (
            id,
            pen_name,
            email,
            profile_image_url
          )
        `)
        .eq('id', postId)
        .single());
      
      if (post && !postError) {
        postType = 'chain';
      }
      console.log('chain_entry_posts query result:', { post: !!post, error: !!postError, errorMessage: postError?.message });
    }

    // If still not found, try stories
    if (postError || !post) {
      ({ data: post, error: postError } = await supabase
        .from('chronicles_stories')
        .select(`
          *,
          chronicles_creators (
            id,
            pen_name,
            email,
            profile_image_url
          )
        `)
        .eq('id', postId)
        .single());
      
      if (post && !postError) {
        postType = 'story';
      }
      console.log('chronicles_stories query result:', { post: !!post, error: !!postError, errorMessage: postError?.message });
    }

    if (postError || !post) {
      console.error('Post not found in any table:', postId, 'last error:', postError);
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Extract creator name from nested object
    const creatorName = post.chronicles_creators?.pen_name || 'Unknown';
    
    // Remove the nested object and add flat field
    const { chronicles_creators, ...postWithoutNested } = post;
    
    // Add the flat creator_name field and explicitly set post_type
    // Note: post_type is not a database column, it's determined by which table the post came from
    const flattenedPost = {
      ...postWithoutNested,
      creator_name: creatorName,
      post_type: postType, // Use the postType variable we determined earlier
    };

    // Fetch chapters if it's a story
    let chapters: any[] = [];
    if (postType === 'story') {
      // console.log('Fetching chapters for story:', postId);
      const { data: chaptersData, error: chaptersError } = await supabase
        .from('chronicles_story_chapters')
        .select('*')
        .eq('story_id', postId)
        .order('sequence', { ascending: true });
      
      // console.log('Chapters fetched:', chaptersData?.length || 0, chaptersError);
      chapters = chaptersData || [];
    }

    if (postError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Fetch comments based on post type
    let comments: any[] = [];
    if (postType === 'chronicles') {
      const { data } = await supabase
        .from('chronicles_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: false })
        .limit(50);
      comments = data || [];
    } else if (postType === 'chain') {
      const { data } = await supabase
        .from('chronicles_chain_entry_post_comments')
        .select('*')
        .eq('chain_entry_post_id', postId)
        .order('created_at', { ascending: false })
        .limit(50);
      comments = data || [];
    } else if (postType === 'story') {
      // console.log('Fetching comments for story:', postId);
      const { data, error: commentsError } = await supabase
        .from('chronicles_story_comments')
        .select('*')
        .eq('story_id', postId)
        .order('created_at', { ascending: false })
        .limit(50);
      // console.log('Story comments fetched:', data?.length || 0, commentsError);
      comments = data || [];
    }

    // Fetch reactions based on post type
    let reactions: any[] = [];
    if (postType === 'chronicles') {
      const { data } = await supabase
        .from('chronicles_post_reactions')
        .select('*')
        .eq('post_id', postId)
        .limit(50);
      reactions = data || [];
    } else if (postType === 'chain') {
      const { data } = await supabase
        .from('chronicles_chain_entry_post_likes')
        .select('*')
        .eq('chain_entry_post_id', postId)
        .limit(50);
      reactions = data || [];
    } else if (postType === 'story') {
      // console.log('Fetching reactions for story:', postId);
      const { data, error: reactionsError } = await supabase
        .from('chronicles_story_likes')
        .select('*')
        .eq('story_id', postId)
        .limit(50);
      // console.log('Story reactions fetched:', data?.length || 0, reactionsError);
      reactions = data || [];
    }

    // Fetch flag info - check both post_id and chain_entry_post_id
    const { data: flags } = await supabase
      .from('chronicles_flagged_reviews')
      .select('*')
      .or(`post_id.eq.${postId},chain_entry_post_id.eq.${postId}`)
      .order('created_at', { ascending: false });

    // console.log('Returning story data:', {
    //   postType,
    //   hasPost: !!flattenedPost,
    //   hasDescription: !!flattenedPost?.description,
    //   descriptionLength: flattenedPost?.description?.length || 0,
    //   creatorName: flattenedPost?.creator_name,
    //   chaptersCount: chapters.length,
    //   commentsCount: comments.length,
    //   reactionsCount: reactions.length,
    // });

    return NextResponse.json({
      post: flattenedPost,
      postType,
      chapters: chapters || [],
      comments: comments || [],
      reactions: reactions || [],
      flags: flags || [],
    });
  } catch (error) {
    console.error('Error fetching post:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createSupabaseServer();
    const { id: postId } = await params;

    // Try to delete from all tables
    const { error: deleteError1 } = await supabase
      .from('chronicles_posts')
      .delete()
      .eq('id', postId);

    const { error: deleteError2 } = await supabase
      .from('chronicles_chain_entry_posts')
      .delete()
      .eq('id', postId);

    const { error: deleteError3 } = await supabase
      .from('chronicles_stories')
      .delete()
      .eq('id', postId);

    if (deleteError1 && deleteError2 && deleteError3) {
      console.error('Error deleting post:', deleteError1, deleteError2, deleteError3);
      return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createSupabaseServer();
    const { id: postId } = await params;
    const body = await request.json();
    const { status, featured, category, tags, title, content, description } = body;

    console.log('PATCH request for post:', postId, 'body:', body);

    // Try to update in chronicles_posts first
    let updates: any = {};
    if (status) updates.status = status;
    if (featured !== undefined) updates.featured = featured;
    if (category !== undefined) updates.category = category;
    if (tags !== undefined) updates.tags = tags;
    if (title) updates.title = title;
    if (content) updates.content = content;

    const { data: post, error: updateError } = await supabase
      .from('chronicles_posts')
      .update(updates)
      .eq('id', postId)
      .select()
      .single();

    console.log('chronicles_posts update result:', { post: !!post, error: !!updateError });

    if (!updateError && post) {
      console.log('Updated in chronicles_posts');
      return NextResponse.json({ post, postType: 'chronicles' });
    }

    // Try chain_entry_posts
    const { data: chainPost, error: chainError } = await supabase
      .from('chronicles_chain_entry_posts')
      .update(updates)
      .eq('id', postId)
      .select()
      .single();

    console.log('chain_entry_posts update result:', { chainPost: !!chainPost, error: !!chainError });

    if (!chainError && chainPost) {
      console.log('Updated in chain_entry_posts');
      return NextResponse.json({ post: chainPost, postType: 'chain' });
    }

    // Try stories - use description field for stories
    const storyUpdates: any = {};
    if (status) storyUpdates.status = status;
    if (category !== undefined) storyUpdates.category = category;
    if (tags !== undefined) storyUpdates.tags = tags;
    if (title) storyUpdates.title = title;
    
    // For stories, both 'content' and 'description' from frontend map to the 'description' field
    const storyContent = description || content;
    if (storyContent) {
      storyUpdates.description = storyContent;
      console.log('Setting story description, length:', storyContent.length);
    }

    console.log('Updating story with updates:', Object.keys(storyUpdates));

    const { data: story, error: storyError } = await supabase
      .from('chronicles_stories')
      .update(storyUpdates)
      .eq('id', postId)
      .select()
      .single();

    console.log('stories update result:', { story: !!story, error: !!storyError, errorDetails: storyError });

    if (storyError) {
      console.error('Failed to update story:', storyError);
      console.error('Error details:', JSON.stringify(storyError, null, 2));
      return NextResponse.json({ 
        error: 'Failed to update post', 
        details: storyError.message || storyError 
      }, { status: 500 });
    }

    if (!story) {
      console.error('No story returned after update - post may not exist');
      return NextResponse.json({ error: 'Failed to update post - no data returned' }, { status: 500 });
    }

    console.log('Story updated successfully:', story.id, 'description length:', story.description?.length);
    return NextResponse.json({ post: story, postType: 'story' });
  } catch (error) {
    console.error('Error in PATCH:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
