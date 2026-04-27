import request from 'supertest';
import app, { startServer } from '../server.js';

let server;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  server = await startServer();
});

afterAll(async () => {
  if (server) server.close();
});

describe('API smoke tests', () => {
  it('GET /api/goty should return 200', async () => {
    const res = await request(app).get('/api/goty');
    expect(res.statusCode).toBe(200);
  });
});
