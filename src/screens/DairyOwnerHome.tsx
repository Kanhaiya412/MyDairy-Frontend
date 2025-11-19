import React, { useEffect, useRef, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import Icon from '@expo/vector-icons/MaterialIcons';
import { getUserInfo } from '../services/userService'; 

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { width, height } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

// Mock data for our dashboard
const mockData = {
  milkCollection: {
    today: '12,450L',
    farmers: 42,
    paymentsDue: '₹86,500',
    trend: '+12.4%'
  },
  farmerStats: {
    total: 128,
    newRequests: 3,
    avgPerformance: '87%'
  },
  payments: {
    weekly: [24000, 32000, 28000, 41000, 38000, 45000, 52000],
    monthly: [120000, 145000, 168000, 185000]
  },
  inventory: [
    { name: 'Butter', level: 75, color: '#FFD93D' },
    { name: 'Curd', level: 45, color: '#6BCB77' },
    { name: 'Ghee', level: 30, color: '#4D96FF' },
    { name: 'Cheese', level: 60, color: '#FF6B6B' }
  ],
  notifications: [
    { id: 1, message: 'Milk shortage expected tomorrow', time: '2h ago', type: 'warning' },
    { id: 2, message: '3 payments pending', time: '5h ago', type: 'payment' },
    { id: 3, message: 'New farmer registration request', time: '1d ago', type: 'info' }
  ]
};

const Greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
};

// Profile View Component
const ProfileView = ({ user, onLogout, onClose, darkMode }: any) => (
  <View style={[styles.profileContainer, darkMode && styles.darkProfileContainer]}>
    <Pressable style={styles.profileCloseButton} onPress={onClose}>
      <Text style={[styles.profileCloseIcon, darkMode && styles.darkProfileCloseIcon]}>✕</Text>
    </Pressable>
    
    <View style={styles.profileHeader}>
      <View style={[styles.profileAvatar, darkMode && styles.darkProfileAvatar]}>
        <Text style={styles.profileAvatarEmoji}>🐄</Text>
      </View>
      <Text style={[styles.profileName, darkMode && styles.darkProfileName]}>{user?.username}</Text>
      <Text style={[styles.profileRole, darkMode && styles.darkProfileRole]}>{user?.role}</Text>
    </View>
    
    <View style={styles.profileDetails}>
      <View style={styles.profileDetailRow}>
        <Text style={[styles.profileDetailLabel, darkMode && styles.darkProfileDetailLabel]}>Username</Text>
        <Text style={[styles.profileDetailValue, darkMode && styles.darkProfileDetailValue]}>{user?.username}</Text>
      </View>
      
      <View style={styles.profileDetailRow}>
        <Text style={[styles.profileDetailLabel, darkMode && styles.darkProfileDetailLabel]}>Role</Text>
        <Text style={[styles.profileDetailValue, darkMode && styles.darkProfileDetailValue]}>{user?.role}</Text>
      </View>
      
      <View style={styles.profileDetailRow}>
        <Text style={[styles.profileDetailLabel, darkMode && styles.darkProfileDetailLabel]}>Member Since</Text>
        <Text style={[styles.profileDetailValue, darkMode && styles.darkProfileDetailValue]}>Jan 2023</Text>
      </View>
    </View>
    
    <Pressable style={[styles.profileLogoutButton, darkMode && styles.darkProfileLogoutButton]} onPress={onLogout}>
      <Text style={styles.profileLogoutText}>Logout</Text>
    </Pressable>
  </View>
);

// Stat Card Component
const StatCard = ({ title, value, icon, trend }: { title: string; value: string; icon: string; trend?: string }) => (
  <View style={styles.statCard}>
    <View style={styles.statHeader}>
      <Text style={styles.statIcon}>{icon}</Text>
      {trend && <Text style={styles.statTrend}>{trend}</Text>}
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statTitle}>{title}</Text>
  </View>
);

