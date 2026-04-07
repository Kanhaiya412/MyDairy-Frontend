import apiClient from "./apiClient";

/* ============================================================
   Types for Milk Entry
   Supports both cattle-wise and general milk entries
============================================================ */

export interface MilkEntry {
  userId: number;
  cattleId?: number | null; // ✅ allow null also
  date: string; // YYYY-MM-DD
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
   ✏️ UPDATE MILK ENTRY — PUT /milk/update
   Update happens by (userId + date + shift + cattleId)
============================================================ */
export const updateMilkEntry = async (entry: MilkEntry) => {
  try {
    console.log("[milkService] Updating milk entry:", entry);

    const response = await apiClient.put("/milk/update", entry);

    console.log("✅ Milk entry updated:", response.data);
    return response.data;
  } catch (error: any) {
    console.error(
      "❌ Failed to update milk entry:",
      error.response?.data || error.message
    );
    throw error;
  }
};

/* ============================================================
   🗑️ DELETE MILK ENTRY — DELETE /milk/delete/{entryId}
============================================================ */
export const deleteMilkEntry = async (entryId: number) => {
  try {
    console.log("[milkService] Deleting milk entry:", entryId);

    const response = await apiClient.delete(`/milk/delete/${entryId}`);

    console.log("✅ Milk entry deleted:", response.data);
    return response.data;
  } catch (error: any) {
    console.error(
      "❌ Failed to delete milk entry:",
      error.response?.data || error.message
    );
    throw error;
  }
};

/* ============================================================
   🔍 GET MILK ENTRIES
   /milk/user/{userId}?month=&year=
   ✅ Backend expects month = 1–12
============================================================ */
export const getMilkEntries = async (
  userId: number,
  month?: number,
  year?: number
) => {
  try {
    const params: any = {};

    /**
     * ✅ IMPORTANT:
     * If you pass month from Moment like moment().month()
     * -> it gives 0 to 11
     * So convert to 1-12 ONLY if input is 0-11
     */
    if (month !== undefined && year !== undefined) {
      const backendMonth = month >= 0 && month <= 11 ? month + 1 : month;
      params.month = backendMonth;
      params.year = year;
    }

    const response = await apiClient.get(`/milk/user/${userId}`, { params });

    console.log("📄 Milk entries fetched:", response.data?.length || 0);
    return response.data;
  } catch (error: any) {
    console.error(
      "❌ Failed to fetch milk entries:",
      error.response?.data || error.message
    );
    throw error;
  }
};
