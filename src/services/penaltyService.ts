import apiClient from "./apiClient";

export interface PenaltyPayload {
  labourId: number;
  date: string;
  extraLeaves: number;
  penaltyAmount: number;
  reason?: string;
}

export interface PenaltyEntry {
  id: number;
  date: string;
  extraLeaves: number;
  penaltyAmount: number;
  reason?: string;
  status: "PAID" | "UNPAID";
  paidDate?: string | null;
}

/* ---------------- ADD PENALTY ---------------- */
export async function addPenalty(payload: PenaltyPayload) {
  // ✅ backend: /api/labour/penalty/add
  const res = await apiClient.post("/labour/penalty/add", payload);
  return res.data;
}

/* ---------------- GET HISTORY ---------------- */
export async function getPenaltyHistory(labourId: number): Promise<PenaltyEntry[]> {
  // ✅ backend: /api/labour/penalty/{labourId}
  const res = await apiClient.get(`/labour/penalty/${labourId}`);
  return res.data;
}

// ✅ alias
export const getPenalties = getPenaltyHistory;

/* ---------------- MARK PAID ---------------- */
export async function markPenaltyPaid(penaltyId: number, payload?: { notes?: string }) {
  // ✅ backend: /api/labour/penalty/{penaltyId}/paid
  const res = await apiClient.post(`/labour/penalty/${penaltyId}/paid`, payload || {});
  return res.data;
}