// Progress Bar Component for Inventory
const ProgressBar = ({ percentage, color }: { percentage: number; color: string }) => (
  <View style={styles.progressBarBackground}>
    <Animated.View 
      style={[
        styles.progressBarFill, 
        // eslint-disable-next-line react-native/no-inline-styles
        { 
          width: `${percentage}%`, 
          backgroundColor: color,
          borderTopRightRadius: percentage === 100 ? 8 : 0,
          borderBottomRightRadius: percentage === 100 ? 8 : 0,
        }
      ]} 
    />
  </View>
);

// Inventory Item Component
const InventoryItem = ({ name, level, color }: { name: string; level: number; color: string }) => (
  <View style={styles.inventoryItem}>
    <View style={styles.inventoryHeader}>
      <Text style={styles.inventoryName}>{name}</Text>
      <Text style={styles.inventoryLevel}>{level}%</Text>
    </View>
    <ProgressBar percentage={level} color={color} />
  </View>
);

// Notification Item Component
const NotificationItem = ({ message, time, type }: { message: string; time: string; type: string }) => {
  const getNotificationIcon = () => {
    switch (type) {
      case 'warning': return '⚠️';
      case 'payment': return '💰';
      case 'info': return 'ℹ️';
      default: return '🔔';
    }
  };

  return (
    <View style={styles.notificationItem}>
      <Text style={styles.notificationIcon}>{getNotificationIcon()}</Text>
      <View style={styles.notificationContent}>
        <Text style={styles.notificationMessage}>{message}</Text>
        <Text style={styles.notificationTime}>{time}</Text>
      </View>
    </View>
  );
};

