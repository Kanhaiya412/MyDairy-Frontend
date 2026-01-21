// ===============================================
// LabourManagementScreen.tsx — FINAL CLEAN VERSION
// ===============================================

import React, { useEffect, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
  Pressable,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  Card,
  Chip,
  Button,
  TextInput,
  Text,
  FAB,
  Switch,
} from "react-native-paper";

import {
  getLaboursByUser,
  addLabour,
  updateLabour,
  getSalaryHistory,
  markSalaryPaid,
} from "../services/labourService";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RootDrawerParamList, RootStackParamList } from "../navigation/types";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { createNavigationContainerRef } from "@react-navigation/native";
// Navigation
const Stack = createNativeStackNavigator<RootStackParamList>();
const Drawer = createDrawerNavigator<RootDrawerParamList>(); // ⬅️ typed Drawer
export const navigationRef = createNavigationContainerRef();

import { DrawerScreenProps } from "@react-navigation/drawer";
// import { RootDrawerParamList } from "../navigation/types";

type Props = DrawerScreenProps<RootDrawerParamList, "LabourManagement">;
// Types matching backend DTO
type WageType = "DAILY" | "MONTHLY";
type LabourStatus = "ACTIVE" | "INACTIVE";

export interface LabourEntry {
  id: number;
  labourName: string;
  mobile?: string;
  wageType: WageType;
  dailyWage?: number;
  monthlySalary?: number;
  role?: string;
  joiningDate?: string;
  status?: LabourStatus;
  address?: string;
  notes?: string;
  useAttendance?: boolean;
  referralBy?: string;
}

export interface LabourSalaryEntry {
  id: number;
  month: number;
  year: number;
  presentDays?: number;
  manualDays?: number;
  totalSalary: number;
  paymentStatus: "PAID" | "UNPAID";
  generatedDate?: string;
  paidDate?: string;
}

// ==========================================================================
// Reusable Components
// ==========================================================================

function InfoRow({ label, value }: { label: string; value: any }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value ?? "—"}</Text>
    </View>
  );
}

function GlassCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <Card mode="elevated" style={styles.glassCard}>
      <View style={styles.cardHeaderRow}>
        <View style={styles.cardAccentDot} />
        <View>
          <Text style={styles.sectionTitle}>{title}</Text>
          {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <Card.Content>{children}</Card.Content>
    </Card>
  );
}

function FormField({
  label,
  value,
  onChangeText,
  keyboardType = "default",
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (txt: string) => void;
  keyboardType?: "default" | "numeric";
  multiline?: boolean;
}) {
  return (
    <View style={styles.fieldContainer}>
      <TextInput
        label={label}
        mode="outlined"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        multiline={multiline}
        outlineStyle={styles.inputOutline}
        style={[styles.input, multiline && { minHeight: 72 }]}
      />
    </View>
  );
}

interface DateFieldProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
}

function DateField({ label, value, onChange }: DateFieldProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [internalDate, setInternalDate] = useState<Date>(
    value ? new Date(value) : new Date()
  );

  const handleChange = (_: any, selected?: Date) => {
    if (selected) {
      setInternalDate(selected);
      onChange(formatYMD(selected));
    }
    if (Platform.OS !== "ios") setShowPicker(false);
  };

  return (
    <View style={styles.fieldContainer}>
      <Pressable onPress={() => setShowPicker(true)}>
        <TextInput
          label={label}
          mode="outlined"
          value={value}
          editable={false}
          outlineStyle={styles.inputOutline}
          style={styles.input}
        />
      </Pressable>

      {showPicker && (
        <DateTimePicker
          value={internalDate}
          mode="date"
          display="default"
          onChange={handleChange}
        />
      )}
    </View>
  );
}

