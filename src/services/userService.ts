import apiClient from "./apiClient";

// import apiClient from "./apiClient";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "http://10.0.2.2:8080/api/auth"; // backend auth endpoints
// 🔹 Example: Fetch logged-in user's profile
export const getUserProfile = async () => {
  const response = await apiClient.get("/user/profile");
  return response.data;
};

// 🔹 Example: Fetch dairy data (secured endpoint)
export const getDairyData = async () => {
  const response = await apiClient.get("/dairy/data");
  return response.data;
};

// 🔹 Example: Update user profile
export const updateUserProfile = async (data: any) => {
  const response = await apiClient.put("/user/update", data);
  return response.data;
};

export const getUserInfo = async () => {
  try {
    const token = await AsyncStorage.getItem("jwtToken");
    if (!token) throw new Error("No token found");

    const response = await apiClient.get(`${API_URL}/getuser`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    return response.data; // { username, role }
  } catch (error: any) {
    console.error("getUserInfo error:", error);
    throw new Error(error.response?.data?.message || "Failed to fetch user info");
  }
};