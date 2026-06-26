import type { AnalyzeTicketResponse } from '../types/schemas.js';
import {
  CREDENTIAL_REGEX,
  CREDENTIAL_REQUEST_REGEX,
  REFUND_PROMISE_PATTERNS,
  REFUND_DIRECT_REGEX,
  REFUND_CONFIRMED_REGEX,
  REFUND_PAST_REGEX,
  REFUND_CUSTOMER_REGEX,
  THIRD_PARTY_REGEX,
  BD_PHONE_REGEX,
  OFFICIAL_SUPPORT_NUMBER,
} from '../constants/regex.js';

export class SafetyService {
  /**
   * Deterministic safety guardrails to intercept and sanitize the LLM response.
   * Modifies the response to comply with fintech safety regulations.
   */
  public static sanitizeResponse(response: AnalyzeTicketResponse): AnalyzeTicketResponse {
    const sanitized = { ...response };
    let safetyViolationDetected = false;

    // 1. PIN / OTP / Password check
    // "The service must never ask the customer for PIN, OTP, password, or full card number"
    if (CREDENTIAL_REGEX.test(sanitized.customer_reply)) {
      safetyViolationDetected = true;
      // Sanitize the specific pattern of requesting credentials
      sanitized.customer_reply = sanitized.customer_reply.replace(
        CREDENTIAL_REQUEST_REGEX,
        'Please do not share your security credentials.'
      );
      // Append strict safety warning
      if (!sanitized.customer_reply.includes('We will never ask for your PIN')) {
        sanitized.customer_reply += ' Remember: We will never ask for your PIN, OTP, password, or full card number.';
      }
    }

    // 2. Refund / Reversal / Unblock / Recovery promise check
    // "must never confirm a refund, reversal, account unblock, or recovery without authority"
    const hasRefundPromiseInReply = REFUND_PROMISE_PATTERNS.some(regex => regex.test(sanitized.customer_reply));
    const hasRefundPromiseInAction = REFUND_PROMISE_PATTERNS.some(regex => regex.test(sanitized.recommended_next_action));

    if (hasRefundPromiseInReply) {
      safetyViolationDetected = true;
      sanitized.customer_reply = sanitized.customer_reply.replace(
        REFUND_DIRECT_REGEX,
        'any eligible amount will be returned through official channels'
      ).replace(
        REFUND_CONFIRMED_REGEX,
        'any eligible amount will be returned through official channels'
      ).replace(
        REFUND_PAST_REGEX,
        'any eligible amount will be returned through official channels'
      );
      
      if (!sanitized.customer_reply.toLowerCase().includes('returned through official channels')) {
        sanitized.customer_reply += ' Any eligible amount will be returned through official channels.';
      }
    }

    if (hasRefundPromiseInAction) {
      safetyViolationDetected = true;
      sanitized.recommended_next_action = sanitized.recommended_next_action.replace(
        REFUND_DIRECT_REGEX,
        'any eligible amount will be returned through official channels'
      ).replace(
        REFUND_CUSTOMER_REGEX,
        'verify transaction eligibility for return through official channels'
      );
    }

    // 3. Third party contact checks
    // "never instruct the customer to contact a suspicious third party"
    const hasThirdPartySocial = THIRD_PARTY_REGEX.test(sanitized.customer_reply);
    THIRD_PARTY_REGEX.lastIndex = 0; // Reset regex lastIndex since it has global flag
    const matchedNumbers = sanitized.customer_reply.match(BD_PHONE_REGEX) || [];
    const hasSuspiciousPhone = matchedNumbers.some((num: string) => !num.includes(OFFICIAL_SUPPORT_NUMBER));

    if (hasThirdPartySocial || hasSuspiciousPhone) {
      safetyViolationDetected = true;
      
      sanitized.customer_reply = sanitized.customer_reply.replace(
        THIRD_PARTY_REGEX,
        'our official customer support channel'
      );

      matchedNumbers.forEach((num: string) => {
        if (!num.includes(OFFICIAL_SUPPORT_NUMBER)) {
          sanitized.customer_reply = sanitized.customer_reply.replace(num, OFFICIAL_SUPPORT_NUMBER);
        }
      });

      if (!sanitized.customer_reply.includes(OFFICIAL_SUPPORT_NUMBER)) {
        sanitized.customer_reply += ` Please contact our official support hotline at ${OFFICIAL_SUPPORT_NUMBER}.`;
      }
    }

    // 4. Handle safety triggers by modifying output metadata
    if (safetyViolationDetected) {
      sanitized.human_review_required = true;
      if (sanitized.confidence !== undefined) {
        sanitized.confidence = Math.max(0, sanitized.confidence - 0.15);
      }
      if (!sanitized.reason_codes) {
        sanitized.reason_codes = [];
      }
      if (!sanitized.reason_codes.includes('safety_guardrail_triggered')) {
        sanitized.reason_codes.push('safety_guardrail_triggered');
      }
    }

    return sanitized;
  }
}
