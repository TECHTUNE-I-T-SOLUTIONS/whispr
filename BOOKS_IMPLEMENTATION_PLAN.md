# Whispr Books Feature - Comprehensive Implementation Plan

## Overview
Add a premium e-book publishing platform allowing creators and admins to publish, sell, and distribute e-books with rich formatting, chapter-level access control, and multi-format downloads.

---

## Database Schema
✅ **Completed** - See `supabase/migrations/20240907_add_books_tables.sql`

### Tables Created:
- `books` - Main book metadata
- `book_chapters` - Individual chapters with rich content
- `book_purchases` - Purchase tracking
- `book_reviews` - Reviews and ratings
- `book_reading_progress` - Reading position tracking
- `book_downloads` - Download history
- `book_wishlists` - User wishlists
- `book_recommendations` - Curated collections

---

## ISBN Strategy

### Current Situation
Whispr is not officially licensed with ISBN agencies (Bowker in US, Nielsen in UK, etc.)

### Recommended Approach: Skip ISBN for Now

**Why skip ISBN:**
- ISBNs cost money ($125-295 per ISBN in US)
- Requires official publisher registration
- Not needed for digital distribution on your own platform
- Can be added later if expanding to retail stores

**Alternative Identification:**
- Use internal `article_id` (WHP-XXXXXXX) for copyright tracking
- Use ASIN (Amazon Standard Identification Number) only if publishing to Amazon KDP
- Use DOI (Digital Object Identifier) for academic works (optional, paid service)

**Future ISBN Options:**
1. **Self-Publishing Services** - Some aggregators provide ISBNs:
   - Draft2Digital (free ISBN for their distribution)
   - Smashwords (free ISBN for their store)
   - Lulu (free ISBN with their publishing package)

2. **Official ISBN Agencies** (if needed later):
   - US: Bowker (myidentifiers.com)
   - UK: Nielsen ISBN Agency
   - Canada: Library and Archives Canada (free for Canadian publishers)

**Recommendation:** Start without ISBN, use internal article_id for tracking. Add ISBN later if expanding to retail distribution.

---

## Book Content Creation Methods

We support two ways for authors to create books:

### Option 1: Write Online with Rich Text Editor
**Recommended Solution: Tiptap**

**Why Tiptap:**
- Headless editor framework (build custom UI)
- Excellent Markdown support
- Real-time collaboration ready
- Extensible with custom nodes
- Great mobile support
- TypeScript support

### Option 2: Upload Existing PDF/Word Files
**For authors who already have their books ready**

**Supported Formats:**
- PDF (.pdf)
- Microsoft Word (.doc, .docx)
- Plain text (.txt)

**How it works:**
1. Author uploads their existing book file
2. System extracts text content for search indexing
3. Author adds introduction pages (using rich text editor)
4. Author adds book metadata (title, description, cover, etc.)
5. File is stored securely and served for downloads
6. Readers can download the original file (free or paid)

**Implementation:**
- File upload to Supabase Storage (`book-files` bucket)
- PDF text extraction using `pdf-parse` or `pdfjs-dist`
- Word document parsing using `mammoth` (for .docx) or `textract`
- File size limits (max 50MB per file)
- Virus scanning on upload
- File validation and format checking

**Dependencies:**
```bash
npm install pdf-parse mammoth
npm install @types/pdf-parse
```

---

## Rich Text Editor for Chapter Content

### Recommended Solution: Tiptap (We already have it, we'll just re-use it.)

**Why Tiptap:**
- Headless editor framework (build custom UI)
- Excellent Markdown support
- Real-time collaboration ready
- Extensible with custom nodes
- Great mobile support
- TypeScript support

### Implementation Plan

#### 1. Install Dependencies
```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-placeholder
npm install @tiptap/extension-image @tiptap/extension-link
npm install @tiptap/extension-table @tiptap/extension-table-row
npm install @tiptap/extension-text-align @tiptap/extension-text-style
npm install @tiptap/extension-color @tiptap/extension-highlight
npm install @tiptap/extension-underline @tiptap/extension-subscript
npm install @tiptap/extension-superscript
```

