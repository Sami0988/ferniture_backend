ALTER TABLE "testimonials" ADD COLUMN "translations" jsonb DEFAULT '{}';

ALTER TABLE "faqs" ADD COLUMN "translations" jsonb DEFAULT '{}';

ALTER TABLE "blog_posts" ADD COLUMN "translations" jsonb DEFAULT '{}';

ALTER TABLE "about_page" ADD COLUMN "translations" jsonb DEFAULT '{}';

ALTER TABLE "services" ADD COLUMN "translations" jsonb DEFAULT '{}';

ALTER TABLE "before_after" ADD COLUMN "translations" jsonb DEFAULT '{}';

ALTER TABLE "contact_info" ADD COLUMN "translations" jsonb DEFAULT '{}';
