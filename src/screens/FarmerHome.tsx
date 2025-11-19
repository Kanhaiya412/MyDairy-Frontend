import React, { useEffect, useMemo, useState, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  StatusBar,
  ViewStyle,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import moment from 'moment';
import { LineChart } from 'react-native-chart-kit';

import { getUserInfo } from '../services/userService';
import { getMilkEntries } from '../services/milkService';

// ────────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────────
type PressableState = { pressed: boolean };

type StatChipProps = { label: string; value: string; trend?: string };
type QuickTileProps = { icon: string; title: string; onPress: () => void };
type MiniCardProps = { title: string; value: string; hint: string };
type TaskItemProps = { title: string; completed: boolean };
type ProfileProps = { user: any; onLogout: () => void; onClose: () => void };

type DashboardProps = {
  user: any;
  handleLogout: () => void;
  setShowProfile: (val: boolean) => void;
  notifications: number;
  showProfile: boolean;
  navigation: DrawerNavigationProp<any>;
  // NEW: data props
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  today: {
    morning?: any | null;
    evening?: any | null;
    totalLitres: number;
    totalEarnings: number;
    avgFat: number;
    insightDeltaPct: number; // vs yesterday litres
  };
  weekly: { date: string; litres: number; earnings: number }[];
};

// ────────────────────────────────────────────────────────────────────────────────
// THEME
// ────────────────────────────────────────────────────────────────────────────────
const theme = {
  bg: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceStrong: '#F1F5F9',
  border: '#E2E8F0',
  brand: '#22C55E',
  brandStrong: '#16A34A',
  text: '#1E293B',
  textMuted: '#64748B',
  danger: '#EF4444',
  ok: '#10B981',
};

const font = {
  heavy: 'Outfit-ExtraBold',
  bold: 'Outfit-SemiBold',
  medium: 'Manrope-Medium',
  regular: 'Manrope-Regular',
};

const pressable = (base: ViewStyle) => ({ pressed }: PressableState) => [
  base,
  { transform: [{ scale: pressed ? 0.98 : 1 }] },
  pressed && { opacity: 0.9 },
];

// ────────────────────────────────────────────────────────────────────────────────
// Reusable UI
// ────────────────────────────────────────────────────────────────────────────────
const StatChip = memo(({ label, value, trend }: StatChipProps) => (
  <View style={styles.statChip}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
    {trend ? (
      <Text
        style={[
          styles.statTrend,
          trend.trim().startsWith('-') ? styles.trendDown : styles.trendUp,
        ]}
      >
        {trend}
      </Text>
    ) : null}
  </View>
));

const QuickTile = memo(({ icon, title, onPress }: QuickTileProps) => (
  <Pressable
    style={pressable(styles.quickTile)}
    onPress={onPress}
    android_ripple={{ color: theme.border }}
  >
    <Text style={styles.quickIcon}>{icon}</Text>
    <Text style={styles.quickTitle}>{title}</Text>
  </Pressable>
));

const MiniCard = memo(({ title, value, hint }: MiniCardProps) => (
  <View style={styles.miniCard}>
    <Text style={styles.miniTitle}>{title}</Text>
    <Text style={styles.miniValue}>{value}</Text>
    <Text style={styles.miniHint}>{hint}</Text>
  </View>
));

const TaskItem = memo(({ title, completed }: TaskItemProps) => (
  <View style={styles.taskRow}>
    <View style={[styles.checkbox, completed && styles.checkboxDone]}>
      {completed ? <Text style={styles.check}>✓</Text> : null}
    </View>
    <Text style={[styles.taskText, completed && styles.taskTextDone]}>{title}</Text>
  </View>
));

const ProfileView = ({ user, onLogout, onClose }: ProfileProps) => (
  <View style={styles.profileWrap}>
    <Pressable style={styles.profileBackdrop} onPress={onClose} />
    <View style={styles.profileCard}>
      <Pressable onPress={onClose} style={styles.closeHit}>
        <Text style={styles.closeIcon}>✕</Text>
      </Pressable>

      <View style={styles.pHead}>
        <View style={styles.pAvatar}>
          <Text style={styles.pEmoji}>🐄</Text>
        </View>
        <Text style={styles.pName}>{user?.username || 'Farmer'}</Text>
        <Text style={styles.pRole}>{user?.role || 'User'}</Text>
      </View>

      <View style={styles.pGrid}>
        <View style={styles.pRow}>
          <Text style={styles.pKey}>Username</Text>
          <Text style={styles.pVal}>{user?.username || '-'}</Text>
        </View>
        <View style={styles.pRow}>
          <Text style={styles.pKey}>Role</Text>
          <Text style={styles.pVal}>{user?.role || '-'}</Text>
        </View>
        <View style={styles.pRow}>
          <Text style={styles.pKey}>Member Since</Text>
          <Text style={styles.pVal}>—</Text>
        </View>
      </View>

      <Pressable style={pressable(styles.logoutBtn)} onPress={onLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </Pressable>
    </View>
  </View>
);

// ────────────────────────────────────────────────────────────────────────────────
// Dashboard Screen (DATA-DRIVEN)
// ────────────────────────────────────────────────────────────────────────────────
const DashboardScreen = ({
  user,
  handleLogout,
  setShowProfile,
  notifications,
  showProfile,
  navigation,
  loading,
  refreshing,
  onRefresh,
  today,
  weekly,
}: DashboardProps) => {
  const headerTitle = `Hello, ${user?.username || 'Farmer'}`;
  const deltaSign = today.insightDeltaPct >= 0 ? '+' : '−';
  const deltaColor = today.insightDeltaPct >= 0 ? styles.trendUp : styles.trendDown;

  const quick: { id: string; title: string; icon: string }[] = [
    { id: 'AddMilk', title: 'Add Milk', icon: '🥛' },
    { id: 'AddExpense', title: 'Add Expense', icon: '💸' },
    { id: 'AddCattle', title: 'Add Cattle', icon: '🐄' },
    { id: 'SoldCattleRecords', title: 'Sold Cattle', icon: '💰' },
    { id: 'MilkRecord', title: 'Milk Records', icon: '📊' },
  ];

  const herd: { id: string; title: string; value: string; hint: string }[] = [
    { id: 'count', title: 'Total Cattle', value: '—', hint: 'connected later' },
    {
      id: 'avg',
      title: 'Avg Fat (Today)',
      value: `${today.avgFat ? today.avgFat.toFixed(1) : '0.0'}%`,
      hint: 'weighted by entries',
    },
    {
      id: 'morn',
      title: 'Morning Milk',
      value: `${today.morning?.milkQuantity ?? 0} L`,
      hint: `₹ ${today.morning?.totalPayment ?? 0}`,
    },
    {
      id: 'eve',
      title: 'Evening Milk',
      value: `${today.evening?.milkQuantity ?? 0} L`,
      hint: `₹ ${today.evening?.totalPayment ?? 0}`,
    },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.bg} />

      {showProfile && (
        <ProfileView user={user} onLogout={handleLogout} onClose={() => setShowProfile(false)} />
      )}

      <ScrollView
        style={styles.scroller}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.hLeft}>
            <Pressable onPress={() => navigation.openDrawer()} style={styles.menuBtn}>
              <Text style={styles.menuIcon}>☰</Text>
            </Pressable>
            <View style={styles.avatar}>
              <Text style={styles.avatarEmoji}>🐄</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.greet} numberOfLines={1}>
                {headerTitle}
              </Text>
              <Text style={styles.sub}>Farm overview & insights</Text>
            </View>
          </View>

          <View style={styles.hRight}>
            <Pressable
              style={pressable(styles.iconBtn)}
              onPress={() => navigation.navigate('Notifications' as never)}
            >
              <Text style={styles.bell}>🔔</Text>
              {notifications > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{notifications}</Text>
                </View>
              )}
            </Pressable>

            <Pressable style={pressable(styles.iconBtn)} onPress={() => setShowProfile(true)}>
              <Text style={styles.userIcon}>👤</Text>
            </Pressable>
          </View>
        </View>

        {/* Today Summary (Real Data) */}
        <View style={styles.summaryCard}>
          <StatChip label="Total Milk (Today)" value={`${today.totalLitres.toFixed(1)} L`} />
          <StatChip label="Earnings (Today)" value={`₹ ${today.totalEarnings.toFixed(0)}`} />
          <StatChip
            label="Avg Fat (Today)"
            value={`${today.avgFat ? today.avgFat.toFixed(1) : 0.0}%`}
            trend={`${deltaSign}${Math.abs(today.insightDeltaPct).toFixed(1)}% vs yesterday`}
          />
        </View>

        {/* Shift Wise */}
        <Text style={styles.sectionTitle}>Today by Shift</Text>
        <View style={styles.shiftRow}>
          <View style={[styles.shiftCard, { backgroundColor: '#ECFDF5' }]}>
            <Text style={styles.shiftTitle}>🌅 Morning</Text>
            <Text style={styles.shiftBig}>
              {(today.morning?.milkQuantity ?? 0).toFixed(1)} L
            </Text>
            <Text style={styles.shiftMeta}>
              ₹ {(today.morning?.totalPayment ?? 0).toFixed(0)} • Fat{' '}
              {(today.morning?.fat ?? 0).toFixed(1)}%
            </Text>
          </View>

          <View style={[styles.shiftCard, { backgroundColor: '#EFF6FF' }]}>
            <Text style={styles.shiftTitle}>🌇 Evening</Text>
            <Text style={styles.shiftBig}>
              {(today.evening?.milkQuantity ?? 0).toFixed(1)} L
            </Text>
            <Text style={styles.shiftMeta}>
              ₹ {(today.evening?.totalPayment ?? 0).toFixed(0)} • Fat{' '}
              {(today.evening?.fat ?? 0).toFixed(1)}%
            </Text>
          </View>
        </View>

        {/* 7-Day Trend (Litres) */}
        <Text style={[styles.sectionTitle, { marginTop: 16 }]}>7-Day Trend</Text>
        <View style={styles.chartWrap}>
          <LineChart
            data={{
              labels: weekly.map((w) => moment(w.date).format('DD')),
              datasets: [{ data: weekly.map((w) => w.litres) }],
            }}
            width={Dimensions.get('window').width - 40}
            height={180}
            yAxisSuffix=" L"
            chartConfig={{
              backgroundGradientFrom: '#FFFFFF',
              backgroundGradientTo: '#FFFFFF',
              decimalPlaces: 1,
              color: () => '#16A34A',
              labelColor: () => '#64748B',
              propsForDots: { r: '3' },
            }}
            bezier
            style={{ borderRadius: 14 }}
          />
          <Text style={styles.chartHint}>Daily total litres (last 7 days)</Text>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hRow}>
          {quick.map((q) => (
            <QuickTile
              key={q.id}
              icon={q.icon}
              title={q.title}
              onPress={() => navigation.navigate(q.id as never)}
            />
          ))}
        </ScrollView>

        {/* Mini Info */}
        <Text style={styles.sectionTitle}>Key Info</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hRow}>
          {herd.map((h) => (
            <MiniCard key={h.id} title={h.title} value={h.value} hint={h.hint} />
          ))}
        </ScrollView>

        {/* Tasks (static placeholders) */}
        <Text style={styles.sectionTitle}>Today's Tasks</Text>
        <View style={{ paddingHorizontal: 4, marginTop: 4 }}>
          <TaskItem title="Morning milking" completed={!!today.morning} />
          <TaskItem title="Evening milking" completed={!!today.evening} />
          <TaskItem title="Feed distribution" completed={false} />
        </View>
      </ScrollView>

      {/* Bottom bar */}
      <View style={styles.summary}>
        <View>
          <Text style={styles.sumLabel}>Today’s Collection</Text>
          <Text style={styles.sumValue}>{today.totalLitres.toFixed(1)} L</Text>
        </View>
        <Pressable
          style={pressable(styles.sumBtn)}
          onPress={() => navigation.navigate('MilkRecord' as never)}
        >
          <Text style={styles.sumBtnText}>View Records</Text>
        </Pressable>
      </View>

      {/* FAB */}
      <Pressable
        style={pressable(styles.fab)}
        onPress={() => navigation.navigate('AddMilk' as never)}
      >
        <Text style={styles.fabPlus}>＋</Text>
      </Pressable>
    </SafeAreaView>
  );
};