function formatYMD(date: Date) {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// ==========================================================================
// Main Component
// ==========================================================================

type TabKey = "overview" | "salary" | "form";

export default function LabourManagementScreen({ navigation }: Props) {
  const [tab, setTab] = useState<TabKey>("overview");
  const [labours, setLabours] = useState<LabourEntry[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isNew, setIsNew] = useState(false);

  const [latestSalary, setLatestSalary] = useState<LabourSalaryEntry | null>(
    null
  );
  const [salaryHistory, setSalaryHistory] = useState<LabourSalaryEntry[]>([]);

  // Form
  const [labourName, setLabourName] = useState("");
  const [mobile, setMobile] = useState("");
  const [wageType, setWageType] = useState<WageType>("DAILY");
  const [dailyWage, setDailyWage] = useState("");
  const [monthlySalary, setMonthlySalary] = useState("");
  const [joiningDate, setJoiningDate] = useState("");
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState<LabourStatus>("ACTIVE");
  const [useAttendance, setUseAttendance] = useState(true);
  const [notes, setNotes] = useState("");

  const currentLabour = selectedId
    ? labours.find((l) => l.id === selectedId)
    : null;

  // Load labour list
  useEffect(() => {
    loadLabours();
  }, []);

  const loadLabours = async () => {
    try {
      const id = await AsyncStorage.getItem("userId");
      if (!id) return;

      const data = await getLaboursByUser(Number(id));
      setLabours(data);

      if (data.length > 0) {
        setSelectedId(data[0].id);
        setIsNew(false);
      } else {
        setIsNew(true);
        setTab("form");
      }
    } catch (e) {
      console.log("Load labour error:", e);
    }
  };

  // Load salary when labour changes
  useEffect(() => {
    if (selectedId && !isNew) loadSalary(selectedId);
    if (selectedId && !isNew) fillForm(selectedId);
  }, [selectedId, isNew]);

  const loadSalary = async (id: number) => {
    try {
      const res = await getSalaryHistory(id);
      setSalaryHistory(res);
      setLatestSalary(res[0] ?? null);
    } catch {
      setLatestSalary(null);
      setSalaryHistory([]);
    }
  };

  const fillForm = (id: number) => {
    const l = labours.find((x) => x.id === id);
    if (!l) return;

    setLabourName(l.labourName);
    setMobile(l.mobile || "");
    setWageType(l.wageType);
    setDailyWage(l.dailyWage ? String(l.dailyWage) : "");
    setMonthlySalary(l.monthlySalary ? String(l.monthlySalary) : "");
    setJoiningDate(l.joiningDate || "");
    setAddress(l.address || "");
    setNotes(l.notes || "");
    setUseAttendance(l.useAttendance ?? true);
    setStatus(l.status ?? "ACTIVE");
  };

  const clearForm = () => {
    setLabourName("");
    setMobile("");
    setWageType("DAILY");
    setDailyWage("");
    setMonthlySalary("");
    setJoiningDate("");
    setAddress("");
    setNotes("");
    setUseAttendance(true);
    setStatus("ACTIVE");
  };

  // Payload
  const buildPayload = () => ({
    labourName,
    mobile: mobile || null,
    wageType,
    dailyWage: wageType === "DAILY" ? Number(dailyWage) : null,
    monthlySalary: wageType === "MONTHLY" ? Number(monthlySalary) : null,
    joiningDate: joiningDate || null,
    status,
    address: address || null,
    notes: notes || null,
    role: "LABOUR",
    useAttendance,
    referralBy: null,
  });

  const save = async () => {
    if (!labourName.trim()) return Alert.alert("Enter labour name");

    try {
      const payload = buildPayload();

      if (isNew) await addLabour(payload);
      else if (selectedId) await updateLabour(selectedId, payload);

      loadLabours();
      setTab("overview");
      Alert.alert("Success", isNew ? "Labour added" : "Labour updated");
    } catch {
      Alert.alert("Error", "Failed to save");
    }
  };

  const markPaid = async () => {
    if (!latestSalary) return;
    try {
      await markSalaryPaid(latestSalary.id);
      Alert.alert("Done", "Marked as Paid");
      if (selectedId) loadSalary(selectedId);
    } catch {
      Alert.alert("Error");
    }
  };

  // ==========================================================================
  // UI
  // ==========================================================================

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>Labour Management</Text>
        <Text style={styles.heroSubtitle}>
          Track attendance, salary & payments
        </Text>
      </View>

      {/* Labour Chips */}
      <Card mode="elevated" style={styles.cattleCard}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {labours.map((l) => {
            const active = selectedId === l.id;
            return (
              <Chip
                key={l.id}
                selected={active}
                mode={active ? "flat" : "outlined"}
                onPress={() => {
                  setIsNew(false);
                  setSelectedId(l.id);
                  setTab("overview");
                }}
                style={[
                  styles.cattleChip,
                  active && styles.cattleChipActive,
                ]}
                textStyle={[
                  styles.cattleChipText,
                  active && styles.cattleChipTextActive,
                ]}
              >
                {l.labourName}
              </Chip>
            );
          })}

          <Chip
            selected={isNew}
            mode={isNew ? "flat" : "outlined"}
            onPress={() => {
              clearForm();
              setIsNew(true);
              setSelectedId(null);
              setTab("form");
            }}
            style={[
              styles.cattleChip,
              isNew && styles.cattleChipActive,
            ]}
            textStyle={[
              styles.cattleChipText,
              isNew && styles.cattleChipTextActive,
            ]}
          >
            + Add Labour
          </Chip>
        </ScrollView>
      </Card>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {(["overview", "salary", "form"] as TabKey[]).map((key) => {
          const active = tab === key;

          return (
            <Pressable
              key={key}
              onPress={() => setTab(key)}
              style={[styles.tabPill, active && styles.tabPillActive]}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {key === "overview"
                  ? "Overview"
                  : key === "salary"
                  ? "Salary"
                  : isNew || !currentLabour
                  ? "Add"
                  : "Update"}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Content */}
      <ScrollView style={{ marginBottom: 80 }}>
        {/* Overview */}
        {tab === "overview" && currentLabour && (
          <>
            <GlassCard title="Basic Details">
              <InfoRow label="Name" value={currentLabour.labourName} />
              <InfoRow label="Mobile" value={currentLabour.mobile} />
              <InfoRow label="Joining Date" value={currentLabour.joiningDate} />
              <InfoRow label="Status" value={currentLabour.status} />
              <InfoRow label="Address" value={currentLabour.address} />
            </GlassCard>

            <GlassCard title="Compensation">
              <InfoRow label="Wage Type" value={currentLabour.wageType} />
              <InfoRow
                label="Daily Wage"
                value={
                  currentLabour.dailyWage
                    ? `₹${currentLabour.dailyWage}`
                    : "—"
                }
              />
              <InfoRow
                label="Monthly Salary"
                value={
                  currentLabour.monthlySalary
                    ? `₹${currentLabour.monthlySalary}`
                    : "—"
                }
              />
            </GlassCard>

           <Button
  mode="contained"
  style={{ margin: 10 }}
  onPress={() =>
    (navigation as any).navigate("LabourProfile", {
      labourId: currentLabour.id,
    })
  }
>
  Open Full Profile
</Button>
          </>
        )}

        {/* Salary */}
        {tab === "salary" && (
          <>
            <GlassCard title="Latest Salary">
              <InfoRow
                label="Total Salary"
                value={latestSalary ? `₹${latestSalary.totalSalary}` : "—"}
              />
              <InfoRow
                label="Present Days"
                value={latestSalary?.presentDays ?? "—"}
              />
              <InfoRow
                label="Manual Days"
                value={latestSalary?.manualDays ?? "—"}
              />
              <InfoRow
                label="Status"
                value={latestSalary?.paymentStatus ?? "—"}
              />
              {latestSalary?.paymentStatus === "UNPAID" && (
                <Button
                  mode="contained"
                  style={styles.primaryButton}
                  onPress={markPaid}
                >
                  Mark as Paid
                </Button>
              )}
            </GlassCard>

            <GlassCard title="Salary History">
              {salaryHistory.map((s) => (
                <Text
                  key={s.id}
                  style={{ color: "#E5E7EB", marginVertical: 4 }}
                >
                  {s.month}/{s.year} — ₹{s.totalSalary} ({s.paymentStatus})
                </Text>
              ))}
            </GlassCard>
          </>
        )}

        {/* Form */}
        {tab === "form" && (
          <GlassCard title={isNew ? "Add Labour" : "Update Labour"}>
            <FormField
              label="Name"
              value={labourName}
              onChangeText={setLabourName}
            />
            <FormField
              label="Mobile"
              value={mobile}
              onChangeText={setMobile}
              keyboardType="numeric"
            />

            <DateField
              label="Joining Date"
              value={joiningDate}
              onChange={setJoiningDate}
            />

            {/* Wage Type */}
            <View style={{ flexDirection: "row", marginTop: 6 }}>
              {(["DAILY", "MONTHLY"] as WageType[]).map((wt) => (
                <Chip
                  key={wt}
                  selected={wageType === wt}
                  mode={wageType === wt ? "flat" : "outlined"}
                  onPress={() => setWageType(wt)}
                  style={styles.statusChip}
                >
                  {wt}
                </Chip>
              ))}
            </View>

            {wageType === "DAILY" && (
              <FormField
                label="Daily Wage (₹)"
                value={dailyWage}
                onChangeText={setDailyWage}
                keyboardType="numeric"
              />
            )}

            {wageType === "MONTHLY" && (
              <FormField
                label="Monthly Salary (₹)"
                value={monthlySalary}
                onChangeText={setMonthlySalary}
                keyboardType="numeric"
              />
            )}

            <FormField
              label="Address"
              value={address}
              onChangeText={setAddress}
            />

            <FormField
              label="Notes"
              value={notes}
              onChangeText={setNotes}
              multiline
            />

            <Button
              mode="contained"
              style={styles.primaryButton}
              onPress={save}
            >
              {isNew ? "Add Labour" : "Update Labour"}
            </Button>
          </GlassCard>
        )}
      </ScrollView>

      {/* Floating Action Buttons */}
      <View style={styles.fabContainer}>
        {/* Salary FAB */}
        <FAB
          style={styles.fabSecondary}
          icon="cash"
          onPress={() => setTab("salary")}
        />

        {/* Add/Edit FAB */}
        <FAB
          style={styles.fabPrimary}
          icon="plus"
          onPress={() => {
            if (currentLabour && !isNew) fillForm(currentLabour.id);
            else clearForm();

            setIsNew(true);
            setSelectedId(null);
            setTab("form");
          }}
        />
      </View>
    </View>
  );
}

// ==========================================================================
// Styles
// ==========================================================================

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#020014",
    padding: 12,
  },

  heroCard: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    backgroundColor: "rgba(10,10,30,0.95)",
    borderWidth: 1.2,
    borderColor: "rgba(129,140,248,0.6)",
  },
  heroTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
  },
  heroSubtitle: {
    color: "#9CA3AF",
    marginTop: 4,
  },

  cattleCard: {
    borderRadius: 16,
    padding: 10,
    backgroundColor: "rgba(12,10,40,0.96)",
    borderWidth: 1,
    borderColor: "rgba(129,140,248,0.6)",
    marginBottom: 10,
  },

  cattleChip: {
    marginRight: 8,
    backgroundColor: "#111827",
  },
  cattleChipActive: {
    backgroundColor: "#22C55E",
  },
  cattleChipText: {
    color: "#E5E7EB",
  },
  cattleChipTextActive: {
    color: "#022C22",
    fontWeight: "700",
  },

  tabRow: {
    flexDirection: "row",
    backgroundColor: "rgba(12,10,40,0.96)",
    borderRadius: 999,
    padding: 4,
    marginBottom: 10,
  },
  tabPill: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 30,
  },
  tabPillActive: {
    backgroundColor: "#22C55E",
  },
  tabText: {
    color: "#9CA3AF",
    fontWeight: "600",
  },
  tabTextActive: {
    color: "#022C22",
    fontWeight: "700",
  },

  glassCard: {
    borderRadius: 18,
    marginBottom: 12,
    backgroundColor: "rgba(11,14,40,0.9)",
    borderWidth: 1.2,
    borderColor: "rgba(129,140,248,0.8)",
    paddingBottom: 10,
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  infoLabel: {
    color: "#9CA3AF",
    fontSize: 12,
  },
  infoValue: {
    color: "#E5E7EB",
    fontSize: 13,
    fontWeight: "600",
  },

  sectionTitle: {
    color: "#E5E7EB",
    fontSize: 14,
    fontWeight: "700",
  },
  sectionSubtitle: {
    color: "#9CA3AF",
    fontSize: 11,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    gap: 8,
  },
  cardAccentDot: {
    width: 8,
    height: 8,
    borderRadius: 8,
    backgroundColor: "#22C55E",
  },

  fieldContainer: {
    marginVertical: 8,
  },
  input: {
    backgroundColor: "#111827",
  },
  inputOutline: {
    borderRadius: 12,
    borderColor: "rgba(148,163,184,0.8)",
  },

  statusChip: {
    marginRight: 8,
    backgroundColor: "#111827",
  },

  primaryButton: {
    borderRadius: 16,
    backgroundColor: "#22C55E",
    marginTop: 10,
  },

  fabContainer: {
    position: "absolute",
    right: 16,
    bottom: 20,
    alignItems: "center",
    gap: 10,
  },
  fabPrimary: {
    backgroundColor: "#22C55E",
  },
  fabSecondary: {
    backgroundColor: "#020617",
    borderWidth: 1,
    borderColor: "#22C55E",
  },
});
