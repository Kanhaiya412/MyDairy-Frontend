



import React, { useEffect, useState } from "react";
import { NavigationContainer, createNavigationContainerRef } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { PaperProvider } from "react-native-paper";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { Text, View } from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";

// Screens
import LoginScreen from "./src/screens/LoginScreen";
import RegisterScreen from "./src/screens/RegisterScreen";
import FarmerHome from "./src/screens/FarmerHome";
import DairyOwnerHome from "./src/screens/DairyOwnerHome";
import AdminHome from "./src/screens/AdminHome";

// Drawer Screens
import AddMilkScreen from "./src/screens/AddMilkScreen";
import MilkRecordScreen from "./src/screens/MilkRecordScreen";
import AddCattleScreen from "./src/screens/AddCattleScreen";
import CattleRecordsScreen from "./src/screens/CattleRecordsScreen";
import SoldCattleRecordsScreen from "./src/screens/SoldCattleRecordsScreen";
import AddExpenseScreen from "./src/screens/AddExpenseScreen";
import ExpenseRecordScreen from "./src/screens/ExpenseRecordScreen";
import AnimalManagementScreen from "./src/screens/AnimalManagementScreen";
import LabourManagementScreen from "./src/screens/LabourManagementScreen";

// Stack Screens (Labour module)
import LabourProfileScreen from "./src/screens/LabourProfileScreen";
import LabourLoanScreen from "./src/screens/LabourLoanScreen";
import LabourPenaltyScreen from "./src/screens/LabourPenaltyScreen";
import LabourAdvanceScreen from "./src/screens/LabourAdvanceScreen";
import LabourAttendanceScreen from "./src/screens/LabourAttendanceScreen";
import LabourSalaryScreen from "./src/screens/LabourSalaryScreen";

// Other
import ChatbotScreen from "./src/screens/ChatbotScreen";
import CustomDrawerContent from "./src/components/CustomDrawerContent";

// Services
import { getUserInfo } from "./src/services/userService";

// Types
import { RootDrawerParamList, RootStackParamList } from "./src/navigation/types";

const Stack = createNativeStackNavigator<RootStackParamList>();
const Drawer = createDrawerNavigator<RootDrawerParamList>();

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

// ✅ Initialize Query Client
const queryClient = new QueryClient();

// ✅ Farmer Drawer Navigator
function FarmerDrawer() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    (async () => {
      try {
        const u = await getUserInfo();
        setUser(u);
      } catch (err) {
        console.log("Error fetching user info:", err);
      }
    })();
  }, []);

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove(["jwtToken", "username", "role", "userId"]);
    } catch (e) {
      console.log("Logout error:", e);
    }

    // ✅ Reset navigation safely
    navigationRef.current?.reset({
      index: 0,
      routes: [{ name: "Login" }],
    });
  };

  return (
    <Drawer.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerShown: false,
        drawerStyle: { width: 280 },
        // sceneContainerStyle: { backgroundColor: "#020014" },
      }}
      drawerContent={(props) => (
        <CustomDrawerContent {...props} user={user} onLogout={handleLogout} />
      )}
    >
      <Drawer.Screen name="Dashboard" component={FarmerHome} />
      <Drawer.Screen name="AddMilk" component={AddMilkScreen} />
      <Drawer.Screen name="MilkRecord" component={MilkRecordScreen} />

      <Drawer.Screen name="AddCattle" component={AddCattleScreen} />
      <Drawer.Screen name="CattleRecords" component={CattleRecordsScreen} />
      <Drawer.Screen name="SoldCattleRecords" component={SoldCattleRecordsScreen} />

      <Drawer.Screen name="AddExpense" component={AddExpenseScreen} />
      <Drawer.Screen name="ExpenseRecord" component={ExpenseRecordScreen} />

      <Drawer.Screen name="AnimalManagement" component={AnimalManagementScreen} />
      <Drawer.Screen name="LabourManagement" component={LabourManagementScreen} />

      {/* ✅ keep Settings safe (still undefined screen) */}
      <Drawer.Screen name="Settings" component={FarmerHome} />
    </Drawer.Navigator>
  );
}

// ✅ Root App
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider>
        <NavigationContainer ref={navigationRef}>
          <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
            {/* Auth */}
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />

            {/* Main */}
            <Stack.Screen name="FarmerHome" component={FarmerDrawer} />
            <Stack.Screen name="DairyOwnerHome" component={DairyOwnerHome} />
            <Stack.Screen name="AdminHome" component={AdminHome} />

            {/* ✅ Stack screens which require params */}
            <Stack.Screen name="LabourProfile" component={LabourProfileScreen} />
            <Stack.Screen name="LabourLoan" component={LabourLoanScreen} />
            <Stack.Screen name="LabourPenalty" component={LabourPenaltyScreen} />
            <Stack.Screen name="LabourAdvance" component={LabourAdvanceScreen} />
            <Stack.Screen name="LabourAttendance" component={LabourAttendanceScreen} />
            <Stack.Screen name="LabourSalary" component={LabourSalaryScreen} />

            <Stack.Screen name="ChatBot" component={ChatbotScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </QueryClientProvider>
  );
}



// export default function App() {
//   return (
//     <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
//       <Text>MyDairy App Running 🐄🥛</Text>
//     </View>
//   );
// }