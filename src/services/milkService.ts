import apiClient from "./apiClient";

export interface MilkEntry {
  userId: number;
  day?: string;
  date: string;  // YYYY-MM-DD
  shift: "MORNING" | "EVENING";
  milkQuantity: number;
  fat: number;
  fatPrice: number;
  totalPayment?: number;
}

/* --------------------------------------------------------
   ADD Milk Entry — POST /milk/add
-------------------------------------------------------- */
export const addMilkEntry = async (entry: MilkEntry) => {
  try {
    const response = await apiClient.post("/milk/add", entry);
    return response.data;
  } catch (error: any) {
    console.error("Failed to add milk entry:", error.response?.data || error.message);
    throw error;
  }
};

/* --------------------------------------------------------
   GET Milk Entries (Supports Month + Year)
   GET /milk/user/{userId}?month=&year=
-------------------------------------------------------- */
export const getMilkEntries = async (
  userId: number,
  month?: number,   // JS month index (0–11)
  year?: number
) => {
  try {
    const params: any = {};

    // If month passed → convert 0–11 → backend 1–12
    if (month !== undefined && year !== undefined) {
      params.month = month + 1; // IMPORTANT ✔
      params.year = year;
    }

    const response = await apiClient.get(`/milk/user/${userId}`, { params });
    return response.data;
  } catch (error: any) {
    console.error("Failed to fetch milk entries:", error.response?.data || error.message);
    throw error;
  }
};
