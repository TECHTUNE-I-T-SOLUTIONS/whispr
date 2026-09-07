-- Books Feature Migration
-- Adds tables for e-book publishing, purchasing, and reading

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Main books table
CREATE TABLE IF NOT EXISTS books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  subtitle TEXT,
  description TEXT,
  cover_image_url TEXT,
  cover_image_path TEXT,
  author_type VARCHAR(20) NOT NULL CHECK (author_type IN ('admin', 'creator')),
  admin_id UUID REFERENCES admins(id) ON DELETE CASCADE,
  creator_id UUID REFERENCES chronicles_creators(id) ON DELETE CASCADE,
  isbn VARCHAR(20),
  asin VARCHAR(20), -- Amazon Standard Identification Number
  language VARCHAR(10) DEFAULT 'en',
  genre TEXT[],
  tags TEXT[],
  total_chapters INTEGER DEFAULT 0,
  total_words INTEGER DEFAULT 0,
  reading_time_minutes INTEGER,
  price DECIMAL(10, 2) DEFAULT 0.00 CHECK (price >= 0),
  currency VARCHAR(3) DEFAULT 'USD',
  is_free BOOLEAN DEFAULT true,
  free_sample_percentage INTEGER DEFAULT 20 CHECK (free_sample_percentage >= 0 AND free_sample_percentage <= 100),
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'unpublished', 'archived')),
  published_at TIMESTAMP WITH TIME ZONE,
  featured BOOLEAN DEFAULT false,
  trending_score INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  purchase_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  average_rating DECIMAL(3, 2) CHECK (average_rating >= 0 AND average_rating <= 5),
  rating_count INTEGER DEFAULT 0,
  article_id VARCHAR(20) UNIQUE, -- WHP-XXXXXXX for copyright tracking
  content_source VARCHAR(20) DEFAULT 'online' CHECK (content_source IN ('online', 'uploaded')),
  file_url TEXT, -- URL to uploaded book file (PDF/Word)
  file_path TEXT, -- Storage path for uploaded file
  file_type VARCHAR(20), -- 'pdf', 'docx', 'doc', 'txt'
  file_size_bytes BIGINT, -- Size of uploaded file
  extracted_text TEXT, -- Extracted text from uploaded file for search indexing
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT check_author_not_null CHECK (
    (author_type = 'admin' AND admin_id IS NOT NULL AND creator_id IS NULL) OR
    (author_type = 'creator' AND creator_id IS NOT NULL AND admin_id IS NULL)
  )
);

-- Indexes for books
CREATE INDEX idx_books_slug ON books(slug);
CREATE INDEX idx_books_status ON books(status);
CREATE INDEX idx_books_admin ON books(admin_id) WHERE admin_id IS NOT NULL;
CREATE INDEX idx_books_creator ON books(creator_id) WHERE creator_id IS NOT NULL;
CREATE INDEX idx_books_featured ON books(featured) WHERE featured = true;
CREATE INDEX idx_books_genre ON books USING GIN(genre);
CREATE INDEX idx_books_tags ON books USING GIN(tags);
CREATE INDEX idx_books_is_free ON books(is_free);
CREATE INDEX idx_books_published_at ON books(published_at DESC) WHERE status = 'published';

-- Book chapters table
CREATE TABLE IF NOT EXISTS book_chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL, -- Rich text content (HTML/Markdown)
  content_format VARCHAR(20) DEFAULT 'html' CHECK (content_format IN ('html', 'markdown', 'plain')),
  word_count INTEGER DEFAULT 0,
  reading_time_minutes INTEGER,
  is_locked BOOLEAN DEFAULT false,
  price DECIMAL(10, 2) DEFAULT 0.00 CHECK (price >= 0), -- Optional: individual chapter pricing
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(book_id, chapter_number)
);

-- Indexes for book_chapters
CREATE INDEX idx_book_chapters_book ON book_chapters(book_id);
CREATE INDEX idx_book_chapters_number ON book_chapters(book_id, chapter_number);
CREATE INDEX idx_book_chapters_locked ON book_chapters(is_locked);

