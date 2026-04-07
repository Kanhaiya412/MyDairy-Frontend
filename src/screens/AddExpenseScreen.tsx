import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { Dropdown } from "react-native-element-dropdown";
import moment from "moment";
import { addExpense, updateExpense, Expense } from "../services/expenseService.ts";
import { useNavigation, useRoute } from "@react-navigation/native";

// 🎨 Modern Theme
const theme = {
  bg: "#F1F5F9",
  surface: "#FFFFFF",
  accent: "#2563EB",
  accentLight: "#60A5FA",
  text: "#0F172A",
  textMuted: "#64748B",
  border: "#E2E8F0",
};

// Dropdown options
const categoryOptions = [
  { label: "Feed", value: "FEED" },
  { label: "Medicine", value: "MEDICINE" },
  { label: "Equipment", value: "EQUIPMENT" },
  { label: "Maintenance", value: "MAINTENANCE" },
  { label: "Labor", value: "LABOR" },
  { label: "Other", value: "OTHER" },
];

const AddExpenseScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);
  const [expenseId, setExpenseId] = useState<number | null>(null);
  const fadeAnim = useState(new Animated.Value(0))[0];

  const [form, setForm] = useState<Expense>({
    userId: 0,
    cattleId: "",
    itemId: "",
    itemCategory: "",
    itemName: "",
    itemQuality: "",
    itemQuantity: 1,
    itemPrice: 0,
    totalCost: 0,
    itemShopName: "",
    itemBuyer: "",
    shopOwner: "",
    purchaseDate: moment().format("YYYY-MM-DD"),
    purchaseDay: moment().format("dddd"),
    itemShop: "",
    remarks: "",
    status: "ACTIVE",
  });

  // Fade animation mount
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  // Load user ID
  useEffect(() => {
    const loadUser = async () => {
      const userId = await AsyncStorage.getItem("userId");
      if (userId) setForm((f) => ({ ...f, userId: parseInt(userId) }));
    };
    loadUser();
  }, []);

  // Edit mode
  useEffect(() => {
    if (route.params && (route.params as any).expenseData) {
      const expenseData = (route.params as any).expenseData;
      setIsUpdate(true);
      setExpenseId(expenseData.id);
      setForm({
        ...form,
        ...expenseData,
        purchaseDate: expenseData.purchaseDate || moment().format("YYYY-MM-DD"),
        purchaseDay: expenseData.purchaseDay || moment().format("dddd"),
      });
    }
  }, [route.params]);

  const handleChange = (key: keyof Expense, value: any) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleDateConfirm = (date: Date) => {
    handleChange("purchaseDate", moment(date).format("YYYY-MM-DD"));
    handleChange("purchaseDay", moment(date).format("dddd"));
    setShowDatePicker(false);
  };

  const handleSubmit = async () => {
    if (!form.itemName || !form.itemCategory || !form.itemPrice) {
      Alert.alert("⚠️ Missing Data", "Please fill required fields: Name, Category, Price");
      return;
    }

    try {
      setLoading(true);
      if (isUpdate && expenseId) {
        await updateExpense(expenseId, form);
        Alert.alert("✅ Updated", "Expense updated successfully!");
      } else {
        await addExpense(form);
        Alert.alert("✅ Added", "Expense added successfully!");
      }
      navigation.goBack();
    } catch (error: any) {
      console.error("Expense Error:", error);
      Alert.alert("❌ Error", error.message || "Failed to save expense");
    } finally {
      setLoading(false);
    }
  };

  const totalCost = (form.itemQuantity || 0) * (form.itemPrice || 0);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={{ paddingBottom: 180 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerCard}>
            <Text style={styles.title}>{isUpdate ? "✏️ Edit Expense" : "➕ Add Expense"}</Text>
            <Text style={styles.subtitle}>Record your farm expense details</Text>
          </View>

          {/* Cattle ID */}
          <TextInput
            style={styles.input}
            placeholder="Cattle ID (optional)"
            placeholderTextColor={theme.textMuted}
            value={form.cattleId}
            onChangeText={(t) => handleChange("cattleId", t)}
          />

          {/* Item Name */}
          <TextInput
            style={styles.input}
            placeholder="Item Name"
            placeholderTextColor={theme.textMuted}
            value={form.itemName}
            onChangeText={(t) => handleChange("itemName", t)}
          />

          {/* Item Quality */}
          <TextInput
            style={styles.input}
            placeholder="Item Quality (optional)"
            placeholderTextColor={theme.textMuted}
            value={form.itemQuality}
            onChangeText={(t) => handleChange("itemQuality", t)}
          />

          {/* Category */}
          <Text style={styles.label}>Category</Text>
          <Dropdown
            data={categoryOptions}
            labelField="label"
            valueField="value"
            placeholder="Select Category"
            value={form.itemCategory}
            onChange={(item) => handleChange("itemCategory", item.value)}
            style={styles.dropdown}
            placeholderStyle={styles.placeholderText}
            selectedTextStyle={styles.dateText}
          />

          {/* Quantity & Price */}
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.half]}
              placeholder="Quantity"
              keyboardType="numeric"
              value={form.itemQuantity?.toString() || ""}
              onChangeText={(t) => handleChange("itemQuantity", Number(t))}
            />
            <TextInput
              style={[styles.input, styles.half]}
              placeholder="Price per unit (₹)"
              keyboardType="numeric"
              value={form.itemPrice?.toString() || ""}
              onChangeText={(t) => handleChange("itemPrice", Number(t))}
            />
          </View>

          {/* Auto-calculated Total */}
          {totalCost > 0 && (
            <View style={styles.totalBox}>
              <Text style={styles.totalText}>💰 Total Cost:</Text>
              <Text style={styles.totalValue}>₹{totalCost.toFixed(2)}</Text>
            </View>
          )}

          {/* Purchase Date */}
          <Text style={styles.label}>Purchase Date</Text>
          <Pressable style={styles.dateInput} onPress={() => setShowDatePicker(true)}>
            <Text style={form.purchaseDate ? styles.dateText : styles.placeholderText}>
              {form.purchaseDate}
            </Text>
            <Text>📅</Text>
          </Pressable>

          {/* Shop Name */}
          <TextInput
            style={styles.input}
            placeholder="Shop Name"
            value={form.itemShopName}
            onChangeText={(t) => handleChange("itemShopName", t)}
          />

          {/* Shop Owner */}
          <TextInput
            style={styles.input}
            placeholder="Shop Owner (optional)"
            value={form.shopOwner}
            onChangeText={(t) => handleChange("shopOwner", t)}
          />

          {/* Buyer Name */}
          <TextInput
            style={styles.input}
            placeholder="Buyer Name"
            value={form.itemBuyer}
            onChangeText={(t) => handleChange("itemBuyer", t)}
          />

          {/* Remarks */}
          <TextInput
            style={[styles.input, { height: 90, textAlignVertical: "top" }]}
            placeholder="Remarks (optional)"
            multiline
            value={form.remarks}
            onChangeText={(t) => handleChange("remarks", t)}
          />

          {/* Save Button */}
          <Pressable
            style={[styles.button, loading && { opacity: 0.6 }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>
                {isUpdate ? "💾 Update Expense" : "➕ Save Expense"}
              </Text>
            )}
          </Pressable>
        </ScrollView>

        <DateTimePickerModal
          isVisible={showDatePicker}
          mode="date"
          onConfirm={handleDateConfirm}
          onCancel={() => setShowDatePicker(false)}
          date={new Date(form.purchaseDate || new Date())}
        />
      </Animated.View>
    </KeyboardAvoidingView>
  );
};

export default AddExpenseScreen;

// 💅 Styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  scrollContainer: { flex: 1, paddingHorizontal: 20, paddingTop: 10 },
  headerCard: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    marginBottom: 20,
    elevation: 4,
  },
  title: { fontSize: 24, fontWeight: "800", color: theme.accent },
  subtitle: { color: theme.textMuted, marginTop: 4 },
  label: { marginTop: 10, fontWeight: "600", color: theme.textMuted },
  input: {
    backgroundColor: theme.surface,
    borderColor: theme.border,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
    color: theme.text,
    fontSize: 15,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 14,
    marginTop: 8,
    backgroundColor: "#F8FAFC",
  },
  dateInput: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: theme.surface,
    borderColor: theme.border,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
  },
  dateText: { color: theme.text, fontSize: 16 },
  placeholderText: { color: theme.textMuted, fontSize: 16 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  half: { width: "48%" },
  totalBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
    backgroundColor: "#EFF6FF",
    padding: 12,
    borderRadius: 10,
  },
  totalText: { fontWeight: "600", color: theme.textMuted },
  totalValue: { fontWeight: "700", color: theme.accent, fontSize: 16 },
  button: {
    backgroundColor: theme.accent,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 25,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
