// src/services/advanceService.ts
import apiClient from "./apiClient";

export interface SalaryAdvanceEntry {
  id: number;
  labourId: number;
  amount: number;
  date: string;       // yyyy-MM-dd
  remarks?: string;
  status: "PENDING" | "SETTLED";
  settledDate?: string;
}

export interface AddAdvancePayload {
  labourId: number;
  amount: number;
  date: string;       // yyyy-MM-dd
  remarks?: string;
}

// ---------------- CREATE ADVANCE ----------------
export async function addSalaryAdvance(payload: AddAdvancePayload) {
  const res = await apiClient.post("/advance/create", payload);
  return res.data;
}

// ---------------- HISTORY ----------------
export async function getAdvanceHistory(
  labourId: number,
  month?: number,
  year?: number
): Promise<SalaryAdvanceEntry[]> {
  const params: any = {};
  if (month) params.month = month;
  if (year) params.year = year;

  const res = await apiClient.get(`/advance/history/${labourId}`, { params });
  return res.data;
}

// ---------------- PENDING (FOR MONTH/YEAR) ----------------
export async function getPendingAdvances(
  labourId: number,
  month: number,
  year: number
): Promise<SalaryAdvanceEntry[]> {
  const res = await apiClient.get(`/advance/pending/${labourId}`, {
    params: { month, year },
  });
  return res.data;
}

// ---------------- SETTLE ONE ADVANCE ----------------
export async function settleAdvance(advanceId: number) {
  const res = await apiClient.post(`/advance/${advanceId}/settle`, {});
  return res.data;
}
