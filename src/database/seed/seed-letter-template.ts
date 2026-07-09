import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { letterTemplates } from '../schema/letter-templates.schema';
import { users } from '../schema/users.schema';
import { eq } from 'drizzle-orm';
import 'dotenv/config';

async function seed() {
  const client = postgres(process.env.DATABASE_URL!);
  const db = drizzle(client);

  // Find a super_admin user to set as createdBy
  const [admin] = await db.select().from(users).where(eq(users.role, 'super_admin')).limit(1);
  if (!admin) {
    console.error('No super_admin user found. Create one first.');
    process.exit(1);
  }

  // Check if default already exists
  const [existing] = await db.select().from(letterTemplates).where(eq(letterTemplates.isDefault, true));
  if (existing) {
    console.log('Default template already exists:', existing.id);
    process.exit(0);
  }

  const defaultHtml = `
<div style="padding: 40px; font-family: Arial, sans-serif; color: #333;">
  <div style="background-color: #4a2c0a; color: white; padding: 15px 30px; display: flex; align-items: center;">
    {{companyLogo}}
    <span style="font-size: 18px; font-weight: bold; letter-spacing: 0.5px;">{{companyName}}</span>
  </div>

  <div style="text-align: right; margin: 20px 0; font-size: 14px;">
    Date: {{date}}
  </div>

  <div style="margin-bottom: 30px; line-height: 1.6;">
    To<br>
    {{recipientCompanyName}}<br>
    {{recipientTitle}}<br>
    {{recipientAddress}}
  </div>

  <div style="text-align: center; margin: 30px 0; font-size: 14px;">
    Subject: <u>{{subject}}</u>
  </div>

  <div style="line-height: 1.8; font-size: 14px;">
    {{body}}
  </div>

  <div style="text-align: right; margin-top: 60px; line-height: 1.8;">
    Thank you for your cooperation.<br><br>
    Yours sincerely,<br>
    <strong>{{signatoryName}}</strong>
  </div>

  <div style="border-top: 1px solid #ccc; padding-top: 10px; margin-top: 40px; font-size: 11px; color: #666; display: flex; justify-content: space-between;">
    <span>Phone: {{companyPhone}}</span>
    <span>Email: {{companyEmail}}</span>
  </div>
</div>`;

  const [template] = await db.insert(letterTemplates).values({
    name: 'Default Payment Letter',
    description: 'Standard payment inquiry letter template with company header, recipient block, subject, body, and closing.',
    htmlContent: defaultHtml,
    cssContent: '',
    isDefault: true,
    isActive: true,
    createdBy: admin.id,
  }).returning();

  console.log('Default template created:', template.id);
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
