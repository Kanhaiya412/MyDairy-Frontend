import apiClient from "./apiClient";

/* ============================================================================
   TYPES — Match backend DTOs exactly
   ========================================================================== */

export interface LabourEntry {
  id: number;
  labourName: string;
  mobile?: string;

  wageType: "DAILY" | "MONTHLY";
  dailyWage?: number;
  monthlySalary?: number;

  role?: string;

  joiningDate?: string; // yyyy-MM-dd
  status?: "ACTIVE" | "INACTIVE";

  address?: string;
  notes?: string;
  useAttendance?: boolean;
  referralBy?: string;
}

export interface LabourSalaryEntry {
  id: number;
  month: number;
  year: number;

  presentDays?: number;
  manualDays?: number;
  totalSalary: number;

  paymentStatus: "PAID" | "UNPAID";

  generatedDate?: string;
  paidDate?: string;
}


export interface LabourEventDTO {
  date: string;         // yyyy-MM-dd
  type: string;         // e.g. LOAN_DISBURSEMENT, CONTRACT_CREATED...
  amount: number;
  description?: string;
}


export interface LabourDashboardDTO {
  labourId: number;
  labourName: string;
  mobile?: string;
  wageType?: string;
  dailyWage?: number;
  monthlySalary?: number;

  activeContractId?: number | null;
  contractType?: string | null;
  contractAmount?: number | null;
  contractStartDate?: string | null;
  contractEndDate?: string | null;

  totalDisbursed: number;
  totalRepaid: number;
  outstandingPrincipal: number;
  totalInterest: number;
  outstandingWithInterest: number;

  totalSalaryPaid: number;
  totalPenaltyUnpaid: number;
  totalPenaltyPaid: number;

  timeline: LabourEventDTO[];
}


/* ============================================================================
   BACKEND-MATCHING API FUNCTIONS
   ========================================================================== */

export async function getLaboursByUser(
  userId: number
): Promise<LabourEntry[]> {
  const res = await apiClient.get(`/labour/user/${userId}`);
  return res.data;
}

export async function addLabour(payload: any): Promise<any> {
  const res = await apiClient.post(`/labour/add`, payload);
  return res.data;
}

export async function updateLabour(
  labourId: number,
  payload: any
): Promise<any> {
  const res = await apiClient.put(`/labour/${labourId}`, payload);
  return res.data;
}

export async function getSalaryHistory(
  labourId: number
): Promise<LabourSalaryEntry[]> {
  const res = await apiClient.get(`/labour/salary/${labourId}`);
  return res.data;
}

export async function generateSalary(payload: {
  labourId: number;
  month: number;
  year: number;
  manualDays?: number;
  fullMonth?: boolean;
}): Promise<any> {
  const res = await apiClient.post(`/labour/salary/generate`, payload);
  return res.data;
}

export async function getLabourById(labourId: number): Promise<LabourEntry> {
  const res = await apiClient.get(`/labour/${labourId}`);
  return res.data;
}

export async function markSalaryPaid(salaryId: number): Promise<any> {
  const res = await apiClient.post(`/labour/salary/${salaryId}/paid`, {});
  return res.data;
}

export async function getLabourDashboard(
  labourId: number
): Promise<LabourDashboardDTO> {
  const res = await apiClient.get(`/labour/${labourId}/dashboard`);
  return res.data;
}
