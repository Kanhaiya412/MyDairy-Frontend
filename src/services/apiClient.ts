// import axios from "axios";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { Platform } from "react-native";

// let BASE_URL = "";

// if (Platform.OS === "android") {
//   BASE_URL = "http://10.0.2.2:8080/api";
// } else {
//   BASE_URL = "http://localhost:8080/api";
// }

// console.log("🔥 BACKEND URL:", BASE_URL);

// const apiClient = axios.create({
//   baseURL: BASE_URL,
//   headers: { "Content-Type": "application/json" },
//   timeout: 15000,
// });

// apiClient.interceptors.request.use(async (config) => {
//   const token = await AsyncStorage.getItem("jwtToken");
//   if (token) config.headers.Authorization = `Bearer ${token}`;
//   return config;
// });

// apiClient.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     if (!error.response) {
//       console.error("❌ Network Error: Backend unreachable");
//     }
//     return Promise.reject(error);
//   }
// );

// export default apiClient;


import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Using your laptop's Hotspot IPv4 address for physical device testing
const BASE_URL = "http://10.22.247.26:8080/api";

console.log("🔥 BACKEND URL:", BASE_URL);

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000, // 15 seconds is perfect to catch timeout errors quickly
});

apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("jwtToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!error.response) {
      console.error("❌ Network Error: Backend unreachable. Check firewall or IP.");
    }
    return Promise.reject(error);
  }
);

export default apiClient;