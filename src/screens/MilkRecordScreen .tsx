// src/screens/MilkRecordScreen.tsx
import React, { JSX, useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  Pressable,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Platform,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import moment from "moment";
import { getMilkEntries } from "../services/milkService";
import { LineChart } from "react-native-chart-kit";
import LinearGradient from "react-native-linear-gradient";
import * as Animatable from "react-native-animatable";
import { useNavigation } from "@react-navigation/native";

const { width: screenWidth } = Dimensions.get("window");

// ──────────────────────────────────────────────────────────
// THEME — Dairy Professional White & Blue (Concept C)
// ──────────────────────────────────────────────────────────
const theme = {
  bg: "#EDF2FF",
  surface: "#FFFFFF",
  surfaceSoft: "#F4F6FF",
  border: "#D4DCFF",
  text: "#0F172A",
  textMuted: "#64748B",
  brand: "#2563EB",
  brandStrong: "#1D4ED8",
  accent: "#38BDF8",
  success: "#16A34A",
  danger: "#EF4444",
};

type MilkRecord = {
  id?: number;
  userId?: number;
  date: string; // YYYY-MM-DD
  day?: string;
  shift?: "MORNING" | "EVENING" | string;
  milkQuantity: number;
  fat?: number;
  fatPrice?: number;
  totalPayment: number;
};

const months = moment.months();

/** sprint helper */
const sprintForIndex = (index: number, year: number, monthIndex: number) => {
  const daysInMonth = moment({ year, month: monthIndex }).daysInMonth();
  if (index === 0) return { start: 1, end: Math.min(10, daysInMonth) };
  if (index === 1) return { start: 11, end: Math.min(20, daysInMonth) };
  return { start: 21, end: daysInMonth };
};

/* ========== PREMIUM BLUE BORDER TILE COMPONENT ========== */
const StatTile = ({
  label,
  value,
  icon,
  delay = 0,
}: {
  label: string;
  value: string | number;
  icon: string;
  delay?: number;
}) => {
  return (
    <Animatable.View
      animation="fadeInUp"
      delay={delay}
      style={styles.tileContainer}
    >
      <View style={styles.tile}>
        <View style={styles.tileIconBox}>
          <Text style={styles.tileIcon}>{icon}</Text>
        </View>

        <Text style={styles.tileValue}>{value}</Text>
        <Text style={styles.tileLabel}>{label}</Text>
      </View>
    </Animatable.View>
  );
};

export default function MilkRecordScreen(): JSX.Element {
  const navigation = useNavigation<any>();

  const [records, setRecords] = useState<MilkRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number>(
    moment().month()
  );
  const [selectedYear, setSelectedYear] = useState<number>(moment().year());
  const [selectedSprintIndex, setSelectedSprintIndex] = useState<number>(() => {
    const d = moment().date();
    if (d <= 10) return 0;
    if (d <= 20) return 1;
    return 2;
  });

  const [chartMode, setChartMode] = useState<"milk" | "earnings">("milk");

  // ────────────────────────────────────────────────────────
  // Fetch month records
  // ────────────────────────────────────────────────────────
  const fetchMonth = useCallback(async (monthIndex: number, year: number) => {
    try {
      setLoading(true);
      const uid = await AsyncStorage.getItem("userId");
      if (!uid) {
        setRecords([]);
        setLoading(false);
        return;
      }
      const userId = Number(uid);
      const data = await getMilkEntries(userId, monthIndex, year);
      const arr = Array.isArray(data) ? data : data?.data ?? [];
      const normalized: MilkRecord[] = arr.map((r: any) => ({
        id: r.id,
        userId: r.userId,
        date: r.date,
        day: r.day,
        shift: r.shift || "MORNING",
        milkQuantity: Number(r.milkQuantity || 0),
        fat: r.fat !== undefined ? Number(r.fat) : 0,
        fatPrice: r.fatPrice !== undefined ? Number(r.fatPrice) : 0,
        totalPayment:
          r.totalPayment !== undefined
            ? Number(r.totalPayment)
            : Number(
                (
                  (r.milkQuantity || 0) *
                  (r.fat || 0) *
                  (r.fatPrice || 0)
                ).toFixed(2)
              ),
      }));
      setRecords(normalized);
    } catch (e) {
      console.error("fetchMonth error:", e);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMonth(selectedMonthIndex, selectedYear);
  }, [fetchMonth, selectedMonthIndex, selectedYear]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMonth(selectedMonthIndex, selectedYear);
    setRefreshing(false);
  };

  // sprint range & days for chart (cap to today if current month)
  const sprintRangeFull = useMemo(
    () => sprintForIndex(selectedSprintIndex, selectedYear, selectedMonthIndex),
    [selectedSprintIndex, selectedYear, selectedMonthIndex]
  );

  const sprintRangeForChart = useMemo(() => {
    const { start, end } = sprintRangeFull;
    const isCurrentMonth =
      selectedMonthIndex === moment().month() &&
      selectedYear === moment().year();
    if (!isCurrentMonth) return { start, end };
    const today = moment().date();
    const cappedEnd = Math.min(end, today);
    return { start, end: cappedEnd };
  }, [sprintRangeFull, selectedMonthIndex, selectedYear]);

  const sprintDaysForChart = useMemo(() => {
    const arr: number[] = [];
    const { start, end } = sprintRangeForChart;
    for (let d = start; d <= end; d++) arr.push(d);
    return arr;
  }, [sprintRangeForChart]);

  // Aggregates for the **full** sprint (displayed in tiles)
  const sprintAggregates = useMemo(() => {
    const fullStart = sprintRangeFull.start;
    const fullEnd = sprintRangeFull.end;

    let totalMilk = 0;
    let totalEarn = 0;
    let totalEntries = 0;
    let fatSum = 0;

    for (const r of records) {
      const dd = moment(r.date, "YYYY-MM-DD");
      if (dd.month() !== selectedMonthIndex || dd.year() !== selectedYear)
        continue;
      const day = dd.date();
      if (day < fullStart || day > fullEnd) continue;
      totalMilk += r.milkQuantity;
      totalEarn += r.totalPayment;
      fatSum += r.fat || 0;
      totalEntries++;
    }

    return {
      totalMilk,
      totalEarn,
      totalEntries,
      avgFatOverall:
        totalEntries > 0 ? Number((fatSum / totalEntries).toFixed(2)) : 0,
    };
  }, [records, sprintRangeFull, selectedMonthIndex, selectedYear]);

  // chartData built from sprintDaysForChart
  const chartData = useMemo(() => {
    const labels = sprintDaysForChart.map((d) => String(d));
    const dataPoints = sprintDaysForChart.map((d) => {
      const items = records.filter((r) => {
        const dd = moment(r.date, "YYYY-MM-DD");
        return (
          dd.month() === selectedMonthIndex &&
          dd.year() === selectedYear &&
          dd.date() === d
        );
      });
      if (chartMode === "milk")
        return Number(
          items
            .reduce((s, it) => s + (it.milkQuantity || 0), 0)
            .toFixed(2)
        );
      return Number(
        items
          .reduce((s, it) => s + (it.totalPayment || 0), 0)
          .toFixed(2)
      );
    });

    return {
      labels,
      datasets: [{ data: dataPoints }],
    };
  }, [records, sprintDaysForChart, chartMode, selectedMonthIndex, selectedYear]);

  // groupedByDate for listing entries
  const groupedByDate = useMemo(() => {
    const groups: Record<string, MilkRecord[]> = {};
    for (const r of records) {
      const key = moment(r.date, "YYYY-MM-DD").format("YYYY-MM-DD");
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    }
    Object.keys(groups).forEach((k) =>
      groups[k].sort((a, b) => {
        if (a.shift === b.shift) return 0;
        if (a.shift === "MORNING") return -1;
        return 1;
      })
    );
    return groups;
  }, [records]);

  // ────────────────────────────────────────────────────────
  // LOADING STATE
  // ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.loaderBox}>
        <ActivityIndicator size="large" color={theme.brand} />
        <Text style={styles.loaderText}>Loading records…</Text>
      </View>
    );
  }

  // ────────────────────────────────────────────────────────
  // MAIN UI
  // ────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* MONTH CHIPS */}
      <View style={styles.monthRow}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={months}
          keyExtractor={(m, i) => `${m}-${i}`}
          renderItem={({ item, index }) => {
            const active = index === selectedMonthIndex;
            return (
              <Pressable
                onPress={() => {
                  setSelectedMonthIndex(index);
                  const today = moment();
                  if (index === today.month() && selectedYear === today.year()) {
                    const d = today.date();
                    if (d <= 10) setSelectedSprintIndex(0);
                    else if (d <= 20) setSelectedSprintIndex(1);
                    else setSelectedSprintIndex(2);
                  } else {
                    setSelectedSprintIndex(0);
                  }
                }}
                style={[
                  styles.monthChip,
                  active && styles.monthChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.monthChipText,
                    active && styles.monthChipTextActive,
                  ]}
                >
                  {item.substring(0, 3)}
                </Text>
              </Pressable>
            );
          }}
          contentContainerStyle={styles.monthList}
        />
      </View>

      {/* SPRINT SELECT */}
      <View style={styles.sprintRow}>
        {(() => {
          const daysInMonth = moment({
            year: selectedYear,
            month: selectedMonthIndex,
          }).daysInMonth();
          const labels = [`1–10`, `11–20`, `21–${daysInMonth}`];
          return labels.map((lbl, idx) => {
            const active = idx === selectedSprintIndex;
            return (
              <Pressable
                key={lbl}
                onPress={() => setSelectedSprintIndex(idx)}
                style={[styles.sprintBtn, active && styles.sprintBtnActive]}
              >
                <Text
                  style={[
                    styles.sprintBtnText,
                    active && styles.sprintBtnTextActive,
                  ]}
                >
                  {lbl}
                </Text>
              </Pressable>
            );
          });
        })()}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.brand}
          />
        }
      >
        {/* SUMMARY TILES */}
        <View style={styles.tileRow}>
          <StatTile
            icon="🥛"
            label="Total Milk"
            value={`${sprintAggregates.totalMilk.toFixed(2)} L`}
            delay={0}
          />
          <StatTile
            icon="💰"
            label="Earnings"
            value={`₹ ${sprintAggregates.totalEarn.toFixed(2)}`}
            delay={80}
          />
        </View>

        <View style={styles.tileRow}>
          <StatTile
            icon="🧪"
            label="Avg Fat"
            value={`${sprintAggregates.avgFatOverall.toFixed(2)}%`}
            delay={160}
          />
          <StatTile
            icon="📄"
            label="Entries"
            value={sprintAggregates.totalEntries}
            delay={240}
          />
        </View>

        {/* CHART CARD */}
        <Animatable.View
          animation="fadeInUp"
          delay={320}
          style={styles.chartCard}
        >
          <View style={styles.chartHeader}>
            <View>
              <Text style={styles.chartTitle}>
                {chartMode === "milk" ? "Milk Trend" : "Earnings Trend"}
              </Text>
              <Text style={styles.chartSub}>
                {moment({
                  year: selectedYear,
                  month: selectedMonthIndex,
                }).format("MMMM YYYY")}{" "}
                • {sprintRangeFull.start}–{sprintRangeFull.end}
              </Text>
            </View>

            <View style={styles.modeRow}>
              <Pressable
                onPress={() => setChartMode("milk")}
                style={[
                  styles.modeBtn,
                  chartMode === "milk" && styles.modeBtnActive,
                ]}
              >
                <Text
                  style={[
                    styles.modeTxt,
                    chartMode === "milk" && styles.modeTxtActive,
                  ]}
                >
                  🥛 Milk
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setChartMode("earnings")}
                style={[
                  styles.modeBtn,
                  chartMode === "earnings" && styles.modeBtnActive,
                ]}
              >
                <Text
                  style={[
                    styles.modeTxt,
                    chartMode === "earnings" && styles.modeTxtActive,
                  ]}
                >
                  💸 Earnings
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.chartBody}>
            {chartData.labels.length > 0 ? (
              <LineChart
                data={chartData}
                width={Math.min(screenWidth - 34, 1200)}
                height={220}
                withInnerLines={true}
                withOuterLines={false}
                chartConfig={{
                  backgroundGradientFrom: "#FFFFFF",
                  backgroundGradientTo: "#FFFFFF",
                  decimalPlaces: 1,
                  color: (opacity = 1) =>
                    `rgba(37,99,235,${opacity})`,
                  labelColor: () => theme.textMuted,
                  propsForDots: {
                    r: "4",
                    strokeWidth: "2",
                    stroke: "#FFFFFF",
                    fill: theme.brand,
                  },
                  propsForBackgroundLines: {
                    stroke: "rgba(148,163,184,0.2)",
                  },
                  fillShadowGradient: "#2563EB",
                  fillShadowGradientOpacity: 0.15, // Area chart effect
                }}
                bezier
                style={{ borderRadius: 12 }}
              />
            ) : (
              <View style={styles.emptyChart}>
                <Text style={styles.emptyText}>No chart data</Text>
              </View>
            )}
          </View>
        </Animatable.View>

        {/* DATE-GROUPED LIST (Clean cards) */}
        {Object.keys(groupedByDate).length === 0 ? (
          <View style={styles.noDataBox}>
            <Text style={styles.noDataText}>
              No entries for this month
            </Text>
          </View>
        ) : (
          Object.entries(groupedByDate)
            .sort(
              (a, b) =>
                new Date(b[0]).getTime() - new Date(a[0]).getTime()
            )
            .map(([dateStr, items]) => (
              <Animatable.View
                key={dateStr}
                animation="fadeInUp"
                style={styles.dayCard}
              >
                <View style={styles.dayHeader}>
                  <Text style={styles.dayHeaderText}>
                    {moment(dateStr).format("ddd, DD MMM YYYY")}
                  </Text>
                  <Text style={styles.dayHeaderRight}>
                    {items
                      .reduce(
                        (s, it) => s + (it.milkQuantity || 0),
                        0
                      )
                      .toFixed(2)}{" "}
                    L · ₹{" "}
                    {items
                      .reduce(
                        (s, it) => s + (it.totalPayment || 0),
                        0
                      )
                      .toFixed(2)}
                  </Text>
                </View>

                {items.map((it, idx) => (
                  <View key={idx} style={styles.entryRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.entryShift}>
                        {it.shift === "MORNING"
                          ? "🌅 Morning"
                          : "🌇 Evening"}
                      </Text>
                      <Text style={styles.entryMeta}>
                        Fat {it.fat ?? 0}% · ₹ {it.fatPrice ?? 0}/unit
                      </Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={styles.entryMilk}>
                        {(it.milkQuantity || 0).toFixed(2)} L
                      </Text>
                      <Text style={styles.entryEarn}>
                        ₹ {(it.totalPayment || 0).toFixed(2)}
                      </Text>
                    </View>
                  </View>
                ))}
              </Animatable.View>
            ))
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* FAB – Add Milk */}
      <Pressable
        onPress={() => navigation.navigate("AddMilk" as any)}
        style={({
          pressed,
        }: {
          pressed: boolean;
        }) =>
          [
            styles.fab,
            pressed && { transform: [{ scale: 0.96 }] },
          ] as any
        }
      >
        <LinearGradient
          colors={[theme.brandStrong, theme.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabInner}
        >
          <Text style={styles.fabText}>＋</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

/* ---------- STYLES ---------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },

  loaderBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.bg,
  },
  loaderText: { color: theme.textMuted, marginTop: 8 },

  // Month chips
  monthRow: { paddingVertical: 10, paddingLeft: 12 },
  monthList: { paddingRight: 12 },
  monthChip: {
    backgroundColor: theme.surfaceSoft,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    marginRight: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  monthChipActive: {
    backgroundColor: "#DBEAFE",
    borderColor: theme.brandStrong,
  },
  monthChipText: {
    color: theme.textMuted,
    fontWeight: "700",
    fontSize: 13,
  },
  monthChipTextActive: {
    color: theme.brandStrong,
    fontWeight: "900",
  },

  // Sprint chips
  sprintRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginBottom: 10,
  },
  sprintBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: theme.surfaceSoft,
    borderWidth: 1,
    borderColor: theme.border,
  },
  sprintBtnActive: {
    backgroundColor: "#DBEAFE",
    borderColor: theme.brandStrong,
  },
  sprintBtnText: {
    color: theme.textMuted,
    fontWeight: "700",
    fontSize: 13,
  },
  sprintBtnTextActive: {
    color: theme.brandStrong,
    fontWeight: "900",
  },

  scroll: { flex: 1 },
  contentContainer: { paddingHorizontal: 14, paddingBottom: 24 },

  // Stat tiles
  tileRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 6,
  },
  tileContainer: { flex: 1, marginHorizontal: 6 },
  tile: {
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  tileIconBox: {
    marginBottom: 6,
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.surfaceSoft,
  },
  tileIcon: { fontSize: 20 },
  tileValue: {
    color: theme.brandStrong,
    fontSize: 18,
    fontWeight: "800",
    marginTop: 6,
  },
  tileLabel: {
    color: theme.textMuted,
    fontWeight: "600",
    marginTop: 4,
    fontSize: 12,
  },

  // Chart
  chartCard: {
    backgroundColor: theme.surface,
    marginTop: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.border,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  chartHeader: {
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  chartTitle: {
    color: theme.text,
    fontSize: 16,
    fontWeight: "800",
  },
  chartSub: {
    color: theme.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  modeRow: { flexDirection: "row" },
  modeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: theme.surfaceSoft,
    borderWidth: 1,
    borderColor: theme.border,
    marginLeft: 8,
  },
  modeBtnActive: {
    backgroundColor: "#DBEAFE",
    borderColor: theme.brandStrong,
  },
  modeTxt: {
    color: theme.textMuted,
    fontWeight: "700",
    fontSize: 12,
  },
  modeTxtActive: {
    color: theme.brandStrong,
    fontWeight: "800",
  },

  chartBody: { padding: 12 },
  emptyChart: {
    height: 180,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: { color: theme.textMuted },

  // Date cards
  dayCard: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  dayHeaderText: {
    color: theme.text,
    fontWeight: "800",
    fontSize: 14,
  },
  dayHeaderRight: {
    color: theme.textMuted,
    fontWeight: "600",
    fontSize: 12,
  },

  entryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 6,
  },
  entryShift: {
    color: theme.text,
    fontWeight: "700",
    fontSize: 13,
  },
  entryMeta: {
    color: theme.textMuted,
    marginTop: 2,
    fontSize: 12,
  },
  entryMilk: {
    color: theme.text,
    fontWeight: "800",
    fontSize: 15,
  },
  entryEarn: {
    color: theme.brandStrong,
    fontWeight: "800",
    fontSize: 15,
    marginTop: 2,
  },

  noDataBox: { alignItems: "center", padding: 30 },
  noDataText: { color: theme.textMuted },

  // FAB
  fab: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 34 : 24,
    right: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2563EB",
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  fabInner: {
    width: "100%",
    height: "100%",
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  fabText: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "900",
    lineHeight: 34,
  },
});