-- Book purchases table
CREATE TABLE IF NOT EXISTS book_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email VARCHAR(255), -- For guest purchases
  purchase_amount DECIMAL(10, 2) NOT NULL CHECK (purchase_amount >= 0),
  currency VARCHAR(3) DEFAULT 'USD',
  payment_method VARCHAR(50), -- 'stripe', 'paypal', etc.
  payment_id VARCHAR(255), -- Stripe/PayPal transaction ID
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded', 'partial_refund')),
  receipt_url TEXT,
  download_count INTEGER DEFAULT 0,
  max_downloads INTEGER DEFAULT 5,
  download_expiry TIMESTAMP WITH TIME ZONE,
  refunded_amount DECIMAL(10, 2) DEFAULT 0.00,
  refund_reason TEXT,
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT check_user_identifier CHECK (
    (user_id IS NOT NULL) OR (user_email IS NOT NULL)
  )
);

-- Indexes for book_purchases
CREATE INDEX idx_book_purchases_book ON book_purchases(book_id);
CREATE INDEX idx_book_purchases_user ON book_purchases(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_book_purchases_email ON book_purchases(user_email) WHERE user_email IS NOT NULL;
CREATE INDEX idx_book_purchases_status ON book_purchases(payment_status);
CREATE INDEX idx_book_purchases_payment_id ON book_purchases(payment_id);

-- Book reviews table
CREATE TABLE IF NOT EXISTS book_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name VARCHAR(255), -- For guest reviews
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  is_verified_purchase BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'flagged')),
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT check_reviewer_identifier CHECK (
    (user_id IS NOT NULL) OR (user_name IS NOT NULL)
  )
);

-- Indexes for book_reviews
CREATE INDEX idx_book_reviews_book ON book_reviews(book_id);
CREATE INDEX idx_book_reviews_user ON book_reviews(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_book_reviews_status ON book_reviews(status);
CREATE INDEX idx_book_reviews_rating ON book_reviews(rating);
CREATE INDEX idx_book_reviews_verified ON book_reviews(is_verified_purchase) WHERE is_verified_purchase = true;

-- Book reading progress table
CREATE TABLE IF NOT EXISTS book_reading_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id VARCHAR(255), -- For anonymous readers
  current_chapter_id UUID REFERENCES book_chapters(id) ON DELETE SET NULL,
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  last_read_position INTEGER, -- Character position in chapter
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_reading_time_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT check_reader_identifier CHECK (
    (user_id IS NOT NULL AND session_id IS NULL) OR
    (user_id IS NULL AND session_id IS NOT NULL)
  ),
  UNIQUE(book_id, user_id),
  UNIQUE(book_id, session_id)
);

-- Indexes for book_reading_progress
CREATE INDEX idx_book_progress_book ON book_reading_progress(book_id);
CREATE INDEX idx_book_progress_user ON book_reading_progress(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_book_progress_session ON book_reading_progress(session_id) WHERE session_id IS NOT NULL;

-- Book downloads table
CREATE TABLE IF NOT EXISTS book_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  purchase_id UUID REFERENCES book_purchases(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  download_format VARCHAR(20) NOT NULL CHECK (download_format IN ('pdf', 'epub', 'mobi')),
  file_url TEXT,
  file_size_bytes BIGINT,
  ip_address INET,
  user_agent TEXT,
  downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for book_downloads
CREATE INDEX idx_book_downloads_book ON book_downloads(book_id);
CREATE INDEX idx_book_downloads_purchase ON book_downloads(purchase_id) WHERE purchase_id IS NOT NULL;
CREATE INDEX idx_book_downloads_user ON book_downloads(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_book_downloads_format ON book_downloads(download_format);

-- Book wishlists table (for users to save books they want to read)
CREATE TABLE IF NOT EXISTS book_wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, book_id)
);

-- Indexes for book_wishlists
CREATE INDEX idx_book_wishlists_user ON book_wishlists(user_id);
CREATE INDEX idx_book_wishlists_book ON book_wishlists(book_id);

-- Book recommendations table (for curated collections)
CREATE TABLE IF NOT EXISTS book_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  collection_name VARCHAR(100) NOT NULL, -- 'featured', 'trending', 'new_releases', 'editors_pick'
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(book_id, collection_name)
);

-- Indexes for book_recommendations
CREATE INDEX idx_book_recommendations_collection ON book_recommendations(collection_name, display_order);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_recommendations ENABLE ROW LEVEL SECURITY;

-- Books RLS Policies
CREATE POLICY "Public can view published books"
  ON books FOR SELECT
  USING (status = 'published');

