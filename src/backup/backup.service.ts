import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as zlib from 'zlib';
import * as crypto from 'crypto';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

interface ServiceAccountKey {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);

  private readonly connectionString = process.env.DATABASE_URL;
  private readonly driveFolderId = process.env.GOOGLE_DRIVE_BACKUP_FOLDER_ID;
  private readonly retentionDays = 1825;

  private readonly clientId = process.env.GOOGLE_OAUTH_CLIENT_ID!;
  private readonly clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET!;
  private readonly refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN!;
  private readonly redirectUri = 'https://kassahun-backend.onrender.com/api/v1/backup/oauth/callback';

  // OAuth token caching
  private accessToken: string = '';
  private tokenExpiry = 0;

  // Service Account support
  private serviceAccountKey: ServiceAccountKey | null = null;
  private saAccessToken: string = '';
  private saTokenExpiry = 0;

  constructor() {
    this.loadServiceAccountKey();
  }

  private loadServiceAccountKey(): void {
    const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    if (keyJson) {
      try {
        this.serviceAccountKey = JSON.parse(keyJson) as ServiceAccountKey;
        this.logger.log('Service account key loaded successfully');
      } catch (error) {
        this.logger.error('Failed to parse GOOGLE_SERVICE_ACCOUNT_KEY:', (error as Error).message);
        this.serviceAccountKey = null;
      }
    } else {
      this.logger.warn('GOOGLE_SERVICE_ACCOUNT_KEY not set, falling back to OAuth');
    }
  }

  private signJwt(claims: Record<string, any>): string {
    const header = { alg: 'RS256', typ: 'JWT' };
    const now = Math.floor(Date.now() / 1000);

    const payload = { ...claims, iat: now, exp: now + 3600 };

    const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
    const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signingInput = `${headerB64}.${payloadB64}`;

    const sign = crypto.createSign('RSA-SHA256');
    sign.update(signingInput);
    const signature = sign.sign(this.serviceAccountKey!.private_key, 'base64url');

    return `${signingInput}.${signature}`;
  }

  private async getServiceAccountAccessToken(): Promise<string> {
    if (this.saAccessToken && Date.now() < this.saTokenExpiry) {
      return this.saAccessToken;
    }

    if (!this.serviceAccountKey) {
      throw new Error('Service account key not configured');
    }

    const jwt = this.signJwt({
      iss: this.serviceAccountKey.client_email,
      scope: 'https://www.googleapis.com/auth/drive.file',
      aud: 'https://oauth2.googleapis.com/token',
    });

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    });

    if (!res.ok) {
      throw new Error(`Service account token exchange failed: ${await res.text()}`);
    }

    const data = await res.json();
    this.saAccessToken = data.access_token;
    this.saTokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
    this.logger.log('Service account access token obtained');
    return this.saAccessToken;
  }

  getAuthorizeUrl(): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/drive.file',
      access_type: 'offline',
      prompt: 'consent',
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async exchangeCode(code: string): Promise<{ accessToken: string; refreshToken: string }> {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!res.ok) {
      throw new Error(`Token exchange failed: ${await res.text()}`);
    }

    const data = await res.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
    return { accessToken: data.access_token, refreshToken: data.refresh_token };
  }

  private async getAccessToken(): Promise<string> {
    // Prefer service account if configured
    if (this.serviceAccountKey) {
      return this.getServiceAccountAccessToken();
    }

    // Fall back to OAuth
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: this.refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!res.ok) {
      throw new Error(`Token refresh failed: ${await res.text()}`);
    }

    const data = await res.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
    return this.accessToken;
  }

  getAuthMethod(): string {
    return this.serviceAccountKey ? 'service-account' : 'oauth';
  }

  async runBackup(): Promise<void> {
    const dumpPath = await this.dumpDatabase();
    try {
      this.logger.log(`Uploading backup using ${this.getAuthMethod()} authentication`);
      await this.uploadToDrive(dumpPath);
      await this.deleteOldBackups();
      this.logger.log('Backup completed and uploaded successfully');
    } finally {
      if (fs.existsSync(dumpPath)) fs.unlinkSync(dumpPath);
    }
  }

  private escapeValue(v: any): string {
    if (v === null || v === undefined) return 'NULL';
    if (typeof v === 'boolean') return v ? 'true' : 'false';
    if (typeof v === 'number') return String(v);
    if (v instanceof Date) return `'${v.toISOString()}'`;
    if (typeof v === 'object') return `'${JSON.stringify(v).replace(/'/g, "''")}'`;
    return `'${String(v).replace(/'/g, "''")}'`;
  }

  private async dumpDatabase(): Promise<string> {
    const dateStamp = new Date().toISOString().slice(0, 10);
    const fileName = `furniture-backup-${dateStamp}.sql.gz`;
    const filePath = path.join(os.tmpdir(), fileName);

    this.logger.log(`Starting database backup`);

    // Try pg_dump first (fast native backup), fall back to Node.js dump
    try {
      await this.dumpWithPgDump(filePath);
      this.logger.log(`Backup completed via pg_dump: ${filePath}`);
      return filePath;
    } catch (pgErr) {
      this.logger.warn(`pg_dump failed, falling back to Node.js dump: ${(pgErr as Error).message}`);
      return this.dumpWithClient(filePath);
    }
  }

  private async dumpWithPgDump(filePath: string): Promise<void> {
    // Remove .gz extension for pg_dump, we'll compress separately
    const rawPath = filePath.replace('.gz', '');
    
    await execFileAsync('pg_dump', [
      '--no-password',
      '--format=plain',
      '--file', rawPath,
      this.connectionString || '',
    ], {
      timeout: 120000,
      maxBuffer: 500 * 1024 * 1024, // 500MB buffer
    });

    // Compress with gzip
    const sqlBuffer = fs.readFileSync(rawPath);
    const compressed = zlib.gzipSync(sqlBuffer);
    fs.writeFileSync(filePath, compressed);
    fs.unlinkSync(rawPath);
    
    this.logger.log(`Backup written: ${filePath} (${(compressed.length / 1024 / 1024).toFixed(2)} MB compressed)`);
  }

  private async dumpWithClient(filePath: string): Promise<string> {
    const { Client } = await import('pg');
    const client = new Client({ connectionString: this.connectionString });
    await client.connect();

    try {
      const tables = await client.query(`
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' ORDER BY tablename
      `);

      let sql = '-- Pharmacy ERP Backup\\n';
      sql += `-- Generated: ${new Date().toISOString()}\\n\\n`;

      for (const row of tables.rows) {
        const tableName = row.tablename;
        this.logger.log(`Backing up: ${tableName}`);

        const cols = await client.query(`
          SELECT column_name, data_type, 
                 CASE WHEN character_maximum_length IS NOT NULL 
                      THEN character_maximum_length::text 
                      ELSE NULL END as max_len,
                 is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_schema = 'public' AND table_name = $1 
          ORDER BY ordinal_position
        `, [tableName]);

        const colDefs = cols.rows.map(c => {
          let type = c.data_type.toUpperCase();
          if (c.data_type === 'character varying') type = 'VARCHAR';
          else if (c.data_type === 'character') type = `CHAR(${c.max_len})`;
          else if (c.data_type === 'numeric') type = 'NUMERIC';
          else if (c.data_type === 'timestamp without time zone') type = 'TIMESTAMP';
          else if (c.data_type === 'timestamp with time zone') type = 'TIMESTAMPTZ';

          let def = '';
          if (c.column_default && !c.column_default.includes('nextval')) {
            def = ` DEFAULT ${c.column_default}`;
          }

          const nullable = c.is_nullable === 'NO' ? ' NOT NULL' : '';
          return `  "${c.column_name}" ${type}${nullable}${def}`;
        });

        sql += `DROP TABLE IF EXISTS "${tableName}" CASCADE;\\n`;
        sql += `CREATE TABLE "${tableName}" (\\n${colDefs.join(',\\n')}\\n);\\n\\n`;

        const colNames = cols.rows.map(c => `"${c.column_name}"`);
        const data = await client.query(`SELECT * FROM "${tableName}"`);

        if (data.rows.length > 0) {
          for (const drow of data.rows) {
            const values = Object.values(drow).map(v => this.escapeValue(v));
            sql += `INSERT INTO "${tableName}" (${colNames.join(', ')}) VALUES (${values.join(', ')});\\n`;
          }
          sql += '\\n';
        }
      }

      const compressed = zlib.gzipSync(Buffer.from(sql, 'utf-8'));
      fs.writeFileSync(filePath, compressed);
      this.logger.log(`Backup written: ${filePath} (${(compressed.length / 1024 / 1024).toFixed(2)} MB compressed)`);
      return filePath;
    } finally {
      await client.end();
    }
  }

  private async uploadToDrive(filePath: string): Promise<void> {
    const token = await this.getAccessToken();
    const fileName = path.basename(filePath);
    const fileContent = fs.readFileSync(filePath);

    this.logger.log(`Uploading ${fileName} to Google Drive`);

    const metadata = { name: fileName, parents: this.driveFolderId ? [this.driveFolderId] : [] };
    const boundary = '----BackupBoundary' + Date.now();

    const jsonPart = Buffer.from(JSON.stringify(metadata));
    const filePart = fileContent;

    const parts: Buffer[] = [];
    parts.push(Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n`));
    parts.push(jsonPart);
    parts.push(Buffer.from(`\r\n--${boundary}\r\nContent-Type: application/gzip\r\n\r\n`));
    parts.push(filePart);
    parts.push(Buffer.from(`\r\n--${boundary}--\r\n`));

    const body = Buffer.concat(parts);

    const res = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: body as any,
      },
    );

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Upload failed: ${err}`);
    }

    this.logger.log(`Uploaded: ${fileName}`);
  }

  private async deleteOldBackups(): Promise<void> {
    const token = await this.getAccessToken();
    const now = new Date();
    const fiveYearsAgo = new Date(now);
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
    const oneYearAgo = new Date(now);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const q = `'${this.driveFolderId}' in parents and name contains 'furniture-backup-' and trashed = false`;
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,createdTime)&orderBy=createdTime`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      this.logger.error(`Failed to list backups: ${await res.text()}`);
      return;
    }

    const data = await res.json();
    const files = data.files || [];

    for (const file of files) {
      if (!file.createdTime) continue;
      const fileDate = new Date(file.createdTime);

      if (fileDate < fiveYearsAgo) {
        this.logger.log(`Deleting backup older than 5 years: ${file.name}`);
        await this.deleteFile(file.id, token);
        continue;
      }

      if (fileDate < oneYearAgo) {
        const dayOfWeek = fileDate.getDay();
        if (dayOfWeek !== 1) {
          this.logger.log(`Deleting non-weekly backup between 1-5 years: ${file.name}`);
          await this.deleteFile(file.id, token);
        }
      }
    }
  }

  private async deleteFile(fileId: string, token: string): Promise<void> {
    await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  }
}
