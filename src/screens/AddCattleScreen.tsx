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
import { Dropdown } from "react-native-element-dropdown";
import moment from "moment";

import {
  addCattleEntry,
  updateCattleEntry,
  CattleEntry,
  CattleBreed,
  CattleCategory,
  CattleGender,
} from "../services/cattleService";

import { useNavigation, useFocusEffect } from "@react-navigation/native";

/* ──────────────────────────────────────────────
        MATCHING WHITE + BLUE DAIRY THEME
────────────────────────────────────────────── */
const theme = {
  bg: "#EDF2FF",
  surface: "#FFFFFF",
  surfaceSoft: "#F4F6FF",
  border: "#D4DCFF",
  brand: "#2563EB",
  brandStrong: "#1D4ED8",
  text: "#0F172A",
  textMuted: "#64748B",
};

/* ------------------- Options ------------------- */
const genderOptions = [
  { label: "Male", value: "MALE" },
  { label: "Female", value: "FEMALE" },
];

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
  { label: "Other Cow", value: "OTHER_COW" },
];

const buffaloBreeds = [
  { label: "Murrah", value: "MURRAH" },
  { label: "Jafrawadi", value: "JAFRAWADI" },
  { label: "Mehsana", value: "MEHSANA" },
  { label: "Badhawari", value: "BADHAWARI" },
  { label: "Banni", value: "BANNI" },
  { label: "Other Buffalo", value: "OTHER_BUFFALO" },
];