#### 2. Create Editor Component
**File:** `components/book-editor/book-chapter-editor.tsx`

Features:
- Bold, Italic, Underline, Strikethrough
- Headings (H1-H6)
- Lists (ordered, unordered, bullet)
- Blockquotes
- Code blocks with syntax highlighting
- Images with drag-and-drop upload
- Links with validation
- Tables
- Text alignment (left, center, right, justify)
- Text color and highlighting
- Undo/Redo
- Word count
- Auto-save to draft
- Markdown import/export

#### 3. Storage Format
- Store content as HTML in database
- Convert to Markdown for editing
- Convert to HTML for display
- Convert to plain text for search indexing

#### 4. Image Upload
- Upload to Supabase Storage (`book-covers` and `book-images` buckets)
- Generate optimized thumbnails
- Store URLs in content
- Support drag-and-drop and paste

#### 5. Alternative: Quill (Simpler Option)
If Tiptap is too complex, Quill is a good alternative:
```bash
npm install react-quill quill
```
- Simpler API
- Good default UI
- Less customization needed
- Smaller bundle size

---

## PDF/EPUB Generation with Formatting Preservation

### PDF Generation

#### Option 1: Puppeteer (Recommended)
```bash
npm install puppeteer @types/puppeteer
```

**Pros:**
- Perfect HTML-to-PDF rendering
- Preserves all formatting
- Supports CSS print media queries
- Can generate table of contents
- Handles page breaks well

**Cons:**
- Heavy dependency (~300MB)
- Requires server-side execution

**Implementation:**
```typescript
// lib/services/pdf-generator.service.ts
import puppeteer from 'puppeteer';

export async function generateBookPDF(bookId: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Fetch book content with chapters
  const book = await getBookWithChapters(bookId);
  
  // Generate HTML with print-optimized CSS
  const html = generateBookHTML(book);
  
  await page.setContent(html, { waitUntil: 'networkidle0' });
  
  const pdf = await page.pdf({
    format: 'A5',
    printBackground: true,
    margin: {
      top: '20mm',
      right: '15mm',
      bottom: '20mm',
      left: '15mm'
    },
    displayHeaderFooter: true,
    headerTemplate: `
      <div style="font-size: 10px; color: #666; text-align: center; width: 100%;">
        ${book.title} - <span class="pageNumber"></span>
      </div>
    `,
    footerTemplate: `
      <div style="font-size: 10px; color: #666; text-align: center; width: 100%;">
        © ${new Date().getFullYear()} ${book.author} | Whispr
      </div>
    `
  });
  
  await browser.close();
  return pdf;
}
```

#### Option 2: jsPDF (Lighter Alternative)
```bash
npm install jspdf html2canvas
```

**Pros:**
- Smaller dependency
- Client-side generation possible
- Good for simple documents

**Cons:**
- Limited formatting support
- Poor table support
- Page break issues

#### Option 3: PDFKit (Programmatic)
```bash
npm install pdfkit
```

**Pros:**
- Full programmatic control
- Great for custom layouts
- Lightweight

**Cons:**
- Must manually position everything
- No HTML-to-PDF conversion
- Steep learning curve

**Recommendation:** Use Puppeteer for production quality PDFs.

---

### EPUB Generation

#### Recommended: epub-gen
```bash
npm install epub-gen
```

**Implementation:**
```typescript
// lib/services/epub-generator.service.ts
import { Epub } from 'epub-gen';

export async function generateBookEPUB(bookId: string): Promise<Buffer> {
  const book = await getBookWithChapters(bookId);
  
  const content = book.chapters.map(chapter => ({
    title: chapter.title,
    data: chapter.content, // HTML content
    filename: `chapter-${chapter.chapter_number}.xhtml`
  }));
  
  const option = {
    title: book.title,
    author: book.author,
    publisher: 'Whispr',
    cover: book.cover_image_url,
    content: content,
    tocTitle: 'Table of Contents',
    version: 3
  };
  
  return await Epub(option);
}
```

**Alternative: epub-creator-js**
```bash
npm install epub-creator-js
```

