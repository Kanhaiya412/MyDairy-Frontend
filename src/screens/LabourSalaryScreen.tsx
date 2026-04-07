import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Alert, FlatList, TouchableOpacity } from "react-native";
import { Text, Button, IconButton, ActivityIndicator, TextInput, Portal, Modal } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import {
  getLabourDashboard,
  generateSalary,
  getSalaryHistory,
  markSalaryPaid,
  payLumpsumSalary,
  LabourDashboardDTO
} from "../services/labourService";
import LinearGradient from "react-native-linear-gradient";

type Props = NativeStackScreenProps<RootStackParamList, "LabourSalary">;

export default function LabourSalaryScreen({ route, navigation }: Props) {
  const { labourId } = route.params;
  const [data, setData] = useState<LabourDashboardDTO | null>(null);
  const [salaries, setSalaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const [genMonth, setGenMonth] = useState(String(today.getMonth() + 1).padStart(2, "0"));
  const [genYear, setGenYear] = useState(String(today.getFullYear()));
  const [generating, setGenerating] = useState(false);

  // Payment Modal States
  const [payModalVisible, setPayModalVisible] = useState(false);
  const [selectedSalaryId, setSelectedSalaryId] = useState<number | null>(null);
  const [payAmount, setPayAmount] = useState<string>("0");
  const [maxPayAmount, setMaxPayAmount] = useState<number>(0);
  const [paying, setPaying] = useState(false);

  const [lumpsumModalVisible, setLumpsumModalVisible] = useState(false);
  const [lumpsumAmount, setLumpsumAmount] = useState<string>("0");
  const [lumpsumLoading, setLumpsumLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [labourId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const dash = await getLabourDashboard(labourId);
      setData(dash);

      const salList = await getSalaryHistory(labourId);
      setSalaries(salList);
    } catch (e) {
      Alert.alert("Error", "Failed to load salary ledger.");
    } finally {
      setLoading(false);
    }
  };

  const onGenerate = async () => {
    if (!genMonth || !genYear) {
      Alert.alert("Error", "Please enter MM and YYYY");
      return;
    }
    Alert.alert("Confirm", `Generate salary for ${genMonth}/${genYear}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Generate",
        style: "default",
        onPress: async () => {
          try {
            setGenerating(true);
            await generateSalary({
              labourId,
              month: Number(genMonth),
              year: Number(genYear)
            });
            Alert.alert("Success", "Salary generated successfully.");
            await loadData();
          } catch (e: any) {
            Alert.alert("Error", e?.response?.data || "Failed to generate.");
          } finally {
            setGenerating(false);
          }
        }
      }
    ]);
  };

  if (loading && !data) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#1E293B" />
      </View>
    );
  }

  if (!data) return null;

  // ... (keep renderSalaries but rewrite it safely below)
  const openPaymentModal = (id: number, remaining: number) => {
    setSelectedSalaryId(id);
    setMaxPayAmount(remaining);
    setPayAmount(String(remaining));
    setPayModalVisible(true);
  };

  const handlePay = async () => {
    if (!selectedSalaryId) return;
    const amountNum = Number(payAmount);
    if (amountNum <= 0) {
      Alert.alert("Error", "Amount must be greater than zero.");
      return;
    }
    try {
      setPaying(true);
      await markSalaryPaid(selectedSalaryId, amountNum);
      setPayModalVisible(false);
      loadData();
    } catch (e) {
      Alert.alert("Error", "Failed to mark paid");
    } finally {
      setPaying(false);
    }
  };

  const handleLumpsumPay = async () => {
    const amountNum = Number(lumpsumAmount);
    if (amountNum <= 0) {
      Alert.alert("Error", "Enter a valid amount.");
      return;
    }
    try {
      setLumpsumLoading(true);
      await payLumpsumSalary(labourId, amountNum);
      setLumpsumModalVisible(false);
      Alert.alert("Success", "Bulk payment processed and allocated.");
      loadData();
    } catch (e: any) {
      Alert.alert("Error", e?.response?.data || "Lumpsum failed");
    } finally {
      setLumpsumLoading(false);
    }
  };

  const renderSalaries = () => {
    if (salaries.length === 0) {
      return (
        <View style={styles.ledgerCard}>
          <Text style={{ textAlign: "center", color: "#64748B", fontWeight: '700' }}>No Monthly Statements Ledgered.</Text>
        </View>
      );
    }

    return salaries.map((item, index) => {
      const isPaid = item.paymentStatus === "PAID";
      const amountPaid = item.amountPaid || 0;
      const remaining = item.totalSalary - amountPaid;
      const pct = Math.min(100, (amountPaid / item.totalSalary) * 100);

      const statusConfig = isPaid
        ? { label: "PAID", bg: "#DCFCE7", text: "#166534" }
        : amountPaid > 0
          ? { label: "PARTIAL", bg: "#FEF3C7", text: "#92400E" }
          : { label: "UNSETTLED", bg: "#FEE2E2", text: "#991B1B" };

      return (
        <View key={index} style={styles.ledgerCard}>
          <View style={styles.cardTop}>
            <Text style={styles.monthYear}>{String(item.month).padStart(2, "0")}/{item.year}</Text>
            <View style={[styles.statusCapsule, { backgroundColor: statusConfig.bg }]}>
              <Text style={[styles.statusText, { color: statusConfig.text }]}>{statusConfig.label}</Text>
            </View>
          </View>

          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: `${pct}%`, backgroundColor: isPaid ? "#10B981" : "#6366F1" }]} />
          </View>

          <View style={styles.cardFooter}>
            <View>
              <Text style={styles.amountDueLabel}>Settlement Due</Text>
              <Text style={styles.amountDueValue}>₹{remaining.toLocaleString("en-IN")}</Text>
              <Text style={styles.paidAmount}>Paid: ₹{amountPaid.toLocaleString("en-IN")}</Text>
            </View>

            {!isPaid && (
              <Button
                mode="contained"
                buttonColor="#6366F1"
                style={styles.settleButton}
                labelStyle={{ fontSize: 11, fontWeight: '900' }}
                onPress={() => openPaymentModal(item.id, remaining)}
              >
                Pay Monthly
              </Button>
            )}
          </View>
        </View>
      );
    });
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.appBar}>
        <IconButton icon="arrow-left" size={24} iconColor="#1E293B" onPress={() => navigation.goBack()} />
        <Text style={styles.appBarTitle}>Salary Ledger</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* SNAPSHOTS OVERHAUL */}
        <View style={styles.snapshotRow}>
          <View style={[styles.infoCard, { borderTopColor: '#6366F1' }]}>
            <Text style={styles.snapLabel}>Total Payouts</Text>
            <Text style={styles.snapValue}>₹{Number(data.totalSalaryPaid || 0).toLocaleString("en-IN")}</Text>
            <Text style={styles.snapSub}>Staff Earnings</Text>
          </View>
          <View style={[styles.infoCard, { borderTopColor: '#DC2626' }]}>
            <Text style={styles.snapLabel}>Pending Now</Text>
            <Text style={styles.snapValue}>₹{Number(data.pendingSalary || 0).toLocaleString("en-IN")}</Text>
            <Text style={styles.snapSub}>Live Accruals</Text>
          </View>
        </View>

        {/* BULK SETTLER SECTION (New) */}
        {data.pendingSalary > 0 && (
          <View style={[styles.generateBox, { backgroundColor: "#EEF2FF", borderColor: "#C7D2FE", borderStyle: 'dashed' }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={{ fontSize: 15, fontWeight: "900", color: "#4338CA" }}>Bulk Settlement Ready</Text>
                <Text style={{ fontSize: 24, fontWeight: "900", color: "#1E1B4B" }}>₹{(data.pendingSalary || 0).toLocaleString("en-IN")}</Text>
                <Text style={{ fontSize: 11, color: "#6366F1", fontWeight: "700" }}>Total Outstanding Multi-Month Due</Text>
              </View>
              <TouchableOpacity 
                onPress={() => {
                  setLumpsumAmount(String(data.pendingSalary));
                  setLumpsumModalVisible(true);
                }} 
                style={{ backgroundColor: '#6366F1', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 }}
              >
                <Text style={{ color: '#FFF', fontWeight: "900", fontSize: 13 }}>Settle Bulk</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {data.wageType !== "YEARLY" ? (
          <>
            <Text style={styles.sectionTitle}>Generate Statement</Text>
            <View style={styles.generateBox}>
              <View style={styles.genInputRow}>
                <TextInput label="Month (MM)" value={genMonth} onChangeText={setGenMonth} keyboardType="numeric" mode="outlined" style={styles.genInput} />
                <TextInput label="Year (YYYY)" value={genYear} onChangeText={setGenYear} keyboardType="numeric" mode="outlined" style={styles.genInput} />
              </View>
              <Button mode="contained" buttonColor="#1E293B" onPress={onGenerate} loading={generating} style={styles.genButton} labelStyle={{ fontWeight: '900' }}>
                Calculate Monthly Statement
              </Button>
            </View>
          </>
        ) : (
          <View style={[styles.generateBox, { backgroundColor: "#ECFDF5", borderColor: "#10B981" }]}>
            <Text style={{ fontWeight: "900", color: "#065F46", fontSize: 16 }}>Yearly Settlement Mode</Text>
            <Text style={{ color: "#065F46", marginTop: 4, fontSize: 13 }}>Package tracking activated. You can pay particular advances below.</Text>
          </View>
        )}

        <Text style={[styles.sectionTitle, { marginTop: 10 }]}>Financial Ledger</Text>

        {data.wageType === "YEARLY" ? (
          salaries.map((item, index) => {
            const amountPaid = item.amountPaid || 0;
            const remaining = item.totalSalary - amountPaid;
            const pct = Math.min(100, (amountPaid / item.totalSalary) * 100);

            return (
              <View key={index} style={styles.ledgerCard}>
                <View style={styles.cardTop}>
                  <View>
                    <Text style={styles.snapLabel}>Annual Settlement</Text>
                    <Text style={styles.monthYear}>Full Package Year {item.year}</Text>
                  </View>
                  <View style={[styles.statusCapsule, { backgroundColor: pct >= 100 ? '#DCFCE7' : '#FEF3C7' }]}>
                    <Text style={[styles.statusText, { color: pct >= 100 ? '#166534' : '#92400E' }]}>
                      {pct >= 100 ? "FULLY SETTLED" : `${pct.toFixed(0)}% PAID`}
                    </Text>
                  </View>
                </View>

                <View style={styles.progressContainer}>
                  <View style={[styles.progressBar, { width: `${pct}%`, backgroundColor: "#10B981" }]} />
                </View>

                <View style={styles.cardFooter}>
                  <View>
                    <Text style={styles.amountDueLabel}>Current Due</Text>
                    <Text style={[styles.amountDueValue, { color: '#DC2626' }]}>₹{remaining.toLocaleString("en-IN")}</Text>
                    <Text style={styles.paidAmount}>Paid: ₹{amountPaid.toLocaleString("en-IN")}</Text>
                  </View>
                  {pct < 100 && (
                    <Button mode="contained" buttonColor="#1E293B" style={styles.settleButton} labelStyle={{ fontSize: 11, fontWeight: '900' }} onPress={() => openPaymentModal(item.id, remaining)}>
                      Pay Advance
                    </Button>
                  )}
                </View>
              </View>
            );
          })
        ) : (
          renderSalaries()
        )}

      </ScrollView>

      {/* PAYMENT MODAL OVERHAUL */}
      <Portal>
        <Modal visible={payModalVisible} onDismiss={() => setPayModalVisible(false)} contentContainerStyle={styles.modalContent}>
          <Text style={styles.modalTitle}>Settle Wages</Text>
          <Text style={styles.modalSub}>Handover particular cash amount to staff for the selected month.</Text>

          <View style={{ position: 'relative' }}>
            <TextInput
              label="Amount Paying"
              value={payAmount}
              onChangeText={setPayAmount}
              keyboardType="numeric"
              mode="outlined"
              style={{ backgroundColor: "#FFFFFF" }}
              activeOutlineColor="#6366F1"
              left={<TextInput.Icon icon="currency-inr" color="#64748B" />}
            />
            <TouchableOpacity style={styles.quickMaxBtn} onPress={() => setPayAmount(String(maxPayAmount))}>
              <Text style={styles.quickMaxText}>MAX: ₹{maxPayAmount}</Text>
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: "row", marginTop: 32, gap: 12, justifyContent: "flex-end" }}>
            <Button
              onPress={() => setPayModalVisible(false)}
              textColor="#94A3B8"
              labelStyle={{ fontWeight: "900" }}
            >Cancel</Button>

            <TouchableOpacity onPress={handlePay} disabled={paying} style={{ flex: 1, height: 48, borderRadius: 24, overflow: 'hidden' }}>
              <LinearGradient colors={['#10B981', '#059669']} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                {paying ? (
                  <ActivityIndicator color="#FFF" size={20} />
                ) : (
                  <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 16 }}>Confirm Pay</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Modal>
      </Portal>

      {/* LUMPSUM MODAL (New) */}
      <Portal>
        <Modal visible={lumpsumModalVisible} onDismiss={() => setLumpsumModalVisible(false)} contentContainerStyle={styles.modalContent}>
          <Text style={styles.modalTitle}>Lumpsum Payout</Text>
          <Text style={styles.modalSub}>Handover a bulk amount. The system will auto-allocate it to the oldest pending months first.</Text>
          
          <TextInput
            label="Lumpsum Amount"
            value={lumpsumAmount}
            onChangeText={setLumpsumAmount}
            keyboardType="numeric"
            mode="outlined"
            style={{ backgroundColor: "#FFFFFF" }}
            activeOutlineColor="#6366F1"
            left={<TextInput.Icon icon="tray-arrow-down" color="#64748B" />}
          />

          <View style={{ flexDirection: "row", marginTop: 32, gap: 12, justifyContent: "flex-end" }}>
            <Button onPress={() => setLumpsumModalVisible(false)} textColor="#94A3B8">Cancel</Button>
            <TouchableOpacity onPress={handleLumpsumPay} disabled={lumpsumLoading} style={{ flex: 1, height: 48, borderRadius: 24, overflow: 'hidden' }}>
              <LinearGradient colors={['#6366F1', '#4338CA']} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                {lumpsumLoading ? (
                  <ActivityIndicator color="#FFF" size={20} />
                ) : (
                  <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 16 }}>Confirm Lumpsum</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Modal>
      </Portal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F8FAFC" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  /* APP BAR */
  appBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  appBarTitle: { fontSize: 20, fontWeight: "900", color: "#1E293B" },

  content: { padding: 20, paddingBottom: 100 },

  /* SNAPSHOTS */
  snapshotRow: { flexDirection: "row", gap: 12, marginBottom: 24 },
  infoCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: 20,
    shadowColor: "#64748B",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    borderTopWidth: 3
  },
  snapLabel: { fontSize: 9, fontWeight: "800", color: "#94A3B8", textTransform: "uppercase" },
  snapValue: { fontSize: 16, fontWeight: "900", color: "#1E293B", marginTop: 4 },
  snapSub: { fontSize: 10, color: "#64748B", marginTop: 2, fontWeight: "600" },

  /* GENERATE SECTION */
  sectionTitle: { fontSize: 16, fontWeight: "900", color: "#1E293B", marginBottom: 14 },
  generateBox: {
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 28
  },
  genInputRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  genInput: { flex: 1, backgroundColor: "#F8FAFC" },
  genButton: { borderRadius: 16, height: 48, justifyContent: 'center' },

  /* LEDGER CARDS */
  ledgerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#64748B",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F1F5F9"
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  monthYear: { fontSize: 18, fontWeight: "900", color: "#1E293B" },
  statusCapsule: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 10, fontWeight: "900" },

  progressContainer: { height: 6, backgroundColor: "#F1F5F9", borderRadius: 3, marginBottom: 16, overflow: 'hidden' },
  progressBar: { height: '100%', borderRadius: 3 },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  amountDueLabel: { fontSize: 11, fontWeight: "800", color: "#94A3B8", textTransform: "uppercase" },
  amountDueValue: { fontSize: 18, fontWeight: "900", color: "#1E293B" },
  paidAmount: { fontSize: 11, color: "#64748B", marginTop: 2 },

  settleButton: { borderRadius: 14, height: 40 },

  /* MODAL */
  modalContent: { backgroundColor: 'white', padding: 24, margin: 24, borderRadius: 28 },
  modalTitle: { fontSize: 22, fontWeight: "900", color: "#1E293B", marginBottom: 8 },
  modalSub: { fontSize: 14, color: "#64748B", marginBottom: 20 },
  quickMaxBtn: { position: 'absolute', right: 12, top: 12, backgroundColor: '#EFF6FF', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  quickMaxText: { fontSize: 11, fontWeight: "900", color: "#6366F1" },
});
