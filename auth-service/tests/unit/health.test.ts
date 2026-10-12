import request from 'supertest';
import { createApp } from '../../src/app';

describe('GET /health', () => {
  it('returns 200 with the service name', async () => {
    const res = await request(createApp()).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('auth-service');
  });

  it('returns 404 JSON for an unknown route', async () => {
    const res = await request(createApp()).get('/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('message');
  });
});
