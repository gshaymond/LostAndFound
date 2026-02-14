const request = require('supertest');
const { app } = require('../server');

describe('Uploads API', () => {
  test('POST /api/uploads/presign missing fields returns 400', async () => {
    const res = await request(app).post('/api/uploads/presign').send({});
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});