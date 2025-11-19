// AddMilkScreen.tsx — PREMIUM GLASS VERSION (Final + No Prefill)

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import moment from "moment";
import DateTimePicker from "@react-native-community/datetimepicker";
import { addMilkEntry, getMilkEntries } from "../services/milkService";

const theme = {
  bg: "#0F172A",
  surface: "#0B1220",
  glass: "rgba(255,255,255,0.06)",
  border: "rgba(255,255,255,0.1)",
  white: "#FFFFFF",
  cyan: "#06B6D4",
  blue: "#2563EB",
  muted: "#94A3B8",
  green: "#10B981",
  red: "#EF4444",
};

const AddMilkScreen = ({ navigation }: any) => {
  const [milkQuantity, setMilkQuantity] = useState("");
  const [fat, setFat] = useState("");
  const [fatPrice, setFatPrice] = useState("8");

  const [total, setTotal] = useState("0");
  const [isEditing, setIsEditing] = useState(false);

  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);

  const [shift, setShift] = useState<"MORNING" | "EVENING">("MORNING");
  const [date, setDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  /* --------------------------------------------------------
      LOAD USER
  -------------------------------------------------------- */
  useEffect(() => {
    (async () => {
      const id = await AsyncStorage.getItem("userId");
      if (id) setUserId(Number(id));
      setShift(moment().hour() < 12 ? "MORNING" : "EVENING");
    })();
  }, []);

  /* --------------------------------------------------------
      AUTO CALCULATE TOTAL
  -------------------------------------------------------- */
  useEffect(() => {
    const qty = Number(milkQuantity) || 0;
    const f = Number(fat) || 0;
    const price = Number(fatPrice) || 0;

    setTotal((qty * f * price).toFixed(2));
  }, [milkQuantity, fat, fatPrice]);

  /* --------------------------------------------------------
      DUPLICATE CHECK
  -------------------------------------------------------- */
  const checkDuplicate = async (checkDate: string, checkShift: string) => {
    if (!userId) return false;

    const m = moment(checkDate).month();
    const y = moment(checkDate).year();

    const records = await getMilkEntries(userId, m, y);

    return records.some(
      (e: any) => e.date === checkDate && e.shift === checkShift
    );
  };

  /* --------------------------------------------------------
      SAVE ENTRY
  -------------------------------------------------------- */
  const handleSave = async () => {
    if (!milkQuantity.trim() || !fat.trim()) {
      Alert.alert("Missing Info", "Please fill all required fields.");
      return;
    }

    if (!userId) {
      Alert.alert("Error", "User ID not found.");
      return;
    }

    const formattedDate = moment(date).format("YYYY-MM-DD");

    if (await checkDuplicate(formattedDate, shift)) {
      Alert.alert(
        "Duplicate Entry ❌",
        `Entry already exists for ${formattedDate} (${shift}).`
      );
      return;
    }

    setLoading(true);

    try {
      const entry = {
        userId,
        day: moment(date).format("dddd").toUpperCase(),
        date: formattedDate,
        shift,
        milkQuantity: Number(milkQuantity),
        fat: Number(fat),
        fatPrice: Number(fatPrice),
      };

      await addMilkEntry(entry);

      Alert.alert("Success", "Milk entry added!");

      setMilkQuantity("");
      setFat("");

    } catch (e) {
      Alert.alert("Error", "Could not save entry.");
    } finally {
      setLoading(false);
    }
  };

  /* --------------------------------------------------------
      MAIN UI
  -------------------------------------------------------- */
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.header}>Add Milk Entry 🥛</Text>

        <View style={styles.card}>
          {/* DATE */}
          <Text style={styles.label}>Date</Text>

          <Pressable
            style={styles.input}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.inputText}>
              {moment(date).format("DD MMM YYYY")}
            </Text>
          </Pressable>

          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              maximumDate={new Date()}
              display="default"
              onChange={(e, d) => {
                setShowDatePicker(false);
                if (d) setDate(d);
              }}
            />
          )}

          {/* SHIFT */}
          <Text style={[styles.label, { marginTop: 12 }]}>Shift</Text>

          <View style={styles.shiftRow}>
            {["MORNING", "EVENING"].map((s) => (
              <Pressable
                key={s}
                onPress={() => setShift(s as any)}
                style={[
                  styles.shiftBtn,
                  shift === s && styles.shiftActive,
                ]}
              >
                <Text
                  style={[
                    styles.shiftTxt,
                    shift === s && styles.shiftTxtActive,
                  ]}
                >
                  {s === "MORNING" ? "Morning" : "Evening"}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* INPUTS */}
          <Text style={styles.label}>Milk Quantity (L)</Text>
          <TextInput
            style={styles.input}
            value={milkQuantity}
            onChangeText={setMilkQuantity}
            keyboardType="numeric"
            placeholder="e.g. 12.5"
            placeholderTextColor={theme.muted}
          />

          <Text style={styles.label}>Fat (%)</Text>
          <TextInput
            style={styles.input}
            value={fat}
            onChangeText={setFat}
            keyboardType="numeric"
            placeholder="e.g. 4.2"
            placeholderTextColor={theme.muted}
          />

          {/* FAT PRICE */}
          <View style={styles.row}>
            <Text style={styles.label}>Fat Price (₹)</Text>

            <Pressable onPress={() => setIsEditing(!isEditing)}>
              <Text style={styles.edit}>{isEditing ? "Done" : "Edit"}</Text>
            </Pressable>
          </View>

          <TextInput
            style={[styles.input, !isEditing && { opacity: 0.4 }]}
            value={fatPrice}
            editable={isEditing}
            keyboardType="numeric"
            onChangeText={setFatPrice}
          />

          {/* TOTAL */}
          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>Total Payment</Text>
            <Text style={styles.totalValue}>₹ {total}</Text>
          </View>

          {/* SAVE BUTTON */}
          <Pressable
            onPress={handleSave}
            disabled={loading}
            style={({ pressed }) => [
              styles.saveBtn,
              pressed && { opacity: 0.7 },
            ]}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveTxt}>Save Entry</Text>
            )}
          </Pressable>

          {/* VIEW RECORD BUTTON */}
          <Pressable
            onPress={() => navigation.navigate("MilkRecord")}
            style={({ pressed }) => [
              styles.recordBtnGlass,
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text style={styles.recordTxtGlass}>📊 View Milk Records</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default AddMilkScreen;

/* --------------------------------------------------------
      STYLES
-------------------------------------------------------- */
const styles = StyleSheet.create({
  container: { padding: 18 },

  header: {
    fontSize: 22,
    fontWeight: "800",
    color: theme.white,
    textAlign: "center",
    marginBottom: 14,
  },

  card: {
    backgroundColor: theme.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },

  label: {
    fontSize: 14,
    color: theme.muted,
    fontWeight: "600",
    marginBottom: 6,
  },

  input: {
    backgroundColor: theme.glass,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 14,
    color: theme.white,
    marginBottom: 12,
  },

  inputText: { color: theme.white, fontSize: 15 },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },

  edit: { color: theme.blue, fontSize: 13, fontWeight: "700" },

  shiftRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  shiftBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: theme.glass,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: "center",
    marginHorizontal: 4,
  },

  shiftActive: {
    backgroundColor: "rgba(37,99,235,0.25)",
    borderColor: theme.blue,
  },

  shiftTxt: { color: theme.muted, fontWeight: "700" },

  shiftTxtActive: { color: theme.white },

  totalBox: {
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "rgba(16,185,129,0.08)",
    borderWidth: 1,
    borderColor: theme.green,
    alignItems: "center",
  },

  totalLabel: { color: theme.green, fontSize: 14 },

  totalValue: {
    color: theme.green,
    fontSize: 22,
    fontWeight: "800",
    marginTop: 4,
  },

  saveBtn: {
    backgroundColor: theme.blue,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 18,
    alignItems: "center",
    shadowColor: theme.blue,
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },

  saveTxt: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
  },

  recordBtnGlass: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },

  recordTxtGlass: {
    color: theme.white,
    fontWeight: "800",
    fontSize: 16,
  },
});
