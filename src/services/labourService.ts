import apiClient from "./apiClient";

/* ============================================================================
   TYPES — Match backend DTOs exactly
   ========================================================================== */

export interface LabourEntry {
  id: number;
  labourName: string;
  mobile?: string;
  photoUrl?: string;

  wageType: "DAILY" | "MONTHLY" | "YEARLY";
  dailyWage?: number;
  monthlySalary?: number;
  yearlySalary?: number;
  allowedLeaves?: number;

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
  amountPaid: number;

  paymentStatus: "PAID" | "UNPAID" | "PARTIAL";

  generatedDate?: string;
  paidDate?: string;
}


export interface LabourEventDTO {
  date: string;         // yyyy-MM-dd
  type: string;         // e.g. LOAN_DISBURSEMENT, CONTRACT_CREATED...
  amount: number;
  description?: string;
}


export interface LabourResponseDTO {
  id: number;
  labourName: string;
  mobile: string;
  photoUrl: string;
  role: string;
  wageType: string;
  dailyWage?: number;
  monthlySalary?: number;
  yearlySalary?: number;
  allowedLeaves?: number;
  status: string;
  joiningDate?: string;
  endDate?: string;
  totalWorkingDays?: number;
}


export interface LabourDashboardDTO {
  labourId: number;
  labourName: string;
  mobile?: string;
  photoUrl?: string;
  wageType?: string;
  dailyWage?: number;
  monthlySalary?: number;
  yearlySalary?: number;
  allowedLeaves?: number;
  status?: "ACTIVE" | "INACTIVE";

  activeContractId?: number | null;
  contractType?: string | null;
  contractAmount?: number | null;
  contractStartDate?: string | null;
  contractEndDate?: string | null;

  joiningDate?: string;
  endDate?: string;
  totalWorkingDays?: number;

  totalDisbursed: number;
  totalRepaid: number;
  outstandingPrincipal: number;
  totalInterest: number;
  outstandingWithInterest: number;

  totalSalaryPaid: number;
  totalAccruedSalary?: number;
  pendingSalary?: number;
  totalPenaltyUnpaid: number;
  totalPenaltyPaid: number;

  timeline: LabourEventDTO[];
}


/* ============================================================================
   BACKEND-MATCHING API FUNCTIONS
   ========================================================================== */
export async function getLaboursByUser(): Promise<LabourEntry[]> {
  const res = await apiClient.get(`/labour/my`);
  return res.data;
}

export async function addLabour(payload: any): Promise<any> {
  const res = await apiClient.post(`/labour/add`, payload);
  return res.data;
}

export async function uploadLabourPhoto(photoUri: string, type: string, name: string): Promise<string> {
  const formData = new FormData();
  formData.append("file", {
    uri: photoUri,
    type: type || "image/jpeg",
    name: name || "photo.jpg",
  } as any);

  const res = await apiClient.post(`/labour/upload-photo`, formData, {
    headers: {
      "Content-Type": "multipart/form-data", // Tell Axios to boundary encode
    },
  });
  // The backend now returns { photoUrl: "/uploads/labour/..." }
  return res.data.photoUrl;
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

export async function markSalaryPaid(salaryId: number, amount: number): Promise<any> {
  const res = await apiClient.post(`/labour/salary/${salaryId}/paid?amount=${amount}`, {});
  return res.data;
}

export async function payLumpsumSalary(labourId: number, amount: number): Promise<any> {
  const res = await apiClient.post(`/labour/bulk-pay?labourId=${labourId}&amount=${amount}`, {});
  return res.data;
}

export async function markBatchAttendance(data: {
  date: string;
  entries: {
    labourId: number;
    status: string;
    remarks?: string;
    shift?: string;
    workHours?: number;
  }[];
}): Promise<any> {
  const res = await apiClient.post("/labour/attendance/batch", data);
  return res.data;
}


export async function getLabourDashboard(
  labourId: number
): Promise<LabourDashboardDTO> {
  const res = await apiClient.get(`/labour/${labourId}/dashboard`);
  return res.data;
}

export async function markAttendance(payload: {
  labourId: number;
  date: string; // yyyy-MM-dd
  status: "PRESENT" | "ABSENT";
  remarks?: string;
}) {
  const res = await apiClient.post(`/labour/attendance/mark`, payload);
  return res.data;
}
