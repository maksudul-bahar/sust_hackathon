/**
 * Centralized regex patterns used for safety guardrail checks.
 * All patterns are defined here for easy auditing and maintenance.
 */

/** Detects credential-related terms (PIN, OTP, password, CVV, card number, etc.) */
export const CREDENTIAL_REGEX = /\b(pin|otp|password|cvv|card\s*number|card\s*digit|passcode|verification\s*code)\b/i;

/** Detects a request pattern asking customers for credentials */
export const CREDENTIAL_REQUEST_REGEX = /please\s+(provide|enter|send|share|tell|give)\s+(?:your\s+)?\b(pin|otp|password|cvv|card\s*number|card\s*digit|passcode|verification\s*code)\b/gi;

/** Detects unauthorized refund/reversal/unblock/recovery promises */
export const REFUND_PROMISE_PATTERNS: RegExp[] = [
  /we\s+will\s+(refund|reverse|unblock|recover|return)/i,
  /i\s+will\s+(refund|reverse|unblock|recover|return)/i,
  /(refund|reversal|unblock|recovery)\s+is\s+(confirmed|processed|done|approved|successful|completed)/i,
  /money\s+will\s+be\s+returned/i,
  /we\s+have\s+refunded/i,
  /your\s+account\s+has\s+been\s+unblocked/i,
  /\b(refund|reverse|unblock|recover)\b/i,
];

/** Detects a direct "we will refund/reverse/return your money" promise */
export const REFUND_DIRECT_REGEX = /we\s+will\s+(refund|reverse|return\s+your\s+money|send\s+back\s+your\s+money|give\s+back\s+your\s+money)/gi;

/** Detects "refund is processed/done" confirmation phrases */
export const REFUND_CONFIRMED_REGEX = /(?:your\s+)?refund\s+(?:is|has\s+been)\s+(?:processed|completed|done|approved)/gi;

/** Detects "we have refunded you" */
export const REFUND_PAST_REGEX = /we\s+have\s+refunded\s+you/gi;

/** Detects "refund the customer" in agent actions */
export const REFUND_CUSTOMER_REGEX = /refund\s+the\s+customer/gi;

/** Detects references to third-party social/messaging platforms */
export const THIRD_PARTY_REGEX = /\b(whatsapp|telegram|imo|facebook\s+group|fb\s+group|messenger)\b/gi;

/** Detects Bangladeshi mobile phone numbers (with or without country code) */
export const BD_PHONE_REGEX = /(?:\+?88)?01[3-9]\d{8}/g;

/** Official bKash support shortcode */
export const OFFICIAL_SUPPORT_NUMBER = '16247';
