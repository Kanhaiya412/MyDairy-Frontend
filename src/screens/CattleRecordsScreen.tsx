// src/screens/CattleRecordsScreen.tsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Pressable,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Image,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import * as Animatable from "react-native-animatable";

import {
  getCattleByUser,
  updateCattleEntry,
} from "../services/cattleService.ts";

// ---- THEME (aligned with FarmerHome) ------------------
const theme = {
  bg: "#EEF2FF",          // page background
  surface: "#FFFFFF",     // cards
  border: "#D4D9F5",
  text: "#0F172A",
  muted: "#64748B",

  primary: "#2563EB",
  primarySoft: "#E0EAFF",
  primaryDeep: "#1D4ED8",

  sell: "#F59E0B",
  danger: "#EF4444",
  green: "#16A34A",

  cowTagBg: "#DCFCE7",
  buffaloTagBg: "#E0F2FE",
};

const CattleRecordsScreen = () => {
  const navigation = useNavigation<any>();

  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [soldTo, setSoldTo] = useState("");
  const [soldPrice, setSoldPrice] = useState("");

  // ---------------- LOAD DATA ----------------
  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      const userId = await AsyncStorage.getItem("userId");
      if (!userId) {
        setRecords([]);
        return;
      }

      const res = await getCattleByUser(Number(userId));
      setRecords(Array.isArray(res) ? res : res || []);
    } catch (e) {
      console.log("❌ Failed to fetch cattle:", e);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRecords();
    setRefreshing(false);
  };

  // --------------- FILTERING ------------------
  const filteredRecords = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return records;

    return records.filter((item) => {
      const name = (item.cattlename || item.cattleName || "").toLowerCase();
      const id = (item.cattleId || "").toLowerCase();
      const breed = (item.cattleBreed || "").toLowerCase();
      const cat = (item.cattleCategory || "").toLowerCase();
      return (
        name.includes(term) ||
        id.includes(term) ||
        breed.includes(term) ||
        cat.includes(term)
      );
    });
  }, [records, search]);

  // --------------- MARK AS SOLD ---------------
  const markAsSold = async () => {
    if (!soldTo.trim() || !soldPrice.trim()) {
      Alert.alert("Missing info", "Please enter buyer and price.");
      return;
    }

    try {
      const today = new Date().toISOString().split("T")[0];

      const payload = {
        ...selected,
        cattleSoldDate: today,
        cattleSoldTo: soldTo.trim(),
        cattleSoldPrice: Number(soldPrice),
        status: "SOLD",
      };

      await updateCattleEntry(selected.id, payload);

      Alert.alert("Success", "Cattle marked as sold.");
      setShowModal(false);
      setSoldTo("");
      setSoldPrice("");
      fetchRecords();
    } catch (e) {
      console.log(e);
      Alert.alert("Error", "Unable to update cattle.");
    }
  };

  // --------------- RENDER ROW -----------------
  const renderItem = ({ item, index }: any) => {
    const sold = !!item.cattleSoldDate;
    const name = item.cattlename || item.cattleName;
    const id = item.cattleId;
    const breed = item.cattleBreed;
    const category = item.cattleCategory;

    return (
      <Animatable.View
        animation="fadeInUp"
        delay={index * 40}
        style={styles.rowWrapper}
      >
        <View style={styles.rowCard}>
          {/* LEFT ICON */}
          <View
            style={[
              styles.avatar,
              {
                backgroundColor:
                  category === "COW" ? theme.cowTagBg : theme.buffaloTagBg,
              },
            ]}
          >
            <Text style={styles.avatarEmoji}>
              {category === "COW" ? "🐄" : "🐃"}
            </Text>
          </View>

          {/* CENTER CONTENT */}
          <View style={styles.rowContent}>
            <View style={styles.rowTopLine}>
              <Text style={styles.rowName} numberOfLines={1}>
                {name}
              </Text>

              <View style={styles.categoryPill}>
                <Text
                  style={[
                    styles.categoryText,
                    {
                      color:
                        category === "COW" ? theme.green : theme.primaryDeep,
                    },
                  ]}
                >
                  {category}
                </Text>
              </View>
            </View>

            <Text style={styles.rowSub} numberOfLines={1}>
              {breed} • ID: {id}
            </Text>

            <View style={styles.rowMetaLine}>
              <Text style={styles.metaText}>📅 {item.cattlePurchaseDate}</Text>
              <Text style={styles.metaText}>₹ {item.cattlePurchasePrice}</Text>
            </View>

            <Text
              style={[
                styles.statusText,
                sold ? styles.statusSold : styles.statusActive,
              ]}
              numberOfLines={1}
            >
              {sold
                ? `Sold on ${item.cattleSoldDate} • ${item.cattleSoldTo}`
                : "Active in herd"}
            </Text>
          </View>

          {/* RIGHT ACTIONS */}
          <View style={styles.actionsCol}>
            {!sold && (
              <Pressable
                style={[styles.actionPill, styles.sellPill]}
                onPress={() => {
                  setSelected(item);
                  setShowModal(true);
                }}
              >
                <Text style={styles.actionText}>Sell</Text>
              </Pressable>
            )}

            <Pressable
              style={[styles.actionPill, styles.editPill]}
              onPress={async () => {
                await AsyncStorage.setItem(
                  "cattleDataForUpdate",
                  JSON.stringify(item)
                );
                navigation.navigate("AddCattle");
              }}
            >
              <Text style={styles.actionText}>Edit</Text>
            </Pressable>
          </View>
        </View>
      </Animatable.View>
    );
  };

  // --------------- LOADING STATE --------------
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles.centerText}>Loading herd…</Text>
      </View>
    );
  }

  // --------------- META COUNTS ----------------
  const total = records.length;
  const soldCount = records.filter((r) => r.status === "SOLD").length;
  const activeCount = total - soldCount;

  // --------------- MAIN UI --------------------
  return (
    <View style={styles.container}>
      {/* HEADER SUMMARY CARD */}
      <View style={styles.headerCard}>
        <View style={styles.headerTopRow}>
          <View>
            <Text style={styles.headerTitle}>My Herd</Text>
            <Text style={styles.headerSubtitle}>
              Structured view of all cattle
            </Text>
          </View>
        </View>

        {/* SEARCH FIELD */}
        <View style={styles.searchShell}>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by name, ID, breed or type…"
            placeholderTextColor={theme.muted}
            style={styles.searchInput}
          />
        </View>

        {/* METRICS */}
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{total}</Text>
            <Text style={styles.metricLabel}>Total</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{activeCount}</Text>
            <Text style={styles.metricLabel}>Active</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{soldCount}</Text>
            <Text style={styles.metricLabel}>Sold</Text>
          </View>
        </View>
      </View>

      {/* LIST */}
      <FlatList
        data={filteredRecords}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Image
              source={{
                uri: "https://cdn-icons-png.flaticon.com/512/7068/7068103.png",
              }}
              style={{ width: 96, height: 96, opacity: 0.8, marginBottom: 8 }}
            />
            <Text style={styles.emptyTitle}>No cattle yet</Text>
            <Text style={styles.emptySubtitle}>
              Start by adding your first cattle record.
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
      />

      {/* FAB: ADD CATTLE */}
      <Pressable
        style={styles.fab}
        onPress={() => navigation.navigate("AddCattle")}
      >
        <Text style={styles.fabPlus}>＋</Text>
      </Pressable>

      {/* SELL MODAL */}
      <Modal visible={showModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Sell Cattle</Text>
            <Text style={styles.modalSubtitle}>
              {selected?.cattlename || selected?.cattleName}
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Buyer name"
              value={soldTo}
              onChangeText={setSoldTo}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Price (₹)"
              keyboardType="numeric"
              value={soldPrice}
              onChangeText={setSoldPrice}
            />

            <View style={styles.modalBtnRow}>
              <Pressable
                style={[styles.modalBtn, { backgroundColor: theme.danger }]}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.modalBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, { backgroundColor: theme.primary }]}
                onPress={markAsSold}
              >
                <Text style={styles.modalBtnText}>Confirm</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default CattleRecordsScreen;

