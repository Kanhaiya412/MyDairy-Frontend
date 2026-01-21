// src/screens/LabourContractScreen.tsx

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
  TouchableOpacity,
} from "react-native";

import { getLabourById } from "../services/labourService";
import {
  getActiveContract,
  getContractHistory,
  createContract,
  closeContract,
  ContractType,
} from "../services/contractService";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";

// ✅ FIX THIS:
type Props = NativeStackScreenProps<RootStackParamList, "LabourContract">;

export default function LabourContractScreen({ route }: Props) {
  const { labourId } = route.params;

  const [labour, setLabour] = useState<any>(null);
  const [activeContract, setActiveContract] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // form state
  const [contractType, setContractType] = useState<ContractType>("YEARLY");
  const [amount, setAmount] = useState("");
  const [startDate, setStartDate] = useState(""); // yyyy-MM-dd
  const [endDate, setEndDate] = useState(""); // yyyy-MM-dd
  const [allowedLeaves, setAllowedLeaves] = useState("21");
  const [interest, setInterest] = useState("0.02");

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      setLoading(true);
      const l = await getLabourById(labourId);
      setLabour(l);

      const ac = await getActiveContract(labourId);
      setActiveContract(ac || null);

      const hist = await getContractHistory(labourId);
      setHistory(hist || []);
    } catch (e) {
      Alert.alert("Error", "Failed to load contract data");
    } finally {
      setLoading(false);
    }
  };

  const onCreateContract = async () => {
    if (!amount || !startDate || !endDate) {
      Alert.alert("Validation", "Please fill amount, start & end date");
      return;
    }

    try {
      await createContract({
        labourId,
        contractType,
        contractAmount: Number(amount),
        startDate,
        endDate,
        allowedLeaves: allowedLeaves ? Number(allowedLeaves) : undefined,
        monthlyInterestRate: interest ? Number(interest) : undefined,
      });
      Alert.alert("Success", "Contract created");
      loadAll();
    } catch (e: any) {
      Alert.alert("Error", e?.response?.data || "Failed to create contract");
    }
  };

  const onCloseContract = async () => {
    if (!activeContract) return;

    try {
      await closeContract(activeContract.id, undefined); // backend can default endDate = today
      Alert.alert("Success", "Contract closed");
      loadAll();
    } catch (e) {
      Alert.alert("Error", "Failed to close contract");
    }
  };

  if (loading || !labour) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#777" }}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>{labour.labourName}</Text>
      <Text style={styles.sub}>Contract Setup</Text>

      {/* ACTIVE CONTRACT SECTION */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Active Contract</Text>
        {activeContract ? (
          <>
            <Text>Type: {activeContract.contractType}</Text>
            <Text>Amount: ₹{activeContract.contractAmount}</Text>
            <Text>
              Period: {activeContract.startDate} → {activeContract.endDate}
            </Text>
            <Text>Allowed Leaves: {activeContract.allowedLeaves}</Text>
            <Text>Interest / month: {activeContract.monthlyInterestRate}</Text>

            <TouchableOpacity style={styles.dangerBtn} onPress={onCloseContract}>
              <Text style={styles.btnText}>Close Contract</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text style={{ color: "#666" }}>No active contract.</Text>
        )}
      </View>

      {/* CREATE / EDIT FORM (only if no active contract) */}
      {!activeContract && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Create Contract</Text>

          <Text style={styles.label}>Contract Type</Text>
          <View style={styles.row}>
            {(["YEARLY", "MONTHLY", "DAILY"] as ContractType[]).map((t) => {
              const isActive = contractType === t;
              return (
                <TouchableOpacity
                  key={t}
                  style={[styles.chip, isActive && styles.chipActive]}
                  onPress={() => setContractType(t)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      isActive && styles.chipTextActive,
                    ]}
                  >
                    {t}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.label}>Contract Amount (₹)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />

          <Text style={styles.label}>Start Date (yyyy-MM-dd)</Text>
          <TextInput
            style={styles.input}
            value={startDate}
            onChangeText={setStartDate}
            placeholder="2025-01-01"
          />

          <Text style={styles.label}>End Date (yyyy-MM-dd)</Text>
          <TextInput
            style={styles.input}
            value={endDate}
            onChangeText={setEndDate}
            placeholder="2026-01-01"
          />

          <Text style={styles.label}>Allowed Leaves (per year)</Text>
          <TextInput
            style={styles.input}
            value={allowedLeaves}
            keyboardType="numeric"
            onChangeText={setAllowedLeaves}
          />

          <Text style={styles.label}>Monthly Interest Rate</Text>
          <TextInput
            style={styles.input}
            value={interest}
            keyboardType="numeric"
            onChangeText={setInterest}
            placeholder="0.02"
          />

          <TouchableOpacity style={styles.primaryBtn} onPress={onCreateContract}>
            <Text style={styles.btnText}>Save Contract</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* HISTORY */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Contract History</Text>
        {history.length === 0 ? (
          <Text style={{ color: "#666" }}>No previous contracts.</Text>
        ) : (
          history.map((c) => (
            <View key={c.id} style={styles.historyItem}>
              <Text style={{ fontWeight: "600" }}>
                {c.contractType} • ₹{c.contractAmount}
              </Text>
              <Text style={{ color: "#555" }}>
                {c.startDate} → {c.endDate}
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

  row: { flexDirection: "row", marginTop: 4 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    marginRight: 6,
  },
  chipActive: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  chipText: { fontSize: 12, color: "#374151" },
  chipTextActive: { color: "#FFFFFF", fontWeight: "700" },

  primaryBtn: {
    backgroundColor: "#16A34A",
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 14,
  },
  dangerBtn: {
    backgroundColor: "#DC2626",
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 12,
  },
  btnText: { color: "white", textAlign: "center", fontWeight: "700" },

  historyItem: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
  },
});
