// src/screens/LabourLoanScreen.tsx

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
import { RootDrawerParamList } from "../navigation/types";

import { getLabourById } from "../services/labourService";
import { getActiveContract } from "../services/contractService";
import {
  getLoanSummary,
  getLoanTransactions,
  addLoanDisbursement,
  addLoanRepayment,
} from "../services/loanService";
import { RootStackParamList } from "../navigation/types";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

type Props = NativeStackScreenProps<RootStackParamList, "LabourLoan">;

export default function LabourLoanScreen({ route, navigation }: Props) {
  const { labourId } = route.params;

  const [labour, setLabour] = useState<any>(null);
  const [contract, setContract] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [txns, setTxns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [disAmount, setDisAmount] = useState("");
  const [disReason, setDisReason] = useState("");
  const [repAmount, setRepAmount] = useState("");
  const [repNotes, setRepNotes] = useState("");

  useEffect(() => {
    loadAll();
  }, []);

  const today = () => new Date().toISOString().slice(0, 10); // yyyy-MM-dd

  const loadAll = async () => {
    try {
      setLoading(true);
      const l = await getLabourById(labourId);
      setLabour(l);

     const ac = await getActiveContract(labourId);
      setContract(ac || null);

      if (ac) {
        // 1) summary now includes accountId
        const s = await getLoanSummary(ac.id);
        setSummary(s);

        // 2) use accountId for transactions
        const trs = await getLoanTransactions(s.accountId);
        setTxns(trs || []);
      } else {
        setSummary(null);
        setTxns([]);
      }
    } catch (e) {
      Alert.alert("Error", "Failed to load loan info");
    } finally {
      setLoading(false);
    }
  };

  const onDisburse = async () => {
    if (!contract) {
      Alert.alert("No Contract", "Create a contract first.");
      return;
    }
    if (!disAmount) {
      Alert.alert("Validation", "Enter amount");
      return;
    }
    try {
      await addLoanDisbursement(contract.id, {
        amount: Number(disAmount),
        date: today(),
        reason: disReason || "Loan from mobile app",
        notes: disReason || undefined,
      });
      Alert.alert("Success", "Loan disbursed");
      setDisAmount("");
      setDisReason("");
      loadAll();
    } catch (e: any) {
      Alert.alert("Error", e?.response?.data || "Failed to disburse");
    }
  };

  const onRepay = async () => {
    if (!contract) {
      Alert.alert("No Contract", "Create a contract first.");
      return;
    }
    if (!repAmount) {
      Alert.alert("Validation", "Enter amount");
      return;
    }
    try {
      await addLoanRepayment(contract.id, {
        amount: Number(repAmount),
        date: today(),
        notes: repNotes || "Repayment from mobile app",
      });
      Alert.alert("Success", "Repayment recorded");
      setRepAmount("");
      setRepNotes("");
      loadAll();
    } catch (e: any) {
      Alert.alert("Error", e?.response?.data || "Failed to record repayment");
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#777" }}>Loading...</Text>
      </View>
    );
  }

  if (!contract) {
    return (
      <View style={styles.center}>
        <Text style={{ marginBottom: 10 }}>
          No active contract for this labour.
        </Text>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigation.navigate("LabourContract", { labourId })}
        >
          <Text style={styles.btnText}>Create Contract</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>{labour?.labourName}</Text>
      <Text style={styles.sub}>Loan & Advance Management</Text>

      {/* SUMMARY */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Loan Summary</Text>
        {summary ? (
          <>
            <Text>Total Disbursed: ₹{summary.totalDisbursed}</Text>
            <Text>Total Repaid: ₹{summary.totalRepaid}</Text>
            <Text>Total Interest: ₹{summary.totalInterest}</Text>
            <Text style={{ fontWeight: "700" }}>
              Outstanding: ₹{summary.outstandingAmount}
            </Text>
          </>
        ) : (
          <Text style={{ color: "#666" }}>No loan account yet.</Text>
        )}
      </View>

      {/* DISBURSE SECTION */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Give Loan / Advance</Text>
        <Text style={styles.label}>Amount (₹)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={disAmount}
          onChangeText={setDisAmount}
        />
        <Text style={styles.label}>Reason (optional)</Text>
        <TextInput
          style={styles.input}
          value={disReason}
          onChangeText={setDisReason}
          placeholder="e.g. Family emergency"
        />

        <TouchableOpacity style={styles.primaryBtn} onPress={onDisburse}>
          <Text style={styles.btnText}>Disburse</Text>
        </TouchableOpacity>
      </View>

      {/* REPAY SECTION */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Record Repayment</Text>
        <Text style={styles.label}>Amount (₹)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={repAmount}
          onChangeText={setRepAmount}
        />
        <Text style={styles.label}>Notes (optional)</Text>
        <TextInput
          style={styles.input}
          value={repNotes}
          onChangeText={setRepNotes}
          placeholder="e.g. Paid in cash"
        />

        <TouchableOpacity style={styles.secondaryBtn} onPress={onRepay}>
          <Text style={styles.btnText}>Record Repayment</Text>
        </TouchableOpacity>
      </View>

      {/* TRANSACTIONS */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Transactions</Text>
        {txns.length === 0 ? (
          <Text style={{ color: "#666" }}>No transactions yet.</Text>
        ) : (
          txns.map((t) => (
            <View key={t.id} style={styles.txnItem}>
              <Text style={{ fontWeight: "600" }}>
                {t.txnDate} • {t.type}
              </Text>
              <Text>
                ₹{t.amount} {t.reason ? `• ${t.reason}` : ""}
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
    backgroundColor: "#16A34A",
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 12,
    minWidth: 140,
  },
  secondaryBtn: {
    backgroundColor: "#2563EB",
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 12,
  },
  btnText: { color: "white", textAlign: "center", fontWeight: "700" },

  txnItem: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
  },
});
