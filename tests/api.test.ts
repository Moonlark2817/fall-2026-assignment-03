import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/index.js';

describe('Part 1: API Integration Tests', () => {
  it('creates a new user', async () => {
    const response = await request(app)
      .post('/users')
      .set('X-User-Id', '1')
      .send({
        name: 'Test User',
        email: `test-${Date.now()}@example.com`,
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe('Test User');
  });

  it('rejects POST requests without X-User-Id', async () => {
    const response = await request(app).post('/users').send({
      name: 'Unauthorized User',
      email: 'unauthorized@example.com',
    });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Unauthorized' });
  });

  it('returns 404 for a non-existent user', async () => {
    const response = await request(app).get('/users/999999');

    expect(response.status).toBe(404);
  });

  it('creates a new ticket', async () => {
    // First create a user so the ticket has a valid creator_id.
    const userResponse = await request(app)
      .post('/users')
      .set('X-User-Id', '1')
      .send({
        name: 'Ticket Creator',
        email: `creator-${Date.now()}@example.com`,
      });

    expect(userResponse.status).toBe(201);

    const response = await request(app)
      .post('/tickets')
      .set('X-User-Id', String(userResponse.body.id))
      .send({
        title: 'Integration Test Ticket',
        description: 'Created by the API integration test',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.title).toBe('Integration Test Ticket');
    expect(response.body.creator_id).toBe(userResponse.body.id);
  });

  it('returns 404 for a non-existent ticket', async () => {
    const response = await request(app).get('/tickets/999999');

    expect(response.status).toBe(404);
  });

  it('supports pagination on GET /tickets', async () => {
    const response = await request(app).get('/tickets?limit=1&offset=0');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeLessThanOrEqual(1);
  });

  it('supports filtering tickets by status', async () => {
    const response = await request(app).get('/tickets?status=TODO');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);

    for (const ticket of response.body) {
      expect(ticket.status).toBe('TODO');
    }
  });

  it('updates a ticket status', async () => {
    const userResponse = await request(app)
      .post('/users')
      .set('X-User-Id', '1')
      .send({
        name: 'Status Test User',
        email: `status-${Date.now()}@example.com`,
      });

    expect(userResponse.status).toBe(201);

    const userId = userResponse.body.id;

    const ticketResponse = await request(app)
      .post('/tickets')
      .set('X-User-Id', String(userId))
      .send({
        title: 'Status Test Ticket',
        description: 'Testing status updates',
      });

    expect(ticketResponse.status).toBe(201);

    const ticketId = ticketResponse.body.id;

    const response = await request(app)
      .patch(`/tickets/${ticketId}/status`)
      .set('X-User-Id', String(userId))
      .send({
        status: 'IN_PROGRESS',
      });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('IN_PROGRESS');
  });

  it('rejects an invalid ticket status', async () => {
    const response = await request(app)
      .patch('/tickets/999999/status')
      .set('X-User-Id', '1')
      .send({
        status: 'INVALID_STATUS',
      });

    expect(response.status).toBe(400);
  });
});