// ────────────────────────────────────────────────────────────────────────────────
// Container: fetch + compute real data, pass to dashboard
// ────────────────────────────────────────────────────────────────────────────────
const FarmerHome = () => {
  const [user, setUser] = useState<any>(null);
  const [notifications] = useState<number>(3);
  const [showProfile, setShowProfile] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [entries, setEntries] = useState<any[]>([]);

  const navigation = useNavigation<DrawerNavigationProp<any>>();

  const loadAll = async () => {
    try {
      setLoading(true);
      const u = await getUserInfo();
      setUser(u);

      const uid = await AsyncStorage.getItem('userId');
      if (uid) {
        const res = await getMilkEntries(Number(uid));
        const data = Array.isArray(res) ? res : res?.data || [];
        setEntries(data);
      } else {
        setEntries([]);
      }
    } catch (e) {
      console.error('Failed to load dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  };

  // Derived: today + weekly aggregates
  const todayKey = moment().format('YYYY-MM-DD');
  const yesterdayKey = moment().subtract(1, 'day').format('YYYY-MM-DD');

  const todayRecs = useMemo(
    () => entries.filter((e) => e.date === todayKey),
    [entries, todayKey]
  );

  const todayMorning = useMemo(
    () => todayRecs.find((e) => e.shift === 'MORNING') || null,
    [todayRecs]
  );
  const todayEvening = useMemo(
    () => todayRecs.find((e) => e.shift === 'EVENING') || null,
    [todayRecs]
  );

  const todayTotals = useMemo(() => {
    const litres = todayRecs.reduce((s, r) => s + (r.milkQuantity || 0), 0);
    const earnings = todayRecs.reduce((s, r) => s + (r.totalPayment || 0), 0);
    const fatSum = todayRecs.reduce((s, r) => s + (r.fat || 0), 0);
    const avgFat = todayRecs.length ? fatSum / todayRecs.length : 0;
    return { litres, earnings, avgFat };
  }, [todayRecs]);

  const yesterdayLitres = useMemo(
    () =>
      entries
        .filter((e) => e.date === yesterdayKey)
        .reduce((s, r) => s + (r.milkQuantity || 0), 0),
    [entries, yesterdayKey]
  );

  const insightDeltaPct =
    yesterdayLitres > 0
      ? ((todayTotals.litres - yesterdayLitres) / yesterdayLitres) * 100
      : 0;

  const weekly = useMemo(() => {
    const days = [...Array(7)].map((_, i) =>
      moment().subtract(i, 'days').format('YYYY-MM-DD')
    );
    return days
      .reverse()
      .map((d) => {
        const dayRecs = entries.filter((e) => e.date === d);
        return {
          date: d,
          litres: dayRecs.reduce((s, r) => s + (r.milkQuantity || 0), 0),
          earnings: dayRecs.reduce((s, r) => s + (r.totalPayment || 0), 0),
        };
      });
  }, [entries]);

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('jwtToken');
    } catch {}
    navigation.reset({ index: 0, routes: [{ name: 'Login' as never }] });
  };

  return (
    <DashboardScreen
      user={user}
      handleLogout={handleLogout}
      setShowProfile={setShowProfile}
      notifications={notifications}
      showProfile={showProfile}
      navigation={navigation}
      // data props
      loading={loading}
      refreshing={refreshing}
      onRefresh={onRefresh}
      today={{
        morning: todayMorning,
        evening: todayEvening,
        totalLitres: todayTotals.litres,
        totalEarnings: todayTotals.earnings,
        avgFat: todayTotals.avgFat,
        insightDeltaPct,
      }}
      weekly={weekly}
    />
  );
};

export default FarmerHome;

// ────────────────────────────────────────────────────────────────────────────────
// Styles
// ────────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  scroller: { flex: 1 },
  scrollPad: { padding: 20, paddingBottom: 160 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, marginTop: 10 },
  hLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  hRight: { flexDirection: 'row', alignItems: 'center' },
  menuBtn: { padding: 8, marginRight: 12, borderRadius: 12 },
  menuIcon: { fontSize: 24, color: theme.text },
  avatar: { width: 44, height: 44, borderRadius: 14, backgroundColor: theme.surface, justifyContent: 'center', alignItems: 'center', marginRight: 12, borderWidth: 1, borderColor: theme.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  avatarEmoji: { fontSize: 22 },
  greet: { color: theme.text, fontFamily: font.bold, fontSize: 18, letterSpacing: 0.3, marginBottom: 2 },
  sub: { color: theme.textMuted, fontFamily: font.regular, fontSize: 13 },
  iconBtn: { padding: 10, marginLeft: 8, borderRadius: 14, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  bell: { fontSize: 22, color: theme.text },
  userIcon: { fontSize: 22, color: theme.text },
  badge: { position: 'absolute', top: -5, right: -5, backgroundColor: theme.brandStrong, borderRadius: 12, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 5 },
  badgeText: { color: '#FFFFFF', fontWeight: '700', fontSize: 11 },

  sectionTitle: { color: theme.text, fontFamily: font.bold, fontSize: 18, marginTop: 8, marginBottom: 10 },

  hRow: { paddingVertical: 8 },

  // Stat chip row (today summary)
  statChip: { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 16, marginRight: 12, minWidth: 150, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  statValue: { color: theme.brand, fontFamily: font.heavy, fontSize: 20 },
  statLabel: { color: theme.textMuted, fontFamily: font.medium, fontSize: 12, marginTop: 4 },
  statTrend: { marginTop: 8, fontFamily: font.bold, fontSize: 12 },
  trendUp: { color: theme.ok },
  trendDown: { color: theme.danger },

  summaryCard: { flexDirection: 'row', columnGap: 12, marginBottom: 8 },

  // Quick tiles
  quickTile: { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 20, padding: 20, marginRight: 16, alignItems: 'center', width: 130, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 },
  quickIcon: { fontSize: 38, marginBottom: 10 },
  quickTitle: { color: theme.text, fontFamily: font.medium, fontSize: 15 },

  // Mini cards
  miniCard: { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 20, padding: 20, marginRight: 16, width: 190, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  miniTitle: { color: theme.textMuted, fontFamily: font.medium, fontSize: 13 },
  miniValue: { color: theme.text, fontFamily: font.bold, fontSize: 22, marginTop: 4 },
  miniHint: { color: theme.textMuted, fontFamily: font.regular, fontSize: 13, marginTop: 6 },

  // Tasks
  taskRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  checkbox: { width: 24, height: 24, borderRadius: 8, borderWidth: 2, borderColor: theme.brandStrong, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  checkboxDone: { backgroundColor: theme.brandStrong, borderColor: theme.brandStrong },
  check: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
  taskText: { color: theme.text, fontFamily: font.medium, fontSize: 16, flex: 1 },
  taskTextDone: { color: theme.textMuted, textDecorationLine: 'line-through' },

  // Profile overlay
  profileWrap: { ...StyleSheet.absoluteFillObject, zIndex: 100, alignItems: 'center', justifyContent: 'center' },
  profileBackdrop: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.5)' },
  profileCard: { width: '90%', backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 26, padding: 25, maxWidth: 400, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20, elevation: 10 },
  closeHit: { position: 'absolute', right: 16, top: 16, padding: 8 },
  closeIcon: { color: theme.textMuted, fontSize: 20 },
  pHead: { alignItems: 'center', marginTop: 10, marginBottom: 20 },
  pAvatar: { width: 100, height: 100, borderRadius: 30, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, alignItems: 'center', justifyContent: 'center', marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  pEmoji: { fontSize: 48 },
  pName: { color: theme.text, fontFamily: font.bold, fontSize: 22 },
  pRole: { color: theme.textMuted, fontFamily: font.medium, fontSize: 14, marginTop: 4 },
  pGrid: { marginTop: 8, width: '100%' },
  pRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderColor: theme.border },
  pKey: { color: theme.textMuted, fontFamily: font.regular, fontSize: 15 },
  pVal: { color: theme.text, fontFamily: font.medium, fontSize: 15 },
  logoutBtn: { marginTop: 20, backgroundColor: theme.danger, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  logoutText: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },

  // Shift Cards
  shiftRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  shiftCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.border,
  },
  shiftTitle: { color: theme.textMuted, fontFamily: font.medium, fontSize: 13 },
  shiftBig: { color: theme.text, fontFamily: font.bold, fontSize: 22, marginTop: 4 },
  shiftMeta: { color: theme.textMuted, fontFamily: font.regular, fontSize: 12, marginTop: 4 },

  chartWrap: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 8,
  },
  chartHint: { color: theme.textMuted, fontFamily: font.regular, fontSize: 12, marginTop: 6 },

  // Bottom bar
  summary: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingVertical: 18,
    backgroundColor: theme.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: theme.border,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: -4 },
    shadowRadius: 12,
    elevation: 8,
  },
  sumLabel: { color: theme.textMuted, fontFamily: font.medium, fontSize: 14 },
  sumValue: { color: theme.brandStrong, fontFamily: font.heavy, fontSize: 26 },
  sumBtn: { backgroundColor: theme.brand, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 14 },
  sumBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.brand,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 12,
    elevation: 10,
    zIndex: 20,
  },
  fabPlus: { color: '#FFFFFF', fontSize: 32, fontWeight: '900' },
});
