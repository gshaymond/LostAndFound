const request = require('supertest');
const { app } = require('../server');

describe('Geocode API', () => {
  test('POST /api/geocode without address returns 400', async () => {
    const res = await request(app).post('/api/geocode').send({});
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});