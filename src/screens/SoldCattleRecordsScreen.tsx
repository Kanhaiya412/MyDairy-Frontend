import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSoldCattleByUser } from '../services/cattleService.ts'; // Update import
import { useNavigation } from '@react-navigation/native';

const theme = {
  bg: '#F8FAFC',
  surface: '#FFFFFF',
  border: '#E2E8F0',
  text: '#1E293B',
  textMuted: '#64748B',
  brand: '#22C55E',
  brandStrong: '#16A34A',
  danger: '#EF4444',
  ok: '#10B981',
};

const SoldCattleRecordsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Fetch sold cattle records from backend
  const fetchSoldCattleRecords = async () => {
    try {
      setLoading(true);
      const userId = await AsyncStorage.getItem("userId");
      if (userId) {
        // Use the new endpoint that fetches only sold cattle
        const data = await getSoldCattleByUser(Number(userId));
        setRecords(data);
      }
    } catch (err) {
      console.error("❌ Error fetching sold cattle records:", err);
      Alert.alert("Error", "Failed to fetch sold cattle records");
    } finally {
      setLoading(false);
    }
  };

  // Refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchSoldCattleRecords();
    setRefreshing(false);
  }, []);

  // Load on mount
  useEffect(() => {
    fetchSoldCattleRecords();
  }, []);

  // Calculate profit/loss for each sold cattle
  const calculateProfit = (purchasePrice: number, salePrice: number) => {
    const profit = salePrice - purchasePrice;
    return {
      value: profit,
      isProfit: profit >= 0,
      percentage: purchasePrice > 0 ? ((profit / purchasePrice) * 100).toFixed(2) : '0.00'
    };
  };

  // Render a single sold cattle card
  const renderCard = (item: any, index: number) => {
    const profitData = calculateProfit(
      Number(item.cattlePurchasePrice) || 0,
      Number(item.cattleSoldPrice) || 0
    );

    return (
      <View key={index} style={styles.card}>
        {/* Header Row */}
        <View style={styles.rowBetween}>
          <Text style={styles.cattleName}>
            {item.cattlename || item.cattleName || 'Unnamed Cattle'}
          </Text>
          <Text
            style={[
              styles.categoryTag,
              {
                backgroundColor:
                  item.cattleCategory === 'COW' ? '#DCFCE7' : '#E0E7FF',
                color: item.cattleCategory === 'COW' ? '#166534' : '#3730A3',
              },
            ]}
          >
            {item.cattleCategory}
          </Text>
        </View>

        <Text style={styles.breedText}>{item.cattleBreed}</Text>

        {/* Purchase Info */}
        <View style={styles.infoBlock}>
          <Text style={styles.infoText}>
            🗓 Purchased on:{' '}
            <Text style={styles.infoStrong}>
              {item.cattlePurchaseDate || '-'}
            </Text>
          </Text>
          <Text style={styles.infoText}>
            💰 Purchase Price:{' '}
            <Text style={styles.infoStrong}>₹{item.cattlePurchasePrice}</Text>
          </Text>
        </View>

        {/* Sale Info */}
        <View
          style={[
            styles.saleBlock,
            { backgroundColor: '#FEF2F2', borderColor: '#FCA5A5' },
          ]}
        >
          <Text style={[styles.saleText, { color: theme.danger }]}>
            Sold on {item.cattleSoldDate} to {item.cattleSoldTo}
          </Text>
          <Text style={[styles.saleText, { color: theme.danger }]}>
            Sale Price: ₹{item.cattleSoldPrice}
          </Text>
          <Text style={[styles.saleText, { 
            color: profitData.isProfit ? theme.brandStrong : theme.danger,
            fontWeight: 'bold'
          }]}>
            {profitData.isProfit ? ' Profit: ' : ' Loss: '}
            ₹{Math.abs(profitData.value)} ({profitData.percentage}%)
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Total Cattle:{' '}
            <Text style={styles.infoStrong}>{item.totalCattle}</Text>
          </Text>
          <View style={{ flexDirection: 'row' }}>
            <Pressable
              style={({ pressed }) => [
                styles.viewBtn,
                { opacity: pressed ? 0.7 : 1, marginRight: 8 },
              ]}
              onPress={() => {
                // View details action
                Alert.alert(
                  "Cattle Details",
                  `ID: ${item.cattleId}\n` +
                  `Name: ${item.cattlename || item.cattleName}\n` +
                  `Category: ${item.cattleCategory}\n` +
                  `Breed: ${item.cattleBreed}\n` +
                  `Purchased From: ${item.cattlePurchaseFrom}\n` +
                  `Purchase Price: ₹${item.cattlePurchasePrice}\n` +
                  `Sold To: ${item.cattleSoldTo}\n` +
                  `Sold Price: ₹${item.cattleSoldPrice}\n` +
                  `Profit/Loss: ₹${profitData.value} (${profitData.percentage}%)`
                );
              }}
            >
              <Text style={styles.viewText}>Details</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.brandStrong} />
        <Text style={styles.textMuted}>Loading sold cattle records...</Text>
      </View>
    );
  }

  // Main render
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 16 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.header}>💰 Sold Cattle Records</Text>
      <Text style={styles.subHeader}>Profitable sales history and analytics</Text>

      {records.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.textMuted}>No sold cattle records found yet.</Text>
          <Text style={styles.textMuted}>
            Cattle records will appear here after they are marked as sold.
          </Text>
        </View>
      ) : (
        records.map(renderCard)
      )}
    </ScrollView>
  );
};

export default SoldCattleRecordsScreen;

// ──────────────────────────────────────────────
// Styles
// ──────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  header: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 4,
  },
  subHeader: {
    fontSize: 14,
    color: theme.textMuted,
    marginBottom: 16,
  },
  card: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cattleName: { fontSize: 18, fontWeight: '700', color: theme.text },
  categoryTag: {
    fontWeight: '700',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
    fontSize: 12,
  },
  breedText: { color: theme.textMuted, fontSize: 14, marginTop: 4 },
  infoBlock: { marginTop: 10 },
  infoText: { color: theme.textMuted, fontSize: 14, marginBottom: 2 },
  infoStrong: { color: theme.text, fontWeight: '600' },
  saleBlock: {
    marginTop: 10,
    borderWidth: 1,
    padding: 10,
    borderRadius: 10,
  },
  saleText: { fontSize: 13, fontWeight: '500' },
  availableText: {
    color: theme.ok,
    fontWeight: '600',
    marginTop: 8,
  },
  footer: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: { color: theme.textMuted, fontSize: 13 },
  viewBtn: {
    backgroundColor: theme.brandStrong,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  viewText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  textMuted: { color: theme.textMuted, marginTop: 8 },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
  },
});