---

### Formatting Preservation Strategy

#### 1. CSS Print Styles
Create `styles/book-print.css`:
```css
@media print {
  @page {
    size: A5;
    margin: 20mm 15mm;
  }
  
  body {
    font-family: 'Georgia', serif;
    font-size: 11pt;
    line-height: 1.6;
    color: #333;
  }
  
  h1 { font-size: 18pt; page-break-before: always; }
  h2 { font-size: 14pt; margin-top: 12pt; }
  h3 { font-size: 12pt; margin-top: 10pt; }
  
  p { margin-bottom: 12pt; text-align: justify; }
  
  img { max-width: 100%; height: auto; page-break-inside: avoid; }
  
  table { width: 100%; border-collapse: collapse; page-break-inside: avoid; }
  
  blockquote {
    border-left: 3px solid #ccc;
    margin-left: 20px;
    padding-left: 15px;
    font-style: italic;
  }
  
  code {
    font-family: 'Courier New', monospace;
    background: #f5f5f5;
    padding: 2px 5px;
  }
  
  pre {
    background: #f5f5f5;
    padding: 10px;
    border-radius: 4px;
    white-space: pre-wrap;
    word-wrap: break-word;
  }
  
  .chapter-break {
    page-break-before: always;
    height: 0;
  }
}
```

