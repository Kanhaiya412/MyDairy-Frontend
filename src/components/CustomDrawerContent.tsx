import React, { ReactNode } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
} from "react-native";
import {
  DrawerContentScrollView,
  DrawerContentComponentProps,
} from "@react-navigation/drawer";
import GradientBackground from "./GradientBackground";

interface DrawerUser {
  username: string;
  role: string;
}

// ✅ FIX: Extend built-in DrawerContentComponentProps
interface CustomDrawerContentProps extends DrawerContentComponentProps {
  user?: DrawerUser | null;
  onLogout?: () => void;
  children?: ReactNode;
}

const { width } = Dimensions.get("window");

const CustomDrawerContent: React.FC<CustomDrawerContentProps> = ({
  navigation,
  user,
  onLogout,
  state,
}) => {
  const activeRoute = state?.routes?.[state?.index]?.name;

  const menuItems = [
    { name: "Dashboard", icon: "📊", screen: "Dashboard" },
    { name: "Add Milk", icon: "🥛", screen: "AddMilk" },
    { name: "Add Cattle", icon: "🐄", screen: "AddCattle" },
    { name: "Cattle Records", icon: "📋", screen: "CattleRecords" },
    { name: "Sold Cattle", icon: "💸", screen: "SoldCattleRecords" },
    { name: "Add Expense", icon: "💰", screen: "AddExpense" },
    { name: "Expense Records", icon: "🧾", screen: "ExpenseRecord" },
    { name: "Milk Records", icon: "🥛", screen: "MilkRecord" },
    { name: "Animal Management", icon: "🧾", screen: "AnimalManagement" },
    { name: "Labour Management", icon: "🧾", screen: "LabourManagement" },
    { name: "Labour Profile", icon: "🧾", screen: "LabourProfile" },
  
    { name: "Settings", icon: "⚙️", screen: "Settings" },
  ];

  return (
    <View style={styles.drawerContainer}>
      {/* Background gradient bounded to drawer width */}
      <View style={styles.gradientWrapper}>
        <GradientBackground />
      </View>

      <DrawerContentScrollView
        contentContainerStyle={styles.drawerScroll}
        showsVerticalScrollIndicator={false}
      >
        {/* 👤 Profile Section */}
        <View style={styles.profileSection}>
          <Text style={styles.profileEmoji}>🐮</Text>
          <Text style={styles.profileName}>{user?.username || "Farmer"}</Text>
          <Text style={styles.profileRole}>
            {user?.role?.toUpperCase() || "USER"}
          </Text>
          <Text style={styles.profileTagline}>Smart Dairy Management</Text>
        </View>

        {/* 🧭 Menu Section */}
        <View style={styles.menuSection}>
          {menuItems.map((item) => {
            const isActive = activeRoute === item.screen;
            return (
              <Pressable
                key={item.screen}
                onPress={() => navigation.navigate(item.screen as never)}
                style={[styles.menuItem, isActive && styles.activeMenuItem]}
              >
                <Text style={styles.emojiIcon}>{item.icon}</Text>
                <Text
                  style={[styles.menuText, isActive && styles.activeMenuText]}
                >
                  {item.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </DrawerContentScrollView>

      {/* 🚪 Logout Button */}
      {onLogout && (
        <Pressable
          onPress={onLogout}
          style={({ pressed }) => [
            styles.logoutButton,
            pressed && { opacity: 0.8 },
          ]}
        >
          <Text style={styles.emojiIcon}>🚪</Text>
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      )}
    </View>
  );
};

// const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    backgroundColor: "rgba(2,16,26,0.97)",
    overflow: "hidden",
  },
  gradientWrapper: {
    ...StyleSheet.absoluteFillObject,
    width: width * 0.8, // match drawer width
    zIndex: -1,
  },
  drawerScroll: {
    paddingTop: 10,
    paddingBottom: 20,
  },
  profileSection: {
    alignItems: "center",
    paddingVertical: 40,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  profileEmoji: { fontSize: 48 },
  profileName: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
    marginTop: 6,
  },
  profileRole: {
    color: "#22C55E",
    fontSize: 13,
    fontWeight: "600",
    marginVertical: 4,
  },
  profileTagline: {
    color: "#A5F3FC",
    fontSize: 12,
    letterSpacing: 0.5,
  },
  menuSection: { paddingHorizontal: 12, marginTop: 10 },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginVertical: 4,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  activeMenuItem: {
    backgroundColor: "rgba(34,197,94,0.15)",
    borderLeftWidth: 3,
    borderLeftColor: "#22C55E",
  },
  emojiIcon: { fontSize: 20, marginRight: 12 },
  menuText: { color: "#FFFFFF", fontSize: 15, fontWeight: "500" },
  activeMenuText: { color: "#22C55E", fontWeight: "700" },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,65,65,0.25)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    marginHorizontal: 16,
    marginBottom: 25,
    borderRadius: 12,
    paddingVertical: 12,
  },
  logoutText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    marginLeft: 8,
  },
});

export default CustomDrawerContent;
