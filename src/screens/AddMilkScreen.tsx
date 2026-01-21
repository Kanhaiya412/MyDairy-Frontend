// AddMilkScreen.tsx — Dairy Professional White & Blue Theme
// Matches FarmerHome Concept-C dashboard UI

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
import { getCattleByUser } from "../services/cattleService";

// Same design language as FarmerHome (Concept C)
const theme = {
  bg: "#EDF2FF",          // page background
  surface: "#FFFFFF",     // cards
  surfaceSoft: "#F4F6FF", // subtle areas
  border: "#D4DCFF",
  text: "#0F172A",
  textMuted: "#64748B",
  brand: "#2563EB",
  brandStrong: "#1D4ED8",
  success: "#16A34A",
  danger: "#EF4444",
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

  // CATTLE DROPDOWN
  const [cattleList, setCattleList] = useState<any[]>([]);
  const [cattleId, setCattleId] = useState<number | null>(null);
  const [showCattleDropdown, setShowCattleDropdown] = useState(false);

  // --------------------------------------------------------
  // LOAD USER + CATTLE
  // --------------------------------------------------------
  useEffect(() => {
    (async () => {
      const id = await AsyncStorage.getItem("userId");
      if (id) {
        const parsed = Number(id);
        setUserId(parsed);
        loadCattle(parsed);
      }
      setShift(moment().hour() < 12 ? "MORNING" : "EVENING");
    })();
  }, []);

  const loadCattle = async (uid: number) => {
    try {
      const list = await getCattleByUser(uid);
      setCattleList(list || []);
    } catch (e) {
      console.log("❌ Failed to load cattle list", e);
    }
  };

  // --------------------------------------------------------
  // AUTO CALCULATE TOTAL
  // --------------------------------------------------------
  useEffect(() => {
    const qty = Number(milkQuantity) || 0;
    const f = Number(fat) || 0;
    const price = Number(fatPrice) || 0;

    setTotal((qty * f * price).toFixed(2));
  }, [milkQuantity, fat, fatPrice]);

  // --------------------------------------------------------
  // DUPLICATE CHECK
  // --------------------------------------------------------
  const checkDuplicate = async (checkDate: string, checkShift: string) => {
    if (!userId) return false;

    const m = moment(checkDate).month();
    const y = moment(checkDate).year();

    const records = await getMilkEntries(userId, m, y);

    return records?.some(
      (e: any) => e.date === checkDate && e.shift === checkShift
    );
  };

  // --------------------------------------------------------
  // SAVE ENTRY
  // --------------------------------------------------------
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
        cattleId: cattleId || undefined,
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
      setCattleId(null);
    } catch (e) {
      console.log("❌ Error while saving entry:", e);
      Alert.alert("Error", "Could not save entry.");
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------------
  // UI
  // --------------------------------------------------------
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* HEADER */}
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [
              styles.backBtn,
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text style={styles.backArrow}>←</Text>
          </Pressable>

          <View style={{ flex: 1 }}>
            <Text style={styles.header}>Add Milk Entry</Text>
            <Text style={styles.headerSub}>
              Capture today&apos;s collection & fat details
            </Text>
          </View>

          <View style={styles.headerEmojiWrap}>
            <Text style={styles.headerEmoji}>🥛</Text>
          </View>
        </View>

        {/* CARD */}
        <View style={styles.card}>
          {/* CATTLE DROPDOWN */}
          <Text style={styles.label}>Cattle (optional)</Text>

          <Pressable
            style={styles.input}
            onPress={() => setShowCattleDropdown(!showCattleDropdown)}
          >
            <Text style={styles.inputText}>
              {cattleId
                ? (() => {
                    const c = cattleList.find((x) => x.id === cattleId);
                    return c
                      ? `${c.cattlename} (${c.cattleId})`
                      : "Select Cattle";
                  })()
                : "No Cattle (General Entry)"}
            </Text>
          </Pressable>

          {showCattleDropdown && (
            <View style={styles.dropdown}>
              <Pressable
                style={styles.dropdownItem}
                onPress={() => {
                  setCattleId(null);
                  setShowCattleDropdown(false);
                }}
              >
                <Text style={styles.dropdownText}>No Cattle (General)</Text>
              </Pressable>

              {cattleList.map((c) => (
                <Pressable
                  key={c.id}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setCattleId(c.id);
                    setShowCattleDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownText}>
                    {c.cattlename} ({c.cattleId})
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          {/* DATE */}
          <Text style={[styles.label, { marginTop: 12 }]}>Date</Text>
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
            {["MORNING", "EVENING"].map((s) => {
              const active = shift === s;
              return (
                <Pressable
                  key={s}
                  onPress={() => setShift(s as any)}
                  style={[
                    styles.shiftBtn,
                    active && styles.shiftActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.shiftTxt,
                      active && styles.shiftTxtActive,
                    ]}
                  >
                    {s === "MORNING" ? "Morning" : "Evening"}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* MILK QTY */}
          <Text style={styles.label}>Milk Quantity (L)</Text>
          <TextInput
            style={styles.input}
            value={milkQuantity}
            onChangeText={setMilkQuantity}
            keyboardType="numeric"
            placeholder="e.g. 12.5"
            placeholderTextColor={theme.textMuted}
          />

          {/* FAT */}
          <Text style={styles.label}>Fat (%)</Text>
          <TextInput
            style={styles.input}
            value={fat}
            onChangeText={setFat}
            keyboardType="numeric"
            placeholder="e.g. 4.5"
            placeholderTextColor={theme.textMuted}
          />

          {/* FAT PRICE */}
          <View style={styles.row}>
            <Text style={styles.label}>Fat Price (₹)</Text>
            <Pressable onPress={() => setIsEditing(!isEditing)}>
              <Text style={styles.edit}>
                {isEditing ? "Done" : "Edit"}
              </Text>
            </Pressable>
          </View>

          <TextInput
            style={[
              styles.input,
              !isEditing && { opacity: 0.6 },
            ]}
            value={fatPrice}
            editable={isEditing}
            keyboardType="numeric"
            onChangeText={setFatPrice}
            placeholder="Price per fat unit"
            placeholderTextColor={theme.textMuted}
          />

          {/* TOTAL */}
          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>Estimated Payment</Text>
            <Text style={styles.totalValue}>₹ {total}</Text>
          </View>

          {/* SAVE BUTTON */}
          <Pressable
            onPress={handleSave}
            disabled={loading}
            style={({ pressed }) => [
              styles.saveBtn,
              pressed && { opacity: 0.85 },
              loading && { opacity: 0.7 },
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
              styles.recordBtn,
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text style={styles.recordTxt}>📊 View Milk Records</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default AddMilkScreen;

// --------------------------------------------------------
// STYLES
// --------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: theme.bg,
    flexGrow: 1,
  },

  // Header
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  backArrow: {
    fontSize: 18,
    color: theme.text,
  },
  header: {
    fontSize: 22,
    fontWeight: "800",
    color: theme.text,
  },
  headerSub: {
    fontSize: 13,
    color: theme.textMuted,
    marginTop: 2,
  },
  headerEmojiWrap: {
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: theme.surfaceSoft,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  headerEmoji: {
    fontSize: 22,
  },

  // Card
  card: {
    backgroundColor: theme.surface,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },

  label: {
    fontSize: 13,
    color: theme.textMuted,
    fontWeight: "600",
    marginBottom: 6,
  },

  input: {
    backgroundColor: theme.surfaceSoft,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 14,
    color: theme.text,
    marginBottom: 12,
  },
  inputText: {
    color: theme.text,
    fontSize: 15,
  },

  dropdown: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 12,
    overflow: "hidden",
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: theme.border,
  },
  dropdownText: { color: theme.text, fontSize: 14 },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  edit: {
    color: theme.brandStrong,
    fontSize: 13,
    fontWeight: "700",
  },

  // Shift buttons
  shiftRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  shiftBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: theme.surfaceSoft,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: "center",
    marginHorizontal: 4,
  },
  shiftActive: {
    backgroundColor: "#DBEAFE",
    borderColor: theme.brandStrong,
  },
  shiftTxt: {
    color: theme.textMuted,
    fontWeight: "700",
    fontSize: 13,
  },
  shiftTxtActive: {
    color: theme.brandStrong,
  },

  // Total
  totalBox: {
    marginTop: 16,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: theme.brandStrong,
    alignItems: "center",
  },
  totalLabel: {
    color: theme.brandStrong,
    fontSize: 13,
    fontWeight: "600",
  },
  totalValue: {
    color: theme.brandStrong,
    fontSize: 22,
    fontWeight: "800",
    marginTop: 4,
  },

  // Buttons
  saveBtn: {
    backgroundColor: theme.brandStrong,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 18,
    alignItems: "center",
    shadowColor: theme.brandStrong,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  saveTxt: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },

  recordBtn: {
    marginTop: 14,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    backgroundColor: theme.surfaceSoft,
    borderWidth: 1,
    borderColor: theme.border,
  },
  recordTxt: {
    color: theme.brandStrong,
    fontWeight: "700",
    fontSize: 15,
  },
});
