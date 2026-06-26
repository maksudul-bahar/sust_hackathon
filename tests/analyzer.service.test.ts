import { describe, it, expect } from 'vitest';
import { TransactionMatcherService } from '../src/services/transactionMatcher.service';
import { AnalyzeTicketRequest } from '../src/types/schemas';

describe('TransactionMatcherService Evidence logic', () => {
  it('should find relevant transaction by exact ID match', () => {
    const request: AnalyzeTicketRequest = {
      ticket_id: 'TKT-001',
      complaint: 'I have issue with transaction TXN-9101',
      transaction_history: [
        {
          transaction_id: 'TXN-9101',
          timestamp: '2026-04-14T14:08:22Z',
          type: 'transfer',
          amount: 5000,
          counterparty: '+8801719876543',
          status: 'completed',
        },
        {
          transaction_id: 'TXN-9102',
          timestamp: '2026-04-14T15:08:22Z',
          type: 'transfer',
          amount: 1000,
          counterparty: '+8801719876544',
          status: 'completed',
        }
      ]
    };

    const evidence = TransactionMatcherService.matchTransaction(request);
    expect(evidence.relevant_transaction_id).toBe('TXN-9101');
    expect(evidence.evidence_verdict).toBe('consistent');
  });

  it('should find relevant transaction by amount and counterparty digits', () => {
    const request: AnalyzeTicketRequest = {
      ticket_id: 'TKT-002',
      complaint: 'I sent 1000 to number 01719876544 but it failed',
      transaction_history: [
        {
          transaction_id: 'TXN-9101',
          timestamp: '2026-04-14T14:08:22Z',
          type: 'transfer',
          amount: 5000,
          counterparty: '+8801719876543',
          status: 'completed',
        },
        {
          transaction_id: 'TXN-9102',
          timestamp: '2026-04-14T15:08:22Z',
          type: 'transfer',
          amount: 1000,
          counterparty: '+8801719876544',
          status: 'failed',
        }
      ]
    };

    const evidence = TransactionMatcherService.matchTransaction(request);
    expect(evidence.relevant_transaction_id).toBe('TXN-9102');
    expect(evidence.evidence_verdict).toBe('consistent'); // failed claim + failed status = consistent
  });

  it('should mark inconsistent when transaction status contradicts the failure claim', () => {
    const request: AnalyzeTicketRequest = {
      ticket_id: 'TKT-003',
      complaint: 'I sent 1000 to number 01719876544 but it failed and balance deducted',
      transaction_history: [
        {
          transaction_id: 'TXN-9102',
          timestamp: '2026-04-14T15:08:22Z',
          type: 'transfer',
          amount: 1000,
          counterparty: '+8801719876544',
          status: 'completed',
        }
      ]
    };

    const evidence = TransactionMatcherService.matchTransaction(request);
    expect(evidence.relevant_transaction_id).toBe('TXN-9102');
    expect(evidence.evidence_verdict).toBe('inconsistent'); // failed claim + completed status = inconsistent
  });

  it('should mark insufficient_data when no history or no matching details found', () => {
    const request: AnalyzeTicketRequest = {
      ticket_id: 'TKT-004',
      complaint: 'I sent 2500 BDT to another person',
      transaction_history: [
        {
          transaction_id: 'TXN-9102',
          timestamp: '2026-04-14T15:08:22Z',
          type: 'transfer',
          amount: 1000,
          counterparty: '+8801719876544',
          status: 'completed',
        }
      ]
    };

    const evidence = TransactionMatcherService.matchTransaction(request);
    expect(evidence.relevant_transaction_id).toBeNull();
    expect(evidence.evidence_verdict).toBe('insufficient_data');
  });
});
