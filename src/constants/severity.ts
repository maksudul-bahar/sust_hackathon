/**
 * Severity classification rules for deterministic fallback analysis.
 * Each rule maps complaint keywords to a case type, department, and severity.
 */

export interface SeverityRule {
  /** Keywords that trigger this rule (checked against lowercased complaint) */
  keywords: string[];
  case_type: string;
  department: string;
  severity: string;
  human_review_required?: boolean;
}

/**
 * Ordered list of severity rules. First match wins.
 * Rules are ordered from most specific/critical to least.
 */
export const SEVERITY_RULES: SeverityRule[] = [
  {
    keywords: ['pin', 'otp', 'scam', 'phish', 'প্রতারণা'],
    case_type: 'phishing_or_social_engineering',
    department: 'fraud_risk',
    severity: 'critical',
    human_review_required: true,
  },
  {
    keywords: ['wrong', 'mistake', 'ভুল'],
    case_type: 'wrong_transfer',
    department: 'dispute_resolution',
    severity: 'medium',
  },
  {
    keywords: ['fail', 'deduct', 'ব্যর্থ', 'কেটে'],
    case_type: 'payment_failed',
    department: 'payments_ops',
    severity: 'medium',
  },
  {
    keywords: ['refund', 'রিফান্ড'],
    case_type: 'refund_request',
    department: 'customer_support',
    severity: 'low',
  },
];

/** Default classification when no rules match */
export const DEFAULT_CLASSIFICATION = {
  case_type: 'other',
  department: 'customer_support',
  severity: 'low',
  human_review_required: false,
} as const;