CREATE POLICY "Admins can view all books"
  ON books FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = auth.uid()
    )
  );

CREATE POLICY "Creators can view their own books"
  ON books FOR SELECT
  USING (
    author_type = 'creator' AND creator_id IN (
      SELECT id FROM chronicles_creators WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert books"
  ON books FOR INSERT
  WITH CHECK (
    author_type = 'admin' AND admin_id IN (
      SELECT id FROM admins WHERE id = auth.uid()
    )
  );

CREATE POLICY "Creators can insert their books"
  ON books FOR INSERT
  WITH CHECK (
    author_type = 'creator' AND creator_id IN (
      SELECT id FROM chronicles_creators WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update all books"
  ON books FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = auth.uid()
    )
  );

CREATE POLICY "Creators can update their books"
  ON books FOR UPDATE
  USING (
    author_type = 'creator' AND creator_id IN (
      SELECT id FROM chronicles_creators WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can delete books"
  ON books FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = auth.uid()
    )
  );

CREATE POLICY "Creators can delete their books"
  ON books FOR DELETE
  USING (
    author_type = 'creator' AND creator_id IN (
      SELECT id FROM chronicles_creators WHERE user_id = auth.uid()
    )
  );

-- Book Chapters RLS Policies
CREATE POLICY "Public can view chapters from published books"
  ON book_chapters FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM books
      WHERE books.id = book_chapters.book_id AND books.status = 'published'
    )
  );

CREATE POLICY "Book owners can view all their chapters"
  ON book_chapters FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM books
      WHERE books.id = book_chapters.book_id AND (
        (books.author_type = 'admin' AND books.admin_id IN (SELECT id FROM admins WHERE id = auth.uid())) OR
        (books.author_type = 'creator' AND books.creator_id IN (SELECT id FROM chronicles_creators WHERE user_id = auth.uid()))
      )
    )
  );

CREATE POLICY "Book owners can insert chapters"
  ON book_chapters FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM books
      WHERE books.id = book_chapters.book_id AND (
        (books.author_type = 'admin' AND books.admin_id IN (SELECT id FROM admins WHERE id = auth.uid())) OR
        (books.author_type = 'creator' AND books.creator_id IN (SELECT id FROM chronicles_creators WHERE user_id = auth.uid()))
      )
    )
  );

CREATE POLICY "Book owners can update chapters"
  ON book_chapters FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM books
      WHERE books.id = book_chapters.book_id AND (
        (books.author_type = 'admin' AND books.admin_id IN (SELECT id FROM admins WHERE id = auth.uid())) OR
        (books.author_type = 'creator' AND books.creator_id IN (SELECT id FROM chronicles_creators WHERE user_id = auth.uid()))
      )
    )
  );

CREATE POLICY "Book owners can delete chapters"
  ON book_chapters FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM books
      WHERE books.id = book_chapters.book_id AND (
        (books.author_type = 'admin' AND books.admin_id IN (SELECT id FROM admins WHERE id = auth.uid())) OR
        (books.author_type = 'creator' AND books.creator_id IN (SELECT id FROM chronicles_creators WHERE user_id = auth.uid()))
      )
    )
  );

-- Book Purchases RLS Policies
CREATE POLICY "Users can view their own purchases"
  ON book_purchases FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Service can insert purchases"
  ON book_purchases FOR INSERT
  WITH CHECK (true); -- Service role will handle this

CREATE POLICY "Users can update their own purchases"
  ON book_purchases FOR UPDATE
  USING (user_id = auth.uid());

-- Book Reviews RLS Policies
CREATE POLICY "Public can view approved reviews"
  ON book_reviews FOR SELECT
  USING (status = 'approved');

CREATE POLICY "Users can view their own reviews"
  ON book_reviews FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can insert reviews"
  ON book_reviews FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own reviews"
  ON book_reviews FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own reviews"
  ON book_reviews FOR DELETE
  USING (user_id = auth.uid());

-- Book Reading Progress RLS Policies
CREATE POLICY "Users can view their own progress"
  ON book_reading_progress FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own progress"
  ON book_reading_progress FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own progress"
  ON book_reading_progress FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own progress"
  ON book_reading_progress FOR DELETE
  USING (user_id = auth.uid());

