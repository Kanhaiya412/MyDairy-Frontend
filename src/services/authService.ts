// authService.ts
import apiClient from "./apiClient";
import AsyncStorage from "@react-native-async-storage/async-storage";

// 🔹 Register user
export const registerUser = async (data: any) => {
  const res = await apiClient.post("/auth/register", data);
  return res.data;
};

// 🔹 Login user
export const loginUser = async (username: string, password: string) => {
  const res = await apiClient.post("/auth/login", { username, password });

  // ✅ Log to confirm backend data shape
  console.log("🧠 [authService] Login API raw data:", res.data);

  // ✅ Destructure all available fields
  const { success, token, username: userName, role, userId } = res.data;

  if (!success || !token) {
    throw new Error("Invalid response from server");
  }

  // ✅ Save to AsyncStorage
  await AsyncStorage.setItem("jwtToken", token);
  await AsyncStorage.setItem("username", userName);
  await AsyncStorage.setItem("role", role);

  // ✅ Include userId in return
  if (userId) {
    await AsyncStorage.setItem("userId", String(userId));
    console.log("✅ [authService] Saved userId:", userId);
  } else {
    console.warn("⚠️ [authService] No userId in backend response!");
  }

  // ✅ Return full data to LoginScreen
  return { success, token, username: userName, role, userId };
};
