// src/screens/LabourPenaltyScreen.tsx

import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, Alert, Pressable } from "react-native";
import { Card, Text, Button, TextInput, ActivityIndicator, Chip } from "react-native-paper";

import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";

import { getLabourById } from "../services/labourService";
import {
  addPenalty,
  getPenaltyHistory,
  markPenaltyPaid,
  PenaltyEntry,
} from "../services/penaltyService";

type Props = NativeStackScreenProps<RootStackParamList, "LabourPenalty">;

const today = () => new Date().toISOString().slice(0, 10);

const formatNumber = (num: any) => {
  if (num == null || isNaN(num)) return "0";
  return Number(num).toLocaleString("en-IN", { maximumFractionDigits: 0 });
};

export default function LabourPenaltyScreen({ route, navigation }: Props) {
  const { labourId } = route.params;

  const [labour, setLabour] = useState<any>(null);
  const [penalties, setPenalties] = useState<PenaltyEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const [date, setDate] = useState(today());
  const [extraLeaves, setExtraLeaves] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      setLoading(true);

      const l = await getLabourById(labourId);
      setLabour(l);

      const list = await getPenaltyHistory(labourId);
      setPenalties(list || []);
    } catch (e: any) {
      Alert.alert("Error", e?.response?.data || "Failed to load penalties");
    } finally {
      setLoading(false);
    }
  };

  const unpaidTotal = penalties
    .filter((p) => p.status === "UNPAID")
    .reduce((sum, p) => sum + (p.penaltyAmount || 0), 0);

  const paidTotal = penalties
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + (p.penaltyAmount || 0), 0);

  const onAddPenalty = async () => {
    if (!extraLeaves.trim() || Number(extraLeaves) <= 0) {
      Alert.alert("Validation", "Extra leaves must be > 0");
      return;
    }
    if (!amount.trim() || Number(amount) <= 0) {
      Alert.alert("Validation", "Penalty amount must be > 0");
      return;
    }

    try {
      setSaving(true);

      await addPenalty({
        labourId,
        date: date || today(),
        extraLeaves: Number(extraLeaves),
        penaltyAmount: Number(amount),
        reason: reason || "Extra leaves",
      });

      Alert.alert("Success ✅", "Penalty recorded");

      setDate(today());
      setExtraLeaves("");
      setAmount("");
      setReason("");

      loadAll();
    } catch (e: any) {
      Alert.alert("Error", e?.response?.data || "Failed to add penalty");
    } finally {
      setSaving(false);
    }
  };

  const onMarkPaid = async (p: PenaltyEntry) => {
    Alert.alert(
      "Mark Paid?",
      `Penalty ₹${formatNumber(p.penaltyAmount)}\nDate: ${p.date}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Mark Paid",
          style: "default",
          onPress: async () => {
            try {
              await markPenaltyPaid(p.id, { notes: "Marked paid from app" });
              Alert.alert("Done ✅", "Penalty marked as PAID");
              loadAll();
            } catch (e: any) {
              Alert.alert("Error", e?.response?.data || "Failed to mark paid");
            }
          },
        },
      ]
    );
  };

  if (loading) {
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
        <Text style={styles.heroSub}>Penalty & Extra Leaves</Text>

        <View style={styles.summaryRow}>
          <View style={styles.summaryBoxOrange}>
            <Text style={styles.summaryLabel}>Unpaid</Text>
            <Text style={styles.summaryValueOrange}>₹{formatNumber(unpaidTotal)}</Text>
          </View>
          <View style={styles.summaryBoxGreen}>
            <Text style={styles.summaryLabel}>Paid</Text>
            <Text style={styles.summaryValueGreen}>₹{formatNumber(paidTotal)}</Text>
          </View>
        </View>
      </View>

      {/* ADD PENALTY */}
      <Card style={styles.glassCard}>
        <Text style={styles.cardTitle}>Add Penalty</Text>

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
          label="Extra Leaves (count)"
          value={extraLeaves}
          onChangeText={setExtraLeaves}
          keyboardType="numeric"
          style={styles.input}
          outlineStyle={styles.inputOutline}
        />

        <TextInput
          mode="outlined"
          label="Penalty Amount (₹)"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          style={styles.input}
          outlineStyle={styles.inputOutline}
        />

        <TextInput
          mode="outlined"
          label="Reason (optional)"
          value={reason}
          onChangeText={setReason}
          style={styles.input}
          outlineStyle={styles.inputOutline}
        />

        <Button
          mode="contained"
          buttonColor="#F97316"
          style={styles.btn}
          loading={saving}
          disabled={saving}
          onPress={onAddPenalty}
        >
          Save Penalty
        </Button>
      </Card>

      {/* HISTORY */}
      <Card style={styles.glassCard}>
        <View style={styles.rowBetween}>
          <Text style={styles.cardTitle}>Penalty History</Text>
          <Pressable onPress={loadAll}>
            <Text style={{ color: "#22C55E", fontWeight: "900" }}>Refresh</Text>
          </Pressable>
        </View>

        {penalties.length === 0 ? (
          <Text style={{ color: "#9CA3AF", marginTop: 6 }}>
            No penalties recorded yet.
          </Text>
        ) : (
          penalties.map((p) => (
            <View key={p.id} style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTop}>
                  {p.date} • ₹{formatNumber(p.penaltyAmount)}
                </Text>

                <Text style={styles.itemSub}>
                  Extra Leaves: {p.extraLeaves}{" "}
                  {p.reason ? `• ${p.reason}` : ""}
                </Text>

                <Text style={styles.itemStatus}>
                  Status:{" "}
                  <Text
                    style={{
                      color: p.status === "PAID" ? "#22C55E" : "#F97316",
                      fontWeight: "900",
                    }}
                  >
                    {p.status}
                  </Text>
                  {p.paidDate ? ` • Paid on ${p.paidDate}` : ""}
                </Text>
              </View>

              {p.status === "UNPAID" ? (
                <Chip
                  mode="flat"
                  style={styles.payChip}
                  textStyle={{ color: "#022C22", fontWeight: "900" }}
                  onPress={() => onMarkPaid(p)}
                >
                  Mark Paid
                </Chip>
              ) : (
                <Chip
                  mode="outlined"
                  style={styles.paidChip}
                  textStyle={{ color: "#22C55E", fontWeight: "900" }}
                >
                  Paid ✅
                </Chip>
              )}
            </View>
          ))
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#020014", padding: 12 },
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

  summaryRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  summaryLabel: { color: "#9CA3AF", fontSize: 12 },

  summaryBoxOrange: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "rgba(249,115,22,0.12)",
    borderWidth: 1,
    borderColor: "rgba(249,115,22,0.35)",
  },
  summaryValueOrange: {
    color: "#F97316",
    fontWeight: "900",
    fontSize: 16,
    marginTop: 2,
  },

  summaryBoxGreen: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "rgba(34,197,94,0.12)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.35)",
  },
  summaryValueGreen: {
    color: "#22C55E",
    fontWeight: "900",
    fontSize: 16,
    marginTop: 2,
  },

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
    marginBottom: 6,
  },

  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "rgba(148,163,184,0.15)",
  },
  itemTop: { color: "#E5E7EB", fontWeight: "900" },
  itemSub: { color: "#9CA3AF", marginTop: 2, fontSize: 12 },
  itemStatus: { color: "#9CA3AF", marginTop: 4, fontSize: 12 },

  payChip: { backgroundColor: "#22C55E", borderRadius: 999 },
  paidChip: { borderRadius: 999, borderColor: "#22C55E" },
});
