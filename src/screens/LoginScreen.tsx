/**
 * MyDairy — Premium Animated Login Screen (2025 Edition)
 * Features: Lottie logo + Gradient + Glass Card + Smooth Animations
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  ActivityIndicator,
  Dimensions,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import * as Animatable from "react-native-animatable";
import LottieView from "lottie-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { loginUser } from "../services/authService";

const { height } = Dimensions.get("window");

const LoginScreen = ({ navigation }: any) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  /** ✅ Handle Login */
  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert("Error", "Please enter both username and password");
      return;
    }

    setIsLoading(true);
    try {
      const response = await loginUser(username, password);
      if (response?.token) {
        await AsyncStorage.setItem("jwtToken", response.token);
        await AsyncStorage.setItem("role", response.role);
        await AsyncStorage.setItem("username", response.username);
        if (response.userId) {
          await AsyncStorage.setItem("userId", String(response.userId));
        }
        navigation.reset({ index: 0, routes: [{ name: "FarmerHome" }] });
      } else {
        Alert.alert("Error", "Invalid credentials");
      }
    } catch (error: any) {
      Alert.alert("Login Failed", error.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={["#0A0F1C", "#1B2735", "#283E51"]}
      style={styles.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
            {/* 🐮 Animated Header */}
            <Animatable.View animation="fadeInDown" duration={1000} style={styles.header}>
              <Animatable.View
                animation="zoomIn"
                duration={1200}
                easing="ease-out"
                style={styles.logoContainer}
              >
                <LottieView
                  source={require("../assets/animations/vaca_H.json")}
                  autoPlay
                  loop
                  style={styles.lottieLogo}
                />
              </Animatable.View>
              <Text style={styles.title}>Welcome to MyDairy</Text>
              <Text style={styles.subtitle}>Simplify. Track. Grow.</Text>
            </Animatable.View>

            {/* 🧊 Glass Card */}
            <Animatable.View animation="fadeInUp" duration={900} style={styles.card}>
              {/* Username Input */}
              <View style={styles.inputContainer}>
                <TextInput
                  placeholder="Username"
                  placeholderTextColor="#94A3B8"
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                />
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <TextInput
                  placeholder="Password"
                  placeholderTextColor="#94A3B8"
                  style={styles.input}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>

              {/* Login Button */}
              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleLogin}
                activeOpacity={0.9}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={["#00C6FF", "#0072FF"]}
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.buttonText}>Login</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Signup Link */}
              <TouchableOpacity
                style={styles.signupContainer}
                onPress={() => navigation.navigate("Register")}
              >
                <Text style={styles.signupText}>
                  Don’t have an account?{" "}
                  <Text style={styles.signupLink}>Sign up</Text>
                </Text>
              </TouchableOpacity>
            </Animatable.View>
          </KeyboardAvoidingView>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

/* 🎨 STYLES */
const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoContainer: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(255,255,255,0.06)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    shadowColor: "#00C6FF",
    shadowOpacity: 0.3,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
  },
  lottieLogo: {
    width: 100,
    height: 100,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 15,
    color: "#94A3B8",
    marginTop: 4,
    textAlign: "center",
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 22,
    paddingVertical: 35,
    paddingHorizontal: 25,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 10,
  },
  inputContainer: {
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: 14,
    paddingHorizontal: 16,
    marginBottom: 18,
  },
  input: {
    height: 48,
    fontSize: 16,
    color: "#1E293B",
  },
  button: {
    borderRadius: 14,
    overflow: "hidden",
    marginTop: 12,
  },
  buttonGradient: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  signupContainer: {
    marginTop: 25,
  },
  signupText: {
    color: "#CBD5E1",
    fontSize: 15,
    textAlign: "center",
  },
  signupLink: {
    color: "#00C6FF",
    fontWeight: "700",
  },
});

export default LoginScreen;
