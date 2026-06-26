import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { buildApp } from '../src/app';
import { FastifyInstance } from 'fastify';

describe('Fastify App API Integration', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health should return 200 and status ok', async () => {
    const res = await request(app.server)
      .get('/health')
      .expect(200);

    expect(res.body).toEqual({ status: 'ok' });
  });

  it('POST /analyze-ticket with malformed body should return 400', async () => {
    const res = await request(app.server)
      .post('/analyze-ticket')
      .send({
        // missing required complaint and ticket_id fields
      })
      .expect(400);

    expect(res.body.error).toContain('required property');
  });

  it('POST /analyze-ticket with empty text values should return 422', async () => {
    const res = await request(app.server)
      .post('/analyze-ticket')
      .send({
        ticket_id: '   ',
        complaint: '   ',
      })
      .expect(422);

    expect(res.body.error).toContain('Semantic validation failed');
  });

  it('POST /analyze-ticket with correct parameters should return 200 and valid schema', async () => {
    // Note: since NODE_ENV is set to 'test', LLMService will use fallback mock response
    const res = await request(app.server)
      .post('/analyze-ticket')
      .send({
        ticket_id: 'TKT-100',
        complaint: 'I had an issue with a wrong transfer of 5000 BDT today',
        transaction_history: [
          {
            transaction_id: 'TXN-9101',
            timestamp: '2026-04-14T14:08:22Z',
            type: 'transfer',
            amount: 5000,
            counterparty: '+8801719876543',
            status: 'completed',
          }
        ]
      })
      .expect(200);

    const body = res.body;
    expect(body.ticket_id).toBe('TKT-100');
    expect(body.relevant_transaction_id).toBe('TXN-9101');
    expect(body.evidence_verdict).toBe('consistent');
    expect(body.case_type).toBe('wrong_transfer');
    expect(body.department).toBe('dispute_resolution');
    expect(body.severity).toBe('medium');
    expect(body.customer_reply).toContain('returned through official channels');
    expect(body.human_review_required).toBeDefined();
  });
});
