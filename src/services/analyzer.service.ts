import type { AnalyzeTicketRequest, AnalyzeTicketResponse } from '../types/schemas.js';
import { TransactionMatcherService } from './transactionMatcher.service.js';
import { LLMService } from './llm.service.js';
import { SafetyService } from './safety.service.js';

/**
 * Orchestrates the full ticket analysis pipeline:
 * 1. Deterministic evidence matching (TransactionMatcherService)
 * 2. LLM reasoning (LLMService) with fallback
 * 3. Safety sanitization (SafetyService)
 */
export class AnalyzerService {
  public static async analyze(request: AnalyzeTicketRequest): Promise<AnalyzeTicketResponse> {
    // 1. Determine relevant transaction ID and evidence verdict deterministically
    const evidence = TransactionMatcherService.matchTransaction(request);

    // 2. Call LLM service for textual reasoning and reply drafting
    const llmResult = await LLMService.analyzeTicket(request, evidence);

    // 3. Guarantee that the output matches the deterministic facts
    const finalResponse: AnalyzeTicketResponse = {
      ...llmResult,
      ticket_id: request.ticket_id,
      relevant_transaction_id: evidence.relevant_transaction_id,
      evidence_verdict: evidence.evidence_verdict,
    };

    // 4. Apply safety guardrails post-generation
    const safeResponse = SafetyService.sanitizeResponse(finalResponse);

    return safeResponse;
  }
}
