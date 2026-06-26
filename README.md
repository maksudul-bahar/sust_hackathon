# QueueStorm Ticket Classification API

A lightweight, fast, and secure AI-powered web service that investigates customer support tickets for a digital finance company — cross-referencing complaints against transaction history, classifying and routing them, and drafting a safe customer reply.

Built for the SUST CSE Carnival 2026 Codex Community Hackathon — QueueStorm Investigator preliminary challenge.

## Tech Stack
- **Language:** TypeScript (compiled via `npm run build`)
- **Runtime:** Node.js `<!-- TODO: state your required version, e.g. v18+ or v20+ -->`
- **HTTP Framework:** `<!-- TODO: e.g. Express / Fastify / native http -->`
- **Schema Validation:** Zod (strict input/output validation)
- **AI Provider SDK:** `@google/genai` (Google Gemini)

## Features
- **AI-Powered Reasoning:** Leverages an LLM to understand complex complaints in multiple languages (English, Bangla, Banglish).
- **Evidence-Based Investigation:** Cross-references the complaint against the customer's recent transaction history to determine which transaction it refers to, and whether the data supports, contradicts, or cannot confirm the complaint.
- **Safety Guardrails:** A deterministic post-processing layer that prevents the AI from requesting credentials, making unauthorized refund promises, or pointing customers to unofficial channels.
- **Schema Validation:** Strict input/output validation using Zod.

## API Endpoints

### `GET /health`
Returns service readiness. Used by the judge harness to confirm the service is up before sending test cases.

**Response**
```json
{ "status": "ok" }
```

### `POST /analyze-ticket`
Accepts one ticket and a short transaction history snippet, returns a structured classification and a safe draft reply.

**Example request**
```json
{
  "ticket_id": "TKT-001",
  "complaint": "I sent 5000 taka to a wrong number around 2pm today...",
  "language": "en",
  "channel": "in_app_chat",
  "user_type": "customer",
  "campaign_context": "boishakh_bonanza_day_1",
  "transaction_history": [
    {
      "transaction_id": "TXN-9101",
      "timestamp": "2026-04-14T14:08:22Z",
      "type": "transfer",
      "amount": 5000,
      "counterparty": "+8801719876543",
      "status": "completed"
    }
  ]
}
```

**Example response**
```json
{
  "ticket_id": "TKT-001",
  "relevant_transaction_id": "TXN-9101",
  "evidence_verdict": "consistent",
  "case_type": "wrong_transfer",
  "severity": "high",
  "department": "dispute_resolution",
  "agent_summary": "Customer reports sending 5000 BDT to the wrong number via TXN-9101; transaction history confirms a completed transfer of matching amount and time.",
  "recommended_next_action": "Verify recipient details for TXN-9101 with the customer and escalate to Dispute Resolution for recovery attempt.",
  "customer_reply": "We have noted your concern about transaction TXN-9101. Our team will review the details and any eligible amount will be returned through official channels.",
  "human_review_required": true,
  "confidence": 0.9,
  "reason_codes": ["wrong_transfer", "transaction_match"]
}
```

**HTTP status codes**
| Code | Meaning |
|---|---|
| 200 | Successful analysis |
| 400 | Malformed input (invalid JSON, missing required fields) |
| 422 | Schema-valid but semantically invalid input (e.g. empty complaint) |
| 500 | Internal error — never includes stack traces, tokens, or secrets |

## How Evidence Reasoning Works (the "Investigator" logic)
`<!-- TODO: replace this with your actual implementation. This is the highest-weighted category (35%) — be specific. -->`

1. The complaint text and `transaction_history` array are sent to the LLM together as a single structured prompt.
2. The model is instructed to identify which `transaction_id` (if any) the complaint refers to, and to judge whether the transaction data **supports**, **contradicts**, or is **insufficient** to confirm the complaint.
3. `<!-- TODO: describe any deterministic cross-check you run — e.g. matching amount/timestamp/counterparty mentioned in the complaint against transaction_history entries, before or after the LLM call -->`
4. `relevant_transaction_id` is set to `null` when no transaction in the provided history matches the complaint.
5. `evidence_verdict` is set to `insufficient_data` when `transaction_history` is empty or doesn't contain enough information to confirm or deny the complaint.

