import apiClient from "./apiClient";

export type ContractType = "YEARLY" | "MONTHLY" | "DAILY";

export interface LabourContract {
  id: number;
  contractType: ContractType;
  contractAmount: number;
  startDate: string;
  endDate: string;
  allowedLeaves: number;
  monthlyInterestRate: number;
  active: boolean;
}

export interface CreateContractPayload {
  labourId: number;
  contractType: ContractType;
  contractAmount: number;
  startDate: string;
  endDate: string;
  allowedLeaves?: number;
  monthlyInterestRate?: number;
}

// ✅ CREATE CONTRACT (Correct URL)
export async function createContract(payload: CreateContractPayload) {
  const res = await apiClient.post(`/contract/create`, payload);
  return res.data;
}

// ✅ GET ACTIVE CONTRACT
export async function getActiveContract(labourId: number) {
  const res = await apiClient.get(`/contract/history/${labourId}`);
  const all = res.data || [];

  const active = all.find((c: any) => c.active === true);
  return active || null;
}

// ✅ GET CONTRACT HISTORY
export async function getContractHistory(labourId: number) {
  const res = await apiClient.get(`/contract/history/${labourId}`);
  return res.data;
}

// ❌ This endpoint DOES NOT EXIST in your backend
// export async function closeContract(id, date)

// ✔ FIXED CLOSE CONTRACT using update endpoint
export async function closeContract(contractId: number, undefined: undefined) {
  const res = await apiClient.put(`/contract/${contractId}/close`);
  return res.data;
}
