import type { AnalyzeTicketRequest, AnalyzeTicketResponse } from '../types/schemas.js';
import { SEVERITY_RULES, DEFAULT_CLASSIFICATION } from '../constants/severity.js';

/**
 * Rule-based fallback service used when the LLM is unavailable (no API key, test env, or API failure).
 * Produces deterministic responses based on keyword matching against the complaint.
 */
export class FallbackService {
  /**
   * Generates a structured response using keyword-based rules instead of an LLM.
   */
  public static generateResponse(
    request: AnalyzeTicketRequest,
    preComputed: { relevant_transaction_id: string | null; evidence_verdict: 'consistent' | 'inconsistent' | 'insufficient_data' },
  ): AnalyzeTicketResponse {
    const lowercaseComplaint = request.complaint.toLowerCase();

    // Find the first matching severity rule
    const matched = SEVERITY_RULES.find(rule =>
      rule.keywords.some(keyword => lowercaseComplaint.includes(keyword)),
    );

    let case_type: any = matched?.case_type ?? DEFAULT_CLASSIFICATION.case_type;
    let department: any = matched?.department ?? DEFAULT_CLASSIFICATION.department;
    let severity: any = matched?.severity ?? DEFAULT_CLASSIFICATION.severity;
    let human_review_required = matched?.human_review_required ?? DEFAULT_CLASSIFICATION.human_review_required;

    // Override severity and review flag if evidence is inconsistent
    if (preComputed.evidence_verdict === 'inconsistent') {
      human_review_required = true;
      severity = 'high';
    }

    return {
      ticket_id: request.ticket_id,
      relevant_transaction_id: preComputed.relevant_transaction_id,
      evidence_verdict: preComputed.evidence_verdict,
      case_type,
      severity,
      department,
      agent_summary: `System processed fallback for ticket ${request.ticket_id}. Complaint mentions issues related to: ${case_type}.`,
      recommended_next_action: `Check transaction details. Escalate if necessary.`,
      customer_reply: `Dear customer, we have received your query. Any eligible amount will be returned through official channels.`,
      human_review_required,
      confidence: 0.8,
      reason_codes: ['fallback_activated'],
    };
  }
}
