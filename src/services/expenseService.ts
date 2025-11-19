import apiClient from "./apiClient";

export interface Expense {
  id?: number;
  userId: number;
  cattleId?: string;
  itemId: string;
  itemCategory: string;
  itemName: string;
  itemQuality?: string;
  itemQuantity: number;
  itemPrice: number;
  totalCost?: number;
  itemShopName?: string;
  itemBuyer?: string;
  shopOwner?: string;
  purchaseDate?: string;
  purchaseDay?: string;
  itemShop?: string;
  remarks?: string;
  status?: string;
}

/**
 * ➕ Add a new expense
 */
export const addExpense = async (expense: Expense) => {
  try {
    const response = await apiClient.post("/expenses/add", expense);
    console.log("✅ Expense added:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("❌ Add expense failed:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Failed to add expense");
  }
};

/**
 * ✏️ Update existing expense
 */
export const updateExpense = async (id: number, expense: Partial<Expense>) => {
  try {
    const response = await apiClient.put(`/expenses/${id}`, expense);
    console.log("✅ Expense updated:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("❌ Update expense failed:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Failed to update expense");
  }
};

/**
 * ❌ Delete expense (soft delete)
 */
export const deleteExpense = async (id: number) => {
  try {
    const response = await apiClient.delete(`/expenses/${id}`);
    console.log("🗑️ Expense deleted:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("❌ Delete expense failed:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Failed to delete expense");
  }
};

/**
 * 📦 Fetch all expenses
 */
export const getAllExpenses = async () => {
  try {
    const response = await apiClient.get("/expenses/all");
    console.log("📦 Expenses fetched:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("❌ Fetch expenses failed:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Failed to fetch expenses");
  }
};

/**
 * 🔍 Fetch expense by expenseId
 */
export const getExpenseByExpenseId = async (expenseId: string) => {
  try {
    const response = await apiClient.get(`/expenses/find/${expenseId}`);
    console.log(`🔍 Expense ${expenseId} fetched:`, response.data);
    return response.data;
  } catch (error: any) {
    console.error("❌ Failed to fetch expense:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Failed to fetch expense");
  }
};