#### 2. HTML Template for Books
```typescript
function generateBookHTML(book: BookWithChapters): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${book.title}</title>
  <link rel="stylesheet" href="/styles/book-print.css">
</head>
<body>
  <div class="book-cover">
    <img src="${book.cover_image_url}" alt="${book.title}">
  </div>
  
  <div class="title-page">
    <h1>${book.title}</h1>
    ${book.subtitle ? `<h2>${book.subtitle}</h2>` : ''}
    <p class="author">By ${book.author}</p>
    <p class="publisher">Whispr Publishing</p>
    <p class="year">${new Date().getFullYear()}</p>
  </div>
  
  <div class="table-of-contents">
    <h1>Table of Contents</h1>
    ${book.chapters.map(ch => `
      <div class="toc-item">
        <span class="toc-title">${ch.title}</span>
        <span class="toc-page">${ch.chapter_number}</span>
      </div>
    `).join('')}
  </div>
  
  ${book.chapters.map(ch => `
    <div class="chapter" id="chapter-${ch.chapter_number}">
      <div class="chapter-break"></div>
      <h1>Chapter ${ch.chapter_number}: ${ch.title}</h1>
      <div class="chapter-content">
        ${ch.content}
      </div>
    </div>
  `).join('')}
  
  <div class="book-end">
    <div class="chapter-break"></div>
    <h1>About the Author</h1>
    <p>${book.author_bio || 'Author bio coming soon.'}</p>
    
    <h1>Copyright</h1>
    <p>© ${new Date().getFullYear()} ${book.author}. All rights reserved.</p>
    <p>Published by Whispr. Article ID: ${book.article_id}</p>
  </div>
</body>
</html>
  `;
}
```

#### 3. MOBI Generation (Optional)
MOBI is Amazon's format. For Kindle:
- Generate EPUB first
- Use Kindle Previewer or online converter
- Or use `epub-to-mobi` package

---

## Content Collaboration Platforms

### Potential Partnerships

#### 1. Goodreads
**Integration Type:** API-based
**What's Possible:**
- Import book metadata (title, author, ISBN)
- Display Goodreads ratings
- Link to Goodreads reviews
- "Read on Whispr" badges

**API Access:**
- Goodreads API (limited, requires approval)
- Alternative: Open Library API (free, open source)

**Implementation:**
```typescript
// lib/services/goodreads.service.ts
export async function getBookInfo(isbn: string) {
  // Use Open Library API as alternative
  const response = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`);
  const data = await response.json();
  return data[`ISBN:${isbn}`];
}
```

#### 2. Wattpad
**Integration Type:** Content syndication
**What's Possible:**
- Feature popular Wattpad stories
- Cross-promotion opportunities
- Author migration program

**Approach:**
- Contact Wattpad for partnership
- Offer revenue sharing
- Provide better reading experience

#### 3. Medium
**Integration Type:** Cross-publishing
**What's Possible:**
- Import Medium articles as chapters
- Export Whispr books to Medium series
- Author cross-platform presence

#### 4. Archive.org (Open Library)
**Integration Type:** Open data integration
**What's Possible:**
- Free book metadata
- ISBN lookup
- Author information
- Cover images

**Implementation:**
```typescript
// lib/services/openlibrary.service.ts
export async function searchOpenLibrary(query: string) {
  const response = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}`);
  return await response.json();
}
```

#### 5. Project Gutenberg
**Integration Type:** Public domain content
**What's Possible:**
- Feature classic literature
- Free content library
- Educational collections

**Note:** Only public domain works (pre-1929 in US)

#### 6. StoryGraph
**Integration Type:** Discovery platform
**What's Possible:**
- Book recommendations
- Reading analytics
- Community features

#### 7. Libby/OverDrive
**Integration Type:** Library distribution
**What's Possible:**
- Library lending integration
- Institutional sales
- Educational partnerships

**Note:** Requires publisher agreements

### Implementation Strategy

#### Phase 1: Open Data Integration (Immediate)
- Integrate Open Library API for metadata
- Add ISBN/ASIN lookup
- Display external ratings
- Link to external platforms

#### Phase 2: Content Syndication (Partnership)
- Reach out to Wattpad for partnership
- Create author migration tools
- Cross-platform publishing options

#### Phase 3: API Development (Long-term)
- Build public API for book data
- Allow other platforms to integrate
- Create affiliate program

#### Phase 4: Library Distribution (Enterprise)
- Partner with library systems
- Educational institution sales
- Corporate licensing

### Recommended Starting Point
**Open Library Integration:**
- Free, no API key needed
- Rich metadata
- Cover images
- Author information
- Easy to implement

---

## API Routes Implementation

### Core Endpoints

#### Book Management
```
GET    /api/books                    - List books (with filters)
GET    /api/books/[slug]             - Get book details
POST   /api/books                    - Create book
PUT    /api/books/[id]               - Update book
DELETE /api/books/[id]               - Delete book
POST   /api/books/[id]/publish       - Publish book
POST   /api/books/[id]/upload-cover  - Upload cover image
POST   /api/books/[id]/upload-file   - Upload book file (PDF/Word)
GET    /api/books/[id]/file          - Get book file download URL
```

#### Chapter Management
```
GET    /api/books/[id]/chapters              - List chapters
GET    /api/books/[id]/chapters/[number]     - Get specific chapter
POST   /api/books/[id]/chapters              - Create chapter
PUT    /api/books/[id]/chapters/[chapterId]  - Update chapter
DELETE /api/books/[id]/chapters/[chapterId]  - Delete chapter
POST   /api/books/[id]/chapters/reorder      - Reorder chapters
```

#### Reading & Access
```
GET    /api/books/[id]/read              - Start reading
GET    /api/books/[id]/progress          - Get reading progress
POST   /api/books/[id]/progress          - Update reading progress
GET    /api/books/[id]/toc               - Get table of contents
```

#### Purchases & Downloads
```
POST   /api/books/[id]/purchase          - Purchase book
GET    /api/books/[id]/purchase-status   - Check purchase status
POST   /api/books/[id]/download          - Download book
GET    /api/books/[id]/download/[format]  - Get download link
```

#### Reviews & Ratings
```
GET    /api/books/[id]/reviews           - Get reviews
POST   /api/books/[id]/reviews           - Submit review
PUT    /api/books/[id]/reviews/[id]      - Update review
DELETE /api/books/[id]/reviews/[id]      - Delete review
POST   /api/books/[id]/reviews/[id]/helpful - Mark as helpful
```

#### Wishlists
```
GET    /api/books/wishlist               - Get user wishlist
POST   /api/books/[id]/wishlist          - Add to wishlist
DELETE /api/books/[id]/wishlist          - Remove from wishlist
```

#### Recommendations
```
GET    /api/books/recommendations/featured     - Featured books
GET    /api/books/recommendations/trending     - Trending books
GET    /api/books/recommendations/new-releases - New releases
GET    /api/books/recommendations/similar/[id]  - Similar books
```

---

## Service Layer Structure

```
lib/services/
├── books.service.ts                    # Book CRUD operations
├── book-chapters.service.ts            # Chapter management
├── book-purchases.service.ts           # Purchase handling
├── book-reviews.service.ts             # Review management
├── book-reader.service.ts              # Reading progress
├── pdf-generator.service.ts            # PDF generation
├── epub-generator.service.ts           # EPUB generation
├── book-cover.service.ts               # Cover upload/management
├── book-file.service.ts                # Book file upload/management (PDF/Word)
├── file-parser.service.ts              # PDF/Word text extraction
├── goodreads.service.ts                # Goodreads integration
├── openlibrary.service.ts              # Open Library integration
└── book-recommendations.service.ts     # Recommendation engine
```

---

## UI Pages Structure

```
app/
├── books/
│   ├── page.tsx                        # Books listing page
│   ├── [slug]/
│   │   ├── page.tsx                    # Book detail page
│   │   ├── read/
│   │   │   └── page.tsx                # Book reader interface
│   │   ├── chapters/
│   │   │   └── [number]/
│   │   │       └── page.tsx            # Chapter view
│   │   ├── purchase/
│   │   │   └── page.tsx                # Purchase flow
│   │   └── reviews/
│   │       └── page.tsx                # Reviews page
│   ├── wishlist/
│   │   └── page.tsx                    # User wishlist
│   └── search/
│       └── page.tsx                    # Book search
├── admin/
│   └── books/
│       ├── page.tsx                    # Admin book management
│       ├── [id]/
│       │   ├── edit/
│       │   │   └── page.tsx            # Edit book
│       │   ├── chapters/
│       │   │   └── page.tsx            # Manage chapters
│       │   └── analytics/
│       │       └── page.tsx            # Book analytics
│       └── new/
│           └── page.tsx                # Create new book
└── chronicles/
    └── books/
        └── (same structure as admin/books for creators)
