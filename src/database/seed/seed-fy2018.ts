import postgres from 'postgres';

async function main() {
  console.log('Connecting to Neon database...');
  
  const conn = postgres('postgresql://neondb_owner:npg_wGXLTivFa2Z6@ep-autumn-wildflower-at09phm2-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require', {
    max: 1,
  });

  try {
    // Wake up the database with a simple query
    console.log('Waking up database...');
    const wakeUp = await conn.unsafe('SELECT NOW() as time');
    console.log('Database awake:', wakeUp[0].time);

    const [admin] = await conn.unsafe("SELECT id FROM users WHERE role = 'super_admin' LIMIT 1");
    const customers = await conn.unsafe('SELECT id FROM customers');
    const suppliers = await conn.unsafe('SELECT id FROM suppliers LIMIT 1');

    if (!admin || customers.length === 0 || suppliers.length === 0) {
      console.log('ERROR: Need at least 1 admin, 1 customer, 1 supplier in DB');
      console.log('admin:', !!admin, 'customers:', customers.length, 'suppliers:', suppliers.length);
      await conn.end();
      return;
    }

    const supId = suppliers[0].id;
    let projNum = 0;
    let fsNum = 0;

    async function insertProject(custIdx: number, title: string, priceBeforeVat: number, paidAt: string) {
      const vat = Math.round(priceBeforeVat * 0.15);
      const total = priceBeforeVat + vat;
      const custId = customers[custIdx % customers.length].id;
      await conn.unsafe(`
        INSERT INTO projects (id, project_number, customer_id, division, title, description, status, priority, total_price, price_before_vat, vat_amount, paid_now_price, order_date, delivery_date, paid_at, created_by, created_at, updated_at)
        VALUES (gen_random_uuid(), 'KWA-FY2018-${String(++projNum).padStart(3, '0')}', '${custId}', 'furniture', '${title}', 'FY2018 seed', 'paid', 'normal', '${total}', '${priceBeforeVat}', '${vat}', '${total}', '${paidAt}', '${paidAt}', '${paidAt}', '${admin.id}', NOW(), NOW())
      `);
      console.log(`  [PROJECT] ${title} | paidAt=${paidAt}`);
    }

    async function insertPurchase(date: string, amountBeforeVat: number) {
      const vat = Math.round(amountBeforeVat * 0.15);
      const withholding = amountBeforeVat > 10000 ? Math.round(amountBeforeVat * 0.03) : 0;
      const total = amountBeforeVat + vat;
      const fs = `FS-FY2018-${String(++fsNum).padStart(3, '0')}`;
      await conn.unsafe(`
        INSERT INTO purchases (id, supplier_id, fs_number, purchase_date, amount_before_vat, vat_amount, withholding_amount, total_amount, created_by, created_at, updated_at)
        VALUES (gen_random_uuid(), '${supId}', '${fs}', '${date}', '${amountBeforeVat}', '${vat}', '${withholding}', '${total}', '${admin.id}', NOW(), NOW())
      `);
      console.log(`  [PURCHASE] ${fs} | date=${date}`);
    }

    console.log('\n=== SEEDING FY2018 DATA ===\n');

    // FM1: Hamle (2026-07-08 → 2026-08-06)
    console.log('--- FM1: Hamle ---');
    await insertProject(0, 'Executive Desk', 95000, '2026-07-15');
    await insertProject(1, 'Conference Table', 120000, '2026-07-28');
    await insertPurchase('2026-07-10', 45000);
    await insertPurchase('2026-07-25', 60000);

    // FM2: Nehase+Pagume (2026-08-07 → 2026-09-09)
    console.log('--- FM2: Nehase–Pagume ---');
    await insertProject(2, 'Custom Wardrobe', 78000, '2026-08-12');
    await insertProject(3, 'Kitchen Island', 55000, '2026-09-01');
    await insertPurchase('2026-08-15', 35000);
    await insertPurchase('2026-09-05', 28000);

    // FM3: Meskerem (2026-09-10 → 2026-10-09)
    console.log('--- FM3: Meskerem ---');
    await insertProject(4, 'L-Shaped Sofa', 145000, '2026-09-20');
    await insertProject(5, 'Bookcase', 32000, '2026-10-01');
    await insertPurchase('2026-09-15', 55000);
    await insertPurchase('2026-10-05', 42000);

    // FM4: Tikimt (2026-10-10 → 2026-11-08)
    console.log('--- FM4: Tikimt ---');
    await insertProject(0, 'Bedroom Set King', 180000, '2026-10-20');
    await insertProject(1, 'Nightstands Pair', 28000, '2026-11-01');
    await insertPurchase('2026-10-15', 65000);
    await insertPurchase('2026-10-28', 22000);

    // FM5: Hidar (2026-11-09 → 2026-12-08)
    console.log('--- FM5: Hidar ---');
    await insertProject(2, 'Entertainment Center', 95000, '2026-11-20');
    await insertProject(3, 'Coffee Table', 35000, '2026-12-01');
    await insertPurchase('2026-11-15', 40000);
    await insertPurchase('2026-12-05', 30000);

    // FM6: Tahsas (2026-12-09 → 2027-01-07)
    console.log('--- FM6: Tahsas ---');
    await insertProject(4, 'Dining Room Set', 135000, '2026-12-20');
    await insertProject(5, 'Bar Stools Set', 48000, '2027-01-05');
    await insertPurchase('2026-12-15', 50000);
    await insertPurchase('2027-01-02', 38000);

    // FM7: Ter (2027-01-08 → 2027-02-06)
    console.log('--- FM7: Ter ---');
    await insertProject(0, 'Home Office Setup', 110000, '2027-01-20');
    await insertProject(1, 'Filing Cabinet', 42000, '2027-02-01');
    await insertPurchase('2027-01-15', 48000);
    await insertPurchase('2027-01-30', 35000);

    // FM8: Yekatit (2027-02-07 → 2027-03-08)
    console.log('--- FM8: Yekatit ---');
    await insertProject(2, 'Shoe Cabinet', 25000, '2027-02-15');
    await insertProject(3, 'TV Stand Large', 38000, '2027-03-01');
    await insertPurchase('2027-02-10', 20000);
    await insertPurchase('2027-03-05', 18000);

    // FM9: Megabit (2027-03-09 → 2027-04-07)
    console.log('--- FM9: Megabit ---');
    await insertProject(4, 'Outdoor Furniture Set', 85000, '2027-03-20');
    await insertProject(5, 'Garden Table', 32000, '2027-04-01');
    await insertPurchase('2027-03-15', 30000);
    await insertPurchase('2027-04-05', 25000);

    // FM10: Miazia (2027-04-08 → 2027-05-07)
    console.log('--- FM10: Miazia ---');
    await insertProject(0, 'Children Bedroom Set', 72000, '2027-04-15');
    await insertProject(1, 'Toy Storage Unit', 28000, '2027-05-01');
    await insertPurchase('2027-04-10', 35000);

    // FM11: Genbot (2027-05-08 → 2027-06-06)
    console.log('--- FM11: Genbot ---');
    await insertProject(2, 'Patio Set', 65000, '2027-05-20');
    await insertPurchase('2027-05-15', 28000);
    await insertPurchase('2027-06-01', 22000);

    // FM12: Sene (2027-06-07 → 2027-07-07)
    console.log('--- FM12: Sene ---');
    await insertProject(3, 'Wall Unit Modular', 95000, '2027-06-15');
    await insertProject(4, 'Display Cabinet', 45000, '2027-07-01');
    await insertPurchase('2027-06-10', 40000);
    await insertPurchase('2027-07-05', 35000);

    console.log('\n=== SEED COMPLETE ===');
    console.log(`Projects: ${projNum}`);
    console.log(`Purchases: ${fsNum}`);
    console.log('\nTest commands:');
    console.log('GET /api/v1/tax-report?period=year&fiscalYear=2018&calendar=ec-fiscal');
    console.log('GET /api/v1/tax-report?period=quarter&fiscalYear=2018&quarter=3&calendar=ec-fiscal');

  } catch (e: any) {
    console.error('Error:', e.message);
    console.error(e);
  } finally {
    await conn.end();
  }
}

main();