/* ------------------------------------------------------------
                     MAIN SCREEN
------------------------------------------------------------ */
const AddCattleScreen: React.FC = () => {
  const navigation = useNavigation();

  const [loading, setLoading] = useState(false);
  const [showPurchasePicker, setShowPurchasePicker] = useState(false);
  const [showSoldPicker, setShowSoldPicker] = useState(false);

  const [isUpdate, setIsUpdate] = useState(false);
  const [cattleRecordId, setCattleRecordId] = useState<number | null>(null);

  const [form, setForm] = useState({
    cattleId: "",
    cattleName: "",
    cattleCategory: "COW",
    cattleBreed: "GIR",
    cattlePurchaseDate: "",
    cattleDay: "",
    cattlePurchaseFrom: "",
    cattlePurchasePrice: "",
    cattleSoldDate: "",
    cattleSoldTo: "",
    cattleSoldPrice: "",
    totalCattle: "1",
    gender: "FEMALE",
  });

  /* ------------ Load Edit Data If Present --------------- */
  useFocusEffect(
    React.useCallback(() => {
      const loadEditData = async () => {
        const stored = await AsyncStorage.getItem("cattleDataForUpdate");

        if (stored) {
          const data = JSON.parse(stored);
          setIsUpdate(true);
          setCattleRecordId(data.id);

          setForm({
            cattleId: data.cattleId || "",
            cattleName: data.cattlename || "",
            gender: data.gender || "MALE",
            cattleCategory: data.cattleCategory || "COW",
            cattleBreed: data.cattleBreed || "GIR",
            cattlePurchaseDate: data.cattlePurchaseDate || "",
            cattleDay: data.cattleDay || "",
            cattlePurchaseFrom: data.cattlePurchaseFrom || "",
            cattlePurchasePrice: data.cattlePurchasePrice?.toString() || "",
            cattleSoldDate: data.cattleSoldDate || "",
            cattleSoldTo: data.cattleSoldTo || "",
            cattleSoldPrice: data.cattleSoldPrice?.toString() || "",
            totalCattle: data.totalCattle?.toString() || "1",
          });

          await AsyncStorage.removeItem("cattleDataForUpdate");
        } else {
          setIsUpdate(false);
          setCattleRecordId(null);
        }
      };

      loadEditData();
    }, [])
  );

  const handleChange = (key: string, value: any) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  /* ------------------- Date Picker ---------------------- */
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

  /* ------------------------ SUBMIT ----------------------- */
  const handleSubmit = async () => {
    if (!form.cattleId || !form.cattleName || !form.cattlePurchaseDate) {
      Alert.alert("Missing Fields", "Please fill all required fields.");
      return;
    }

    try {
      setLoading(true);

      const userId = Number(await AsyncStorage.getItem("userId"));

      const payload: CattleEntry = {
        userId,
        cattleId: form.cattleId,
        cattleName: form.cattleName,
        gender: form.gender as CattleGender,
        cattleCategory: form.cattleCategory as CattleCategory,
        cattleBreed: form.cattleBreed as CattleBreed,
        cattlePurchaseDate: form.cattlePurchaseDate,
        cattleDay: form.cattleDay,
        cattlePurchaseFrom: form.cattlePurchaseFrom,
        cattlePurchasePrice: Number(form.cattlePurchasePrice),
        cattleSoldDate: form.cattleSoldDate || undefined,
        cattleSoldTo: form.cattleSoldTo || undefined,
        cattleSoldPrice: form.cattleSoldPrice
          ? Number(form.cattleSoldPrice)
          : undefined,
        totalCattle: Number(form.totalCattle) || 1,
      };

      if (isUpdate && cattleRecordId) {
        await updateCattleEntry(cattleRecordId, payload);
        Alert.alert("Updated", "Cattle record updated successfully!");
      } else {
        await addCattleEntry(payload);
        Alert.alert("Success", "Cattle added successfully!");
      }

      navigation.goBack();
    } catch (e: any) {
      Alert.alert("Error", e.response?.data || e.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------- UI --------------------------- */
  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
        <Text style={styles.title}>
          {isUpdate ? "Update Cattle" : "🐄 Add New Cattle"}
        </Text>

        <View style={styles.card}>
          {/* Cattle ID */}
          <Text style={styles.label}>Cattle ID</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter cattle ID"
            value={form.cattleId}
            onChangeText={(t) => handleChange("cattleId", t)}
          />

          {/* Name */}
          <Text style={styles.label}>Cattle Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter cattle name"
            value={form.cattleName}
            onChangeText={(t) => handleChange("cattleName", t)}
          />

          {/* Gender */}
          <Text style={styles.label}>Gender</Text>
          <Dropdown
            data={genderOptions}
            labelField="label"
            valueField="value"
            value={form.gender}
            style={styles.dropdown}
            placeholder="Select Gender"
            onChange={(item) => handleChange("gender", item.value)}
          />

          {/* Category */}
          <Text style={styles.label}>Category</Text>
          <Dropdown
            data={categoryOptions}
            labelField="label"
            valueField="value"
            value={form.cattleCategory}
            style={styles.dropdown}
            onChange={(item) => handleChange("cattleCategory", item.value)}
          />

          {/* Breed */}
          <Text style={styles.label}>Breed</Text>
          <Dropdown
            data={form.cattleCategory === "COW" ? cowBreeds : buffaloBreeds}
            labelField="label"
            valueField="value"
            value={form.cattleBreed}
            style={styles.dropdown}
            onChange={(item) => handleChange("cattleBreed", item.value)}
          />

          {/* Purchase Date */}
          <Text style={styles.label}>Purchase Date</Text>
          <Pressable style={styles.dateInput} onPress={() => setShowPurchasePicker(true)}>
            <Text style={styles.dateText}>
              {form.cattlePurchaseDate || "Select Purchase Date"}
            </Text>
            <Text>📅</Text>
          </Pressable>

          {/* Day */}
          <Text style={styles.label}>Day</Text>
          <TextInput style={styles.input} editable={false} value={form.cattleDay} />

          {/* Purchase Info */}
          <Text style={styles.label}>Purchased From</Text>
          <TextInput
            style={styles.input}
            placeholder="Person / Place"
            value={form.cattlePurchaseFrom}
            onChangeText={(t) => handleChange("cattlePurchaseFrom", t)}
          />

          <Text style={styles.label}>Purchase Price (₹)</Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            keyboardType="numeric"
            value={form.cattlePurchasePrice}
            onChangeText={(t) => handleChange("cattlePurchasePrice", t)}
          />

          {/* Sold Info */}
          <Text style={styles.label}>Sold Date (optional)</Text>
          <Pressable style={styles.dateInput} onPress={() => setShowSoldPicker(true)}>
            <Text style={styles.dateText}>
              {form.cattleSoldDate || "Select Sold Date"}
            </Text>
            <Text>📅</Text>
          </Pressable>

          <Text style={styles.label}>Sold To</Text>
          <TextInput
            style={styles.input}
            placeholder="Person / Place"
            value={form.cattleSoldTo}
            onChangeText={(t) => handleChange("cattleSoldTo", t)}
          />

          <Text style={styles.label}>Sold Price (₹)</Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            keyboardType="numeric"
            value={form.cattleSoldPrice}
            onChangeText={(t) => handleChange("cattleSoldPrice", t)}
          />

          {/* Total Cattle */}
          <Text style={styles.label}>Total Cattle</Text>
          <TextInput
            style={styles.input}
            placeholder="1"
            keyboardType="numeric"
            value={form.totalCattle}
            onChangeText={(t) => handleChange("totalCattle", t)}
          />
        </View>

        {/* SAVE BUTTON */}
        <Pressable
          style={[styles.button, loading && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>
              {isUpdate ? "Update Cattle" : "Add Cattle"}
            </Text>
          )}
        </Pressable>
      </ScrollView>

      {/* Date pickers */}
      <DateTimePickerModal
        isVisible={showPurchasePicker}
        mode="date"
        date={form.cattlePurchaseDate ? new Date(form.cattlePurchaseDate) : new Date()}
        onConfirm={(date) => handleDateConfirm("purchase", date)}
        onCancel={() => setShowPurchasePicker(false)}
      />

      <DateTimePickerModal
        isVisible={showSoldPicker}
        mode="date"
        date={form.cattleSoldDate ? new Date(form.cattleSoldDate) : new Date()}
        onConfirm={(date) => handleDateConfirm("sold", date)}
        onCancel={() => setShowSoldPicker(false)}
      />
    </View>
  );
};

export default AddCattleScreen;

/* ------------------------------ STYLES ------------------------------ */
const styles = StyleSheet.create({
  container: { flex: 1 },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: theme.text,
    marginBottom: 16,
  },

  card: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 18,
  },

  label: {
    color: theme.textMuted,
    fontSize: 14,
    fontWeight: "600",
    marginTop: 14,
  },

  input: {
    backgroundColor: theme.surfaceSoft,
    borderColor: theme.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    color: theme.text,
  },

  dropdown: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
    marginTop: 8,
    backgroundColor: theme.surfaceSoft,
  },

  dateInput: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: theme.surfaceSoft,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },

  dateText: { color: theme.text, fontSize: 15 },

  button: {
    backgroundColor: theme.brandStrong,
    borderRadius: 14,
    marginTop: 26,
    paddingVertical: 14,
    alignItems: "center",
  },

  btnText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
  },
});
