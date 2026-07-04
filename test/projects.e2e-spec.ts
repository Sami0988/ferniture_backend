import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

describe('Projects (e2e)', () => {
  let app: INestApplication<App>;
  let accessToken: string;
  let customerId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: require('@nestjs/common').VersioningType.URI, defaultVersion: '1', prefix: 'v' });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();

    // Login as super_admin
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ phone: '+251911000001', password: 'password123' });
    accessToken = loginRes.body.accessToken;

    // Get a customer for project creation
    const customersRes = await request(app.getHttpServer())
      .get('/api/v1/customers')
      .set('Authorization', `Bearer ${accessToken}`);
    customerId = customersRes.body.data?.[0]?.id;
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/projects', () => {
    it('should list projects for admin', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/projects')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('total');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should reject unauthenticated requests', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/projects')
        .expect(401);
    });

    it('should filter by status', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/projects?status=new')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.data.every((p: any) => p.status === 'new')).toBe(true);
    });
  });

  describe('GET /api/v1/projects/:id', () => {
    it('should get project by ID', async () => {
      const listRes = await request(app.getHttpServer())
        .get('/api/v1/projects')
        .set('Authorization', `Bearer ${accessToken}`);

      const projectId = listRes.body.data?.[0]?.id;
      if (!projectId) return; // Skip if no projects

      const res = await request(app.getHttpServer())
        .get(`/api/v1/projects/${projectId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('id', projectId);
      expect(res.body).toHaveProperty('assignees');
    });

    it('should return 404 for non-existent project', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/projects/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('POST /api/v1/projects', () => {
    it('should create a project', async () => {
      if (!customerId) return; // Skip if no customers

      const res = await request(app.getHttpServer())
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          customerId,
          division: 'furniture',
          title: 'E2E Test Project',
          description: 'Created by E2E test',
          orderDate: new Date().toISOString().split('T')[0],
          priority: 'normal',
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.title).toBe('E2E Test Project');
      expect(res.body.projectNumber).toMatch(/^PRJ-\d{4}-\d{4}$/);
    });

    it('should reject invalid division', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          customerId,
          division: 'invalid_division',
          title: 'Test',
          orderDate: new Date().toISOString().split('T')[0],
        })
        .expect(400);
    });
  });

  describe('GET /api/v1/projects/:id/status-history', () => {
    it('should get status history', async () => {
      const listRes = await request(app.getHttpServer())
        .get('/api/v1/projects')
        .set('Authorization', `Bearer ${accessToken}`);

      const projectId = listRes.body.data?.[0]?.id;
      if (!projectId) return;

      const res = await request(app.getHttpServer())
        .get(`/api/v1/projects/${projectId}/status-history`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /api/v1/projects/:id/attachments', () => {
    it('should get attachments', async () => {
      const listRes = await request(app.getHttpServer())
        .get('/api/v1/projects')
        .set('Authorization', `Bearer ${accessToken}`);

      const projectId = listRes.body.data?.[0]?.id;
      if (!projectId) return;

      const res = await request(app.getHttpServer())
        .get(`/api/v1/projects/${projectId}/attachments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });
});
