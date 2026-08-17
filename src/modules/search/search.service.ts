import { Injectable, Inject, Logger } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../../database/drizzle.module';
import { sql } from 'drizzle-orm';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(@Inject(DATABASE_CONNECTION) private readonly db: any) {}

  async search(term: string) {
    const pattern = `%${term}%`;

    const [customers, suppliers, projects, purchases] = await Promise.all([
      this.searchCustomers(pattern),
      this.searchSuppliers(pattern),
      this.searchProjects(pattern),
      this.searchPurchases(pattern),
    ]);

    return { customers, suppliers, projects, purchases };
  }

  private async searchCustomers(pattern: string) {
    return this.db.execute(sql`
      SELECT id, full_name AS "fullName", phone, email, type, tin_number AS "tinNumber"
      FROM customers
      WHERE full_name ILIKE ${pattern}
         OR phone ILIKE ${pattern}
         OR email ILIKE ${pattern}
         OR tin_number ILIKE ${pattern}
      LIMIT 20
    `);
  }

  private async searchSuppliers(pattern: string) {
    return this.db.execute(sql`
      SELECT id, company_name AS "companyName", tin_number AS "tinNumber", phone, address
      FROM suppliers
      WHERE company_name ILIKE ${pattern}
         OR tin_number ILIKE ${pattern}
         OR phone ILIKE ${pattern}
      LIMIT 20
    `);
  }

  private async searchProjects(pattern: string) {
    return this.db.execute(sql`
      SELECT p.id, p.project_number AS "projectNumber", p.title AS "projectTitle",
             p.status, c.full_name AS "customerName"
      FROM projects p
      LEFT JOIN customers c ON p.customer_id = c.id
      WHERE p.project_number ILIKE ${pattern}
         OR p.title ILIKE ${pattern}
         OR p.description ILIKE ${pattern}
         OR c.full_name ILIKE ${pattern}
      LIMIT 20
    `);
  }

  private async searchPurchases(pattern: string) {
    return this.db.execute(sql`
      SELECT pu.id, pu.fs_number AS "fsNumber",
             pu.bank_transaction_number AS "bankTransactionNumber",
             pu.purchase_date AS "purchaseDate", pu.total_amount AS "totalAmount",
             s.company_name AS "supplierName"
      FROM purchases pu
      LEFT JOIN suppliers s ON pu.supplier_id = s.id
      WHERE pu.fs_number ILIKE ${pattern}
         OR pu.bank_transaction_number ILIKE ${pattern}
         OR s.company_name ILIKE ${pattern}
      LIMIT 20
    `);
  }
}
