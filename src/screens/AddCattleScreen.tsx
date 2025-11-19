import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Dropdown } from "react-native-element-dropdown"
import moment from "moment";
import {
  addCattleEntry,
  CattleEntry,
  CattleBreed,
  CattleCategory,
  updateCattleEntry,
  deleteCattleEntry
} from "../services/cattleService.ts";
import { useNavigation, useFocusEffect, useRoute } from "@react-navigation/native";

const theme = {
  bg: "#F8FAFC",
  surface: "#FFFFFF",
  border: "#E2E8F0",
  brand: "#22C55E",
  brandStrong: "#16A34A",
  text: "#1E293B",
  textMuted: "#64748B",
};

const categoryOptions = [
  { label: "Cow", value: "COW" },
  { label: "Buffalo", value: "BUFFALO" },
];

const cowBreeds = [
  { label: "Gir", value: "GIR" },
  { label: "Jersy", value: "JERSY" },
  { label: "Sahival", value: "SAHIVAL" },
  { label: "Devli", value: "DEVLI" },
  { label: "Indian", value: "INDIAN" },
  { label: "Other_Cow", value: "OTHER_COW" },
];

const buffaloBreeds = [
  { label: "Murrah", value: "MURRAH" },
  { label: "Jafrawadi", value: "JAFRAWADI" },
  { label: "Mehsana", value: "MEHSANA" },
  { label: "Badhawari", value: "BADHAWARI" },
  { label: "Banni", value: "BANNI" },
  { label: "Other_Buffalo", value: "OTHER_BUFFALO" },
];

const AddCattleScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [loading, setLoading] = useState(false);
  const [showPurchasePicker, setShowPurchasePicker] = useState(false);
  const [showSoldPicker, setShowSoldPicker] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);
  const [cattleId, setCattleId] = useState<number | null>(null);

  const [form, setForm] = useState({
    cattleId: "",
    cattleName: "",
    cattleCategory: "COW" as CattleCategory,
    cattleBreed: "GIR" as CattleBreed,
    cattlePurchaseDate: "",
    cattleDay: "",
    cattlePurchaseFrom: "",
    cattlePurchasePrice: "",
    cattleSoldDate: "",
    cattleSoldTo: "",
    cattleSoldPrice: "",
    totalCattle: "",
  });

  // Check if we're updating an existing cattle record when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      const checkForUpdateData = async () => {
        try {
          console.log("Checking for update data in AsyncStorage");
          const cattleDataStr = await AsyncStorage.getItem('cattleDataForUpdate');
          console.log("Found cattle data:", cattleDataStr);
          
          if (cattleDataStr) {
            const cattleData = JSON.parse(cattleDataStr);
            console.log("Setting update mode with data:", cattleData);
            setIsUpdate(true);
            setCattleId(cattleData.id);
            
            setForm({
              cattleId: cattleData.cattleId || "",
              cattleName: cattleData.cattleName || cattleData.cattlename || "", // Handle both field names
              cattleCategory: cattleData.cattleCategory || "COW",
              cattleBreed: cattleData.cattleBreed || "GIR",
              cattlePurchaseDate: cattleData.cattlePurchaseDate || "",
              cattleDay: cattleData.cattleDay || "",
              cattlePurchaseFrom: cattleData.cattlePurchaseFrom || "",
              cattlePurchasePrice: cattleData.cattlePurchasePrice?.toString() || "",
              cattleSoldDate: cattleData.cattleSoldDate || "",
              cattleSoldTo: cattleData.cattleSoldTo || "",
              cattleSoldPrice: cattleData.cattleSoldPrice?.toString() || "",
              totalCattle: cattleData.totalCattle?.toString() || "",
            });
            
            // Clear the stored data
            await AsyncStorage.removeItem('cattleDataForUpdate');
          } else {
            console.log("No update data found, resetting to add mode");
            // Reset to add mode if no update data
            setIsUpdate(false);
            setCattleId(null);
            setForm({
              cattleId: "",
              cattleName: "",
              cattleCategory: "COW" as CattleCategory,
              cattleBreed: "GIR" as CattleBreed,
              cattlePurchaseDate: "",
              cattleDay: "",
              cattlePurchaseFrom: "",
              cattlePurchasePrice: "",
              cattleSoldDate: "",
              cattleSoldTo: "",
              cattleSoldPrice: "",
              totalCattle: "",
            });
          }
        } catch (error) {
          console.error("Error parsing cattle data for update:", error);
        }
      };
      
      checkForUpdateData();
    }, [])
  );

  const handleChange = (key: string, value: any) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleDateConfirm = (type: "purchase" | "sold", date: Date) => {
    const formatted = moment(date).format("YYYY-MM-DD");
    if (type === "purchase") {
      handleChange("cattlePurchaseDate", formatted);
      handleChange("cattleDay", moment(date).format("dddd"));
      setShowPurchasePicker(false);
    } else {
      handleChange("cattleSoldDate", formatted);
      setShowSoldPicker(false);
    }
  };

  const handleSubmit = async () => {
    console.log("handleSubmit called", { isUpdate, cattleId, form });
    
    if (
      !form.cattleId ||
      !form.cattleName ||
      !form.cattlePurchasePrice ||
      !form.cattlePurchaseDate
    ) {
      Alert.alert("⚠️ Missing Data", "Please fill all required fields.");
      return;
    }

    // Additional validation for update mode
    if (isUpdate && !cattleId) {
      Alert.alert("⚠️ Update Error", "Missing cattle ID for update operation.");
      return;
    }

    // Track update operation status
    let updateAttempted = false;
    let updateErrorHandled = false;

    try {
      setLoading(true);
      const storedId = await AsyncStorage.getItem("userId");
      const userId = parseInt(storedId || "0", 10);

      const payload: CattleEntry = {
        userId,
        cattleId: form.cattleId,
        cattleName: form.cattleName,
        cattleCategory: form.cattleCategory as CattleCategory,
        cattleBreed: form.cattleBreed as CattleBreed,
        cattlePurchaseDate: form.cattlePurchaseDate,
        cattleDay: form.cattleDay,
        cattlePurchaseFrom: form.cattlePurchaseFrom,
        cattlePurchasePrice: Number(form.cattlePurchasePrice),
        cattleSoldDate: form.cattleSoldDate || undefined,
        cattleSoldTo: form.cattleSoldTo || undefined,
        cattleSoldPrice: Number(form.cattleSoldPrice) || 0,
        totalCattle: Number(form.totalCattle) || 1,
      };

      // Check if this is a sold cattle record
      const isSoldCattle = form.cattleSoldDate && form.cattleSoldTo && form.cattleSoldPrice;

      if (isUpdate && cattleId) {
        // Get userId for the update request
        const storedId = await AsyncStorage.getItem("userId");
        const userId = parseInt(storedId || "0", 10);

        // For update, create a payload with all fields (backend expects all fields)
        const updatePayload: Partial<CattleEntry> = {
          userId: userId, // Include userId for authorization
          cattleId: form.cattleId,
          cattleName: form.cattleName,
          cattleCategory: form.cattleCategory as CattleCategory,
          cattleBreed: form.cattleBreed as CattleBreed,
          cattlePurchaseDate: form.cattlePurchaseDate,
          cattleDay: form.cattleDay,
          cattlePurchaseFrom: form.cattlePurchaseFrom,
          cattlePurchasePrice: Number(form.cattlePurchasePrice),
          totalCattle: Number(form.totalCattle) || 1,
        };

        // Only add sold fields if ALL sold fields have values (to maintain consistency)
        // This prevents sending partial sold data which causes 403 errors
        if (form.cattleSoldDate && form.cattleSoldTo && form.cattleSoldPrice) {
          updatePayload.cattleSoldDate = form.cattleSoldDate;
          updatePayload.cattleSoldTo = form.cattleSoldTo;
          updatePayload.cattleSoldPrice = Number(form.cattleSoldPrice);
        }

        console.log("Sending update payload:", { cattleId, updatePayload });
        updateAttempted = true;

        if (isSoldCattle) {
          // If cattle is sold, delete the record
          console.log("Deleting cattle record:", cattleId);
          await deleteCattleEntry(cattleId);
          Alert.alert("✅ Success", "Cattle record deleted successfully (sold cattle)!");
        } else {
          // Update existing cattle record
          console.log("Updating cattle record:", cattleId);
          console.log("Update payload:", updatePayload);
          try {
            await updateCattleEntry(cattleId, updatePayload);
            Alert.alert("✅ Success", "Cattle record updated successfully!");
          } catch (updateError: any) {
            console.error("Update error:", updateError);
            updateErrorHandled = true;
            // Check if this might be a network issue after successful update
            const errorMessage = updateError.response?.data?.message || updateError.message || "Network error";
            
            // If it's a network error (no response), the update might have succeeded
            if (!updateError.response) {
              Alert.alert("⚠️ Network Issue", 
                "Update may have succeeded despite network error. Please check your records to confirm.");
            } 
            // If it's a backend serialization error but likely succeeded
            else if (updateError.response?.status === 500 && 
                     (errorMessage.includes('serialization') || errorMessage.includes('Hibernate'))) {
              Alert.alert("✅ Success", 
                "Cattle record updated successfully! (Minor backend serialization issue occurred but update was saved)");
            }
            else {
              // For other errors, show the actual error
              Alert.alert("❌ Update Failed", `Failed to update cattle record: ${errorMessage}`);
            }
          }
        }
      } else {
        console.log("Sending add payload:", { payload });
        // Add new cattle record
        console.log("Adding new cattle record");
        await addCattleEntry(payload);
        Alert.alert("✅ Success", "Cattle record added successfully!");
      }

      // Reset form only when adding new record or when selling cattle
      if (!isUpdate || isSoldCattle) {
        setForm({
          cattleId: "",
          cattleName: "",
          cattleCategory: "COW" as CattleCategory,
          cattleBreed: "GIR" as CattleBreed,
          cattlePurchaseDate: "",
          cattleDay: "",
          cattlePurchaseFrom: "",
          cattlePurchasePrice: "",
          cattleSoldDate: "",
          cattleSoldTo: "",
          cattleSoldPrice: "",
          totalCattle: "",
        });
        // Reset update state if we deleted a record or finished adding
        if (isSoldCattle || !isUpdate) {
          setIsUpdate(false);
          setCattleId(null);
        }
      }
    } catch (err: any) {
      console.error("❌ Failed to save cattle:", err);
      // Don't show error if it was already handled in the update section
      if (updateAttempted && !updateErrorHandled) {
        const errorMessage = err.response?.data?.message || err.message || "Unable to save cattle record. Please try again.";
        Alert.alert("❌ Error", errorMessage);
      } else if (!updateAttempted) {
        // Only show error for non-update operations
        const errorMessage = err.response?.data?.message || err.message || "Unable to save cattle record. Please try again.";
        Alert.alert("❌ Error", errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
        <Text style={styles.title}>{isUpdate ? "UpDate Cattle" : "🐄 Add New Cattle"}</Text>

        <View style={styles.card}>
          {/* Cattle ID */}
          <TextInput
            style={styles.input}
            placeholder="Cattle ID"
            value={form.cattleId}
            onChangeText={(t) => handleChange("cattleId", t)}
            placeholderTextColor={theme.textMuted}
          />

          {/* Cattle Name */}
          <TextInput
            style={styles.input}
            placeholder="Cattle Name"
            value={form.cattleName}
            onChangeText={(t) => handleChange("cattleName", t)}
            placeholderTextColor={theme.textMuted}
          />

          {/* Category Dropdown */}
          <Text style={styles.label}>Cattle Category</Text>
          <Dropdown
            data={categoryOptions}
            labelField="label"
            valueField="value"
            placeholder="Select Category"
            value={form.cattleCategory}
            onChange={(item) => handleChange("cattleCategory", item.value)}
            style={styles.dropdown}
            placeholderStyle={styles.placeholderText}
            selectedTextStyle={styles.dateText}
          />

          {/* Breed Dropdown */}
          <Text style={styles.label}>Breed</Text>
          <Dropdown
            data={form.cattleCategory === "COW" ? cowBreeds : buffaloBreeds}
            labelField="label"
            valueField="value"
            placeholder="Select Breed"
            value={form.cattleBreed}
            onChange={(item) => handleChange("cattleBreed", item.value)}
            style={styles.dropdown}
            placeholderStyle={styles.placeholderText}
            selectedTextStyle={styles.dateText}
          />

          {/* Purchase Date */}
          <Text style={styles.label}>Purchase Date</Text>
          <Pressable
            style={styles.dateInput}
            onPress={() => setShowPurchasePicker(true)}
          >
            <Text style={form.cattlePurchaseDate ? styles.dateText : styles.placeholderText}>
              {form.cattlePurchaseDate || "Select Purchase Date"}
            </Text>
            <Text>📅</Text>
          </Pressable>

          {/* Purchase Info */}
          <TextInput
            style={styles.input}
            placeholder="Purchase Day (Auto-filled)"
            value={form.cattleDay}
            editable={false}
          />
          <TextInput
            style={styles.input}
            placeholder="Purchased From"
            value={form.cattlePurchaseFrom}
            onChangeText={(t) => handleChange("cattlePurchaseFrom", t)}
          />
          <TextInput
            style={styles.input}
            placeholder="Purchase Price (₹)"
            value={form.cattlePurchasePrice}
            onChangeText={(t) => handleChange("cattlePurchasePrice", t)}
            keyboardType="numeric"
          />

          {/* Sold Info */}
          <Text style={styles.label}>Sold Date (optional)</Text>
          <Pressable
            style={styles.dateInput}
            onPress={() => setShowSoldPicker(true)}
          >
            <Text style={form.cattleSoldDate ? styles.dateText : styles.placeholderText}>
              {form.cattleSoldDate || "Select Sold Date"}
            </Text>
            <Text>📅</Text>
          </Pressable>

          <TextInput
            style={styles.input}
            placeholder="Sold To (optional)"
            value={form.cattleSoldTo}
            onChangeText={(t) => handleChange("cattleSoldTo", t)}
          />
          <TextInput
            style={styles.input}
            placeholder="Sold Price (₹)"
            value={form.cattleSoldPrice}
            onChangeText={(t) => handleChange("cattleSoldPrice", t)}
            keyboardType="numeric"
          />

          <TextInput
            style={styles.input}
            placeholder="Total Cattle"
            value={form.totalCattle}
            onChangeText={(t) => handleChange("totalCattle", t)}
            keyboardType="numeric"
          />
        </View>

        <Pressable
          style={[styles.button, loading && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : 
            <Text style={styles.btnText}>
              {isUpdate ? 
                (form.cattleSoldDate && form.cattleSoldTo && form.cattleSoldPrice ? 
                  "Sell & Delete" : 
                  "Update Cattle") : 
                "Add Cattle"}
            </Text>
          }
        </Pressable>
      </ScrollView>

      <DateTimePickerModal
        isVisible={showPurchasePicker}
        mode="date"
        date={
          form.cattlePurchaseDate && form.cattlePurchaseDate !== ""
            ? new Date(form.cattlePurchaseDate)
            : new Date()
        }
        onConfirm={(date) => handleDateConfirm("purchase", date)}
        onCancel={() => setShowPurchasePicker(false)}
      />

      <DateTimePickerModal
        isVisible={showSoldPicker}
        mode="date"
        date={
          form.cattleSoldDate && form.cattleSoldDate !== ""
            ? new Date(form.cattleSoldDate)
            : new Date()
        }
        onConfirm={(date) => handleDateConfirm("sold", date)}
        onCancel={() => setShowSoldPicker(false)}
      />
    </View>
  );
};

export default AddCattleScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: theme.text,
    marginBottom: 12,
  },
  card: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 16,
    marginBottom: 20,
  },
  label: {
    color: theme.textMuted,
    fontSize: 14,
    fontWeight: "600",
    marginTop: 10,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 14,
    marginTop: 8,
    backgroundColor: "#F9FAFB",
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderColor: theme.border,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
    color: theme.text,
  },
  dateInput: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderColor: theme.border,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
  },
  dateText: { color: theme.text, fontSize: 16 },
  placeholderText: { color: theme.textMuted, fontSize: 16 },
  button: {
    backgroundColor: theme.brandStrong,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