```

---

## Payment Integration

### Stripe Implementation

#### Setup
```bash
npm install stripe @stripe/stripe-js
```

#### Environment Variables
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### Implementation
```typescript
// lib/services/stripe.service.ts
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function createCheckoutSession(bookId: string, userId: string) {
  const book = await getBookById(bookId);
  
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: book.currency,
        product_data: {
          name: book.title,
          images: [book.cover_image_url],
          metadata: {
            book_id: bookId,
            article_id: book.article_id
          }
        },
        unit_amount: Math.round(book.price * 100)
      },
      quantity: 1
    }],
    mode: 'payment',
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/books/${book.slug}/purchase/success`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/books/${book.slug}/purchase/cancel`,
    customer_email: userEmail,
    metadata: {
      book_id: bookId,
      user_id: userId
    }
  });
  
  return session;
}
```

#### Webhook Handler
```typescript
// app/api/stripe/webhook/route.ts
export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature');
  const body = await req.text();
  
  const event = stripe.webhooks.constructEvent(
    body,
    sig!,
    process.env.STRIPE_WEBHOOK_SECRET!
  );
  
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    await createBookPurchase(session);
  }
  
  return Response.json({ received: true });
}
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [x] Database schema design
- [x] SQL migration file
- [ ] Service layer structure
- [ ] Basic API routes
- [ ] Book listing page
- [ ] Book detail page

### Phase 2: Content Management (Week 3-4)
- [ ] Rich text editor integration
- [ ] Chapter management
- [ ] Cover upload system
- [ ] Draft/publish workflow
- [ ] Admin book management UI
- [ ] Creator book management UI

### Phase 3: Reading Experience (Week 5-6)
- [ ] Book reader interface
- [ ] Reading progress tracking
- [ ] Free sample logic
- [ ] Chapter locking
- [ ] Table of contents
- [ ] Bookmarks

