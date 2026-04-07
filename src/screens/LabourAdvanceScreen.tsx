// src/screens/LabourAdvanceScreen.tsx

import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, Alert, Pressable } from "react-native";
import { Card, Text, Button, TextInput, ActivityIndicator, Chip } from "react-native-paper";

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

const today = () => new Date().toISOString().slice(0, 10);

const formatNumber = (num: any) => {
  if (num == null || isNaN(num)) return "0";
  return Number(num).toLocaleString("en-IN", { maximumFractionDigits: 0 });
};

export default function LabourAdvanceScreen({ route, navigation }: Props) {
  const { labourId } = route.params;

  const [labour, setLabour] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [date, setDate] = useState<string>(today());
  const [amount, setAmount] = useState("");
  const [remarks, setRemarks] = useState("");

  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());

  const [pending, setPending] = useState<SalaryAdvanceEntry[]>([]);
  const [history, setHistory] = useState<SalaryAdvanceEntry[]>([]);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAll();
  }, [month, year]);

  const loadAll = async () => {
    try {
      setLoading(true);

      const l = await getLabourById(labourId);
      setLabour(l);

      const pend = await getPendingAdvances(labourId, month, year);
      setPending(pend || []);

      const hist = await getAdvanceHistory(labourId);
      setHistory(hist || []);
    } catch (e: any) {
      console.log("Advance load error", e?.response?.data || e);
      Alert.alert("Error", "Failed to load advances");
    } finally {
      setLoading(false);
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

  const onAddAdvance = async () => {
    if (!amount.trim() || Number(amount) <= 0) {
      Alert.alert("Validation", "Enter valid amount");
      return;
    }

    try {
      setSaving(true);

      await addSalaryAdvance({
        labourId,
        amount: Number(amount),
        date: date || today(),
        remarks: remarks || undefined,
      });

      Alert.alert("Success ✅", "Advance saved");

      setAmount("");
      setRemarks("");
      setDate(today());

      loadAll();
    } catch (e: any) {
      console.log("Add advance error", e?.response?.data || e);
      Alert.alert("Error", e?.response?.data || "Failed to add advance");
    } finally {
      setSaving(false);
    }
  };

  const onSettle = async (adv: SalaryAdvanceEntry) => {
    Alert.alert(
      "Settle Advance?",
      `Mark this advance as SETTLED?\n₹${formatNumber(adv.amount)} on ${adv.date}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Settle",
          style: "default",
          onPress: async () => {
            try {
              await settleAdvance(adv.id);
              Alert.alert("Success ✅", "Advance settled");
              loadAll();
            } catch {
              Alert.alert("Error", "Failed to settle advance");
            }
          },
        },
      ]
    );
  };

  if (loading && !labour) {
    return (
      <View style={styles.center}>
        <ActivityIndicator animating />
        <Text style={{ color: "#9CA3AF", marginTop: 8 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 30 }}>
      {/* HERO */}
      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>{labour?.labourName || "Labour"}</Text>
        <Text style={styles.heroSub}>Salary Advance (No Interest)</Text>

        <View style={styles.monthRow}>
          <Pressable style={styles.monthBtn} onPress={() => changeMonth(-1)}>
            <Text style={styles.monthBtnText}>◀</Text>
          </Pressable>

          <Text style={styles.monthText}>
            {month}/{year}
          </Text>

          <Pressable style={styles.monthBtn} onPress={() => changeMonth(1)}>
            <Text style={styles.monthBtnText}>▶</Text>
          </Pressable>
        </View>

        <View style={styles.pendingBox}>
          <Text style={styles.pendingLabel}>Pending this month</Text>
          <Text style={styles.pendingValue}>₹{formatNumber(pendingTotal)}</Text>
        </View>
      </View>

      {/* ADD ADVANCE */}
      <Card style={styles.glassCard}>
        <Text style={styles.cardTitle}>Give Advance</Text>

        <TextInput
          mode="outlined"
          label="Date (yyyy-MM-dd)"
          value={date}
          onChangeText={setDate}
          style={styles.input}
          outlineStyle={styles.inputOutline}
        />

        <TextInput
          mode="outlined"
          label="Amount (₹)"
          value={amount}
          keyboardType="numeric"
          onChangeText={setAmount}
          style={styles.input}
          outlineStyle={styles.inputOutline}
        />

        <TextInput
          mode="outlined"
          label="Remarks (optional)"
          value={remarks}
          onChangeText={setRemarks}
          style={styles.input}
          outlineStyle={styles.inputOutline}
        />

        <Button
          mode="contained"
          buttonColor="#22C55E"
          style={styles.btn}
          loading={saving}
          disabled={saving}
          onPress={onAddAdvance}
        >
          Save Advance
        </Button>
      </Card>

      {/* PENDING LIST */}
      <Card style={styles.glassCard}>
        <Text style={styles.cardTitle}>Pending (This Month)</Text>

        {pending.length === 0 ? (
          <Text style={{ color: "#9CA3AF", marginTop: 6 }}>
            No pending advance ✅
          </Text>
        ) : (
          pending.map((a) => (
            <View key={a.id} style={styles.rowBetween}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTop}>
                  {a.date} • ₹{formatNumber(a.amount)}
                </Text>
                {a.remarks ? (
                  <Text style={styles.rowSub}>{a.remarks}</Text>
                ) : null}
              </View>

              <Chip
                mode="flat"
                style={styles.settleChip}
                textStyle={{ color: "#022C22", fontWeight: "900" }}
                onPress={() => onSettle(a)}
              >
                Settle
              </Chip>
            </View>
          ))
        )}
      </Card>

      {/* HISTORY */}
      <Card style={styles.glassCard}>
        <View style={styles.rowBetweenHeader}>
          <Text style={styles.cardTitle}>All Advance History</Text>
          <Pressable onPress={loadAll}>
            <Text style={{ color: "#22C55E", fontWeight: "800" }}>Refresh</Text>
          </Pressable>
        </View>

        {history.length === 0 ? (
          <Text style={{ color: "#9CA3AF", marginTop: 6 }}>
            No advances recorded yet.
          </Text>
        ) : (
          history.map((a) => (
            <View key={a.id} style={styles.historyItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTop}>
                  {a.date} • ₹{formatNumber(a.amount)}
                </Text>
                {a.remarks ? (
                  <Text style={styles.rowSub}>{a.remarks}</Text>
                ) : null}
                <Text style={{ marginTop: 4, color: "#9CA3AF", fontSize: 12 }}>
                  Status:{" "}
                  <Text
                    style={{
                      color: a.status === "SETTLED" ? "#22C55E" : "#F97316",
                      fontWeight: "800",
                    }}
                  >
                    {a.status}
                  </Text>
                  {a.settledDate ? ` • Settled on ${a.settledDate}` : ""}
                </Text>
              </View>
            </View>
          ))
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#020014",
    padding: 12,
  },
  center: {
    flex: 1,
    backgroundColor: "#020014",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },

  heroCard: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    backgroundColor: "rgba(10,10,30,0.95)",
    borderWidth: 1.2,
    borderColor: "rgba(129,140,248,0.6)",
  },
  heroTitle: { color: "#fff", fontSize: 20, fontWeight: "900" },
  heroSub: { color: "#9CA3AF", marginTop: 4 },

  monthRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    gap: 12,
  },
  monthBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.4)",
  },
  monthBtnText: { color: "#E5E7EB", fontWeight: "900" },
  monthText: { color: "#E5E7EB", fontWeight: "900", fontSize: 15 },

  pendingBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "rgba(34,197,94,0.12)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.35)",
  },
  pendingLabel: { color: "#9CA3AF", fontSize: 12 },
  pendingValue: { color: "#22C55E", fontWeight: "900", fontSize: 18, marginTop: 2 },

  glassCard: {
    borderRadius: 18,
    marginBottom: 12,
    backgroundColor: "rgba(11,14,40,0.9)",
    borderWidth: 1.2,
    borderColor: "rgba(129,140,248,0.8)",
    padding: 12,
  },
  cardTitle: { color: "#E5E7EB", fontWeight: "900", fontSize: 14 },

  input: { backgroundColor: "#111827", marginTop: 10 },
  inputOutline: { borderRadius: 12, borderColor: "rgba(148,163,184,0.8)" },

  btn: { marginTop: 12, borderRadius: 16 },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "rgba(148,163,184,0.15)",
  },

  rowBetweenHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },

  rowTop: { color: "#E5E7EB", fontWeight: "800" },
  rowSub: { color: "#9CA3AF", marginTop: 2, fontSize: 12 },

  settleChip: {
    backgroundColor: "#22C55E",
    borderRadius: 999,
  },

  historyItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "rgba(148,163,184,0.15)",
  },
});
