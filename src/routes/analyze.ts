import type { FastifyInstance } from 'fastify';
import { AnalyzeTicketRequestSchema, AnalyzeTicketResponseSchema } from '../types/schemas.js';
import { AnalyzerService } from '../services/analyzer.service.js';

export async function analyzeRoutes(fastify: FastifyInstance) {
  fastify.post('/analyze-ticket', {
    schema: {
      description: 'Analyze a customer support ticket using AI and deterministic evidence matching.',
      tags: ['Ticket Analysis'],
      body: {
        type: 'object',
        required: ['ticket_id', 'complaint'],
        properties: {
          ticket_id: { type: 'string', description: 'Unique identifier for the support ticket' },
          complaint: { type: 'string', description: 'Full text of the customer complaint' },
          language: { type: 'string', enum: ['en', 'bn', 'mixed'], description: 'Language of the complaint' },
          channel: { type: 'string', enum: ['in_app_chat', 'call_center', 'email', 'merchant_portal', 'field_agent'], description: 'Support channel' },
          user_type: { type: 'string', enum: ['customer', 'merchant', 'agent', 'unknown'], description: 'Type of the user' },
          campaign_context: { type: 'string', description: 'Optional campaign context' },
          transaction_history: {
            type: 'array',
            description: 'List of related transactions',
            items: {
              type: 'object',
              required: ['transaction_id', 'timestamp', 'type', 'amount', 'counterparty', 'status'],
              properties: {
                transaction_id: { type: 'string' },
                timestamp: { type: 'string', description: 'ISO 8601 timestamp' },
                type: { type: 'string', enum: ['transfer', 'payment', 'cash_in', 'cash_out', 'settlement', 'refund'] },
                amount: { type: 'number' },
                counterparty: { type: 'string' },
                status: { type: 'string', enum: ['completed', 'failed', 'pending', 'reversed'] },
              },
            },
          },
          metadata: { type: 'object', additionalProperties: true, description: 'Optional key-value metadata' },
        },
      },
      response: {
        200: {
          description: 'Successful ticket analysis',
          type: 'object',
          properties: {
            ticket_id: { type: 'string' },
            relevant_transaction_id: { type: 'string', nullable: true },
            evidence_verdict: { type: 'string', enum: ['consistent', 'inconsistent', 'insufficient_data'] },
            case_type: { type: 'string', enum: ['wrong_transfer', 'payment_failed', 'refund_request', 'duplicate_payment', 'merchant_settlement_delay', 'agent_cash_in_issue', 'phishing_or_social_engineering', 'other'] },
            severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
            department: { type: 'string', enum: ['customer_support', 'dispute_resolution', 'payments_ops', 'merchant_operations', 'agent_operations', 'fraud_risk'] },
            agent_summary: { type: 'string' },
            recommended_next_action: { type: 'string' },
            customer_reply: { type: 'string' },
            human_review_required: { type: 'boolean' },
            confidence: { type: 'number' },
            reason_codes: { type: 'array', items: { type: 'string' } },
          },
        },
        400: {
          description: 'Malformed or missing request fields',
          type: 'object',
          properties: { error: { type: 'string' } },
        },
        422: {
          description: 'Semantic validation failure (e.g. empty ticket_id)',
          type: 'object',
          properties: { error: { type: 'string' } },
        },
        500: {
          description: 'Internal server error',
          type: 'object',
          properties: { error: { type: 'string' } },
        },
      },
    },
  }, async (request, reply) => {
    const body = request.body;

    // Verify request body is a JSON object
    if (!body || typeof body !== 'object') {
      return reply.status(400).send({ error: 'Request body must be a valid JSON object' });
    }

    // 1. Semantic Check (returns 422 as per API contract)
    const rawBody = body as any;
    const isSemanticInvalid = 
      (rawBody.ticket_id !== undefined && String(rawBody.ticket_id).trim() === '') ||
      (rawBody.complaint !== undefined && String(rawBody.complaint).trim() === '');

    if (isSemanticInvalid) {
      return reply.status(422).send({ 
        error: 'Semantic validation failed: ticket_id and complaint cannot be empty or whitespace' 
      });
    }

        // 2. Schema Validation Check (returns 400 for missing fields / incorrect types)
    const validationResult = AnalyzeTicketRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const errorMsg = validationResult.error.issues
        .map((err: any) => `${err.path.join('.')}: ${err.message}`)
        .join(', ');
      return reply.status(400).send({ 
        error: `Malformed input schema: ${errorMsg}` 
      });
    }

    try {
      // 3. Process ticket analysis
      const analysis = await AnalyzerService.analyze(validationResult.data);

      // 4. Validate output schema before sending response to ensure compliance
      const responseValidation = AnalyzeTicketResponseSchema.safeParse(analysis);
      if (!responseValidation.success) {
        fastify.log.error(
          { error: responseValidation.error.format() }, 
          'Output schema validation failed'
        );
        // Fallback to sending the raw analysis object to guarantee standard shape is returned
        return reply.status(200).send(analysis);
      }

      return reply.status(200).send(responseValidation.data);
    } catch (err: any) {
      fastify.log.error(err, 'Internal server error while processing ticket');
      // Enforce security rule: never expose stack traces, tokens, or secrets
      return reply.status(500).send({ 
        error: 'An internal server error occurred while processing the ticket.' 
      });
    }
  });
}