### Phase 4: Monetization (Week 7-8)
- [ ] Stripe integration
- [ ] Purchase flow
- [ ] Download generation (PDF/EPUB)
- [ ] Purchase verification
- [ ] Download limits
- [ ] Receipt generation

### Phase 5: Social Features (Week 9-10)
- [ ] Reviews and ratings
- [ ] Wishlists
- [ ] Recommendations
- [ ] Social sharing
- [ ] Author profiles
- [ ] Book collections

### Phase 6: External Integration (Week 11-12)
- [ ] Open Library integration
- [ ] ISBN/ASIN lookup
- [ ] External ratings display
- [ ] Cross-platform links
- [ ] API documentation
- [ ] Partnership outreach

### Phase 7: Analytics & Optimization (Week 13-14)
- [ ] Reading analytics
- [ ] Sales analytics
- [ ] Performance optimization
- [ ] SEO optimization
- [ ] A/B testing
- [ ] User feedback collection

---

## Technical Considerations

### Performance
- Implement caching for book listings
- Use CDN for cover images
- Lazy load chapters in reader
- Optimize PDF generation (queue system)
- Database query optimization

### Security
- RLS policies implemented
- Payment verification
- Download link expiration
- Rate limiting
- Content moderation

### Accessibility
- WCAG 2.1 AA compliance
- Screen reader support
- Keyboard navigation
- High contrast mode
- Font size options

### SEO
- Structured data (Schema.org)
- Open Graph tags
- Twitter cards
- XML sitemap
- Canonical URLs
- Meta descriptions

### Mobile Optimization
- Responsive design
- Touch-friendly reader
- Offline reading (PWA)
- Mobile payment flow
- App-like experience

---

## Success Metrics

### Engagement
- Books published: Target 50 in first 3 months
- Active readers: Target 1,000 in first 3 months
- Average reading session: Target 15+ minutes
- Completion rate: Target 40%+

### Revenue
- Paid books: Target 20% of published books
- Conversion rate: Target 3-5%
- Average order value: Target $5-15
- Repeat purchases: Target 25%

### Quality
- Average rating: Target 4.0+
- Review rate: Target 10% of readers
- Return rate: Target <2%
- Support tickets: Target <1% of purchases

---

## Next Steps

1. **Immediate (This Week)**
   - Review and approve SQL migration
   - Set up Supabase Storage buckets
   - Install Tiptap dependencies
   - Create basic book listing page

2. **Short-term (Next 2 Weeks)**
   - Implement rich text editor
   - Build chapter management
   - Create admin book UI
   - Set up Stripe test mode

3. **Medium-term (Next Month)**
   - Build reader interface
   - Implement PDF/EPUB generation
   - Launch payment flow
   - Add review system

4. **Long-term (Next Quarter)**
   - External platform integrations
   - Advanced analytics
   - Partnership outreach
   - Marketing campaign

---

## Notes & Questions

### Open Questions
- Should we support audiobooks in the future?
- Do we need DRM for paid books?
- Should we offer subscription model?
- What's the revenue split with creators?
- Do we need content moderation system?

### Risks & Mitigations
- **Risk:** Low adoption by creators
  - **Mitigation:** Incentive program, featured placement
  
- **Risk:** Payment processing issues
  - **Mitigation:** Multiple payment gateways, manual fallback
  
- **Risk:** Copyright infringement
  - **Mitigation:** DMCA takedown process, content review
  
- **Risk:** Technical complexity
  - **Mitigation:** Phased rollout, thorough testing

---

## Resources

### Documentation
- [Tiptap Documentation](https://tiptap.dev/)
- [Puppeteer Documentation](https://pptr.dev/)
- [Stripe Documentation](https://stripe.com/docs)
- [EPUB Specification](https://www.w3.org/publishing/epub32/)

### Inspiration
- Medium (reading experience)
- Wattpad (community features)
- Goodreads (reviews/ratings)
- Amazon Kindle (device sync)
- Apple Books (store design)

### APIs
- [Open Library API](https://openlibrary.org/developers/api)
- [Goodreads API](https://www.goodreads.com/api)
- [Google Books API](https://developers.google.com/books)
