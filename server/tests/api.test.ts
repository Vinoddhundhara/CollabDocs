import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../src/app';
import { config } from '../src/config/env';
import { User } from '../src/models/User';
import { Doc } from '../src/models/Document';
import bcrypt from 'bcryptjs';

const app = createApp();

let aliceToken: string;
let bobToken: string;
let aliceId: string;
let bobId: string;
let charlieId: string;

beforeAll(async () => {
  // Connect to MongoDB for tests
  await mongoose.connect(config.mongodbUri);

  // Setup test users
  const passwordHash = await bcrypt.hash('Password123!', 8);

  const alice = await User.findOneAndUpdate(
    { email: 'alice@example.com' },
    { email: 'alice@example.com', name: 'Alice Test', password: passwordHash, avatarColor: '#7c3aed' },
    { upsert: true, new: true }
  );
  aliceId = alice._id.toString();

  const bob = await User.findOneAndUpdate(
    { email: 'bob@example.com' },
    { email: 'bob@example.com', name: 'Bob Test', password: passwordHash, avatarColor: '#0284c7' },
    { upsert: true, new: true }
  );
  bobId = bob._id.toString();

  const charlie = await User.findOneAndUpdate(
    { email: 'charlie@example.com' },
    { email: 'charlie@example.com', name: 'Charlie Test', password: passwordHash, avatarColor: '#059669' },
    { upsert: true, new: true }
  );
  charlieId = charlie._id.toString();

  // Obtain auth tokens
  const aliceLoginRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'alice@example.com', password: 'Password123!' });
  aliceToken = aliceLoginRes.body.token;

  const bobLoginRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'bob@example.com', password: 'Password123!' });
  bobToken = bobLoginRes.body.token;
});

afterAll(async () => {
  // Clean up any test documents created during testing
  await Doc.deleteMany({ title: /Test Doc/i });
  await mongoose.disconnect();
});

describe('1. Health Check API', () => {
  it('GET /api/health should return 200 and healthy status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.database).toBeDefined();
    expect(res.body.database.connected).toBe(true);
  });
});

describe('2. Authentication Behavior', () => {
  it('POST /api/auth/login succeeds with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@example.com', password: 'Password123!' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('alice@example.com');
  });

  it('POST /api/auth/login fails with invalid password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@example.com', password: 'WrongPassword!' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/auth/me returns current user when authenticated', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${aliceToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe('alice@example.com');
  });

  it('GET /api/auth/me returns 401 when token is missing', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});

describe('3. Document Authorization & Role Enforcement', () => {
  let testDocId: string;

  it('Alice creates a private document', async () => {
    const res = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({
        title: 'Test Doc: Secret Project',
        content: {
          type: 'doc',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Alice private notes.' }] }],
        },
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.document.title).toBe('Test Doc: Secret Project');
    expect(res.body.document.isOwner).toBe(true);
    testDocId = res.body.document.id;
  });

  it('Bob cannot read Alice private document (403 Forbidden)', async () => {
    const res = await request(app)
      .get(`/api/documents/${testDocId}`)
      .set('Authorization', `Bearer ${bobToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('Bob cannot edit Alice private document (403 Forbidden)', async () => {
    const res = await request(app)
      .patch(`/api/documents/${testDocId}`)
      .set('Authorization', `Bearer ${bobToken}`)
      .send({ title: 'Hacked by Bob' });

    expect(res.status).toBe(403);
  });

  it('Alice shares document with Bob as "viewer"', async () => {
    const res = await request(app)
      .post(`/api/documents/${testDocId}/share`)
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({
        email: 'bob@example.com',
        role: 'viewer',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.collaborators.some((c: any) => c.user.email === 'bob@example.com' && c.role === 'viewer')).toBe(true);
  });

  it('Bob can now read the shared document as "viewer"', async () => {
    const res = await request(app)
      .get(`/api/documents/${testDocId}`)
      .set('Authorization', `Bearer ${bobToken}`);

    expect(res.status).toBe(200);
    expect(res.body.document.userRole).toBe('viewer');
    expect(res.body.document.isOwner).toBe(false);
  });

  it('Bob CANNOT modify the document as a viewer (403 Forbidden)', async () => {
    const res = await request(app)
      .patch(`/api/documents/${testDocId}`)
      .set('Authorization', `Bearer ${bobToken}`)
      .send({ title: 'Viewer Attempting Edit' });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/Viewers cannot edit/i);
  });

  it('Alice upgrades Bob to "editor"', async () => {
    const res = await request(app)
      .post(`/api/documents/${testDocId}/share`)
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({
        email: 'bob@example.com',
        role: 'editor',
      });

    expect(res.status).toBe(200);
  });

  it('Bob CAN now edit the document as editor', async () => {
    const res = await request(app)
      .patch(`/api/documents/${testDocId}`)
      .set('Authorization', `Bearer ${bobToken}`)
      .send({ title: 'Test Doc: Updated by Editor Bob' });

    expect(res.status).toBe(200);
    expect(res.body.document.title).toBe('Test Doc: Updated by Editor Bob');
  });

  it('Bob CANNOT delete the document (owner only, 403 Forbidden)', async () => {
    const res = await request(app)
      .delete(`/api/documents/${testDocId}`)
      .set('Authorization', `Bearer ${bobToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/Only the document owner can delete/i);
  });

  it('Bob CANNOT share or manage collaborators (owner only, 403 Forbidden)', async () => {
    const res = await request(app)
      .post(`/api/documents/${testDocId}/share`)
      .set('Authorization', `Bearer ${bobToken}`)
      .send({ email: 'charlie@example.com', role: 'viewer' });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/Only the document owner can manage collaborators/i);
  });

  it('Alice (owner) can delete the document', async () => {
    const res = await request(app)
      .delete(`/api/documents/${testDocId}`)
      .set('Authorization', `Bearer ${aliceToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify it is gone
    const verifyRes = await request(app)
      .get(`/api/documents/${testDocId}`)
      .set('Authorization', `Bearer ${aliceToken}`);
    expect(verifyRes.status).toBe(404);
  });
});

describe('4. File Import & Markdown Parsing', () => {
  it('POST /api/documents/import safely parses markdown into TipTap structured JSON', async () => {
    const markdownContent = `# Test Doc: Imported Spec
Welcome to the imported document.

## Features
- First feature
- Second feature with **bold** text

> This is an important quote
`;

    const res = await request(app)
      .post('/api/documents/import')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({
        rawContent: markdownContent,
        filename: 'Test Doc: Imported Spec.md',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.document.title).toBe('Test Doc: Imported Spec');

    const content = res.body.document.content;
    expect(content.type).toBe('doc');
    expect(content.content.length).toBeGreaterThan(0);

    // Clean up
    await Doc.findByIdAndDelete(res.body.document.id);
  });
});

