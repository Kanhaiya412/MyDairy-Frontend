import apiClient from "./apiClient";

/* ============================================================
   Types for Milk Entry
   Supports both cattle-wise and general milk entries
============================================================ */

export interface MilkEntry {
  userId: number;
  cattleId?: number;        // OPTIONAL → if selected cattle
  date: string;             // YYYY-MM-DD
  shift: "MORNING" | "EVENING";
  milkQuantity: number;
  fat: number;
  fatPrice: number;
  day?: string;
  totalPayment?: number;
}

/* ============================================================
   ➕ ADD MILK ENTRY — POST /milk/add
============================================================ */
export const addMilkEntry = async (entry: MilkEntry) => {
  try {
    console.log("[milkService] Adding milk entry:", entry);

    const response = await apiClient.post("/milk/add", entry);

    console.log("✅ Milk entry added:", response.data);
    return response.data;

  } catch (error: any) {
    console.error(
      "❌ Failed to add milk entry:",
      error.response?.data || error.message
    );
    throw error;
  }
};

/* ============================================================
   🔍 GET MILK ENTRIES
   /milk/user/{userId}?month=&year=
   (month is 1–12)
============================================================ */
export const getMilkEntries = async (
  userId: number,
  month?: number,
  year?: number
) => {
  try {
    const params: any = {};

    // Only add month/year if given
    if (month !== undefined && year !== undefined) {
      params.month = month + 1; // convert JS → backend
      params.year = year;
    }

    const response = await apiClient.get(`/milk/user/${userId}`, { params });

    console.log("📄 Milk entries fetched:", response.data.length);
    return response.data;

  } catch (error: any) {
    console.error(
      "❌ Failed to fetch milk entries:",
      error.response?.data || error.message
    );
    throw error;
  }
};
