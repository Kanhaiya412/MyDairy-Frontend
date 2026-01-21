// src/screens/LabourAdvanceScreen.tsx

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";

import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";

import { getLabourById } from "../services/labourService";
import {
  addSalaryAdvance,
  getAdvanceHistory,
  getPendingAdvances,
  settleAdvance,
  SalaryAdvanceEntry,
} from "../services/advanceService";

type Props = NativeStackScreenProps<RootStackParamList, "LabourAdvance">;

export default function LabourAdvanceScreen({ route }: Props) {
  const { labourId } = route.params;

  const [labour, setLabour] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [date, setDate] = useState<string>(today());
  const [amount, setAmount] = useState("");
  const [remarks, setRemarks] = useState("");

  const [month, setMonth] = useState<number>(new Date().getMonth() + 1); // 1–12
  const [year, setYear] = useState<number>(new Date().getFullYear());

  const [pending, setPending] = useState<SalaryAdvanceEntry[]>([]);
  const [history, setHistory] = useState<SalaryAdvanceEntry[]>([]);

  useEffect(() => {
    loadAll();
  }, [month, year]);

  function today() {
    return new Date().toISOString().slice(0, 10); // yyyy-MM-dd
  }

  const loadAll = async () => {
    try {
      setLoading(true);

      const l = await getLabourById(labourId);
      setLabour(l);

      const pend = await getPendingAdvances(labourId, month, year);
      setPending(pend || []);

      const hist = await getAdvanceHistory(labourId); // full history
      setHistory(hist || []);
    } catch (e) {
      console.log("Advance load error", e);
      Alert.alert("Error", "Failed to load advances");
    } finally {
      setLoading(false);
    }
  };

  const onAddAdvance = async () => {
    if (!amount.trim()) {
      Alert.alert("Validation", "Amount is required");
      return;
    }

    try {
      await addSalaryAdvance({
        labourId,
        amount: Number(amount),
        date: date || today(),
        remarks: remarks || undefined,
      });

      Alert.alert("Success", "Advance recorded");
      setAmount("");
      setRemarks("");
      setDate(today());

      loadAll();
    } catch (e: any) {
      console.log("Add advance error", e?.response?.data || e);
      Alert.alert("Error", e?.response?.data || "Failed to add advance");
    }
  };

  const onSettle = async (adv: SalaryAdvanceEntry) => {
    try {
      await settleAdvance(adv.id);
      Alert.alert("Success", "Advance marked as settled");
      loadAll();
    } catch (e) {
      console.log("Settle advance error", e);
      Alert.alert("Error", "Failed to settle advance");
    }
  };

  const changeMonth = (delta: number) => {
    let m = month + delta;
    let y = year;
    if (m < 1) {
      m = 12;
      y = year - 1;
    } else if (m > 12) {
      m = 1;
      y = year + 1;
    }
    setMonth(m);
    setYear(y);
  };

  const pendingTotal = pending.reduce((sum, a) => sum + (a.amount || 0), 0);

  if (loading && !labour) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#777" }}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>{labour?.labourName}</Text>
      <Text style={styles.sub}>Salary Advance (No interest)</Text>

      {/* MONTH PICKER + SUMMARY */}
      <View style={styles.card}>
        <View style={styles.monthRow}>
          <TouchableOpacity
            style={styles.monthArrow}
            onPress={() => changeMonth(-1)}
          >
            <Text style={styles.monthArrowText}>◀</Text>
          </TouchableOpacity>

          <Text style={styles.monthText}>
            {month}/{year}
          </Text>

          <TouchableOpacity
            style={styles.monthArrow}
            onPress={() => changeMonth(1)}
          >
            <Text style={styles.monthArrowText}>▶</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.summaryText}>
          Pending advances this month:{" "}
          <Text style={{ fontWeight: "700" }}>₹{pendingTotal.toFixed(2)}</Text>
        </Text>
      </View>

      {/* ADD ADVANCE */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Give Salary Advance</Text>

        <Text style={styles.label}>Date (yyyy-MM-dd)</Text>
        <TextInput
          style={styles.input}
          value={date}
          onChangeText={setDate}
          placeholder={today()}
        />

        <Text style={styles.label}>Amount (₹)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />

        <Text style={styles.label}>Remarks (optional)</Text>
        <TextInput
          style={styles.input}
          value={remarks}
          onChangeText={setRemarks}
          placeholder="e.g. Emergency, festival, etc."
        />

        <TouchableOpacity style={styles.primaryBtn} onPress={onAddAdvance}>
          <Text style={styles.btnText}>Save Advance</Text>
        </TouchableOpacity>
      </View>

      {/* PENDING LIST */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Pending this Month</Text>
        {pending.length === 0 ? (
          <Text style={{ color: "#6B7280" }}>No pending advances.</Text>
        ) : (
          pending.map((a) => (
            <View key={a.id} style={styles.rowBetween}>
              <View>
                <Text style={{ fontWeight: "600" }}>
                  {a.date} • ₹{a.amount}
                </Text>
                {a.remarks ? (
                  <Text style={{ color: "#4B5563" }}>{a.remarks}</Text>
                ) : null}
              </View>

              <TouchableOpacity
                style={styles.smallBtn}
                onPress={() => onSettle(a)}
              >
                <Text style={styles.smallBtnText}>Settle</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      {/* FULL HISTORY */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>All Advance History</Text>
        {history.length === 0 ? (
          <Text style={{ color: "#6B7280" }}>No advances recorded yet.</Text>
        ) : (
          history.map((a) => (
            <View key={a.id} style={styles.historyItem}>
              <Text style={{ fontWeight: "600" }}>
                {a.date} • ₹{a.amount}
              </Text>
              {a.remarks ? (
                <Text style={{ color: "#4B5563" }}>{a.remarks}</Text>
              ) : null}
              <Text
                style={{
                  color: a.status === "SETTLED" ? "#16A34A" : "#DC2626",
                  fontSize: 12,
                }}
              >
                Status: {a.status}
                {a.settledDate ? ` • Settled on ${a.settledDate}` : ""}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#F9FAFB" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  header: { fontSize: 22, fontWeight: "700", marginBottom: 4 },
  sub: { color: "#6B7280", marginBottom: 12 },

  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    elevation: 2,
  },
  cardTitle: { fontSize: 18, fontWeight: "700", marginBottom: 8 },

  label: { marginTop: 8, marginBottom: 4, color: "#374151" },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
  },

  primaryBtn: {
    backgroundColor: "#2563EB",
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 14,
  },
  btnText: { color: "white", textAlign: "center", fontWeight: "700" },

  monthRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  monthArrow: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  monthArrowText: { fontSize: 16, color: "#111827" },
  monthText: { fontSize: 16, fontWeight: "700", marginHorizontal: 8 },

  summaryText: { color: "#374151" },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
  },

  smallBtn: {
    backgroundColor: "#16A34A",
    height: 32,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  smallBtnText: { color: "white", fontSize: 12, fontWeight: "700" },

  historyItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
  },
});
