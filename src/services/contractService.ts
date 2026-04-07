import apiClient from "./apiClient";

/* =====================================================================
   TYPES
   ===================================================================== */

export type ContractType = "YEARLY" | "MONTHLY" | "DAILY";

export interface LabourContractEntry {
  id: number;
  contractType: ContractType;
  contractAmount: number;
  startDate: string; // yyyy-MM-dd
  endDate: string;   // yyyy-MM-dd

  allowedLeaves?: number;
  monthlyInterestRate?: number;

  active?: boolean;
  advancePaid?: boolean;

  createdAt?: string;
}

export interface CreateContractPayload {
  labourId: number;
  contractType: ContractType;
  contractAmount: number;
  startDate: string; // yyyy-MM-dd
  endDate: string;   // yyyy-MM-dd
  allowedLeaves?: number;
  monthlyInterestRate?: number;
}

/* =====================================================================
   API
   ===================================================================== */

// ✅ Create contract
export async function createContract(payload: CreateContractPayload) {
  const res = await apiClient.post("/contract/create", payload);
  return res.data;
}

// ✅ Contract history
export async function getContractHistory(
  labourId: number
): Promise<LabourContractEntry[]> {
  const res = await apiClient.get(`/contract/history/${labourId}`);
  return res.data;
}

/**
 * ✅ Active contract
 * Backend doesn't have a direct endpoint.
 * So we use history & pick active=true.
 */
export async function getActiveContract(
  labourId: number
): Promise<LabourContractEntry | null> {
  const list = await getContractHistory(labourId);

  // active contract
  const active = list.find((c) => c.active === true);

  // if backend not sending active flag, fallback: assume latest is active if endDate future
  if (active) return active;

  return null;
}

// ✅ Close contract
export async function closeContract(contractId: number, payload?: any) {
  // backend: PUT /api/contract/{id}/close
  const res = await apiClient.put(`/contract/${contractId}/close`, payload || {});
  return res.data;
}
