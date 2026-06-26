import { describe, it, expect } from 'vitest';
import { SafetyService } from '../src/services/safety.service';
import { AnalyzeTicketResponse } from '../src/types/schemas';

describe('SafetyService', () => {
  it('should detect credential requests (PIN/OTP/password) and sanitize customer_reply', () => {
    const input: AnalyzeTicketResponse = {
      ticket_id: 'TKT-001',
      relevant_transaction_id: 'TXN-101',
      evidence_verdict: 'consistent',
      case_type: 'wrong_transfer',
      severity: 'high',
      department: 'dispute_resolution',
      agent_summary: 'Test summary.',
      recommended_next_action: 'Test action.',
      customer_reply: 'Please provide your OTP so we can verify.',
      human_review_required: false,
    };

    const result = SafetyService.sanitizeResponse(input);
    expect(result.customer_reply).toContain('do not share your security credentials');
    expect(result.customer_reply).toContain('never ask for your PIN, OTP, password');
    expect(result.human_review_required).toBe(true);
    expect(result.reason_codes).toContain('safety_guardrail_triggered');
  });

  it('should detect refund promises and replace with standard safe phrasing', () => {
    const input: AnalyzeTicketResponse = {
      ticket_id: 'TKT-002',
      relevant_transaction_id: 'TXN-102',
      evidence_verdict: 'consistent',
      case_type: 'refund_request',
      severity: 'low',
      department: 'customer_support',
      agent_summary: 'Test summary.',
      recommended_next_action: 'Refund the customer 500 BDT.',
      customer_reply: 'Do not worry, we will refund you 500 BDT directly.',
      human_review_required: false,
    };

    const result = SafetyService.sanitizeResponse(input);
    expect(result.customer_reply).toContain('any eligible amount will be returned through official channels');
    expect(result.customer_reply).not.toContain('we will refund you');
    expect(result.recommended_next_action).toContain('verify transaction eligibility for return through official channels');
    expect(result.human_review_required).toBe(true);
  });

  it('should sanitize external/suspicious contact numbers or social media', () => {
    const input: AnalyzeTicketResponse = {
      ticket_id: 'TKT-003',
      relevant_transaction_id: 'TXN-103',
      evidence_verdict: 'consistent',
      case_type: 'other',
      severity: 'low',
      department: 'customer_support',
      agent_summary: 'Test summary.',
      recommended_next_action: 'None.',
      customer_reply: 'Please contact us on Telegram or Whatsapp at 01799999999.',
      human_review_required: false,
    };

    const result = SafetyService.sanitizeResponse(input);
    expect(result.customer_reply).toContain('our official customer support channel');
    expect(result.customer_reply).toContain('16247');
    expect(result.customer_reply).not.toContain('01799999999');
    expect(result.customer_reply).not.toContain('Whatsapp');
    expect(result.human_review_required).toBe(true);
  });
});
