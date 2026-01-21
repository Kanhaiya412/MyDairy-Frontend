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
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";

import { CattleEntry, getCattleByUser } from "../services/cattleService";
import {
  addAnimalRecord,
  updateAnimalRecord,
  getAnimalHistory,
  getLatestAnimalRecord,
  HEALTH_STATUS_OPTIONS,
  ANIMAL_STATUS_OPTIONS,
  AnimalHealthStatus,
  AnimalStatus,
} from "../services/animalService";

import {
  Card,
  Chip,
  Button,
  TextInput,
  Text,
  FAB,
} from "react-native-paper";

/* =======================================================================================
    SMALL HELPER COMPONENTS
======================================================================================= */

function InfoRow({
  label,
  value,
  multiline,
}: {
  label: string;
  value: any;
  multiline?: boolean;
}) {
  return (
    <View
      style={[
        styles.infoRow,
        multiline && { alignItems: "flex-start" },
      ]}
    >
      <Text style={styles.infoLabel}>{label}</Text>
      <Text
        style={[
          styles.infoValue,
          multiline && { flex: 1, textAlign: "right" },
        ]}
        numberOfLines={multiline ? 3 : 1}
      >
        {value ?? "—"}
      </Text>
    </View>
  );
}

function GlassCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card mode="elevated" style={styles.glassCard}>
      <View style={styles.cardHeaderRow}>
        <View style={styles.cardAccentDot} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <Card.Content style={{ paddingTop: 4 }}>{children}</Card.Content>
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
        style={[
          styles.input,
          multiline && { minHeight: 72, textAlignVertical: "top" },
        ]}
        textColor="#E5E7EB"
        placeholderTextColor="#6B7280"
      />
    </View>
  );
}

/** ✅ FIXED DATE FIELD – WORKING MODAL PICKER (OPTION A) */
function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [internalDate, setInternalDate] = useState<Date>(
    value ? new Date(value) : new Date()
  );

  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setInternalDate(d);
      }
    }
  }, [value]);

  const handleChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (event.type === "dismissed") {
      setShowPicker(false);
      return;
    }

    const date = selected || internalDate;
    setInternalDate(date);

    const formatted = formatDateToYMD(date);
    onChange(formatted);

    // 👉 Android-style modal: close after pick
    if (Platform.OS === "android") setShowPicker(false);
  };

  return (
    <View style={styles.fieldContainer}>
      {/* Whole field is tappable */}
      <Pressable onPress={() => setShowPicker(true)}>
        <View pointerEvents="none">
          <TextInput
            label={label}
            mode="outlined"
            value={value}
            editable={false}
            outlineStyle={[styles.inputOutline, styles.dateInputOutline]}
            style={styles.input}
            textColor="#E5E7EB"
            placeholder="Select date"
            placeholderTextColor="#6B7280"
          />
        </View>
      </Pressable>

      {/* Minimal “calendar” indicator (no icon lib) */}
      <View style={styles.dateRightShapeWrapper}>
        <View style={styles.dateRightShape} />
      </View>

      {showPicker && (
        <DateTimePicker
          value={internalDate}
          mode="date"
          display="default" // ✅ Android modal style
          onChange={handleChange}
        />
      )}
    </View>
  );
}

function SectionLabel({ title }: { title: string }) {
  return <Text style={styles.sectionLabel}>{title}</Text>;
}

