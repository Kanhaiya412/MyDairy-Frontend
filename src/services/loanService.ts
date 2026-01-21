import apiClient from "./apiClient";

/* ----------- Types ----------- */

export interface LoanSummary {
  id: number; // loanAccountId
  totalDisbursed: number;
  totalRepaid: number;
  totalInterest: number;
  outstandingAmount: number;
}

export interface LoanTransaction {
  id: number;
  loanAccountId: number;
  txnDate: string;
  type: "DISBURSEMENT" | "REPAYMENT" | "INTEREST";
  amount: number;
  reason?: string;
  notes?: string;
}

export interface LoanDisbursementPayload {
  amount: number;
  date: string;
  reason?: string;
  notes?: string;
}

export interface LoanRepaymentPayload {
  amount: number;
  date: string;
  notes?: string;
}

/* ----------- API ----------- */

// GET summary using contractId
export async function getLoanSummary(contractId: number) {
  return (await apiClient.get(`/contract/${contractId}/loan/summary`)).data;
}

export async function getLoanTransactions(accountId: number) {
  return (await apiClient.get(`/contract/loan/${accountId}/transactions`)).data;
}

export async function addLoanDisbursement(
  contractId: number,
  payload: LoanDisbursementPayload
) {
  return (await apiClient.post(`/contract/${contractId}/loan/disburse`, payload)).data;
}

export async function addLoanRepayment(
  contractId: number,
  payload: LoanRepaymentPayload
) {
  return (await apiClient.post(`/contract/${contractId}/loan/repay`, payload)).data;
}
