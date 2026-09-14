# Multi-language (i18n) Translation Plan for Dynamic Content

## Current State

- Static UI text (nav, hero, section headers) → `messages/en.json` + `messages/am.json` ✅ already works
- Dynamic content (blog, services, FAQs, about, testimonials, before/after) → DB stores **English only** ❌
- Language switcher exists in Navbar, switches URL between `/en` and `/am`
- Frontend uses `next-intl` with `useLocale()` hook to detect current language

## Goal

When admin creates/edits content, they can provide both English and Amharic versions. When a visitor selects Amharic on the website, they see Amharic content. If no Amharic translation exists, fall back to English.

---

## Approach: JSONB Translations Column

Add a `translations` JSONB column to each existing table that has translatable content.

### Why JSONB over Separate Translation Tables

1. **6 fewer tables** to manage, migrate, and query with JOINs
2. **Backward compatible** — existing English data stays in existing columns, no data migration
3. **Simpler admin UI** — one form with language tabs, not a separate "translations" section
4. **Simpler frontend** — just pick `data.translations?.[locale] ?? data.title`
5. **One API call** gets everything — no extra queries for translations

---

## Entities That Need Translation

| Entity | Table | Fields to translate |
|---|---|---|
| Blog Post | `blog_posts` | `title`, `excerpt`, `content` |
| Service | `services` | `title`, `description`, `bulletPoints` |
| FAQ | `faqs` | `question`, `answer` |
| About Page | `about_page` | `title`, `description1`, `description2` |
| Testimonial | `testimonials` | `reviewText` (name/company stay the same) |
| Before/After | `before_after` | `title`, `description` |

---

## Backend Changes

### 1. Schema Changes (`website.schema.ts`)

Add `translations` column to each table:

```ts
import { jsonb } from 'drizzle-orm/pg-core';

// Add to each table:
translations: jsonb('translations').default({}),
```

SQL migration:
```sql
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT '{}';
ALTER TABLE services ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT '{}';
ALTER TABLE faqs ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT '{}';
ALTER TABLE about_page ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT '{}';
ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT '{}';
ALTER TABLE before_after ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT '{}';
```

### 2. DTO Changes (`website.dto.ts`)

Add `translations` field to each create/update DTO:

```ts
import { IsObject, IsOptional } from 'class-validator';

// Example for CreateBlogPostDto:
@IsOptional()
@IsObject()
@ApiPropertyOptional({
  example: {
    am: { title: 'አማርኛ ስርወ ቃል', excerpt: '...', content: '...' },
  },
})
translations?: Record<string, Record<string, any>>;
```

### 3. Public Controller Changes — Locale-Aware Responses

Each public GET endpoint accepts an optional `?locale=am` query parameter.

**Pattern:**

```ts
// Controller
@Get()
@Public()
findAll(@Query('locale') locale?: string) {
  return this.websiteService.getPublicFaqs(locale);
}

// Service
async getPublicFaqs(locale?: string) {
  const cacheKey = `faqs:all:${locale || 'en'}`;
  let faqs = await this.cache.get<any[]>(cacheKey);
  if (!faqs) {
    faqs = await this.repo.findPublicFaqs();
    // Merge translations for the requested locale
    faqs = faqs.map(faq => this.mergeTranslation(faq, locale));
    await this.cache.set(cacheKey, faqs, 600);
  }
  return faqs;
}

// Shared helper in service:
private mergeTranslation(item: any, locale?: string): any {
  if (!locale || locale === 'en') return item;
  const translation = item.translations?.[locale];
  if (!translation) return item; // fallback to English
  return {
    ...item,
    ...translation,
    // Keep the id and non-translatable fields
    id: item.id,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    sortOrder: item.sortOrder,
    isActive: item.isActive,
  };
}
```

### 4. Admin Controller Changes — Accept Translations on Create/Update

No structural change needed. The admin DTOs already accept all fields. Adding `translations` to the DTO means admins can pass:

```json
{
  "title": "Custom Furniture",
  "category": "CUSTOM",
  "description": "Handcrafted furniture...",
  "translations": {
    "am": {
      "title": "ብጁ ዕን炠",
      "description": "በ Jade የተሠራ..."
    }
  }
}
```

### 5. Admin Frontend — Add Translation Tabs

Each admin create/edit form gets a tabbed interface:
- **Tab 1: English** (existing fields)
- **Tab 2: Amharic** (same fields, stored in `translations.am`)

---

## Frontend Changes

