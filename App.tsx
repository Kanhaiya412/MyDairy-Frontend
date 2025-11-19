// import React from 'react';
// import { NavigationContainer } from '@react-navigation/native';
// import { createNativeStackNavigator } from '@react-navigation/native-stack';
// import { createDrawerNavigator } from '@react-navigation/drawer';
// import LoginScreen from './android/app/src/main/screens/LoginScreen';
// import RegisterScreen from './android/app/src/main/screens/RegisterScreen';
// import FarmerHome from './android/app/src/main/screens/FarmerHome';
// import DairyOwnerHome from './android/app/src/main/screens/DairyOwnerHome';
// import AdminHome from './android/app/src/main/screens/AdminHome';
// import CustomDrawerContent from './android/app/src/main/components/CustomDrawerContent';
// import { getUserInfo } from './android/app/src/main/services/userService';

// // Create navigators
// const Stack = createNativeStackNavigator();
// const Drawer = createDrawerNavigator();

// // Create a separate component for the Farmer Home with Drawer
// const FarmerHomeWithDrawer = () => {
//   const [user, setUser] = React.useState(null);
  
//   React.useEffect(() => {
//     const fetchUser = async () => {
//       try {
//         const userData = await getUserInfo();
//         setUser(userData);
//       } catch (error) {
//         console.error('Error fetching user:', error);
//       }
//     };
    
//     fetchUser();
//   }, []);
  
//   const handleLogout = () => {
//     // Logout will be handled by navigating to Login screen
//   };

//   return (
//     <Drawer.Navigator
//       initialRouteName="Dashboard"
//       drawerContent={(props) => (
//         <CustomDrawerContent 
//           {...props} 
//           user={user} 
//           onLogout={handleLogout}
//         />
//       )}
//       screenOptions={{
//         drawerStyle: {
//           width: 250,
//         },
//         headerShown: false,
//       }}
//     >
//       <Drawer.Screen name="Dashboard" component={FarmerHome} />
//     </Drawer.Navigator>
//   );
// };

// export type RootStackParamList = {
//   Login: undefined;
//   Register: undefined;
//   FarmerHome: undefined;
//   DairyOwnerHome: undefined;
//   AdminHome: undefined;
// };

// function App() {
//   return (
//     <NavigationContainer>
//       <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
//         <Stack.Screen name="Login" component={LoginScreen} />
//         <Stack.Screen name="Register" component={RegisterScreen} />
//         <Stack.Screen name="FarmerHome" component={FarmerHomeWithDrawer} />
//         <Stack.Screen name="DairyOwnerHome" component={DairyOwnerHome} />
//         <Stack.Screen name="AdminHome" component={AdminHome} />
//       </Stack.Navigator>
//     </NavigationContainer>
//   );
// }

// export default App;


import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createDrawerNavigator } from "@react-navigation/drawer";
import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
  DrawerItemList,
} from '@react-navigation/drawer';


// ──────────────────────────────────────────────
// Screens
// ──────────────────────────────────────────────
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
// ──────────────────────────────────────────────
// Components & Services
// ──────────────────────────────────────────────
import CustomDrawerContent from "./src/components/CustomDrawerContent";
import { getUserInfo } from "./src/services/userService";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ──────────────────────────────────────────────
// Navigation setup
// ──────────────────────────────────────────────
const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

// ──────────────────────────────────────────────
// Drawer for Farmer Home
// ──────────────────────────────────────────────
const FarmerHomeWithDrawer = () => {
  const [user, setUser] = React.useState<any>(null);

  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getUserInfo();
        setUser(userData);
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem("jwtToken");
    await AsyncStorage.removeItem("username");
    await AsyncStorage.removeItem("role");
    navigationRef.current?.reset({
      index: 0,
      routes: [{ name: "Login" }],
    });
  };

  return (
    <Drawer.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerShown: true,
        drawerStyle: { width: 250 },
        headerTintColor: "#1E293B",
        headerTitleAlign: "center",
      }}
      drawerContent={(props) => (
        <CustomDrawerContent {...props} user={user} onLogout={handleLogout} />
      )}
    >
      {/* Dashboard / Home */}
      <Drawer.Screen
        name="Dashboard"
        component={FarmerHome}
        options={{ title: "Farmer Dashboard" }}
      />

      {/* Add Milk Entry */}
      <Drawer.Screen
        name="AddMilk"
        component={AddMilkScreen}
        options={{ title: "Add Milk Entry" }}
      />

        <Drawer.Screen
        name="MilkRecord"
        component={MilkRecordScreen}
        options={{ title: "Milk Records" }}
      />

      {/* Cattle Management */}
      <Drawer.Screen
        name="AddCattle"
        component={AddCattleScreen}
        options={{ title: "Add Cattle" }}
      />
      <Drawer.Screen
        name="CattleRecords"
        component={CattleRecordsScreen}
        options={{ title: "Cattle Records" }}
      />
      <Drawer.Screen
        name="SoldCattleRecords"
        component={SoldCattleRecordsScreen}
        options={{ title: "Sold Cattle" }}
      />

<Drawer.Screen
  name="AddExpense"
  component={AddExpenseScreen}
  options={{ title: "Add Expense" }}
/>

<Drawer.Screen
  name="ExpenseRecord"
  component={ExpenseRecordScreen}
  options={{ title: "Expense Records" }}
/>
      {/* Other Screens */}
      <Drawer.Screen
        name="Payments"
        component={FarmerHome}
        options={{ title: "Payments" }}
      />
      <Drawer.Screen
        name="Settings"
        component={FarmerHome}
        options={{ title: "Settings" }}
      />
    </Drawer.Navigator>
  );
};

// ──────────────────────────────────────────────
// Root Stack Navigation
// ──────────────────────────────────────────────
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  FarmerHome: undefined;
  DairyOwnerHome: undefined;
  AdminHome: undefined;
};

// Create a navigation ref to reset navigation programmatically on logout
import { createNavigationContainerRef } from "@react-navigation/native";


export const navigationRef = createNavigationContainerRef();

// ──────────────────────────────────────────────
// Main App Component
// ──────────────────────────────────────────────
function App() {
  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
          animation: "fade",
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="FarmerHome" component={FarmerHomeWithDrawer} />
        <Stack.Screen name="DairyOwnerHome" component={DairyOwnerHome} />
        <Stack.Screen name="AdminHome" component={AdminHome} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