-- Book Downloads RLS Policies
CREATE POLICY "Users can view their own downloads"
  ON book_downloads FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Service can insert downloads"
  ON book_downloads FOR INSERT
  WITH CHECK (true); -- Service role will handle this

-- Book Wishlists RLS Policies
CREATE POLICY "Users can view their own wishlist"
  ON book_wishlists FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert to their wishlist"
  ON book_wishlists FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete from their wishlist"
  ON book_wishlists FOR DELETE
  USING (user_id = auth.uid());

-- Book Recommendations RLS Policies
CREATE POLICY "Public can view recommendations"
  ON book_recommendations FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage recommendations"
  ON book_recommendations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = auth.uid()
    )
  );

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_books_updated_at BEFORE UPDATE ON books
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_book_chapters_updated_at BEFORE UPDATE ON book_chapters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_book_reviews_updated_at BEFORE UPDATE ON book_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_book_reading_progress_updated_at BEFORE UPDATE ON book_reading_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update book statistics
CREATE OR REPLACE FUNCTION update_book_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Update purchase count
    IF TG_TABLE_NAME = 'book_purchases' AND NEW.payment_status = 'completed' THEN
      UPDATE books SET purchase_count = purchase_count + 1 WHERE id = NEW.book_id;
    END IF;
    
    -- Update download count
    IF TG_TABLE_NAME = 'book_downloads' THEN
      UPDATE books SET download_count = download_count + 1 WHERE id = NEW.book_id;
    END IF;
    
    -- Update review count and average rating
    IF TG_TABLE_NAME = 'book_reviews' AND NEW.status = 'approved' THEN
      UPDATE books SET 
        rating_count = rating_count + 1,
        average_rating = (
          SELECT AVG(rating) 
          FROM book_reviews 
          WHERE book_id = NEW.book_id AND status = 'approved'
        )
      WHERE id = NEW.book_id;
    END IF;
  END IF;
  
  IF TG_OP = 'UPDATE' THEN
    -- Update review stats when status changes
    IF TG_TABLE_NAME = 'book_reviews' AND OLD.status != NEW.status THEN
      UPDATE books SET 
        rating_count = (
          SELECT COUNT(*) 
          FROM book_reviews 
          WHERE book_id = NEW.book_id AND status = 'approved'
        ),
        average_rating = (
          SELECT AVG(rating) 
          FROM book_reviews 
          WHERE book_id = NEW.book_id AND status = 'approved'
        )
      WHERE id = NEW.book_id;
    END IF;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    -- Update review stats when review is deleted
    IF TG_TABLE_NAME = 'book_reviews' AND OLD.status = 'approved' THEN
      UPDATE books SET 
        rating_count = rating_count - 1,
        average_rating = (
          SELECT AVG(rating) 
          FROM book_reviews 
          WHERE book_id = OLD.book_id AND status = 'approved'
        )
      WHERE id = OLD.book_id;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers for book statistics
CREATE TRIGGER update_book_stats_purchases AFTER INSERT ON book_purchases
  FOR EACH ROW EXECUTE FUNCTION update_book_stats();

CREATE TRIGGER update_book_stats_downloads AFTER INSERT ON book_downloads
  FOR EACH ROW EXECUTE FUNCTION update_book_stats();

CREATE TRIGGER update_book_stats_reviews AFTER INSERT OR UPDATE OR DELETE ON book_reviews
  FOR EACH ROW EXECUTE FUNCTION update_book_stats();

-- Function to generate article_id for books
CREATE OR REPLACE FUNCTION generate_book_article_id()
RETURNS TRIGGER AS $$
DECLARE
  new_article_id VARCHAR(20);
  max_num INTEGER;
BEGIN
  IF NEW.article_id IS NULL AND NEW.status = 'published' THEN
    SELECT COALESCE(MAX(CAST(SUBSTRING(article_id FROM 5) AS INTEGER)), 0) INTO max_num
    FROM books
    WHERE article_id LIKE 'WHP-%';
    
    new_article_id := 'WHP-' || LPAD((max_num + 1)::TEXT, 7, '0');
    NEW.article_id := new_article_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for article_id generation
CREATE TRIGGER generate_book_article_id_trigger
  BEFORE INSERT OR UPDATE ON books
  FOR EACH ROW
  WHEN (NEW.status = 'published' AND (NEW.article_id IS NULL OR OLD.status != 'published'))
  EXECUTE FUNCTION generate_book_article_id();
