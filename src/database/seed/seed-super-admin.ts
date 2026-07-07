import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as bcrypt from 'bcrypt';
import { users } from '../schema';
import { eq } from 'drizzle-orm';

async function seedSuperAdmin() {
  const connectionString = process.env.DATABASE_URL!;
  const client = postgres(connectionString);
  const db = drizzle(client);

  const email = process.env.SUPER_ADMIN_EMAIL || 'owner@kassahun.com';
  const phone = process.env.SUPER_ADMIN_PHONE || '+251911000001';
  const password = process.env.SUPER_ADMIN_PASSWORD || 'password123';
  const fullName = process.env.SUPER_ADMIN_NAME || 'Kassahun Owner';

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing.length > 0) {
    console.log(`Super admin with email "${email}" already exists. Skipping.`);
    await client.end();
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const [admin] = await db
    .insert(users)
    .values({
      fullName,
      phone,
      email,
      passwordHash,
      role: 'super_admin',
    })
    .returning();

  console.log('Super admin created successfully!');
  console.log({
    id: admin.id,
    fullName: admin.fullName,
    email: admin.email,
    phone: admin.phone,
    role: admin.role,
  });

  await client.end();
  process.exit(0);
}

seedSuperAdmin().catch((err) => {
  console.error('Failed to create super admin:', err);
  process.exit(1);
});
