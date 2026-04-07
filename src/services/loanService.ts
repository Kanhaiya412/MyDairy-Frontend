import apiClient from "./apiClient";

/* ----------- Types ----------- */

export interface LoanSummaryResponse {
  accountId: number;
  totalDisbursed: number;
  totalRepaid: number;
  totalInterest: number;
  outstandingAmount: number;
}

export interface LoanTransaction {
  id: number;
  txnDate: string;
  type: "DISBURSEMENT" | "REPAYMENT" | "INTEREST";
  amount: number;
  reason?: string;
  notes?: string;
}

export interface LabourLoanAccount {
  id: number;
  monthlyInterestRate: number;
  outstanding: number;
  status: string;
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

// ✅ GET summary using labourId
export async function getLoanSummary(
  labourId: number
): Promise<LoanSummaryResponse> {
  const res = await apiClient.get(`/contract/loan/summary/${labourId}`);
  return res.data;
}

export async function getLoanAccount(
  labourId: number
): Promise<LabourLoanAccount> {
  const res = await apiClient.get(`/contract/loan/account/${labourId}`);
  return res.data;
}

export async function getLoanTransactions(
  accountId: number
): Promise<LoanTransaction[]> {
  const res = await apiClient.get(`/contract/loan/${accountId}/transactions`);
  return res.data;
}

export async function addLoanDisbursement(
  labourId: number,
  payload: LoanDisbursementPayload
) {
  const res = await apiClient.post(
    `/contract/loan/disburse/${labourId}`,
    payload
  );
  return res.data;
}

export async function addLoanRepayment(
  labourId: number,
  payload: LoanRepaymentPayload
) {
  const res = await apiClient.post(
    `/contract/loan/repay/${labourId}`,
    payload
  );
  return res.data;
}
