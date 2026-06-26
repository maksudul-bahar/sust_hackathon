# QueueStorm Ticket Classification API

A lightweight, fast, and secure AI-powered web service that classifies customer support tickets for a digital finance company.

## Features
- **AI-Powered Reasoning:** Leverages LLMs to understand complex complaints in multiple languages (English, Bangla, Banglish).
- **Deterministic Evidence Matching:** Cross-references the complaint against user transaction history to find matching evidence.
- **Safety Guardrails:** Strict post-processing layer to prevent the AI from requesting credentials (PIN/OTP) or making unauthorized refund promises.
- **Schema Validation:** Strict input/output validation using Zod.

## Setup and Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set environment variables (create a `.env` file):
   ```
   PORT=8000
   HOST=0.0.0.0
   GEMINI_API_KEY=your_api_key_here
   GEMINI_MODEL=gemini-2.5-flash
   NODE_ENV=development
   ```

3. Build and Start:
   ```bash
   npm run build
   npm start
   ```

4. Development:
   ```bash
   npm run dev
   ```

## MODELS

- **Model:** `gemini-2.5-flash` (Google Gemini)
- **Why:** Best accuracy-to-speed ratio for structured classification tasks. It provides ultra-fast response times (< 2 seconds), correctly handles Bangla/Banglish nuance, and reliably outputs strictly structured JSON (via `responseJsonSchema`).
- **Cost:** Free tier / Highly cost-effective at scale.
- **Where it runs:** External API (`@google/genai` SDK)

## Safety & Security Logic

To comply with fintech regulations and avoid severe penalties, this service implements a deterministic safety layer (`SafetyService`) that intercepts the LLM output before it is returned to the user:
- **Credential Protection:** Regex patterns detect and redact any request for a PIN, OTP, password, or card number in the drafted `customer_reply`.
- **Refund Policy Enforcement:** The AI is prevented from making unauthorized refund promises. Phrases like "we will refund you" are automatically replaced with "any eligible amount will be returned through official channels."
- **Prompt Injection Defense:** The system prompt explicitly instructs the LLM to ignore embedded instructions (prompt injection) and focuses strictly on ticket classification.
- **Human Review Flagging:** If the evidence is inconsistent or a safety rule is triggered, `human_review_required` is automatically set to `true`, and confidence scores are adjusted downwards.
