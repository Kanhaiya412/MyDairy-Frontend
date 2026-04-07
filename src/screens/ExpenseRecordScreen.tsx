import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
  RefreshControl,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getAllExpenses } from "../services/expenseService";  // ✅ changed import
import moment from "moment";
import { Dropdown } from "react-native-element-dropdown";
import LinearGradient from "react-native-linear-gradient";
import { useNavigation } from "@react-navigation/native";

// 🎨 Theme
const theme = {
  bg: "#F9FAFB",
  surface: "#FFFFFF",
  border: "#E2E8F0",
  brand: "#3B82F6",
  brandStrong: "#2563EB",
  text: "#1E293B",
  textMuted: "#64748B",
  success: "#22C55E",
  warning: "#F59E0B",
  danger: "#EF4444",
};

// 📦 Category Options
const categoryOptions = [
  { label: "All", value: "ALL" },
  { label: "Feed", value: "FEED" },
  { label: "Medicine", value: "MEDICINE" },
  { label: "Equipment", value: "EQUIPMENT" },
  { label: "Maintenance", value: "MAINTENANCE" },
  { label: "Labor", value: "LABOR" },
  { label: "Other", value: "OTHER" },
];

const ExpenseRecordScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [totalSpent, setTotalSpent] = useState(0);
  const [error, setError] = useState<string | null>(null);

const fetchExpenses = useCallback(async () => {
  try {
    setLoading(true);
    setError(null);

    // we still read userId, in case you use it later
    const userId = await AsyncStorage.getItem("userId");

    // ✅ fetch all expenses
    const response = await getAllExpenses();
    const allExpenses = Array.isArray(response)
      ? response
      : response.data || [];

    console.log("✅ Expenses fetched:", allExpenses.length);

    // ❌ REMOVE this filtering — user is @JsonIgnored in backend
    // const userExpenses = allExpenses.filter((e: any) => e.user?.id === Number(userId));

    // ✅ instead, just show all (or filter later by category only)
    setExpenses(allExpenses);
    setFilteredExpenses(allExpenses);
    calculateTotal(allExpenses);
  } catch (error: any) {
    console.error("❌ Failed to load expenses:", error);
    let errorMessage =
      error.message ||
      "Failed to load expenses. Please check your connection and try again.";
    if (errorMessage.includes("403") || errorMessage.includes("Access denied")) {
      errorMessage =
        "Access denied. You don't have permission to view expense records.";
    }
    setError(errorMessage);
    Alert.alert("Error Loading Expenses", errorMessage, [
      { text: "Retry", onPress: fetchExpenses },
      { text: "OK", style: "cancel" },
    ]);
  } finally {
    setLoading(false);
  }
}, []);

  const calculateTotal = (data: any[]) => {
    const total = data.reduce((sum, item) => {
      const price = parseFloat(item.itemPrice) || 0;
      const quantity = parseFloat(item.itemQuantity) || 0;
      const cost = parseFloat(item.totalCost) || price * quantity;
      return sum + cost;
    }, 0);
    setTotalSpent(total);
  };

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchExpenses();
    setRefreshing(false);
  };

  useEffect(() => {
    if (selectedCategory === "ALL") {
      setFilteredExpenses(expenses);
      calculateTotal(expenses);
    } else {
      const filtered = expenses.filter(
        (e) => e.itemCategory === selectedCategory
      );
      setFilteredExpenses(filtered);
      calculateTotal(filtered);
    }
  }, [selectedCategory, expenses]);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "FEED":
        return ["#22C55E", "#16A34A"];
      case "MEDICINE":
        return ["#3B82F6", "#1D4ED8"];
      case "EQUIPMENT":
        return ["#F59E0B", "#D97706"];
      case "MAINTENANCE":
        return ["#8B5CF6", "#7C3AED"];
      case "LABOR":
        return ["#EC4899", "#DB2777"];
      default:
        return ["#6B7280", "#4B5563"];
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.brandStrong} />
        <Text style={styles.loadingText}>Loading expenses...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>⚠️ {error}</Text>
        <Pressable style={styles.retryButton} onPress={fetchExpenses}>
          <Text style={styles.retryText}>🔄 Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#2563EB", "#1E3A8A"]} style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Total Spent</Text>
        <Text style={styles.summaryAmount}>₹ {totalSpent.toFixed(2)}</Text>
      </LinearGradient>

      <View style={styles.filterRow}>
        <Text style={styles.filterLabel}>Filter by Category:</Text>
        <Dropdown
          data={categoryOptions}
          labelField="label"
          valueField="value"
          value={selectedCategory}
          onChange={(item: { value: React.SetStateAction<string>; }) => setSelectedCategory(item.value)}
          style={styles.dropdown}
          placeholderStyle={styles.placeholderText}
          selectedTextStyle={styles.selectedText}
        />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredExpenses.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.noData}>No expenses found.</Text>
            <Pressable
              style={styles.addButton}
              onPress={() =>
                (navigation as any).navigate("AddExpense" as never)
              }
            >
              <Text style={styles.addButtonText}>➕ Add Your First Expense</Text>
            </Pressable>
          </View>
        ) : (
          filteredExpenses.map((expense, index) => (
            <LinearGradient
              key={expense.id || index}
              colors={getCategoryColor(expense.itemCategory)}
              style={styles.expenseCard}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{expense.itemName}</Text>
                  <Text style={styles.itemCategory}>{expense.itemCategory}</Text>
                  <Text style={styles.itemShop}>
                    🏪 {expense.itemShopName || "Unknown Shop"}
                  </Text>
                  <Text style={styles.itemDate}>
                    📅 {moment(expense.purchaseDate).format("DD MMM YYYY")}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={styles.amountText}>
                    ₹{" "}
                    {expense.totalCost
                      ? expense.totalCost.toFixed(2)
                      : (expense.itemPrice * expense.itemQuantity).toFixed(2)}
                  </Text>
                  <Pressable
                    style={styles.editBtn}
                    onPress={() =>
                      (navigation as any).navigate("AddExpense" as never, {
                        expenseData: expense,
                      })
                    }
                  >
                    <Text style={styles.editText}>✏️ Edit</Text>
                  </Pressable>
                </View>
              </View>
            </LinearGradient>
          ))
        )}
      </ScrollView>
    </View>
  );
};

