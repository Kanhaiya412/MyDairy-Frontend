import React, { useState, useEffect, useCallback } from "react";
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
import { getCattleByUser, updateCattleEntry } from "../services/cattleService.ts";
import { useNavigation } from "@react-navigation/native";
import * as Animatable from "react-native-animatable";

const theme = {
  bg: "#F9FAF3",
  surface: "#FFFFFF",
  accent: "#22C55E",
  border: "#E5E7EB",
  text: "#1E293B",
  textMuted: "#64748B",
  danger: "#EF4444",
  warn: "#F59E0B",
  ok: "#10B981",
};

const CattleRecordsScreen = () => {
  const navigation = useNavigation();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [soldTo, setSoldTo] = useState("");
  const [soldPrice, setSoldPrice] = useState("");

  // Fetch data
  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      const userId = await AsyncStorage.getItem("userId");
      if (!userId) return;
      const data = await getCattleByUser(Number(userId));
      setRecords(data || []);
    } catch (e) {
      console.error("❌ Failed to fetch cattle:", e);
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

  // Handle sell
  const markAsSold = async () => {
    if (!soldTo || !soldPrice) {
      Alert.alert("⚠️ Missing Info", "Please fill all fields.");
      return;
    }

    try {
      const date = new Date().toISOString().split("T")[0];
      const payload = {
        ...selected,
        cattleSoldDate: date,
        cattleSoldTo: soldTo,
        cattleSoldPrice: Number(soldPrice),
        status: "SOLD",
      };
      await updateCattleEntry(selected.id, payload);
      Alert.alert("✅ Success", "Cattle marked as sold.");
      setShowModal(false);
      setSoldTo("");
      setSoldPrice("");
      fetchRecords();
    } catch (e) {
      console.error(e);
      Alert.alert("❌ Error", "Could not mark cattle as sold.");
    }
  };

  const renderCard = ({ item, index }: any) => {
    const sold = item.cattleSoldDate != null;

    return (
      <Animatable.View
        animation="fadeInUp"
        delay={index * 80}
        style={styles.card}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.name}>
            🐄 {item.cattlename || item.cattleName}
          </Text>
          <View
            style={[
              styles.tag,
              {
                backgroundColor:
                  item.cattleCategory === "COW" ? "#DCFCE7" : "#E0F2FE",
              },
            ]}
          >
            <Text
              style={{
                color:
                  item.cattleCategory === "COW" ? theme.ok : "#2563EB",
                fontWeight: "700",
              }}
            >
              {item.cattleCategory}
            </Text>
          </View>
        </View>

        <Text style={styles.breed}>{item.cattleBreed}</Text>

        <View style={styles.infoRow}>
          <Text style={styles.info}>📅 {item.cattlePurchaseDate}</Text>
          <Text style={styles.info}>💰 ₹{item.cattlePurchasePrice}</Text>
        </View>

        {sold ? (
          <View style={[styles.soldBanner, { backgroundColor: "#FEE2E2" }]}>
            <Text style={{ color: theme.danger, fontWeight: "600" }}>
              Sold on {item.cattleSoldDate} to {item.cattleSoldTo}
            </Text>
          </View>
        ) : (
          <Text style={styles.statusActive}>🌿 Active in herd</Text>
        )}

        <View style={styles.footerRow}>
          <Pressable
            style={[styles.actionBtn, { backgroundColor: theme.warn }]}
            onPress={() => {
              setSelected(item);
              setShowModal(true);
            }}
          >
            <Text style={styles.btnText}>Sell</Text>
          </Pressable>

          <Pressable
            style={[styles.actionBtn, { backgroundColor: theme.accent }]}
            onPress={async () => {
              await AsyncStorage.setItem(
                "cattleDataForUpdate",
                JSON.stringify(item)
              );
              navigation.navigate("AddCattle" as never);
            }}
          >
            <Text style={styles.btnText}>Edit</Text>
          </Pressable>
        </View>
      </Animatable.View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.accent} />
        <Text style={styles.textMuted}>Fetching your herd...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={records}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderCard}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <View style={styles.summaryCard}>
            <Text style={styles.header}>🌾 My Herd Summary</Text>
            <Text style={styles.summaryText}>
              Total: {records.length} | Sold:{" "}
              {records.filter((r) => r.status === "SOLD").length}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Image
              source={{
                uri: "https://cdn-icons-png.flaticon.com/512/7068/7068103.png",
              }}
              style={{ width: 100, height: 100, opacity: 0.8 }}
            />
            <Text style={styles.textMuted}>No cattle added yet.</Text>
          </View>
        }
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
      />

      {/* Modal */}
      <Modal visible={showModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>💰 Sell Cattle</Text>
            <Text style={styles.modalSubtitle}>
              {selected?.cattlename || selected?.cattleName}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Buyer Name"
              value={soldTo}
              onChangeText={setSoldTo}
            />
            <TextInput
              style={styles.input}
              placeholder="Sold Price (₹)"
              keyboardType="numeric"
              value={soldPrice}
              onChangeText={setSoldPrice}
            />

            <View style={styles.modalRow}>
              <Pressable
                style={[styles.modalBtn, { backgroundColor: theme.danger }]}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.btnText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, { backgroundColor: theme.accent }]}
                onPress={markAsSold}
              >
                <Text style={styles.btnText}>Confirm</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default CattleRecordsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  center: { alignItems: "center", marginTop: 60 },
  textMuted: { color: theme.textMuted, marginTop: 8 },
  header: { fontSize: 20, fontWeight: "700", color: theme.text },
  summaryCard: {
    backgroundColor: "#F0FDF4",
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#DCFCE7",
  },
  summaryText: { color: theme.textMuted, marginTop: 4 },
  card: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: { fontSize: 18, fontWeight: "700", color: theme.text },
  tag: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  breed: { color: theme.textMuted, marginTop: 4 },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  info: { color: theme.textMuted, fontSize: 13 },
  statusActive: { color: theme.ok, marginTop: 8, fontWeight: "600" },
  soldBanner: {
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 12,
  },
  actionBtn: {
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginLeft: 8,
  },
  btnText: { color: "#fff", fontWeight: "700" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    width: "85%",
  },
  modalTitle: { fontSize: 20, fontWeight: "700", color: theme.text },
  modalSubtitle: { color: theme.textMuted, marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
  },
  modalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginHorizontal: 5,
  },
});
