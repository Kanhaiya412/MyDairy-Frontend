// src/screens/LabourProfileScreen.tsx

import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
} from "react-native";
import {
  Card,
  Text,
  Button,
  Chip,
  ActivityIndicator,
} from "react-native-paper";

import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";

import {
  getLabourDashboard,
  LabourDashboardDTO,
  LabourEventDTO,
} from "../services/labourService";

type Props = NativeStackScreenProps<RootStackParamList, "LabourProfile">;

type SectionKey = "summary" | "loan" | "penalty" | "timeline";

// small reusable
function InfoRow({ label, value }: { label: string; value: any }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value ?? "—"}</Text>
    </View>
  );
}

function GlassCard(props: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const { title, subtitle, children } = props;
  return (
    <Card mode="elevated" style={styles.glassCard}>
      <View style={styles.cardHeaderRow}>
        <View style={styles.cardAccentDot} />
        <View>
          <Text style={styles.sectionTitle}>{title}</Text>
          {subtitle && (
            <Text style={styles.sectionSubtitle}>{subtitle}</Text>
          )}
        </View>
      </View>
      <Card.Content>{children}</Card.Content>
    </Card>
  );
}

export default function LabourProfileScreen({ route, navigation }: Props) {
  const { labourId } = route.params;

  const [data, setData] = useState<LabourDashboardDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionKey>("summary");

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getLabourDashboard(labourId);
      setData(res);
    } catch (e) {
      console.log("Dashboard load error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [labourId]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  if (loading && !data) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator animating />
        <Text style={{ color: "#9CA3AF", marginTop: 8 }}>
          Loading dashboard...
        </Text>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: "#9CA3AF", marginBottom: 8 }}>
          Failed to load data.
        </Text>
        <Button mode="contained" onPress={loadDashboard}>
          Retry
        </Button>
      </View>
    );
  }

  const {
    labourName,
    mobile,
    wageType,
    dailyWage,
    monthlySalary,
    activeContractId,
    contractType,
    contractAmount,
    contractStartDate,
    contractEndDate,
    totalDisbursed,
    totalRepaid,
    outstandingPrincipal,
    totalInterest,
    outstandingWithInterest,
    totalSalaryPaid,
    totalPenaltyPaid,
    totalPenaltyUnpaid,
    timeline,
  } = data;

  // derived
  const hasContract = !!activeContractId;
  const hasLoan = totalDisbursed > 0 || outstandingPrincipal > 0;

  return (
    <View style={styles.screen}>
      {/* HEADER / HERO */}
      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>{labourName}</Text>
        <Text style={styles.heroSubtitle}>
          {wageType ?? "N/A"} wage •{" "}
          {monthlySalary ? `₹${monthlySalary}` : "No salary set"}
        </Text>
        {mobile && (
          <Text style={[styles.heroSubtitle, { marginTop: 2 }]}>
            📞 {mobile}
          </Text>
        )}
      </View>

      {/* SECTION SWITCHER (TABS) */}
      <View style={styles.tabRow}>
        {(["summary", "loan", "penalty", "timeline"] as SectionKey[]).map(
          (key) => {
            const active = key === activeSection;
            return (
              <Pressable
                key={key}
                onPress={() => setActiveSection(key)}
                style={[styles.tabPill, active && styles.tabPillActive]}
              >
                <Text
                  style={[styles.tabText, active && styles.tabTextActive]}
                >
                  {key === "summary"
                    ? "Summary"
                    : key === "loan"
                    ? "Loan"
                    : key === "penalty"
                    ? "Penalty"
                    : "Timeline"}
                </Text>
              </Pressable>
            );
          }
        )}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* ===================== SUMMARY SECTION ===================== */}
        {activeSection === "summary" && (
          <>
            <GlassCard title="Basic Details">
              <InfoRow label="Name" value={labourName} />
              <InfoRow label="Mobile" value={mobile || "—"} />
              <InfoRow
                label="Wage Type"
                value={wageType ? wageType : "—"}
              />
              <InfoRow
                label="Daily Wage"
                value={
                  dailyWage ? `₹${dailyWage.toFixed(0)}` : "Not set"
                }
              />
              <InfoRow
                label="Monthly Salary"
                value={
                  monthlySalary ? `₹${monthlySalary}` : "Not set"
                }
              />
              <View style={{ marginTop: 8, flexDirection: "row", gap: 8 }}>
                <Chip
                  mode="flat"
                  style={styles.smallChip}
                  icon="card-account-details-outline"
                  onPress={() =>
                    navigation.navigate("LabourContract", { labourId })
                  }
                >
                  Manage Contract
                </Chip>
              </View>
            </GlassCard>

            <GlassCard
              title="Active Contract"
              subtitle={
                hasContract
                  ? "Current agreement with this labour"
                  : "No active contract"
              }
            >
              {hasContract ? (
                <>
                  <InfoRow
                    label="Type"
                    value={contractType ?? "Not set"}
                  />
                  <InfoRow
                    label="Amount"
                    value={
                      contractAmount
                        ? `₹${contractAmount}`
                        : "Not set"
                    }
                  />
                  <InfoRow
                    label="Start"
                    value={contractStartDate || "—"}
                  />
                  <InfoRow label="End" value={contractEndDate || "—"} />

                  <Button
                    mode="contained"
                    style={styles.primaryButton}
                    onPress={() =>
                      navigation.navigate("LabourContract", { labourId })
                    }
                  >
                    View / Edit Contract
                  </Button>
                </>
              ) : (
                <Button
                  mode="contained"
                  style={styles.primaryButton}
                  onPress={() =>
                    navigation.navigate("LabourContract", { labourId })
                  }
                >
                  Create Contract
                </Button>
              )}
            </GlassCard>

            <GlassCard
              title="Salary Summary"
              subtitle="Based on generated & paid salaries"
            >
              <InfoRow
                label="Total Salary Paid"
                value={`₹${formatNumber(totalSalaryPaid)}`}
              />

              <Button
                mode="outlined"
                style={[styles.primaryButton, { marginTop: 8 }]}
                textColor="#22C55E"
                onPress={() =>
                  navigation.navigate("LabourManagement" as any)
                }
              >
                Go to Salary & Attendance
              </Button>
            </GlassCard>

            <GlassCard title="Salary Advances (No Interest)">
              <Text style={{ color: "#9CA3AF", marginBottom: 6 }}>
                Manage short-term salary advances (no interest). For big
                yearly loans, use Loan section.
              </Text>
              <Button
                mode="contained"
                style={styles.primaryButton}
                onPress={() =>
                  navigation.navigate("LabourAdvance", { labourId })
                }
              >
                Manage Salary Advances
              </Button>
            </GlassCard>
          </>
        )}

        {/* ===================== LOAN SECTION ===================== */}
        {activeSection === "loan" && (
          <>
            <GlassCard
              title="Loan / Advance Summary"
              subtitle={
                hasLoan
                  ? "Village-style loan tracking with interest"
                  : "No loan given yet"
              }
            >
              <InfoRow
                label="Total Disbursed"
                value={`₹${formatNumber(totalDisbursed)}`}
              />
              <InfoRow
                label="Total Repaid"
                value={`₹${formatNumber(totalRepaid)}`}
              />
              <InfoRow
                label="Outstanding Principal"
                value={`₹${formatNumber(outstandingPrincipal)}`}
              />
              <InfoRow
                label="Interest (till now)"
                value={`₹${formatNumber(totalInterest)}`}
              />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabelStrong}>Total Due</Text>
                <Text style={styles.infoValueDanger}>
                  ₹{formatNumber(outstandingWithInterest)}
                </Text>
              </View>

              <View
                style={{
                  flexDirection: "row",
                  marginTop: 12,
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                <Button
                  mode="contained"
                  style={[styles.primaryButton, { flex: 1 }]}
                  onPress={() =>
                    navigation.navigate("LabourLoan", { labourId })
                  }
                >
                  Give Loan / Advance
                </Button>
                <Button
                  mode="outlined"
                  style={[styles.primaryButton, { flex: 1 }]}
                  textColor="#22C55E"
                  onPress={() =>
                    navigation.navigate("LabourLoan", { labourId })
                  }
                >
                  Repay / Transactions
                </Button>
              </View>
            </GlassCard>
          </>
        )}

        {/* ===================== PENALTY SECTION ===================== */}
        {activeSection === "penalty" && (
          <>
            <GlassCard
              title="Penalty Summary"
              subtitle="Extra leaves / fines for this labour"
            >
              <InfoRow
                label="Unpaid Penalties"
                value={`₹${formatNumber(totalPenaltyUnpaid)}`}
              />
              <InfoRow
                label="Paid Penalties"
                value={`₹${formatNumber(totalPenaltyPaid)}`}
              />

              <Button
                mode="contained"
                style={styles.primaryButton}
                onPress={() =>
                  navigation.navigate("LabourPenalty", { labourId })
                }
              >
                Manage Penalties
              </Button>
            </GlassCard>
          </>
        )}

        {/* ===================== TIMELINE SECTION ===================== */}
        {activeSection === "timeline" && (
          <>
            <GlassCard
              title="Activity Timeline"
              subtitle="Loans, repayments, penalties, advances & contract events"
            >
              {timeline.length === 0 ? (
                <Text style={{ color: "#9CA3AF" }}>
                  No activity yet for this labour.
                </Text>
              ) : (
                timeline.map((ev, idx) => (
                  <TimelineItem key={idx} event={ev} />
                ))
              )}
            </GlassCard>
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ---------- Timeline item ----------

const TimelineItem: React.FC<{ event: LabourEventDTO }> = ({ event }) => {
  const color = getEventColor(event.type);

  return (
    <View style={styles.timelineRow}>
      <View style={styles.timelineLeft}>
        <View style={[styles.timelineDot, { backgroundColor: color }]} />
        <View style={styles.timelineLine} />
      </View>
      <View style={styles.timelineContent}>
        <View style={styles.timelineHeaderRow}>
          <Text style={styles.timelineDate}>{formatDate(event.date)}</Text>
          <Text style={styles.timelineAmount}>
            ₹{formatNumber(event.amount)}
          </Text>
        </View>
        <Text style={styles.timelineTitle}>
          {mapEventTypeLabel(event.type)}
        </Text>
        {event.description ? (
          <Text style={styles.timelineDesc}>{event.description}</Text>
        ) : null}
      </View>
    </View>
  );
};

// ---------- Helpers ----------

const formatNumber = (num: number | null | undefined): string => {
  if (num == null || isNaN(num as any)) return "0";
  return Number(num).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  });
};

const formatDate = (dateStr: string): string => {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${d}-${m}-${y}`;
};

const mapEventTypeLabel = (type: string): string => {
  if (type.startsWith("LOAN_")) {
    if (type === "LOAN_DISBURSEMENT") return "Loan / Advance Given";
    if (type === "LOAN_REPAYMENT") return "Loan Repayment";
    return "Loan Activity";
  }
  if (type === "CONTRACT_CREATED") return "Contract Created";
  if (type === "SALARY_PAID") return "Salary Paid";
  if (type.startsWith("PENALTY_")) return "Penalty";
  if (type.startsWith("ADVANCE_")) {
    if (type === "ADVANCE_PENDING") return "Salary Advance (Pending)";
    if (type === "ADVANCE_SETTLED") return "Salary Advance (Settled)";
    return "Salary Advance";
  }
  return type.replace(/_/g, " ");
};

const getEventColor = (type: string): string => {
  if (type.startsWith("LOAN_")) return "#3B82F6"; // blue
  if (type === "CONTRACT_CREATED") return "#22C55E"; // green
  if (type === "SALARY_PAID") return "#0EA5E9"; // cyan
  if (type.startsWith("PENALTY_")) return "#F97316"; // orange
  if (type.startsWith("ADVANCE_")) return "#EAB308"; // yellow
  return "#9CA3AF"; // gray fallback
};

// ---------- Styles ----------

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#020014",
    padding: 12,
  },
  scrollContainer: {
    paddingBottom: 50,
  },
  centered: {
    flex: 1,
    backgroundColor: "#020014",
    alignItems: "center",
    justifyContent: "center",
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
  sectionTitle: {
    color: "#E5E7EB",
    fontSize: 14,
    fontWeight: "700",
  },
  sectionSubtitle: {
    color: "#9CA3AF",
    fontSize: 11,
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  infoLabel: {
    color: "#9CA3AF",
    fontSize: 12,
  },
  infoLabelStrong: {
    color: "#E5E7EB",
    fontSize: 13,
    fontWeight: "700",
  },
  infoValue: {
    color: "#E5E7EB",
    fontSize: 13,
    fontWeight: "600",
  },
  infoValueDanger: {
    color: "#F97316",
    fontSize: 14,
    fontWeight: "700",
  },

  smallChip: {
    backgroundColor: "#111827",
  },

  primaryButton: {
    borderRadius: 16,
    backgroundColor: "#22C55E",
    marginTop: 10,
  },

  timelineRow: {
    flexDirection: "row",
    marginBottom: 10,
  },
  timelineLeft: {
    width: 20,
    alignItems: "center",
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: "#4B5563",
    marginTop: 2,
  },
  timelineContent: {
    flex: 1,
    paddingLeft: 8,
    paddingBottom: 4,
  },
  timelineHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  timelineDate: {
    color: "#9CA3AF",
    fontSize: 11,
  },
  timelineAmount: {
    color: "#E5E7EB",
    fontSize: 12,
    fontWeight: "700",
  },
  timelineTitle: {
    color: "#E5E7EB",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 2,
  },
  timelineDesc: {
    color: "#9CA3AF",
    fontSize: 12,
    marginTop: 2,
  },
  
});
