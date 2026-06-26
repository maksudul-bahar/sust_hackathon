import { GoogleGenAI } from '@google/genai';
import { config } from '../config/index.js';
import type { AnalyzeTicketRequest, AnalyzeTicketResponse } from '../types/schemas.js';
import { buildSystemInstruction, buildUserPrompt } from '../prompts/analyze.prompt.js';
import type { PreComputedEvidence } from '../prompts/analyze.prompt.js';
import { FallbackService } from './fallback.service.js';

// OpenAPI 3.0 / JSON Schema definition passed to Gemini for structured JSON responses
const responseJsonSchema = {
  type: 'object',
  properties: {
    ticket_id: { type: 'string' },
    relevant_transaction_id: { type: 'string', nullable: true },
    evidence_verdict: { type: 'string', enum: ['consistent', 'inconsistent', 'insufficient_data'] },
    case_type: {
      type: 'string',
      enum: [
        'wrong_transfer',
        'payment_failed',
        'refund_request',
        'duplicate_payment',
        'merchant_settlement_delay',
        'agent_cash_in_issue',
        'phishing_or_social_engineering',
        'other'
      ]
    },
    severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
    department: {
      type: 'string',
      enum: [
        'customer_support',
        'dispute_resolution',
        'payments_ops',
        'merchant_operations',
        'agent_operations',
        'fraud_risk'
      ]
    },
    agent_summary: { type: 'string' },
    recommended_next_action: { type: 'string' },
    customer_reply: { type: 'string' },
    human_review_required: { type: 'boolean' },
    confidence: { type: 'number' },
    reason_codes: { type: 'array', items: { type: 'string' } }
  },
  required: [
    'ticket_id',
    'relevant_transaction_id',
    'evidence_verdict',
    'case_type',
    'severity',
    'department',
    'agent_summary',
    'recommended_next_action',
    'customer_reply',
    'human_review_required'
  ]
};

export class LLMService {
  private static ai = config.GEMINI_API_KEY
    ? new GoogleGenAI({ apiKey: config.GEMINI_API_KEY })
    : null;

  /**
   * Contacts Gemini API to analyze the support ticket.
   * Falls back to FallbackService on failure or when no API key is configured.
   */
  public static async analyzeTicket(
    request: AnalyzeTicketRequest,
    preComputedEvidence: PreComputedEvidence,
  ): Promise<AnalyzeTicketResponse> {
    
    // In test environment or when API key is missing, return a deterministic fallback
    if (config.NODE_ENV === 'test' || !this.ai) {
      return FallbackService.generateResponse(request, preComputedEvidence);
    }

    const systemInstruction = buildSystemInstruction(request, preComputedEvidence);
    const userPrompt = buildUserPrompt(request, preComputedEvidence);

    try {
      const response = await this.ai.models.generateContent({
        model: config.GEMINI_MODEL,
        contents: userPrompt,
        config: {
          systemInstruction,
          temperature: 0.1,
          responseMimeType: 'application/json',
          responseJsonSchema: responseJsonSchema,
        }
      });

      const text = response.text;
      if (!text) {
        throw new Error('Empty response received from Gemini');
      }

      const json = JSON.parse(text);
      return json as AnalyzeTicketResponse;
    } catch (error) {
      console.error('Error invoking Gemini API:', error);
      // Failover to deterministic fallback in case of any model API failure
      return FallbackService.generateResponse(request, preComputedEvidence);
    }
  }
}