### 6. RTK Query — Pass Locale to API

```ts
// baseApi.ts
getFaqs: builder.query<any[], string>({
  query: (locale) => `/website/faqs?locale=${locale}`,
  transformResponse: (response: any) => response.data,
  providesTags: ['FAQ'],
}),

getServices: builder.query<any[], string>({
  query: (locale) => `/website/services?locale=${locale}`,
  transformResponse: (response: any) => response.data,
  providesTags: ['Services'],
}),
// ... same pattern for all endpoints
```

### 7. Components — Pass `useLocale()` to Hooks

```tsx
// FAQSection.tsx
import { useLocale } from 'next-intl';

export default function FAQSection() {
  const locale = useLocale();
  const { data: apiFaqs = [] } = useGetFaqsQuery(locale);
  // ...
}
```

```tsx
// ServicesSection.tsx
import { useLocale } from 'next-intl';

export default function ServicesSection() {
  const locale = useLocale();
  const { data: services = [] } = useGetServicesQuery(locale);
  // ...
}
```

Same pattern for: AboutSection, BlogSection, TestimonialsSection, BeforeAfterSection, ContactSection.

---

## Files to Modify

### Backend
| File | Change |
|---|---|
| `src/database/schema/website.schema.ts` | Add `translations` JSONB column to 6 tables |
| `src/modules/website/dto/website.dto.ts` | Add `translations` field to 6 DTOs |
| `src/modules/website/website.service.ts` | Add `mergeTranslation()` helper, update all public methods to accept `locale` param |
| `src/modules/website/website.controller.ts` | Add `@Query('locale') locale` to all public GET endpoints |
| `src/modules/website/website.repository.ts` | No change (already returns full rows including translations) |
| New migration SQL | `ALTER TABLE ... ADD COLUMN translations JSONB DEFAULT '{}'` for 6 tables |

### Frontend
| File | Change |
|---|---|
| `src/lib/api/baseApi.ts` | Change all endpoints to accept `locale: string` param |
| `src/components/about/AboutSection.tsx` | Pass `useLocale()` to `useGetAboutPageQuery(locale)` |
| `src/components/services/ServicesSection.tsx` | Pass `useLocale()` to `useGetServicesQuery(locale)` |
| `src/components/blog/BlogSection.tsx` | Pass `useLocale()` to `useGetBlogPostsQuery(locale)` |
| `src/components/testimonials/TestimonialsSection.tsx` | Pass `useLocale()` to `useGetTestimonialsQuery(locale)` |
| `src/components/beforeafter/BeforeAfterSection.tsx` | Pass `useLocale()` to `useGetBeforeAfterQuery(locale)` |
| `src/components/contact/ContactSection.tsx` | Pass `useLocale()` to `useGetContactInfoQuery(locale)` |
| `src/components/faq/FAQSection.tsx` | Pass `useLocale()` to `useGetFaqsQuery(locale)` |

---

## Data Flow

```
Admin creates blog post:
  { title: "Custom Furniture", content: "...", 
    translations: { am: { title: "ብጁ ዕን炠", content: "..." } } }
       ↓
POST /admin/blog → saves to blog_posts table
  title = "Custom Furniture"
  translations = { am: { title: "ብጁ ዕን炠", content: "..." } }
       ↓
Public GET /website/blog?locale=am
       ↓
Service: mergeTranslation(post, "am")
  → returns { ...post, title: "ብጁ ዕን炠", content: "..." }
       ↓
Frontend: BlogSection renders Amharic text
```

---

## Migration SQL (Run on Neon Production)

```sql
-- Add translations JSONB column to all translatable tables
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT '{}';
ALTER TABLE services ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT '{}';
ALTER TABLE faqs ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT '{}';
ALTER TABLE about_page ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT '{}';
ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT '{}';
ALTER TABLE before_after ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT '{}';
```

---

## Implementation Order

1. Run SQL migration on Neon
2. Backend: Update schema (add JSONB column to 6 tables)
3. Backend: Update DTOs (add `translations` field to 6 DTOs)
4. Backend: Update service (add `mergeTranslation` helper, update public methods)
5. Backend: Update controllers (add `?locale=` to public GET endpoints)
6. Backend: Build, test locally, push to GitHub
7. Frontend: Update baseApi.ts (locale param on all endpoints)
8. Frontend: Update all 7 components (pass `useLocale()` to query hooks)
9. Frontend: Typecheck, commit, push
10. Admin frontend: Add language tabs to create/edit forms (separate task)