// Payment Chart Component (simplified)
const PaymentChart = () => {
  const maxValue = Math.max(...mockData.payments.weekly);
  
  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>Weekly Payments</Text>
      <View style={styles.chart}>
        {mockData.payments.weekly.map((value, index) => (
          <View key={index} style={styles.chartBarContainer}>
            <View 
              style={[
                styles.chartBar, 
                // eslint-disable-next-line react-native/no-inline-styles
                { 
                  height: `${(value / maxValue) * 100}%`,
                  backgroundColor: index === mockData.payments.weekly.length - 1 
                    ? '#4D96FF' 
                    : '#6BCB77'
                }
              ]} 
            />
            <Text style={styles.chartLabel}>D{index + 1}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const DairyOwnerHome = ({ navigation }: any) => {
  const [user, setUser] = useState<{ username: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [notificationsCount] = useState(3);
  const [darkMode, setDarkMode] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    // Smooth fade-in animation
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 450, useNativeDriver: true }),
    ]).start();

    const fetchUser = async () => {
      try {
        // Use real user data from API instead of dummy data
        const data = await getUserInfo();
        setUser(data);
      } catch (err) {
        console.error('Failed to fetch user info:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [fadeAnim, translateY]);

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('jwtToken');
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('Logout error:', error);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, darkMode && styles.darkSafeArea]}>
      <StatusBar barStyle={darkMode ? "light-content" : "dark-content"} backgroundColor={darkMode ? "#0A1929" : "#F0F9FF"} />
      
      {/* Profile View Overlay - Always rendered but conditionally displayed */}
      <View style={[styles.profileOverlay, { opacity: showProfile ? 1 : 0, zIndex: showProfile ? 1000 : -1 }]}>
        <Pressable style={styles.profileOverlayBackground} onPress={() => setShowProfile(false)}>
          <ProfileView 
            user={user} 
            onLogout={handleLogout} 
            onClose={() => setShowProfile(false)} 
            darkMode={darkMode}
          />
        </Pressable>
      </View>
      
      <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY }] }]}>
        {/* HEADER */}
        <View style={[styles.header, darkMode && styles.darkHeader]}>
          <View style={styles.headerLeft}>
            <View style={[styles.logoWrap, darkMode && styles.darkLogoWrap]}>
              <Text style={styles.logoEmoji}>🐄</Text>
            </View>
            <View>
              <Text style={[styles.greeting, darkMode && styles.darkGreeting]}>{Greeting()},</Text>
              {loading ? (
                <ActivityIndicator size="small" color={darkMode ? "#4D96FF" : "#2E7D32"} />
              ) : (
                <>
                  <Text style={[styles.name, darkMode && styles.darkName]}>{user?.username}</Text>
                  <Text style={[styles.role, darkMode && styles.darkRole]}>{user?.role}</Text>
                </>
              )}
            </View>
          </View>

          <View style={styles.headerRight}>
            <Pressable 
              style={[styles.themeButton, darkMode && styles.darkThemeButton]} 
              onPress={() => setDarkMode(!darkMode)}
            >
              <Text style={styles.themeIcon}>{darkMode ? '☀️' : '🌙'}</Text>
            </Pressable>
            
            <Pressable 
              style={[styles.notificationButton, darkMode && styles.darkNotificationButton]} 
              onPress={() => navigation.navigate('Notifications')}
            >
              <Text style={[styles.notificationIcon, darkMode && styles.darkNotificationIcon]}>🔔</Text>
              {notificationsCount > 0 && (
                <View style={[styles.notificationBadge, darkMode && styles.darkNotificationBadge]}>
                  <Text style={styles.notificationCount}>{notificationsCount}</Text>
                </View>
              )}
            </Pressable>
            
            {/* Profile Button */}
            <Pressable 
              style={[styles.profileButton, darkMode && styles.darkProfileButton]} 
              onPress={() => setShowProfile(true)}
            >
              <Text style={[styles.profileIcon, darkMode && styles.darkProfileIcon]}>👤</Text>
            </Pressable>
          </View>
        </View>

        <ScrollView 
          contentContainerStyle={styles.scroll} 
          showsVerticalScrollIndicator={false}
        >
          {/* STATS CARDS */}
          <View style={styles.cardsRow}>
            <StatCard 
              title="Today's Collection" 
              value={mockData.milkCollection.today} 
              icon="🥛" 
              trend={mockData.milkCollection.trend} 
            />
            <StatCard 
              title="Active Farmers" 
              value={mockData.milkCollection.farmers.toString()} 
              icon="👨‍🌾" 
            />
            <StatCard 
              title="Payments Due" 
              value={mockData.milkCollection.paymentsDue} 
              icon="💰" 
            />
            <StatCard 
              title="Farmer Requests" 
              value={mockData.farmerStats.newRequests.toString()} 
              icon="📝" 
            />
          </View>

          {/* PAYMENT CHART */}
          <View style={[styles.chartCard, darkMode && styles.darkChartCard]}>
            <PaymentChart />
          </View>

          {/* INVENTORY SECTION */}
          <Text style={[styles.sectionTitle, darkMode && styles.darkSectionTitle]}>Inventory Levels</Text>
          <View style={[styles.inventoryCard, darkMode && styles.darkInventoryCard]}>
            {mockData.inventory.map((item, index) => (
              <InventoryItem 
                key={index} 
                name={item.name} 
                level={item.level} 
                color={item.color} 
              />
            ))}
          </View>

          {/* FARMER STATS */}
          <View style={styles.rowBetween}>
            <View style={[styles.farmerCard, darkMode && styles.darkFarmerCard]}>
              <Text style={[styles.cardTitle, darkMode && styles.darkCardTitle]}>Farmers</Text>
              <Text style={[styles.cardValue, darkMode && styles.darkCardValue]}>{mockData.farmerStats.total}</Text>
              <Text style={[styles.cardSubtitle, darkMode && styles.darkCardSubtitle]}>Total Farmers</Text>
            </View>

            <View style={[styles.farmerCard, darkMode && styles.darkFarmerCard]}>
              <Text style={[styles.cardTitle, darkMode && styles.darkCardTitle]}>Performance</Text>
              <Text style={[styles.cardValue, darkMode && styles.darkCardValue]}>{mockData.farmerStats.avgPerformance}</Text>
              <Text style={[styles.cardSubtitle, darkMode && styles.darkCardSubtitle]}>Avg Rating</Text>
            </View>
          </View>

          {/* NOTIFICATIONS */}
          <Text style={[styles.sectionTitle, darkMode && styles.darkSectionTitle]}>Notifications</Text>
          <View style={[styles.notificationsCard, darkMode && styles.darkNotificationsCard]}>
            {mockData.notifications.map((notification) => (
              <NotificationItem 
                key={notification.id} 
                message={notification.message} 
                time={notification.time} 
                type={notification.type} 
              />
            ))}
          </View>
        </ScrollView>

        {/* VOICE COMMAND BUTTON */}
        <Pressable style={[styles.voiceButton, darkMode && styles.darkVoiceButton]}>
          <Text style={styles.voiceIcon}>🎤</Text>
        </Pressable>

        {/* FAB */}
        <Pressable style={[styles.fab, darkMode && styles.darkFab]} onPress={() => navigation.navigate('AddFarmer')}>
          <Text style={styles.fabIcon}>+</Text>
        </Pressable>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: '#F0F9FF' 
  },
  darkSafeArea: {
    backgroundColor: '#0A1929'
  },
  container: { 
    flex: 1, 
    paddingHorizontal: 16, 
    paddingTop: 18 
  },

  // Profile View
  profileOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileOverlayBackground: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  profileContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  darkProfileContainer: {
    backgroundColor: '#1A3A5F',
  },
  profileCloseButton: {
    alignSelf: 'flex-end',
  },
  profileCloseIcon: {
    fontSize: 24,
    color: '#9CA3AF',
  },
  darkProfileCloseIcon: {
    color: '#A0B0C0',
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0F5FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  darkProfileAvatar: {
    backgroundColor: '#2A4A6F',
  },
  profileAvatarEmoji: {
    fontSize: 40,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0B1A3A',
    marginBottom: 4,
  },
  darkProfileName: {
    color: '#E1F0FF',
  },
  profileRole: {
    fontSize: 16,
    color: '#0F62FE',
    fontWeight: '600',
  },
  darkProfileRole: {
    color: '#6BCB77',
  },
  profileDetails: {
    marginBottom: 24,
  },
  profileDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  darkProfileDetailRow: {
    borderBottomColor: '#2A4A6F',
  },
  profileDetailLabel: {
    fontSize: 16,
    color: '#6B7280',
  },
  darkProfileDetailLabel: {
    color: '#A0B0C0',
  },
  profileDetailValue: {
    fontSize: 16,
    color: '#0B1A3A',
    fontWeight: '600',
  },
  darkProfileDetailValue: {
    color: '#E1F0FF',
  },
  profileLogoutButton: {
    backgroundColor: '#FF4D4D',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  darkProfileLogoutButton: {
    backgroundColor: '#FF6B6B',
  },
  profileLogoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  // Header
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 20,
    backgroundColor: '#E1F0FF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
  },
  darkHeader: {
    backgroundColor: '#1A3A5F',
  },
  headerLeft: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  logoWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
  },
  darkLogoWrap: {
    backgroundColor: '#2A4A6F',
  },
  logoEmoji: { 
    fontSize: 28 
  },
  greeting: { 
    color: '#6B6B6B', 
    fontSize: 13 
  },
  darkGreeting: {
    color: '#A0B0C0'
  },
  name: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: '#2E7D32', 
    marginTop: 2 
  },
  darkName: {
    color: '#4D96FF'
  },
  role: { 
    fontSize: 14, 
    marginTop: 2,
    color: '#1565C0'
  },
  darkRole: {
    color: '#6BCB77'
  },

  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  darkThemeButton: {
    backgroundColor: '#2A4A6F',
  },
  themeIcon: {
    fontSize: 18,
  },
  notificationButton: {
    position: 'relative',
    marginRight: 12,
  },
  darkNotificationButton: {
    // No specific dark mode changes needed
  },
  notificationIcon: {
    fontSize: 24,
    color: '#2E7D32',
  },
  darkNotificationIcon: {
    color: '#4D96FF',
  },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#F44336',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  darkNotificationBadge: {
    backgroundColor: '#FF6B6B',
  },
  notificationCount: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  darkProfileButton: {
    backgroundColor: '#2A4A6F',
  },
  profileIcon: {
    fontSize: 20,
    color: '#2E7D32',
  },
  darkProfileIcon: {
    color: '#4D96FF',
  },

  scroll: { 
    paddingBottom: 80 
  },
  cardsRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    flexWrap: 'wrap',
    marginBottom: 16
  },

  statCard: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4D96FF',
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statIcon: {
    fontSize: 24,
  },
  statTrend: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  statValue: { 
    fontSize: 20, 
    fontWeight: '800', 
    color: '#0A1929',
    marginBottom: 4,
  },
  statTitle: { 
    color: '#6B6B6B', 
    fontSize: 14,
    fontWeight: '500',
  },

  // Chart
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  darkChartCard: {
    backgroundColor: '#1A3A5F',
  },
  chartContainer: {
    width: '100%',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0A1929',
    marginBottom: 16,
  },
  darkChartTitle: {
    color: '#E1F0FF',
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 100,
    paddingTop: 10,
  },
  chartBarContainer: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  chartBar: {
    width: '80%',
    backgroundColor: '#6BCB77',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  chartLabel: {
    fontSize: 10,
    color: '#6B6B6B',
    marginTop: 8,
  },
  darkChartLabel: {
    color: '#A0B0C0',
  },

  // Section Titles
  sectionTitle: { 
    marginVertical: 14, 
    color: '#0A1929', 
    fontWeight: '700', 
    fontSize: 18,
    marginLeft: 8,
  },
  darkSectionTitle: {
    color: '#E1F0FF',
  },

  // Inventory
  inventoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  darkInventoryCard: {
    backgroundColor: '#1A3A5F',
  },
  inventoryItem: {
    marginBottom: 16,
  },
  inventoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  inventoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0A1929',
  },
  darkInventoryName: {
    color: '#E1F0FF',
  },
  inventoryLevel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B6B6B',
  },
  darkInventoryLevel: {
    color: '#A0B0C0',
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4D96FF',
  },

  // Farmer Stats
  rowBetween: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 16
  },
  farmerCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginRight: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#6BCB77',
  },
  darkFarmerCard: {
    backgroundColor: '#1A3A5F',
    borderLeftColor: '#FFD93D',
  },
  cardTitle: {
    fontSize: 14,
    color: '#6B6B6B',
    marginBottom: 4,
  },
  darkCardTitle: {
    color: '#A0B0C0',
  },
  cardValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0A1929',
    marginBottom: 4,
  },
  darkCardValue: {
    color: '#E1F0FF',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#6B6B6B',
  },
  darkCardSubtitle: {
    color: '#A0B0C0',
  },

  // Notifications
  notificationsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  darkNotificationsCard: {
    backgroundColor: '#1A3A5F',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  darkNotificationItem: {
    borderBottomColor: '#2A4A6F',
  },
  notificationContent: {
    flex: 1,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#0A1929',
    marginBottom: 4,
  },
  darkNotificationMessage: {
    color: '#E1F0FF',
  },
  notificationTime: {
    fontSize: 12,
    color: '#6B6B6B',
  },
  darkNotificationTime: {
    color: '#A0B0C0',
  },

  // Voice Command Button
  voiceButton: {
    position: 'absolute',
    left: 20,
    bottom: 80,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4D96FF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#4D96FF',
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  darkVoiceButton: {
    backgroundColor: '#6BCB77',
    shadowColor: '#6BCB77',
  },
  voiceIcon: {
    fontSize: 24,
    color: '#FFFFFF',
  },

  // FAB
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 80,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#2E7D32',
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  darkFab: {
    backgroundColor: '#FF6B6B',
    shadowColor: '#FF6B6B',
  },
  fabIcon: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '300',
  },
});

export default DairyOwnerHome;