function formatDateToYMD(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/* =======================================================================================
    MAIN SCREEN
======================================================================================= */

type TabKey = "overview" | "history" | "form";

export default function AnimalManagementScreen() {
  const [tab, setTab] = useState<TabKey>("overview");
  const [cattleList, setCattleList] = useState<CattleEntry[]>([]);
  const [selectedCattleId, setSelectedCattleId] = useState<number | null>(
    null
  );

  const [latest, setLatest] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  // form fields
  const [healthStatus, setHealthStatus] =
    useState<AnimalHealthStatus>("HEALTHY");
  const [status, setStatus] = useState<AnimalStatus>("ACTIVE");
  const [animalColor, setAnimalColor] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [age, setAge] = useState("");
  const [lastCheckupDate, setLastCheckupDate] = useState("");
  const [nextCheckupDate, setNextCheckupDate] = useState("");
  const [lastVaccinationDate, setLastVaccinationDate] = useState("");
  const [nextVaccinationDate, setNextVaccinationDate] = useState("");
  const [lastHeatDate, setLastHeatDate] = useState("");
  const [lastBullMeetDate, setLastBullMeetDate] = useState("");
  const [lastAIDate, setLastAIDate] = useState("");
  const [avgMilkProduction, setAvgMilkProduction] = useState("");
  const [remarks, setRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* -------------------- load cattle list -------------------- */
  useEffect(() => {
    loadCattle();
  }, []);

  const loadCattle = async () => {
    try {
      const savedUserId = await AsyncStorage.getItem("userId");
      const userId = Number(savedUserId);
      if (!userId) return;

      const data = await getCattleByUser(userId);
      setCattleList(data);

      if (data.length > 0 && data[0].id) {
        setSelectedCattleId(data[0].id);
      }
    } catch (err) {
      console.error("❌ Failed to load cattle", err);
    }
  };

  /* -------------------- load latest + history -------------------- */
  useEffect(() => {
    if (selectedCattleId) {
      loadLatest();
      loadHistory();
    }
  }, [selectedCattleId]);

  const loadLatest = async () => {
    try {
      const res = await getLatestAnimalRecord(selectedCattleId!);
      setLatest(res);
      prefillForm(res);
    } catch {
      setLatest(null);
      clearForm();
    }
  };

  const loadHistory = async () => {
    try {
      const res = await getAnimalHistory(selectedCattleId!);
      setHistory(res);
    } catch {
      setHistory([]);
    }
  };

  /* -------------------- form helpers -------------------- */
  const clearForm = () => {
    setAnimalColor("");
    setBirthDate("");
    setAge("");
    setHealthStatus("HEALTHY");
    setLastCheckupDate("");
    setNextCheckupDate("");
    setLastVaccinationDate("");
    setNextVaccinationDate("");
    setLastHeatDate("");
    setLastBullMeetDate("");
    setLastAIDate("");
    setAvgMilkProduction("");
    setRemarks("");
    setStatus("ACTIVE");
  };

  const prefillForm = (d: any) => {
    setAnimalColor(d.animalColor || "");
    setBirthDate(d.birthDate || "");
    setAge(d.age ? String(d.age) : "");
    setHealthStatus(d.healthStatus || "HEALTHY");
    setLastCheckupDate(d.lastCheckupDate || "");
    setNextCheckupDate(d.nextCheckupDate || "");
    setLastVaccinationDate(d.lastVaccinationDate || "");
    setNextVaccinationDate(d.nextVaccinationDate || "");
    setLastHeatDate(d.lastHeatDate || "");
    setLastBullMeetDate(d.lastBullMeetDate || "");
    setLastAIDate(d.lastAIDate || "");
    setAvgMilkProduction(
      d.avgMilkProduction ? String(d.avgMilkProduction) : ""
    );
    setRemarks(d.remarks || "");
    setStatus(d.status || "ACTIVE");
  };

  const buildPayload = () => ({
    cattleId: selectedCattleId!,
    animalColor,
    birthDate: birthDate || undefined,
    age: age ? Number(age) : undefined,
    healthStatus,
    lastCheckupDate: lastCheckupDate || undefined,
    nextCheckupDate: nextCheckupDate || undefined,
    lastVaccinationDate: lastVaccinationDate || undefined,
    nextVaccinationDate: nextVaccinationDate || undefined,
    lastHeatDate: lastHeatDate || undefined,
    lastBullMeetDate: lastBullMeetDate || undefined,
    lastAIDate: lastAIDate || undefined,
    avgMilkProduction: avgMilkProduction
      ? Number(avgMilkProduction)
      : undefined,
    remarks: remarks || undefined,
    status,
  });

  const onSubmit = async () => {
    if (!selectedCattleId) {
      Alert.alert("Select Cattle", "Please select a cattle first.");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = buildPayload();

      if (latest?.id) {
        await updateAnimalRecord(latest.id, payload);
        Alert.alert("Success", "Record updated");
      } else {
        await addAnimalRecord(payload);
        Alert.alert("Success", "Record added");
      }

      loadLatest();
      loadHistory();
      setTab("overview");
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to save");
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextCheck =
    latest?.nextCheckupDate || latest?.nextVaccinationDate || "—";
  const avgMilk = latest?.avgMilkProduction ?? "—";

  /* =======================================================================================
      RENDER UI
  ======================================================================================== */

  return (
    <View style={styles.screen}>
      {/* HERO HEADER */}
      <View style={styles.heroCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroTitle}>Animal Management</Text>
          <Text style={styles.heroSubtitle}>
            Futuristic health &amp; milk tracking for your herd
          </Text>
        </View>
        <View style={styles.heroCircleOuter}>
          <View style={styles.heroCircleInner} />
        </View>
      </View>

      {/* CATTLE SELECTOR + METRICS */}
      <Card mode="elevated" style={styles.cattleCard}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardAccentDot} />
          <Text style={styles.sectionTitle}>Your Cattle</Text>
        </View>
        <Card.Content>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 4 }}
          >
            {cattleList.map((c) => {
              const isActive = selectedCattleId === c.id;
              return (
                <View key={c.id} style={styles.cattleChipWrapper}>
                  <View style={styles.cattleAvatar} />
                  <Chip
                    mode={isActive ? "flat" : "outlined"}
                    selected={isActive}
                    onPress={() => c.id && setSelectedCattleId(c.id)}
                    style={[
                      styles.cattleChip,
                      isActive && styles.cattleChipActive,
                    ]}
                    textStyle={[
                      styles.cattleChipText,
                      isActive && styles.cattleChipTextActive,
                    ]}
                  >
                    {c.cattleName} ({c.cattleId})
                  </Chip>
                </View>
              );
            })}
            {cattleList.length === 0 && (
              <Text style={styles.emptyChipText}>No cattle found.</Text>
            )}
          </ScrollView>

          <View style={styles.metricsRow}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Health</Text>
              <Text style={styles.metricValue}>
                {latest?.healthStatus || "—"}
              </Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Next Check</Text>
              <Text style={styles.metricValue}>{nextCheck}</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Avg Milk</Text>
              <Text style={styles.metricValue}>
                {avgMilk !== "—" ? `${avgMilk} L` : "—"}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* CUSTOM TABS */}
      <View style={styles.tabRow}>
        {(["overview", "history", "form"] as TabKey[]).map((key) => {
          const isActive = tab === key;
          const label =
            key === "overview"
              ? "Overview"
              : key === "history"
              ? "History"
              : latest
              ? "Update"
              : "Add";
          return (
            <Pressable
              key={key}
              onPress={() => setTab(key)}
              style={[
                styles.tabPill,
                isActive && styles.tabPillActive,
              ]}
            >
              <View
                style={[
                  styles.tabBullet,
                  isActive && styles.tabBulletActive,
                ]}
              />
              <Text
                style={[
                  styles.tabText,
                  isActive && styles.tabTextActive,
                ]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* MAIN CONTENT */}
      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={{ paddingBottom: 140 }}
      >
        {/* OVERVIEW */}
        {tab === "overview" && (
          <>
            {latest ? (
              <>
                <GlassCard title="Basic Info">
                  <InfoRow label="Cattle Name" value={latest.cattleName} />
                  <InfoRow label="Cattle Code" value={latest.cattleId} />
                  <InfoRow label="Color" value={latest.animalColor} />
                  <InfoRow label="Birth Date" value={latest.birthDate} />
                  <InfoRow label="Age" value={latest.age} />
                  <InfoRow label="Status" value={latest.status} />
                </GlassCard>

                <GlassCard title="Health">
                  <InfoRow label="Health Status" value={latest.healthStatus} />
                  <InfoRow
                    label="Last Checkup"
                    value={latest.lastCheckupDate}
                  />
                  <InfoRow
                    label="Next Checkup"
                    value={latest.nextCheckupDate}
                  />
                  <InfoRow
                    label="Remarks"
                    value={latest.remarks}
                    multiline
                  />
                </GlassCard>

                <GlassCard title="Vaccination">
                  <InfoRow
                    label="Last Vaccination"
                    value={latest.lastVaccinationDate}
                  />
                  <InfoRow
                    label="Next Vaccination"
                    value={latest.nextVaccinationDate}
                  />
                </GlassCard>

                <GlassCard title="Breeding">
                  <InfoRow label="Last Heat" value={latest.lastHeatDate} />
                  <InfoRow
                    label="Last Bull Meet"
                    value={latest.lastBullMeetDate}
                  />
                  <InfoRow label="Last AI" value={latest.lastAIDate} />
                </GlassCard>

                <GlassCard title="Milk Production">
                  <InfoRow
                    label="Avg Milk (L/day)"
                    value={latest.avgMilkProduction}
                  />
                </GlassCard>
              </>
            ) : (
              <Card mode="contained" style={styles.emptyCard}>
                <View style={styles.cardHeaderRow}>
                  <View style={styles.cardAccentDotWarning} />
                  <Text style={styles.sectionTitle}>No record yet</Text>
                </View>
                <Card.Content>
                  <Text style={styles.emptyText}>
                    Add the first health record for this cattle.
                  </Text>
                  <Button
                    mode="contained"
                    style={styles.primaryButton}
                    onPress={() => setTab("form")}
                  >
                    Add First Record
                  </Button>
                </Card.Content>
              </Card>
            )}
          </>
        )}

        {/* HISTORY */}
        {tab === "history" && (
          <GlassCard title="Health Timeline">
            {history.length === 0 ? (
              <View style={styles.centerBox}>
                <View style={styles.emptyCircle} />
                <Text style={styles.emptyText}>No history found.</Text>
              </View>
            ) : (
              history.map((h) => (
                <View key={h.id} style={styles.historyItem}>
                  <View style={styles.historyTimelineColumn}>
                    <View style={styles.timelineDot} />
                    <View style={styles.timelineLine} />
                  </View>
                  <View style={styles.historyContent}>
                    <Text style={styles.historyTitle}>
                      {h.healthStatus} • {h.lastCheckupDate || "—"}
                    </Text>
                    <Text style={styles.historyMeta}>
                      Vaccination: {h.lastVaccinationDate || "—"}
                    </Text>
                    <Text style={styles.historyMeta}>
                      Heat: {h.lastHeatDate || "—"} • AI:{" "}
                      {h.lastAIDate || "—"}
                    </Text>
                    {h.remarks ? (
                      <Text style={styles.historyRemarks}>
                        “{h.remarks}”
                      </Text>
                    ) : null}
                  </View>
                </View>
              ))
            )}
          </GlassCard>
        )}

        {/* FORM */}
        {tab === "form" && (
          <GlassCard title={latest ? "Update Record" : "Add Record"}>
            <Text style={styles.fieldLabel}>Health Status</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ marginBottom: 10 }}
            >
              {HEALTH_STATUS_OPTIONS.map((opt: string) => (
                <Chip
                  key={opt}
                  mode={healthStatus === opt ? "flat" : "outlined"}
                  style={[
                    styles.statusChip,
                    healthStatus === opt && styles.statusChipActive,
                  ]}
                  textStyle={[
                    styles.statusChipText,
                    healthStatus === opt && styles.statusChipTextActive,
                  ]}
                  onPress={() => setHealthStatus(opt as AnimalHealthStatus)}
                >
                  {opt}
                </Chip>
              ))}
            </ScrollView>

            <Text style={styles.fieldLabel}>Animal Status</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ marginBottom: 10 }}
            >
              {ANIMAL_STATUS_OPTIONS.map((opt: string) => (
                <Chip
                  key={opt}
                  mode={status === opt ? "flat" : "outlined"}
                  style={[
                    styles.statusChip,
                    status === opt && styles.statusChipActive,
                  ]}
                  textStyle={[
                    styles.statusChipText,
                    status === opt && styles.statusChipTextActive,
                  ]}
                  onPress={() => setStatus(opt as AnimalStatus)}
                >
                  {opt}
                </Chip>
              ))}
            </ScrollView>

            <FormField
              label="Color"
              value={animalColor}
              onChangeText={setAnimalColor}
            />
            <DateField
              label="Birth Date"
              value={birthDate}
              onChange={setBirthDate}
            />
            <FormField
              label="Age (Years)"
              value={age}
              onChangeText={setAge}
              keyboardType="numeric"
            />

            <SectionLabel title="Checkups" />
            <DateField
              label="Last Checkup"
              value={lastCheckupDate}
              onChange={setLastCheckupDate}
            />
            <DateField
              label="Next Checkup"
              value={nextCheckupDate}
              onChange={setNextCheckupDate}
            />

            <SectionLabel title="Vaccination" />
            <DateField
              label="Last Vaccination"
              value={lastVaccinationDate}
              onChange={setLastVaccinationDate}
            />
            <DateField
              label="Next Vaccination"
              value={nextVaccinationDate}
              onChange={setNextVaccinationDate}
            />

            <SectionLabel title="Breeding" />
            <DateField
              label="Last Heat"
              value={lastHeatDate}
              onChange={setLastHeatDate}
            />
            <DateField
              label="Last Bull Meet"
              value={lastBullMeetDate}
              onChange={setLastBullMeetDate}
            />
            <DateField
              label="Last AI"
              value={lastAIDate}
              onChange={setLastAIDate}
            />

            <FormField
              label="Avg Milk (L/day)"
              value={avgMilkProduction}
              onChangeText={setAvgMilkProduction}
              keyboardType="numeric"
            />
            <FormField
              label="Remarks"
              value={remarks}
              onChangeText={setRemarks}
              multiline
            />

            <Button
              mode="contained"
              loading={isSubmitting}
              style={styles.primaryButton}
              onPress={onSubmit}
            >
              {latest ? "Update Record" : "Save Record"}
            </Button>
          </GlassCard>
        )}
      </ScrollView>

      {/* Floating buttons */}
      <View style={styles.fabContainer}>
        <FAB
          icon={() => <View style={styles.fabIconSmall} />}
          style={styles.fabSecondary}
          size="small"
          onPress={() => setTab("history")}
        />
        <FAB
          icon={() => (
            <View style={styles.fabPlusWrapper}>
              <View style={styles.fabPlusLineHorizontal} />
              <View style={styles.fabPlusLineVertical} />
            </View>
          )}
          style={styles.fabPrimary}
          onPress={() => setTab("form")}
        />
      </View>
    </View>
  );
}

