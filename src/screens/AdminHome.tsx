/**
 * AdminHome - Dashboard for System Admin
 */

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

const AdminHome = ({ navigation }: any) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧑‍💼 Admin Dashboard</Text>
      <Text style={styles.subtitle}>Manage users, dairies, and reports</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("UserManagement")}
      >
        <Text style={styles.buttonText}>User Management</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("Reports")}
      > 
        <Text style={styles.buttonText}>View Reports</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.logoutButton]}
        onPress={() => navigation.navigate("Login")}
      >
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#1B5E20",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#555",
    marginBottom: 30,
  },
  button: {
    backgroundColor: "#2E7D32",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    marginVertical: 10,
    width: "80%",
    alignItems: "center",
  },
  buttonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  logoutButton: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#2E7D32",
    marginTop: 30,
  },
  logoutText: {
    color: "#2E7D32",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default AdminHome;
