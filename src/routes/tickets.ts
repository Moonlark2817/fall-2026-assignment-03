import { Router } from 'express';
import {
  getAllTickets,
  getTicketById,
  createTicket,
  updateTicketStatus,
} from '../dal/tickets.js';
import authMiddleware from '../middleware/auth.js';

import { insertTimeLog, getTotalHoursForTicket } from '../dal/timeLogs.js';

const router = Router();

// GET /tickets
router.get('/', async (req, res) => {
  const limit = req.query.limit ? Number(req.query.limit) : undefined;
  const offset = req.query.offset ? Number(req.query.offset) : undefined;
  const status = req.query.status as string | undefined;

  const tickets = await getAllTickets({
    limit,
    offset,
    status,
  });

  res.status(200).json(tickets);
});

// GET /tickets/:id
router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);

  const ticket = await getTicketById(id);

  if (!ticket) {
    res.status(404).json({ error: 'Ticket not found' });
    return;
  }

  res.status(200).json(ticket);
});

// POST /tickets
router.post('/', authMiddleware, async (req, res) => {
  const { title, description } = req.body;

  if (typeof title !== 'string' || title.trim() === '') {
    res.status(400).json({ error: 'Title is required' });
    return;
  }

  const ticket = await createTicket({
    title: title.trim(),
    description: description ?? null,
    creator_id: res.locals.userId,
  });

  res.status(201).json(ticket);
});

// PATCH /tickets/:id/status
router.patch('/:id/status', authMiddleware, async (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body;

  const validStatuses = ['TODO', 'IN_PROGRESS', 'DONE'];

  if (typeof status !== 'string' || !validStatuses.includes(status)) {
    res.status(400).json({
      error: 'Status must be TODO, IN_PROGRESS, or DONE',
    });
    return;
  }

  const ticket = await updateTicketStatus(id, status);

  if (!ticket) {
    res.status(404).json({ error: 'Ticket not found' });
    return;
  }

  res.status(200).json(ticket);
});

// POST /tickets/:id/time
router.post('/:id/time', authMiddleware, async (req, res) => {
  const ticketId = Number(req.params.id);
  const { hours } = req.body;

  if (!Number.isInteger(ticketId) || ticketId <= 0) {
    res.status(400).json({ error: 'Invalid ticket ID' });
    return;
  }

  if (typeof hours !== 'number' || hours <= 0) {
    res.status(400).json({ error: 'Hours must be a positive number' });
    return;
  }

  const ticket = await getTicketById(ticketId);

  if (!ticket) {
    res.status(404).json({ error: 'Ticket not found' });
    return;
  }

  const timeLog = await insertTimeLog(ticketId, res.locals.userId, hours);

  res.status(201).json(timeLog);
});

// GET /tickets/:id/time
router.get('/:id/time', async (req, res) => {
  const ticketId = Number(req.params.id);

  if (!Number.isInteger(ticketId) || ticketId <= 0) {
    res.status(400).json({ error: 'Invalid ticket ID' });
    return;
  }

  const ticket = await getTicketById(ticketId);

  if (!ticket) {
    res.status(404).json({ error: 'Ticket not found' });
    return;
  }

  const totalHours = await getTotalHoursForTicket(ticketId);

  res.status(200).json({
    ticket_id: ticketId,
    total_hours: totalHours,
  });
});

export default router;