// ---------------- STYLES ----------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },

  center: {
    flex: 1,
    backgroundColor: theme.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  centerText: {
    marginTop: 8,
    color: theme.muted,
  },

  // Header card
  headerCard: {
    marginTop: 12,
    marginHorizontal: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 22,
    backgroundColor: "#EBF1FF",
    borderWidth: 1,
    borderColor: "#CBD5F5",
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: theme.text,
  },
  headerSubtitle: {
    marginTop: 4,
    color: theme.muted,
    fontSize: 13,
  },

  searchShell: {
    backgroundColor: theme.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    fontSize: 14,
    color: theme.text,
  },

  metricsRow: {
    flexDirection: "row",
    marginTop: 14,
    justifyContent: "space-between",
  },
  metricCard: {
    flex: 1,
    marginRight: 8,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: "center",
  },
  metricValue: {
    fontSize: 17,
    fontWeight: "800",
    color: theme.primaryDeep,
  },
  metricLabel: {
    marginTop: 2,
    fontSize: 11,
    color: theme.muted,
  },

  // List rows
  rowWrapper: {
    marginTop: 10,
  },
  rowCard: {
    flexDirection: "row",
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: theme.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  avatarEmoji: {
    fontSize: 22,
  },
  rowContent: {
    flex: 1,
  },
  rowTopLine: {
    flexDirection: "row",
    alignItems: "center",
  },
  rowName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: theme.text,
    marginRight: 6,
  },
  categoryPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: "#F8FAFF",
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "700",
  },
  rowSub: {
    marginTop: 2,
    fontSize: 12,
    color: theme.muted,
  },
  rowMetaLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  metaText: {
    fontSize: 11,
    color: theme.muted,
  },
  statusText: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: "700",
  },
  statusActive: {
    color: theme.green,
  },
  statusSold: {
    color: theme.danger,
  },

  actionsCol: {
    justifyContent: "center",
    marginLeft: 10,
  },
  actionPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginVertical: 2,
    alignItems: "center",
    minWidth: 56,
  },
  sellPill: {
    backgroundColor: theme.sell,
  },
  editPill: {
    backgroundColor: theme.primary,
  },
  actionText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },

  // Empty state
  emptyBox: {
    marginTop: 80,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: theme.text,
    marginTop: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: theme.muted,
    marginTop: 2,
    textAlign: "center",
    paddingHorizontal: 24,
  },

  // FAB
  fab: {
    position: "absolute",
    right: 22,
    bottom: 26,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: theme.primary,
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  fabPlus: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "900",
    marginTop: -2,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    width: "85%",
    backgroundColor: theme.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: theme.text,
  },
  modalSubtitle: {
    marginTop: 4,
    marginBottom: 12,
    fontSize: 13,
    color: theme.muted,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
  },
  modalBtnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
  },
  modalBtn: {
    flex: 1,
    marginHorizontal: 5,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  modalBtnText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
});