## Safety & Security Logic
To comply with fintech regulations, this service implements a deterministic safety layer (`SafetyService`) that intercepts the LLM output before it is returned:

- **Credential Protection:** Regex patterns detect and redact any request for a PIN, OTP, password, or card number in the drafted `customer_reply`.
- **Refund Policy Enforcement:** The AI is prevented from confirming a refund, reversal, or account unblock without authority. Phrases like "we will refund you" are automatically replaced with "any eligible amount will be returned through official channels."
- **Official-Channel-Only Enforcement:** `<!-- TODO: confirm/implement — the spec requires the service to never direct customers to a suspicious third party or unofficial contact; replies must point only to official support channels. This is a separate −10 point rule from the refund rule above. -->`
- **Prompt Injection Defense:** The system prompt explicitly instructs the LLM to ignore instructions embedded inside the customer complaint and to focus strictly on ticket classification.
- **Human Review Flagging:** `human_review_required` is set to `true` when any of the following hold:
  - `evidence_verdict` is `inconsistent` or `insufficient_data`
  - a safety rule was triggered and the reply was rewritten/redacted
  - `case_type` is `phishing_or_social_engineering` or otherwise suspicious
  - the transaction amount exceeds `<!-- TODO: define your high-value threshold, e.g. 10,000 BDT -->`
  - the case is a contested dispute (e.g. `wrong_transfer`, contested `refund_request`)

  Confidence scores are adjusted downward whenever a safety rule fires or evidence is ambiguous.

## Setup and Installation

1. Install dependencies:
   ```
   npm install
   ```

2. Set environment variables (create a `.env` file — see `.env.example`):
   ```
   PORT=8000
   HOST=0.0.0.0
   GEMINI_API_KEY=your_api_key_here
   GEMINI_MODEL=gemini-2.5-flash
   NODE_ENV=development
   ```
   `<!-- TODO: add where to obtain a Gemini API key, e.g. https://aistudio.google.com -->`

3. Build and start:
   ```
   npm run build
   npm start
   ```

4. Development mode:
   ```
   npm run dev
   ```

5. Verify the service is up:
   ```
   curl http://localhost:8000/health
   ```

> This section also serves as the fallback runbook (Submission Path C) in case the live URL is unreachable during judging.

## Models

- **Model:** `gemini-2.5-flash` (Google Gemini)
- **Why:** Best accuracy-to-speed ratio for structured classification tasks. Provides fast response times (< 2 seconds), correctly handles Bangla/Banglish nuance, and reliably outputs strictly structured JSON via `responseJsonSchema`.
- **Cost:** Free tier / cost-effective at scale.
- **Where it runs:** External API (`@google/genai` SDK).

## Assumptions
- All transaction history entries provided to the service are synthetic test data; no real payment system integration is performed.
- `transaction_history` may be empty for safety-only cases (e.g. phishing reports with no related transaction).
- `<!-- TODO: add any other assumptions specific to your implementation — e.g. how you handle missing optional fields, multiple plausible transaction matches, or unrecognized language codes -->`

## Known Limitations
- LLM-based classification may occasionally misjudge highly ambiguous or adversarial Banglish phrasing; such cases are routed to `human_review_required: true` rather than resolved automatically.
- The deterministic safety layer relies on pattern matching and may not catch every phrasing variant of a credential request or refund promise; it is a heuristic safeguard, not a guarantee.
- The service depends on Gemini API availability; `<!-- TODO: describe behavior on provider outage/rate limit — e.g. returns 500 with a safe error message, or falls back to a rule-based classifier -->`.
- The service is stateless; no request or transaction data is persisted between calls.

## Sample Output
A sample response generated against the public `SUST_Preli_Sample_Cases.json` pack is included at `<!-- TODO: path, e.g. /samples/sample-output.json -->`.

## Deployment
- **Live URL:** `<!-- TODO -->`
- **Docker image:** `<!-- TODO, e.g. docker pull username/image:tag -->`
- See Setup and Installation above for the runbook fallback.