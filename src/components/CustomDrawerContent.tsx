import React from "react";
import { View, Text, StyleSheet, Pressable, Alert } from "react-native";
import {
  DrawerContentScrollView,
  DrawerContentComponentProps,
} from "@react-navigation/drawer";
import GradientBackground from "./GradientBackground";

interface DrawerUser {
  username?: string;
  role?: string;
}

interface CustomDrawerContentProps extends DrawerContentComponentProps {
  user?: DrawerUser | null;
  onLogout?: () => void;
}

export default function CustomDrawerContent({
  navigation,
  user,
  onLogout,
  state,
}: CustomDrawerContentProps) {
  const activeRoute = state?.routes?.[state.index]?.name;

  // ✅ IMPORTANT: Drawer me only those screens jinke params "undefined" ho
  // LabourProfile, LabourLoan etc stack screens hai → drawer me add karoge to crash hoga
  const menuItems: { name: string; icon: string; screen: string }[] = [
    { name: "Dashboard", icon: "📊", screen: "Dashboard" },
    { name: "Add Milk", icon: "🥛", screen: "AddMilk" },
    { name: "Milk Records", icon: "📒", screen: "MilkRecord" },

    { name: "Add Cattle", icon: "🐄", screen: "AddCattle" },
    { name: "Cattle Records", icon: "📋", screen: "CattleRecords" },
    { name: "Sold Cattle", icon: "💸", screen: "SoldCattleRecords" },

    { name: "Add Expense", icon: "💰", screen: "AddExpense" },
    { name: "Expense Records", icon: "🧾", screen: "ExpenseRecord" },

    { name: "Animal Management", icon: "🩺", screen: "AnimalManagement" },
    { name: "Labour Management", icon: "👷", screen: "LabourManagement" },

    { name: "Settings", icon: "⚙️", screen: "Settings" },
  ];

  const username = user?.username?.trim() || "Farmer";
  const role = user?.role?.trim() || "USER";

  const confirmLogout = () => {
    if (!onLogout) return;

    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: onLogout },
    ]);
  };

  return (
    <View style={styles.drawerContainer}>
      {/* ✅ Background */}
      <View style={styles.gradientWrapper}>
        <GradientBackground />
      </View>

      <DrawerContentScrollView
        contentContainerStyle={styles.drawerScroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ✅ Profile */}
        <View style={styles.profileSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarIcon}>🐮</Text>
          </View>

          <Text style={styles.profileName}>{username}</Text>
          <View style={styles.rolePill}>
            <Text style={styles.profileRole}>{role.toUpperCase()}</Text>
          </View>

          <Text style={styles.profileTagline}>Smart Dairy Management</Text>
        </View>

        {/* ✅ Menu */}
        <View style={styles.menuSection}>
          {menuItems.map((item) => {
            const isActive = activeRoute === item.screen;

            return (
              <Pressable
                key={item.screen}
                onPress={() => navigation.navigate(item.screen as never)}
                style={({ pressed }) => [
                  styles.menuItem,
                  isActive && styles.activeMenuItem,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Text style={styles.emojiIcon}>{item.icon}</Text>

                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.menuText,
                      isActive && styles.activeMenuText,
                    ]}
                  >
                    {item.name}
                  </Text>
                </View>

                {isActive ? <View style={styles.activeDot} /> : null}
              </Pressable>
            );
          })}
        </View>

        {/* ✅ Small Info */}
        <View style={styles.footerInfo}>
          <Text style={styles.footerText}>MyDairy • v1.0</Text>
        </View>
      </DrawerContentScrollView>

      {/* ✅ Logout */}
      {onLogout && (
        <Pressable
          onPress={confirmLogout}
          style={({ pressed }) => [
            styles.logoutButton,
            pressed && { opacity: 0.85 },
          ]}
        >
          <Text style={styles.logoutIcon}>🚪</Text>
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    backgroundColor: "rgba(2, 10, 20, 0.98)",
    overflow: "hidden",
  },

  gradientWrapper: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1,
  },

  drawerScroll: {
    paddingTop: 10,
    paddingBottom: 20,
  },

  profileSection: {
    alignItems: "center",
    paddingVertical: 28,
    marginHorizontal: 14,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },

  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(34,197,94,0.12)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.35)",
  },

  avatarIcon: { fontSize: 34 },

  profileName: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    marginTop: 10,
  },

  rolePill: {
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(34,197,94,0.18)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.35)",
  },

  profileRole: {
    color: "#22C55E",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.6,
  },

  profileTagline: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 12,
    marginTop: 8,
  },

  menuSection: {
    paddingHorizontal: 12,
    marginTop: 14,
  },

  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginVertical: 5,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  activeMenuItem: {
    backgroundColor: "rgba(34,197,94,0.14)",
    borderColor: "rgba(34,197,94,0.40)",
  },

  emojiIcon: { fontSize: 18, marginRight: 12 },

  menuText: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 14.5,
    fontWeight: "600",
  },

  activeMenuText: {
    color: "#22C55E",
    fontWeight: "800",
  },

  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 8,
    backgroundColor: "#22C55E",
    marginLeft: 8,
  },

  footerInfo: {
    marginTop: 18,
    alignItems: "center",
  },

  footerText: {
    color: "rgba(255,255,255,0.40)",
    fontSize: 11,
  },

  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(220,38,38,0.18)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.10)",
    marginHorizontal: 16,
    marginBottom: 22,
    borderRadius: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(220,38,38,0.35)",
  },

  logoutIcon: { fontSize: 18, marginRight: 10 },

  logoutText: {
    color: "#FFFFFF",
    fontSize: 14.5,
    fontWeight: "800",
  },
});
