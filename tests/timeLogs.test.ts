import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/index.js';

describe('Part 2: Time Logs Tests', () => {
  it('logs multiple time entries and returns the correct total hours', async () => {
    // Create a user who will create the ticket and log time.
    const userResponse = await request(app)
      .post('/users')
      .set('X-User-Id', '1')
      .send({
        name: 'Time Log User',
        email: `timelog-${Date.now()}@example.com`,
      });

    expect(userResponse.status).toBe(201);

    const userId = userResponse.body.id;

    // Create a ticket for the time logs.
    const ticketResponse = await request(app)
      .post('/tickets')
      .set('X-User-Id', String(userId))
      .send({
        title: 'Time Log Test Ticket',
        description: 'Ticket used to test time aggregation',
      });

    expect(ticketResponse.status).toBe(201);

    const ticketId = ticketResponse.body.id;

    // Log 2 hours.
    const firstLog = await request(app)
      .post(`/tickets/${ticketId}/time`)
      .set('X-User-Id', String(userId))
      .send({ hours: 2 });

    expect(firstLog.status).toBe(201);

    // Log another 3 hours.
    const secondLog = await request(app)
      .post(`/tickets/${ticketId}/time`)
      .set('X-User-Id', String(userId))
      .send({ hours: 3 });

    expect(secondLog.status).toBe(201);

    // Log another 4 hours.
    const thirdLog = await request(app)
      .post(`/tickets/${ticketId}/time`)
      .set('X-User-Id', String(userId))
      .send({ hours: 4 });

    expect(thirdLog.status).toBe(201);

    // 2 + 3 + 4 should equal 9.
    const totalResponse = await request(app).get(`/tickets/${ticketId}/time`);

    expect(totalResponse.status).toBe(200);
    expect(totalResponse.body).toEqual({
      ticket_id: ticketId,
      total_hours: 9,
    });
  });
});
