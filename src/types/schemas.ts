import { z } from 'zod';

// Allowed Request Enums
export const LanguageEnum = z.enum(['en', 'bn', 'mixed']);
export const ChannelEnum = z.enum(['in_app_chat', 'call_center', 'email', 'merchant_portal', 'field_agent']);
export const UserTypeEnum = z.enum(['customer', 'merchant', 'agent', 'unknown']);
export const TransactionTypeEnum = z.enum(['transfer', 'payment', 'cash_in', 'cash_out', 'settlement', 'refund']);
export const TransactionStatusEnum = z.enum(['completed', 'failed', 'pending', 'reversed']);

// Allowed Response Enums
export const EvidenceVerdictEnum = z.enum(['consistent', 'inconsistent', 'insufficient_data']);
export const CaseTypeEnum = z.enum([
  'wrong_transfer',
  'payment_failed',
  'refund_request',
  'duplicate_payment',
  'merchant_settlement_delay',
  'agent_cash_in_issue',
  'phishing_or_social_engineering',
  'other'
]);
export const SeverityEnum = z.enum(['low', 'medium', 'high', 'critical']);
export const DepartmentEnum = z.enum([
  'customer_support',
  'dispute_resolution',
  'payments_ops',
  'merchant_operations',
  'agent_operations',
  'fraud_risk'
]);

// Transaction History schema
export const TransactionSchema = z.object({
  transaction_id: z.string(),
  timestamp: z.string(), // ISO 8601 format string
  type: TransactionTypeEnum,
  amount: z.number(),
  counterparty: z.string(),
  status: TransactionStatusEnum,
});

// Analyze Ticket Request Schema
export const AnalyzeTicketRequestSchema = z.object({
  ticket_id: z.string(),
  complaint: z.string(),
  language: LanguageEnum.optional(),
  channel: ChannelEnum.optional(),
  user_type: UserTypeEnum.optional(),
  campaign_context: z.string().optional(),
  transaction_history: z.array(TransactionSchema).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

// Analyze Ticket Response Schema
export const AnalyzeTicketResponseSchema = z.object({
  ticket_id: z.string(),
  relevant_transaction_id: z.string().nullable(),
  evidence_verdict: EvidenceVerdictEnum,
  case_type: CaseTypeEnum,
  severity: SeverityEnum,
  department: DepartmentEnum,
  agent_summary: z.string().min(1),
  recommended_next_action: z.string().min(1),
  customer_reply: z.string().min(1),
  human_review_required: z.boolean(),
  confidence: z.number().min(0).max(1).optional(),
  reason_codes: z.array(z.string()).optional(),
});

// Inferred Types
export type Transaction = z.infer<typeof TransactionSchema>;
export type AnalyzeTicketRequest = z.infer<typeof AnalyzeTicketRequestSchema>;
export type AnalyzeTicketResponse = z.infer<typeof AnalyzeTicketResponseSchema>;
