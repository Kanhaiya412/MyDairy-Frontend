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

const theme = {
  bg: "#0F172A",
  surface: "#0B1220",
  glass: "rgba(255,255,255,0.04)",
  glassStrong: "rgba(255,255,255,0.06)",
  white: "#FFFFFF",
  muted: "#94A3B8",
  border: "rgba(255,255,255,0.06)",
  blue: "#2563EB",
  cyan: "#06B6D4",
  green: "#10B981",
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

/* ========== ULTRA PREMIUM NEON TILE COMPONENT ========== */
const NeonTile = ({
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
    <Animatable.View animation="fadeInUp" delay={delay} style={styles.neonTileContainer}>
      <LinearGradient
        colors={["rgba(37,99,235,0.12)", "rgba(6,182,212,0.08)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.neonTile}
      >
        <View style={styles.neonIconBox}>
          <Text style={styles.neonIcon}>{icon}</Text>
        </View>

        <Text style={styles.neonValue}>{value}</Text>
        <Text style={styles.neonLabel}>{label}</Text>
      </LinearGradient>
    </Animatable.View>
  );
};

export default function MilkRecordScreen(): JSX.Element {
  const navigation = useNavigation<any>();

  const [records, setRecords] = useState<MilkRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number>(moment().month());
  const [selectedYear, setSelectedYear] = useState<number>(moment().year());

  const [selectedSprintIndex, setSelectedSprintIndex] = useState<number>(() => {
    const d = moment().date();
    if (d <= 10) return 0;
    if (d <= 20) return 1;
    return 2;
  });

  const [chartMode, setChartMode] = useState<"milk" | "earnings">("milk");

  // ✅ Fetch month records
  const fetchMonth = useCallback(async (monthIndex: number, year: number) => {
    try {
      setLoading(true);

      const uid = await AsyncStorage.getItem("userId");
      if (!uid) {
        setRecords([]);
        return;
      }

      const userId = Number(uid);

      // ✅ IMPORTANT: Backend MONTH(date) expects 1-12
      const apiMonth = monthIndex + 1;

      const data = await getMilkEntries(userId, apiMonth, year);

      const arr = Array.isArray(data) ? data : data?.data ?? [];

      const normalized: MilkRecord[] = arr.map((r: any) => {
        const milkQty = Number(r.milkQuantity || 0);
        const fat = r.fat !== undefined ? Number(r.fat) : 0;
        const fatPrice = r.fatPrice !== undefined ? Number(r.fatPrice) : 0;

        const totalPayment =
          r.totalPayment !== undefined
            ? Number(r.totalPayment)
            : Number((milkQty * fat * fatPrice).toFixed(2));

        return {
          id: r.id,
          userId: r.userId,
          date: r.date,
          day: r.day,
          shift: r.shift || "MORNING",
          milkQuantity: milkQty,
          fat,
          fatPrice,
          totalPayment,
        };
      });

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
      selectedMonthIndex === moment().month() && selectedYear === moment().year();

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
      if (dd.month() !== selectedMonthIndex || dd.year() !== selectedYear) continue;
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
      avgFatOverall: totalEntries > 0 ? Number((fatSum / totalEntries).toFixed(2)) : 0,
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

      if (chartMode === "milk") {
        return Number(
          items.reduce((s: number, it: MilkRecord) => s + (it.milkQuantity || 0), 0).toFixed(2)
        );
      }

      return Number(
        items.reduce((s: number, it: MilkRecord) => s + (it.totalPayment || 0), 0).toFixed(2)
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

    // sort within group (morning first)
    (Object.keys(groups) as string[]).forEach((k: string) =>
      groups[k].sort((a, b) => {
        if (a.shift === b.shift) return 0;
        if (a.shift === "MORNING") return -1;
        return 1;
      })
    );

    return groups;
  }, [records]);

  // RENDER LOADING
  if (loading) {
    return (
      <View style={styles.loaderBox}>
        <ActivityIndicator size="large" color={theme.cyan} />
        <Text style={styles.loaderText}>Loading records…</Text>
      </View>
    );
  }

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

                  // when month changes, reset sprint to default containing today's date if same month-year
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
                style={[styles.monthChip, active && styles.monthChipActive]}
              >
                <Text style={[styles.monthChipText, active && styles.monthChipTextActive]}>
                  {item.substring(0, 3)}
                </Text>
              </Pressable>
            );
          }}
          contentContainerStyle={styles.monthList}
        />
      </View>

      {/* ✅ YEAR SELECT */}
      <View style={styles.yearRow}>
        <Pressable
          onPress={() => {
            setSelectedYear((y) => y - 1);
            setSelectedSprintIndex(0);
          }}
          style={styles.yearBtn}
        >
          <Text style={styles.yearBtnText}>◀</Text>
        </Pressable>

        <Text style={styles.yearText}>{selectedYear}</Text>

        <Pressable
          onPress={() => {
            setSelectedYear((y) => y + 1);
            setSelectedSprintIndex(0);
          }}
          style={styles.yearBtn}
        >
          <Text style={styles.yearBtnText}>▶</Text>
        </Pressable>
      </View>

      {/* SPRINT SELECT */}
      <View style={styles.sprintRow}>
        {(() => {
          const daysInMonth = moment({ year: selectedYear, month: selectedMonthIndex }).daysInMonth();
          const labels = [`1–10`, `11–20`, `21–${daysInMonth}`];

          return labels.map((lbl, idx) => {
            const active = idx === selectedSprintIndex;
            return (
              <Pressable
                key={lbl}
                onPress={() => setSelectedSprintIndex(idx)}
                style={[styles.sprintBtn, active && styles.sprintBtnActive]}
              >
                <Text style={[styles.sprintBtnText, active && styles.sprintBtnTextActive]}>
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.cyan} />
        }
      >
        {/* ULTRA PREMIUM TILES */}
        <View style={styles.premiumRow}>
          <NeonTile
            icon="🥛"
            label="Total Milk"
            value={`${sprintAggregates.totalMilk.toFixed(2)} L`}
            delay={0}
          />
          <NeonTile
            icon="💰"
            label="Earnings"
            value={`₹ ${sprintAggregates.totalEarn.toFixed(2)}`}
            delay={80}
          />
        </View>

        <View style={styles.premiumRow}>
          <NeonTile
            icon="🧪"
            label="Avg Fat"
            value={`${sprintAggregates.avgFatOverall.toFixed(2)}%`}
            delay={160}
          />
          <NeonTile
            icon="📄"
            label="Entries"
            value={sprintAggregates.totalEntries}
            delay={240}
          />
        </View>

        {/* Chart */}
        <Animatable.View animation="fadeInUp" delay={320} style={styles.chartCard}>
          <LinearGradient colors={["#07102a", "#07102a"]} style={styles.chartHeader}>
            <View>
              <Text style={styles.chartTitle}>
                {chartMode === "milk" ? "Milk Trend" : "Earnings Trend"}
              </Text>
              <Text style={styles.chartSub}>
                {moment({ year: selectedYear, month: selectedMonthIndex }).format("MMMM YYYY")} •
                Sprint {sprintRangeFull.start}–{sprintRangeFull.end}
              </Text>
            </View>

            <View style={styles.modeRow}>
              <Pressable
                onPress={() => setChartMode("milk")}
                style={[styles.modeBtn, chartMode === "milk" && styles.modeBtnActive]}
              >
                <Text style={[styles.modeTxt, chartMode === "milk" && styles.modeTxtActive]}>
                  🥛 Milk
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setChartMode("earnings")}
                style={[styles.modeBtn, chartMode === "earnings" && styles.modeBtnActive]}
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
          </LinearGradient>

          <View style={styles.chartBody}>
            {chartData.labels.length > 0 ? (
              <LineChart
                data={chartData}
                width={Math.min(screenWidth - 34, 1200)}
                height={220}
                withInnerLines={true}
                withOuterLines={false}
                chartConfig={{
                  backgroundGradientFrom: "transparent",
                  backgroundGradientTo: "transparent",
                  decimalPlaces: 1,
                  color: (opacity = 1) => `rgba(6,182,212,${opacity})`,
                  labelColor: () => "#9CA3AF",
                  propsForDots: { r: "4", strokeWidth: "2", stroke: "#0F172A", fill: "#06B6D4" },
                  propsForBackgroundLines: { stroke: "rgba(255,255,255,0.03)" },
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

        {/* Date grouped list */}
        {Object.keys(groupedByDate).length === 0 ? (
          <View style={styles.noDataBox}>
            <Text style={styles.noDataText}>No entries for this month</Text>
          </View>
        ) : (
          (Object.keys(groupedByDate) as string[])
            .sort((a: string, b: string) => new Date(b).getTime() - new Date(a).getTime())
            .map((dateStr: string) => {
              const items: MilkRecord[] = groupedByDate[dateStr] || [];

              return (
                <Animatable.View key={dateStr} animation="fadeInUp" style={styles.dayCard}>
                  <View style={styles.dayHeader}>
                    <Text style={styles.dayHeaderText}>
                      {moment(dateStr).format("ddd, DD MMM YYYY")}
                    </Text>
                    <Text style={styles.dayHeaderRight}>
                      {items
                        .reduce((s: number, it: MilkRecord) => s + (it.milkQuantity || 0), 0)
                        .toFixed(2)}{" "}
                      L • ₹{" "}
                      {items
                        .reduce((s: number, it: MilkRecord) => s + (it.totalPayment || 0), 0)
                        .toFixed(2)}
                    </Text>
                  </View>

                  {items.map((it: MilkRecord, idx: number) => (
                    <View key={idx} style={styles.entryRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.entryShift}>
                          {it.shift === "MORNING" ? "🌅 Morning" : "🌇 Evening"}
                        </Text>
                        <Text style={styles.entryMeta}>
                          Fat {it.fat}% • ₹ {it.fatPrice}/unit
                        </Text>
                      </View>

                      <View style={{ alignItems: "flex-end" }}>
                        <Text style={styles.entryMilk}>
                          {(it.milkQuantity || 0).toFixed(2)} L
                        </Text>
                        <Text style={styles.entryEarn}>₹ {(it.totalPayment || 0).toFixed(2)}</Text>
                      </View>
                    </View>
                  ))}
                </Animatable.View>
              );
            })
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* FAB */}
      <Pressable
        onPress={() => navigation.navigate("AddMilk" as any)}
        style={({ pressed }: { pressed: boolean }) =>
          ([styles.fab, pressed && { transform: [{ scale: 0.96 }] }] as any)
        }
      >
        <Text style={styles.fabText}>＋</Text>
      </Pressable>
    </View>
  );
}

/* ---------- STYLES ---------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },

  loaderBox: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.bg },
  loaderText: { color: theme.muted, marginTop: 8 },

  /* month chips */
  monthRow: { paddingVertical: 10, paddingLeft: 12 },
  monthList: { paddingRight: 12 },
  monthChip: {
    backgroundColor: theme.glass,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    marginRight: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  monthChipActive: { backgroundColor: "rgba(37,99,235,0.2)", borderColor: theme.blue },
  monthChipText: { color: theme.muted, fontWeight: "700" },
  monthChipTextActive: { color: theme.white, fontWeight: "900" },

  /* ✅ year selector */
  yearRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    marginBottom: 10,
  },
  yearBtn: {
    width: 42,
    height: 42,
    borderRadius: 999,
    backgroundColor: theme.glass,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: "center",
    justifyContent: "center",
  },
  yearBtnText: {
    color: theme.white,
    fontWeight: "900",
    fontSize: 16,
  },
  yearText: {
    color: theme.white,
    fontSize: 18,
    fontWeight: "900",
  },

  sprintRow: { flexDirection: "row", justifyContent: "center", gap: 10, marginBottom: 10 },
  sprintBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: theme.glass,
    borderWidth: 1,
    borderColor: theme.border,
  },
  sprintBtnActive: { backgroundColor: "rgba(37,99,235,0.2)", borderColor: theme.blue },
  sprintBtnText: { color: theme.muted, fontWeight: "700" },
  sprintBtnTextActive: { color: theme.white, fontWeight: "900" },

  scroll: { flex: 1 },
  contentContainer: { paddingHorizontal: 14, paddingBottom: 24 },

  /* premium neon tiles */
  premiumRow: { flexDirection: "row", justifyContent: "space-between", marginVertical: 6 },

  neonTileContainer: { flex: 1, marginHorizontal: 6 },
  neonTile: {
    paddingVertical: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.02)",
    alignItems: "center",
    shadowColor: "#06B6D4",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  neonIconBox: {
    marginBottom: 6,
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  neonIcon: { fontSize: 22 },

  neonValue: { color: theme.white, fontSize: 20, fontWeight: "900", marginTop: 4 },
  neonLabel: { color: theme.muted, fontWeight: "700", marginTop: 6 },

  /* chart */
  chartCard: {
    backgroundColor: theme.surface,
    marginTop: 10,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: theme.border,
  },
  chartHeader: { padding: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  chartTitle: { color: theme.white, fontSize: 16, fontWeight: "900" },
  chartSub: { color: theme.muted, fontSize: 12, marginTop: 2 },
  modeRow: { flexDirection: "row" },
  modeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: theme.border,
    marginLeft: 8,
  },
  modeBtnActive: { backgroundColor: theme.white },
  modeTxt: { color: theme.white, fontWeight: "700" },
  modeTxtActive: { color: theme.blue, fontWeight: "900" },

  chartBody: { padding: 12 },
  emptyChart: { height: 180, justifyContent: "center", alignItems: "center" },
  emptyText: { color: theme.muted },

  /* list */
  dayCard: {
    backgroundColor: theme.surface,
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  dayHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  dayHeaderText: { color: theme.white, fontWeight: "900", fontSize: 15 },
  dayHeaderRight: { color: theme.muted, fontWeight: "700" },

  entryRow: { flexDirection: "row", justifyContent: "space-between", marginVertical: 6 },
  entryShift: { color: theme.white, fontWeight: "800" },
  entryMeta: { color: theme.muted, marginTop: 2 },
  entryMilk: { color: theme.white, fontWeight: "900", fontSize: 16 },
  entryEarn: { color: theme.cyan, fontWeight: "900", fontSize: 16 },

  noDataBox: { alignItems: "center", padding: 30 },
  noDataText: { color: theme.muted },

  /* FAB */
  fab: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 34 : 24,
    right: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.blue,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: theme.blue,
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  fabText: { color: "#fff", fontSize: 36, fontWeight: "900", lineHeight: 38 },
});