export default ExpenseRecordScreen;

// 💅 Styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg, paddingHorizontal: 12 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, color: theme.textMuted },
  summaryCard: {
    marginTop: 20,
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
  },
  summaryTitle: { color: "#fff", fontSize: 16, fontWeight: "500" },
  summaryAmount: { color: "#fff", fontSize: 28, fontWeight: "700", marginTop: 6 },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
  },
  filterLabel: { fontSize: 14, fontWeight: "600", color: theme.text },
  dropdown: {
    width: 160,
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: theme.border,
  },
  placeholderText: { color: theme.textMuted },
  selectedText: { color: theme.text },
  expenseCard: {
    marginVertical: 8,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  itemName: { fontSize: 18, fontWeight: "700", color: "#fff" },
  itemCategory: { fontSize: 14, color: "#F0FDF4", marginBottom: 4 },
  itemShop: { fontSize: 13, color: "#E0E7FF" },
  itemDate: { fontSize: 12, color: "#CBD5E1" },
  amountText: { fontSize: 18, fontWeight: "700", color: "#fff", marginBottom: 8 },
  editBtn: {
    backgroundColor: "#FFFFFF33",
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  editText: { color: "#fff", fontSize: 14 },
  noData: {
    textAlign: "center",
    color: theme.textMuted,
    marginTop: 40,
    fontSize: 16,
  },
  addButton: {
    backgroundColor: theme.brand,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 20,
  },
  addButtonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  errorText: {
    color: theme.danger,
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: theme.brand,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  retryText: { color: "#fff", fontWeight: "600" },
});
