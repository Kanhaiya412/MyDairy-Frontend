import React from "react";
import {
  NavigationContainer,
  createNavigationContainerRef,
} from "@react-navigation/native";

import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { PaperProvider } from "react-native-paper";

import LoginScreen from "./src/screens/LoginScreen";
import RegisterScreen from "./src/screens/RegisterScreen";
import FarmerHome from "./src/screens/FarmerHome";
import DairyOwnerHome from "./src/screens/DairyOwnerHome";
import AdminHome from "./src/screens/AdminHome";

import AddMilkScreen from "./src/screens/AddMilkScreen";
import SoldCattleRecordsScreen from "./src/screens/SoldCattleRecordsScreen";
import AddCattleScreen from "./src/screens/AddCattleScreen";
import CattleRecordsScreen from "./src/screens/CattleRecordsScreen";
import AddExpenseScreen from "./src/screens/AddExpenseScreen ";
import ExpenseRecordScreen from "./src/screens/ExpenseRecordScreen ";
import MilkRecordScreen from "./src/screens/MilkRecordScreen ";
import AnimalManagementScreen from "./src/screens/AnimalManagementScreen";
import LabourManagementScreen from "./src/screens/LabourManagementScreen";

import CustomDrawerContent from "./src/components/CustomDrawerContent";
import { getUserInfo } from "./src/services/userService";
import AsyncStorage from "@react-native-async-storage/async-storage";

import LabourProfileScreen from "./src/screens/LabourProfileScreen";
import LabourContractScreen from "./src/screens/LabourContractScreen";
import LabourLoanScreen from "./src/screens/LabourLoanScreen";
import LabourPenaltyScreen from "./src/screens/LabourPenaltyScreen";
import LabourAdvanceScreen from "./src/screens/LabourAdvanceScreen";


import { RootDrawerParamList, RootStackParamList } from "./src/navigation/types";
import ChatbotScreen from "./src/screens/ChatbotScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();
const Drawer = createDrawerNavigator<RootDrawerParamList>();
export const navigationRef = createNavigationContainerRef();

// -----------------------------------------------------------------------------
// FARMER DRAWER CONTAINER
// -----------------------------------------------------------------------------
const FarmerHomeWithDrawer = () => {
  const [user, setUser] = React.useState<any>(null);

  React.useEffect(() => {
    (async () => {
      try {
        setUser(await getUserInfo());
      } catch (err) {
        console.log("Error fetching user", err);
      }
    })();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.multiRemove(["jwtToken", "username", "role"]);
    navigationRef.current?.reset({
      index: 0,
      routes: [{ name: "Login" }],
    });
  };

  return (
    <Drawer.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerShown: false,     // ✅ FIXED: Remove white header
        drawerStyle: { width: 250 },
      }}
      drawerContent={(props) => (
        <CustomDrawerContent {...props} user={user} onLogout={handleLogout} />
      )}
    >
      <Drawer.Screen
        name="Dashboard"
        component={FarmerHome}
        options={{ headerShown: false }} // important
      />

      <Drawer.Screen name="AddMilk" component={AddMilkScreen} />
      <Drawer.Screen name="MilkRecord" component={MilkRecordScreen} />

      <Drawer.Screen name="AddCattle" component={AddCattleScreen} />
      <Drawer.Screen name="CattleRecords" component={CattleRecordsScreen} />
      <Drawer.Screen
        name="SoldCattleRecords"
        component={SoldCattleRecordsScreen}
      />

      <Drawer.Screen name="AddExpense" component={AddExpenseScreen} />
      <Drawer.Screen name="ExpenseRecord" component={ExpenseRecordScreen} />

      <Drawer.Screen name="AnimalManagement" component={AnimalManagementScreen} />
      <Drawer.Screen name="LabourManagement" component={LabourManagementScreen} />

      <Drawer.Screen name="Settings" component={FarmerHome} />
    </Drawer.Navigator>
  );
};

// -----------------------------------------------------------------------------
// ROOT APP CONTAINER
// -----------------------------------------------------------------------------
export default function App() {
  return (
    <PaperProvider>
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator
          initialRouteName="Login"
          screenOptions={{ headerShown: false }}   // KEEP OFF
        >
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />

          <Stack.Screen name="FarmerHome" component={FarmerHomeWithDrawer} />
          <Stack.Screen name="DairyOwnerHome" component={DairyOwnerHome} />
          <Stack.Screen name="AdminHome" component={AdminHome} />

          <Stack.Screen name="LabourProfile" component={LabourProfileScreen} />
          <Stack.Screen name="LabourContract" component={LabourContractScreen} />
          <Stack.Screen name="LabourLoan" component={LabourLoanScreen} />
          <Stack.Screen name="LabourPenalty" component={LabourPenaltyScreen} />
          <Stack.Screen name="LabourAdvance" component={LabourAdvanceScreen} />
           <Stack.Screen name="ChatBot" component={ChatbotScreen} />
          
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}
