import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const LOCAL_IP = "172.22.156.178"; // 🔁 Change if IP changes

export const BASE_URL =
  Platform.OS === "android" && !__DEV__
    ? `http://${LOCAL_IP}:8080/api`
    : "http://10.0.2.2:8080/api";

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000, // prevent hanging if server is unreachable
});

// 🔹 Attach JWT before each request
apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("jwtToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 🔹 Handle 401 or network failures gracefully
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.warn("⚠️ Unauthorized — JWT expired or invalid. Logging out.");
      await AsyncStorage.removeItem("jwtToken");
    } else if (!error.response) {
      console.error("🌐 Network error — server may be unreachable.");
    }
    return Promise.reject(error);
  }
);

export default apiClient;