/* =======================================================================================
    STYLES
======================================================================================= */

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#020014",
    paddingHorizontal: 12,
    paddingTop: 10,
  },

  /* HERO */
  heroCard: {
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 10,
    backgroundColor: "rgba(10,10,30,0.98)",
    borderWidth: 1.4,
    borderColor: "rgba(129,140,248,0.7)",
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#4F46E5",
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 10,
  },
  heroTitle: {
    color: "#F9FAFB",
    fontSize: 22,
    fontWeight: "800",
  },
  heroSubtitle: {
    color: "#9CA3AF",
    fontSize: 12,
    marginTop: 3,
  },
  heroCircleOuter: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "#6366F1",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
    backgroundColor: "rgba(15,23,42,0.8)",
  },
  heroCircleInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.4,
    borderColor: "#38BDF8",
    backgroundColor: "rgba(59,130,246,0.35)",
  },

  sectionTitle: {
    color: "#E5E7EB",
    fontSize: 14,
    fontWeight: "700",
  },

  /* CATTLE CARD */
  cattleCard: {
    borderRadius: 20,
    marginBottom: 10,
    backgroundColor: "rgba(12,10,40,0.96)",
    borderWidth: 1.4,
    borderColor: "rgba(129,140,248,0.7)",
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 4,
    gap: 8,
  },
  cardAccentDot: {
    width: 8,
    height: 8,
    borderRadius: 10,
    backgroundColor: "#38BDF8",
  },
  cardAccentDotWarning: {
    width: 8,
    height: 8,
    borderRadius: 10,
    backgroundColor: "#F97316",
  },

  cattleChipWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
    marginTop: 4,
  },
  cattleAvatar: {
    width: 18,
    height: 18,
    borderRadius: 6,
    marginRight: 6,
    borderWidth: 1,
    borderColor: "#38BDF8",
    backgroundColor: "rgba(37,99,235,0.5)",
  },
  cattleChip: {
    backgroundColor: "rgba(15,23,42,0.9)",
    borderColor: "rgba(148,163,184,0.6)",
  },
  cattleChipActive: {
    backgroundColor: "#4F46E5",
    borderColor: "#A855F7",
  },
  cattleChipText: {
    color: "#E5E7EB",
    fontSize: 12,
  },
  cattleChipTextActive: {
    color: "#FEFCE8",
    fontWeight: "700",
  },
  emptyChipText: {
    color: "#6B7280",
    fontSize: 12,
    paddingVertical: 4,
  },

  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    gap: 8,
  },
  metricCard: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: "rgba(12,18,50,0.98)",
    borderWidth: 1,
    borderColor: "rgba(56,189,248,0.6)",
  },
  metricLabel: {
    color: "#9CA3AF",
    fontSize: 11,
  },
  metricValue: {
    color: "#E5E7EB",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 2,
  },

  /* TABS */
  tabRow: {
    flexDirection: "row",
    backgroundColor: "rgba(12,10,40,0.96)",
    borderRadius: 999,
    padding: 4,
    marginTop: 8,
    marginBottom: 6,
    borderWidth: 1.2,
    borderColor: "rgba(55,65,194,0.9)",
  },
  tabPill: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  tabPillActive: {
    backgroundColor: "#EEF2FF",
    shadowColor: "#6366F1",
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 5,
  },
  tabBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(148,163,184,0.8)",
  },
  tabBulletActive: {
    backgroundColor: "#4F46E5",
  },
  tabText: {
    fontSize: 13,
    color: "#9CA3AF",
    fontWeight: "600",
  },
  tabTextActive: {
    color: "#111827",
    fontWeight: "700",
  },

  contentScroll: {
    flex: 1,
  },

  glassCard: {
    borderRadius: 20,
    marginBottom: 14,
    backgroundColor: "rgba(11,14,40,0.9)",
    borderWidth: 1.4,
    borderColor: "rgba(129,140,248,0.85)",
    shadowColor: "#4F46E5",
    shadowOpacity: 0.45,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 8,
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  infoValue: {
    fontSize: 13,
    color: "#E5E7EB",
    fontWeight: "600",
    maxWidth: "60%",
    textAlign: "right",
  },

  emptyCard: {
    borderRadius: 20,
    marginTop: 10,
    backgroundColor: "rgba(17,24,39,0.98)",
    borderWidth: 1.4,
    borderColor: "rgba(248,113,113,0.6)",
  },
  emptyText: {
    color: "#9CA3AF",
    fontSize: 13,
    marginTop: 4,
  },
  centerBox: {
    alignItems: "center",
    paddingVertical: 16,
    gap: 8,
  },
  emptyCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: "#F97316",
  },

  historyItem: {
    flexDirection: "row",
    marginBottom: 14,
  },
  historyTimelineColumn: {
    width: 20,
    alignItems: "center",
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 5,
    backgroundColor: "#38BDF8",
    marginTop: 2,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: "rgba(148,163,184,0.5)",
    marginTop: 2,
  },
  historyContent: {
    flex: 1,
    paddingLeft: 6,
  },
  historyTitle: {
    fontSize: 13,
    color: "#E5E7EB",
    fontWeight: "700",
  },
  historyMeta: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  historyRemarks: {
    fontSize: 12,
    color: "#C7D2FE",
    fontStyle: "italic",
    marginTop: 4,
  },

  primaryButton: {
    marginTop: 14,
    borderRadius: 16,
    backgroundColor: "#4F46E5",
  },

  fieldContainer: {
    marginBottom: 12,
  },
  input: {
    backgroundColor: "rgba(15,23,42,0.9)",
  },
  inputOutline: {
    borderRadius: 12,
    borderColor: "rgba(148,163,184,0.75)",
  },
  dateInputOutline: {
    borderColor: "rgba(96,165,250,0.95)",
  },
  dateRightShapeWrapper: {
    position: "absolute",
    right: 18,
    top: 18,
    width: 20,
    height: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#38BDF8",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15,23,42,0.95)",
  },
  dateRightShape: {
    width: 11,
    height: 11,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#38BDF8",
  },

  fieldLabel: {
    fontSize: 12,
    color: "#9CA3AF",
    marginBottom: 4,
    marginTop: 8,
  },
  sectionLabel: {
    fontSize: 13,
    color: "#E5E7EB",
    fontWeight: "700",
    marginTop: 12,
    marginBottom: 4,
  },

  statusChip: {
    marginRight: 8,
    backgroundColor: "rgba(15,23,42,0.85)",
    borderColor: "rgba(148,163,184,0.7)",
  },
  statusChipActive: {
    backgroundColor: "#4F46E5",
    borderColor: "#A855F7",
  },
  statusChipText: {
    fontSize: 11,
    color: "#E5E7EB",
  },
  statusChipTextActive: {
    color: "#FEFCE8",
    fontWeight: "700",
  },

  /* FABs */
  fabContainer: {
    position: "absolute",
    right: 16,
    bottom: 20,
    alignItems: "center",
    gap: 10,
  },
  fabPrimary: {
    backgroundColor: "#4F46E5",
  },
  fabSecondary: {
    backgroundColor: "#020617",
    borderWidth: 1,
    borderColor: "#38BDF8",
  },
  fabIconSmall: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  fabPlusWrapper: {
    width: 14,
    height: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  fabPlusLineHorizontal: {
    position: "absolute",
    width: 10,
    height: 2,
    borderRadius: 1,
    backgroundColor: "#E5E7EB",
  },
  fabPlusLineVertical: {
    position: "absolute",
    width: 2,
    height: 10,
    borderRadius: 1,
    backgroundColor: "#E5E7EB",
  },
});
