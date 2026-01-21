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
  labourId: number;
  date: string;
  extraLeaves: number;
  penaltyAmount: number;
  reason?: string;
  status: "PAID" | "UNPAID";
  paidDate?: string;
}

/* ---------------- ADD PENALTY ---------------- */
export async function addPenalty(payload: PenaltyPayload) {
  const res = await apiClient.post("/penalty/create", payload);
  return res.data;
}

/* ---------------- GET HISTORY ---------------- */
export async function getPenaltyHistory(
  labourId: number,
  month?: number,
  year?: number
): Promise<PenaltyEntry[]> {
  const params: any = {};
  if (month) params.month = month;
  if (year) params.year = year;

  const res = await apiClient.get(`/penalty/history/${labourId}`, { params });
  return res.data;
}

// ✅ Alias so old screens still work
export const getPenalties = getPenaltyHistory;
/* ---------------- MARK PAID ---------------- */
export async function markPenaltyPaid(
  penaltyId: number,
  payload?: { notes?: string }
) {
  const res = await apiClient.post(`/penalty/${penaltyId}/paid`, payload || {});
  return res.data;
}
