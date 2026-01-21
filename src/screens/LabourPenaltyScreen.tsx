// src/screens/LabourPenaltyScreen.tsx

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
import { DrawerScreenProps } from "@react-navigation/drawer";
import { RootDrawerParamList, RootStackParamList } from "../navigation/types";

import { getLabourById } from "../services/labourService";
import {
  addPenalty,
  getPenaltyHistory,
  markPenaltyPaid,
  PenaltyEntry,
} from "../services/penaltyService";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

type Props = NativeStackScreenProps<RootStackParamList, "LabourPenalty">;

export default function LabourPenaltyScreen({ route }: Props) {
  const { labourId } = route.params;

  const [labour, setLabour] = useState<any>(null);
  const [penalties, setPenalties] = useState<PenaltyEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const [date, setDate] = useState("");
  const [extraLeaves, setExtraLeaves] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    loadAll();
  }, []);

  const today = () => new Date().toISOString().slice(0, 10);

  const loadAll = async () => {
    try {
      setLoading(true);
      const l = await getLabourById(labourId);
      setLabour(l);

      const list = await getPenaltyHistory(labourId);
      setPenalties(list || []);
    } catch (e) {
      Alert.alert("Error", "Failed to load penalties");
    } finally {
      setLoading(false);
    }
  };

  const onAddPenalty = async () => {
    if (!amount || !extraLeaves) {
      Alert.alert("Validation", "Amount and extra leaves are required");
      return;
    }

    try {
      await addPenalty({
        labourId,
        date: date || today(),
        extraLeaves: Number(extraLeaves),
        penaltyAmount: Number(amount),
        reason: reason || "Extra leaves",
      });
      Alert.alert("Success", "Penalty recorded");
      setDate("");
      setExtraLeaves("");
      setAmount("");
      setReason("");
      loadAll();
    } catch (e: any) {
      Alert.alert("Error", e?.response?.data || "Failed to add penalty");
    }
  };

  const onMarkPaid = async (p: PenaltyEntry) => {
    try {
      await markPenaltyPaid(p.id, { notes: "Marked paid from app" });
      Alert.alert("Success", "Penalty marked as paid");
      loadAll();
    } catch (e) {
      Alert.alert("Error", "Failed to mark penalty");
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#777" }}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>{labour?.labourName}</Text>
      <Text style={styles.sub}>Leave Penalties & Deductions</Text>

      {/* CREATE PENALTY */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Add Penalty</Text>

        <Text style={styles.label}>Date (yyyy-MM-dd)</Text>
        <TextInput
          style={styles.input}
          value={date}
          onChangeText={setDate}
          placeholder={today()}
        />

        <Text style={styles.label}>Extra Leaves (count)</Text>
        <TextInput
          style={styles.input}
          value={extraLeaves}
          onChangeText={setExtraLeaves}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Penalty Amount (₹)</Text>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Reason (optional)</Text>
        <TextInput
          style={styles.input}
          value={reason}
          onChangeText={setReason}
          placeholder="More than allowed leaves"
        />

        <TouchableOpacity style={styles.primaryBtn} onPress={onAddPenalty}>
          <Text style={styles.btnText}>Save Penalty</Text>
        </TouchableOpacity>
      </View>

      {/* LIST */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Penalty History</Text>
        {penalties.length === 0 ? (
          <Text style={{ color: "#666" }}>No penalties added yet.</Text>
        ) : (
          penalties.map((p) => (
            <View key={p.id} style={styles.penaltyRow}>
              <View>
                <Text style={{ fontWeight: "600" }}>
                  {p.date} • ₹{p.penaltyAmount}
                </Text>
                <Text style={{ color: "#555" }}>
                  Extra Leaves: {p.extraLeaves} • {p.reason}
                </Text>
                <Text style={{ color: p.status === "PAID" ? "#16A34A" : "#DC2626" }}>
                  Status: {p.status}
                  {p.paidDate ? ` • Paid on ${p.paidDate}` : ""}
                </Text>
              </View>

              {p.status === "UNPAID" && (
                <TouchableOpacity
                  style={styles.smallBtn}
                  onPress={() => onMarkPaid(p)}
                >
                  <Text style={styles.smallBtnText}>Mark Paid</Text>
                </TouchableOpacity>
              )}
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

  penaltyRow: {
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
});
