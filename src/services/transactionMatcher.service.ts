import type { AnalyzeTicketRequest, AnalyzeTicketResponse, Transaction } from '../types/schemas.js';

/**
 * Deterministic transaction matching service.
 * Finds the most relevant transaction from history by scoring each
 * against the complaint text, and determines the evidence verdict.
 */
export class TransactionMatcherService {
  /**
   * Deterministically finds the relevant transaction and decides the evidence verdict.
   */
  public static matchTransaction(request: AnalyzeTicketRequest): {
    relevant_transaction_id: string | null;
    evidence_verdict: 'consistent' | 'inconsistent' | 'insufficient_data';
  } {
    const history = request.transaction_history ?? [];
    const complaint = request.complaint.toLowerCase();

    // If no transaction history is provided, we cannot evaluate
    if (history.length === 0) {
      return {
        relevant_transaction_id: null,
        evidence_verdict: 'insufficient_data',
      };
    }

    let bestTx: Transaction | null = null;
    let maxScore = 0;

    for (const tx of history) {
      let score = 0;

      // Rule A: Direct transaction ID mention (Highest weight)
      if (complaint.includes(tx.transaction_id.toLowerCase())) {
        score += 100;
      }

      // Rule B: Amount mention
      const amountStr = tx.amount.toString();
      const amountRegex = new RegExp(`\\b${amountStr}\\b`);
      if (amountRegex.test(complaint)) {
        score += 20;
      } else if (complaint.includes(amountStr)) {
        score += 10;
      }

      // Rule C: Counterparty matching (handles country code prefixes like +88017... vs 017...)
      const cleanTxCounterparty = tx.counterparty.replace(/[^0-9]/g, '');
      const cleanComplaint = complaint.replace(/[^0-9]/g, '');

      if (cleanTxCounterparty.length >= 6) {
        const lastSixDigits = cleanTxCounterparty.slice(-6);
        if (
          complaint.includes(tx.counterparty.toLowerCase()) || 
          cleanComplaint.includes(lastSixDigits)
        ) {
          score += 15;
        }
      }

      // Rule D: Transaction type keywords (English & Bangla)
      const isTransfer = tx.type === 'transfer' && (
        complaint.includes('send') || complaint.includes('sent') || 
        complaint.includes('transfer') || complaint.includes('পাঠা') || complaint.includes('সেন্ড')
      );
      const isPayment = tx.type === 'payment' && (
        complaint.includes('pay') || complaint.includes('payment') || 
        complaint.includes('বিল') || complaint.includes('পেমেন্ট')
      );
      const isCashIn = tx.type === 'cash_in' && (
        complaint.includes('cash in') || complaint.includes('deposit') || 
        complaint.includes('ক্যাশ ইন') || complaint.includes('জমা')
      );
      const isCashOut = tx.type === 'cash_out' && (
        complaint.includes('cash out') || complaint.includes('withdraw') || 
        complaint.includes('ক্যাশ আউট') || complaint.includes('উত্তোলন')
      );
      const isRefund = tx.type === 'refund' && (
        complaint.includes('refund') || complaint.includes('রিফান্ড')
      );

      if (isTransfer || isPayment || isCashIn || isCashOut || isRefund) {
        score += 5;
      }

      if (score > maxScore) {
        maxScore = score;
        bestTx = tx;
      }
    }

    // Set threshold score to verify it's a valid match
    const relevantTx = maxScore >= 10 ? bestTx : null;
    const relevant_transaction_id = relevantTx ? relevantTx.transaction_id : null;

    // Determine verdict
    const evidence_verdict = this.determineVerdict(complaint, relevantTx, history);

    return {
      relevant_transaction_id,
      evidence_verdict,
    };
  }

  /**
   * Determines whether the complaint is consistent, inconsistent, or has insufficient data
   * relative to the matched transaction record.
   */
  private static determineVerdict(
    complaint: string,
    relevantTx: Transaction | null,
    history: Transaction[],
  ): 'consistent' | 'inconsistent' | 'insufficient_data' {
    if (!relevantTx) {
      return 'insufficient_data';
    }

    const isFailedClaim = complaint.includes('fail') || complaint.includes('deduct') || 
                          complaint.includes('ব্যর্থ') || complaint.includes('কেটে') || 
                          complaint.includes('কাট');
    const isSuccessClaim = complaint.includes('success') || complaint.includes('receive') || 
                           complaint.includes('পেল') || complaint.includes('সফল') || 
                           complaint.includes('পেয়ে');
    const isDuplicateClaim = complaint.includes('twice') || complaint.includes('double') || 
                             complaint.includes('দুইবার') || complaint.includes('ডাবল') || 
                             complaint.includes('দ্বিতীয়');

    if (relevantTx.status === 'completed') {
      if (isFailedClaim && !isDuplicateClaim) {
        return 'inconsistent';
      } else if (isDuplicateClaim) {
        const identicalCount = history.filter(
          (tx: Transaction) => tx.amount === relevantTx.amount &&
                tx.counterparty === relevantTx.counterparty &&
                tx.status === 'completed'
        ).length;
        return identicalCount >= 2 ? 'consistent' : 'inconsistent';
      } else {
        return 'consistent';
      }
    } else if (relevantTx.status === 'failed') {
      if (isFailedClaim) {
        return 'consistent';
      } else if (isSuccessClaim) {
        return 'inconsistent';
      } else {
        return 'consistent';
      }
    } else if (relevantTx.status === 'pending') {
      return 'consistent';
    } else if (relevantTx.status === 'reversed') {
      return 'consistent';
    }

    return 'insufficient_data';
  }
}
