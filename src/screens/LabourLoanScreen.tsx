// src/screens/LabourLoanScreen.tsx

import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Pressable,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { Text, Button, TextInput, ActivityIndicator, IconButton, Card, Avatar } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import DateTimePickerModal from "react-native-modal-datetime-picker";

import { getLabourById } from "../services/labourService";
import {
  getLoanSummary,
  getLoanTransactions,
  addLoanDisbursement,
  addLoanRepayment,
  LoanTransaction,
  LoanSummaryResponse,
} from "../services/loanService";

type Props = NativeStackScreenProps<RootStackParamList, "LabourLoan">;

const todayStr = () => new Date().toISOString().slice(0, 10);

const formatDate = (dateStr: string) => {
  const [y, m, d] = dateStr.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${d} ${months[parseInt(m, 10) - 1]} ${y}`;
};

const formatNumber = (num: any) => {
  if (num == null || isNaN(num)) return "0";
  return Number(num).toLocaleString("en-IN", { maximumFractionDigits: 0 });
};

export default function LabourLoanScreen({ route, navigation }: Props) {
  const { labourId } = route.params;

  const [labour, setLabour] = useState<any>(null);
  const [summary, setSummary] = useState<LoanSummaryResponse | null>(null);
  const [txns, setTxns] = useState<LoanTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Forms
  const [disAmount, setDisAmount] = useState("");
  const [disReason, setDisReason] = useState("");
  const [disDate, setDisDate] = useState(todayStr());
  const [showDisDatePicker, setShowDisDatePicker] = useState(false);

  const [repAmount, setRepAmount] = useState("");
  const [repNotes, setRepNotes] = useState("");
  const [repDate, setRepDate] = useState(todayStr());
  const [showRepDatePicker, setShowRepDatePicker] = useState(false);

  const [saving, setSaving] = useState(false);

  const loadAll = useCallback(async () => {
    try {
      if (!refreshing) setLoading(true);
      const l = await getLabourById(labourId);
      setLabour(l);

      const s = await getLoanSummary(labourId);
      setSummary(s);

      if (s && s.accountId) {
        const trs = await getLoanTransactions(s.accountId);
        setTxns(trs);
      }
    } catch (e: any) {
      console.log("Loan load error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [labourId, refreshing]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const onRefresh = () => {
    setRefreshing(true);
    loadAll();
  };

  const onDisburse = async () => {
    if (!disAmount || Number(disAmount) <= 0) {
      Alert.alert("Invalid Input", "Please enter a valid loan amount.");
      return;
    }
    try {
      setSaving(true);
      await addLoanDisbursement(labourId, {
        amount: Number(disAmount),
        date: disDate,
        reason: disReason || "Udhar (Advance)",
      });
      setDisAmount("");
      setDisReason("");
      setDisDate(todayStr());
      loadAll();
      Alert.alert("Success", "Udhar recorded successfully.");
    } catch (e: any) {
      Alert.alert("Error", e?.response?.data || "Failed to record loan.");
    } finally {
      setSaving(false);
    }
  };

  const onRepay = async () => {
    if (!repAmount || Number(repAmount) <= 0) {
      Alert.alert("Invalid Input", "Please enter a valid repayment amount.");
      return;
    }
    try {
      setSaving(true);
      await addLoanRepayment(labourId, {
        amount: Number(repAmount),
        date: repDate,
        notes: repNotes || "Wapasi (Repayment)",
      });
      setRepAmount("");
      setRepNotes("");
      setRepDate(todayStr());
      loadAll();
      Alert.alert("Success", "Repayment recorded successfully.");
    } catch (e: any) {
      Alert.alert("Error", e?.response?.data || "Failed to record repayment.");
    } finally {
      setSaving(false);
    }
  };

  if (loading && !labour) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#1E293B" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.appBar}>
        <IconButton icon="arrow-left" size={24} iconColor="#1E293B" onPress={() => navigation.goBack()} />
        <Text style={styles.appBarTitle}>Udhar Management</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* SUMMARY CARD */}
        <View style={styles.summaryCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
             <Avatar.Text size={40} label={labour?.labourName?.substring(0,2).toUpperCase() || "L"} style={{ backgroundColor: "#F1F5F9" }} color="#475569" />
             <View style={{ marginLeft: 12 }}>
                <Text style={styles.labourName}>{labour?.labourName}</Text>
                <Text style={styles.labourInfo}>Current Debt Status</Text>
             </View>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Total Given</Text>
              <Text style={styles.statValue}>₹{formatNumber(summary?.totalDisbursed)}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Repaid</Text>
              <Text style={styles.statValue}>₹{formatNumber(summary?.totalRepaid)}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Interest</Text>
              <Text style={styles.statValue}>₹{formatNumber(summary?.totalInterest)}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.dueRow}>
            <Text style={styles.dueLabel}>TOTAL OUTSTANDING DUE</Text>
            <Text style={styles.dueValue}>₹{formatNumber(summary?.outstandingAmount)}</Text>
          </View>
        </View>

        {/* ACTIONS */}
        <Text style={styles.sectionTitle}>Manage Transactions</Text>
        
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
            <Card style={[styles.actionCard, { flex: 1, backgroundColor: "#FEF2F2" }]}>
                <Text style={{ fontWeight: 'bold', color: '#991B1B', marginBottom: 4 }}>Give Udhar</Text>
                <TextInput 
                  placeholder="Amount" 
                  value={disAmount} 
                  onChangeText={setDisAmount} 
                  keyboardType="numeric" 
                  style={styles.miniInput}
                  dense
                />
                <TextInput 
                  placeholder="Reason" 
                  value={disReason} 
                  onChangeText={setDisReason} 
                  style={styles.miniInput}
                  dense
                />
                <TouchableOpacity
                  style={styles.datePickerBtn}
                  onPress={() => setShowDisDatePicker(true)}
                >
                  <IconButton icon="calendar" size={14} style={{ margin: 0 }} iconColor="#991B1B" />
                  <Text style={styles.datePickerText}>{formatDate(disDate)}</Text>
                </TouchableOpacity>
                <Button mode="contained" buttonColor="#B91C1C" onPress={onDisburse} loading={saving} labelStyle={{ fontSize: 11 }}>Give</Button>
            </Card>

            <Card style={[styles.actionCard, { flex: 1, backgroundColor: "#F0FDF4" }]}>
                <Text style={{ fontWeight: 'bold', color: '#166534', marginBottom: 4 }}>Receive Repay</Text>
                <TextInput 
                  placeholder="Amount" 
                  value={repAmount} 
                  onChangeText={setRepAmount} 
                  keyboardType="numeric" 
                  style={styles.miniInput}
                  dense
                />
                <TextInput 
                  placeholder="Note" 
                  value={repNotes} 
                  onChangeText={setRepNotes} 
                  style={styles.miniInput}
                  dense
                />
                <TouchableOpacity
                  style={[styles.datePickerBtn, { borderColor: '#166534' }]}
                  onPress={() => setShowRepDatePicker(true)}
                >
                  <IconButton icon="calendar" size={14} style={{ margin: 0 }} iconColor="#166534" />
                  <Text style={[styles.datePickerText, { color: '#166534' }]}>{formatDate(repDate)}</Text>
                </TouchableOpacity>
                <Button mode="contained" buttonColor="#15803D" onPress={onRepay} loading={saving} labelStyle={{ fontSize: 11 }}>Receive</Button>
            </Card>
        </View>

        {/* TRANSACTIONS */}
        <Text style={styles.sectionTitle}>Transaction History</Text>
        {txns.length === 0 ? (
          <Text style={styles.muted}>No transactions recorded yet.</Text>
        ) : (
          txns.map((t) => (
            <View key={t.id} style={styles.txnRow}>
              <View style={styles.txnIconBox}>
                 <IconButton 
                    icon={t.type === "DISBURSEMENT" ? "arrow-up-circle" : "arrow-down-circle"} 
                    iconColor={t.type === "DISBURSEMENT" ? "#DC2626" : "#059669"} 
                    size={24} 
                 />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                   <Text style={styles.txnType}>{t.type === "DISBURSEMENT" ? "Given (Borrow)" : "Received (Repay)"}</Text>
                   <Text style={[styles.txnAmt, { color: t.type === "DISBURSEMENT" ? "#111827" : "#059669" }]}>
                     {t.type === "DISBURSEMENT" ? "+" : "-"} ₹{formatNumber(t.amount)}
                   </Text>
                </View>
                <Text style={styles.txnDate}>{t.txnDate} • {t.reason || t.notes || "No remarks"}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Date Pickers */}
      <DateTimePickerModal
        isVisible={showDisDatePicker}
        mode="date"
        date={new Date(disDate + "T00:00:00")}
        maximumDate={new Date()}
        onConfirm={(d) => {
          setShowDisDatePicker(false);
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, "0");
          const day = String(d.getDate()).padStart(2, "0");
          setDisDate(`${y}-${m}-${day}`);
        }}
        onCancel={() => setShowDisDatePicker(false)}
      />
      <DateTimePickerModal
        isVisible={showRepDatePicker}
        mode="date"
        date={new Date(repDate + "T00:00:00")}
        maximumDate={new Date()}
        onConfirm={(d) => {
          setShowRepDatePicker(false);
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, "0");
          const day = String(d.getDate()).padStart(2, "0");
          setRepDate(`${y}-${m}-${day}`);
        }}
        onCancel={() => setShowRepDatePicker(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F8FAFC" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  appBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  appBarTitle: { fontSize: 18, fontWeight: "700", color: "#1E293B" },
  content: { padding: 16, paddingBottom: 100 },

  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  labourName: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
  labourInfo: { fontSize: 13, color: "#64748B" },
  
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  statBox: { flex: 1 },
  statLabel: { fontSize: 12, color: "#94A3B8", fontWeight: "600" },
  statValue: { fontSize: 16, fontWeight: "700", color: "#1E293B", marginTop: 4 },
  
  divider: { height: 1, backgroundColor: "#F1F5F9", marginVertical: 16 },
  
  dueRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dueLabel: { fontSize: 12, fontWeight: "800", color: "#64748B" },
  dueValue: { fontSize: 22, fontWeight: "900", color: "#DC2626" },

  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#1E293B", marginBottom: 12 },
  
  actionCard: { padding: 12, borderRadius: 12, elevation: 0 },
  miniInput: { height: 35, backgroundColor: "#FFF", marginVertical: 8, fontSize: 12 },
  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#991B1B',
    borderRadius: 8,
    paddingRight: 8,
    marginBottom: 10,
    backgroundColor: '#FFF',
  },
  datePickerText: { fontSize: 12, color: '#991B1B', fontWeight: '600' },

  muted: { color: "#64748B", textAlign: "center", marginTop: 20 },

  txnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#F1F5F9"
  },
  txnIconBox: { backgroundColor: "#F8FAFC", borderRadius: 8 },
  txnType: { fontWeight: "700", color: "#1E293B", fontSize: 14 },
  txnAmt: { fontWeight: "900", fontSize: 15 },
  txnDate: { fontSize: 12, color: "#64748B", marginTop: 2 }
});
