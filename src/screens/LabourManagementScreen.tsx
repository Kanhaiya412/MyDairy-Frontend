// src/screens/LabourManagementScreen.tsx

import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  Alert,
  TouchableOpacity,
  FlatList,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Button,
  Text,
  TextInput,
  ActivityIndicator,
  Dialog,
  Portal,
  Avatar,
  IconButton,
  FAB,
} from "react-native-paper";
import { launchImageLibrary } from "react-native-image-picker";
import { useNavigation } from "@react-navigation/native";
import DateTimePickerModal from "react-native-modal-datetime-picker";

import {
  getLaboursByUser,
  addLabour,
  uploadLabourPhoto,
  LabourEntry,
} from "../services/labourService";
import apiClient from "../services/apiClient";

export default function LabourManagementScreen() {
  const navigation = useNavigation<any>();

  const [labours, setLabours] = useState<LabourEntry[]>([]);
  const [loadingLabours, setLoadingLabours] = useState(true);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newMobile, setNewMobile] = useState("");
  const [newWageType, setNewWageType] = useState<"DAILY" | "MONTHLY" | "YEARLY">("DAILY");
  const [newDailyWage, setNewDailyWage] = useState("");
  const [newMonthlySalary, setNewMonthlySalary] = useState("");
  const [newYearlySalary, setNewYearlySalary] = useState("");
  const [newAllowedLeaves, setNewAllowedLeaves] = useState("21");
  const [savingNewLabour, setSavingNewLabour] = useState(false);

  // Photo Upload States
  const [newPhotoUri, setNewPhotoUri] = useState<string | null>(null);
  const [newPhotoType, setNewPhotoType] = useState<string>("");
  const [newPhotoName, setNewPhotoName] = useState<string>("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Date States
  const [newJoiningDate, setNewJoiningDate] = useState<Date>(new Date());
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const formatJoiningDate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const serverUrl = apiClient.defaults.baseURL?.replace('/api', '') || "http://10.249.237.26:8080";

  useEffect(() => {
    loadLabours();
    const unsubscribe = navigation.addListener('focus', () => {
      loadLabours();
    });
    return unsubscribe;
  }, [navigation]);

  const loadLabours = async () => {
    try {
      setLoadingLabours(true);
      const list = await getLaboursByUser();
      setLabours(list || []);
    } catch {
      Alert.alert("Error", "Failed to load labours");
    } finally {
      setLoadingLabours(false);
    }
  };

  const onPickPhoto = async () => {
    try {
      const result = await launchImageLibrary({ mediaType: "photo", quality: 0.5 });
      if (result.didCancel) return;
      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setNewPhotoUri(asset.uri || null);
        setNewPhotoType(asset.type || "image/jpeg");
        setNewPhotoName(asset.fileName || "photo.jpg");
      }
    } catch (err: any) {
      Alert.alert("Error", "Could not open gallery");
    }
  };

  const onAddLabour = async () => {
    if (!newName.trim()) {
      Alert.alert("Error", "Name is required");
      return;
    }
    try {
      setSavingNewLabour(true);
      let finalPhotoUrl = null;
      if (newPhotoUri) {
         setUploadingPhoto(true);
         finalPhotoUrl = await uploadLabourPhoto(newPhotoUri, newPhotoType, newPhotoName);
         setUploadingPhoto(false);
      }

      await addLabour({
        labourName: newName.trim(),
        mobile: newMobile,
        photoUrl: finalPhotoUrl,
        wageType: newWageType,
        dailyWage: Number(newDailyWage) || 0,
        monthlySalary: Number(newMonthlySalary) || 0,
        yearlySalary: Number(newYearlySalary) || 0,
        allowedLeaves: Number(newAllowedLeaves) || 0,
        joiningDate: formatJoiningDate(newJoiningDate),
      });
      setShowAddForm(false);
      setNewName("");
      setNewMobile("");
      setNewDailyWage("");
      setNewMonthlySalary("");
      setNewYearlySalary("");
      setNewAllowedLeaves("21");
      setNewJoiningDate(new Date());
      setNewPhotoUri(null);
      await loadLabours();
    } catch (e: any) {
      Alert.alert("Error", "Failed to add labour");
    } finally {
      setSavingNewLabour(false);
      setUploadingPhoto(false);
    }
  };

  const renderLabourCard = ({ item }: { item: LabourEntry }) => {
    const fullPhotoUrl = item.photoUrl ? `${serverUrl}${item.photoUrl}` : null;
    const isActive = item.status === "ACTIVE";

    return (
      <TouchableOpacity 
        style={styles.card} 
        activeOpacity={0.7}
        onPress={() => navigation.navigate("LabourProfile", { labourId: item.id })}
      >
        <View style={styles.cardContent}>
          {fullPhotoUrl ? (
            <Avatar.Image size={48} source={{ uri: fullPhotoUrl }} />
          ) : (
            <Avatar.Text size={48} label={item.labourName.substring(0, 2).toUpperCase()} style={styles.avatarPlaceholder} color="#64748B" />
          )}
          
          <View style={styles.cardTextContainer}>
            <Text style={styles.workerName}>{item.labourName}</Text>
            <Text style={styles.workerRole}>
              {item.wageType === "MONTHLY" ? "Monthly Staff" : item.wageType === "YEARLY" ? "Yearly Contract" : "Daily Wage"}
              {item.role ? ` • ${item.role}` : ""}
            </Text>
          </View>
          <View style={styles.statusContainer}>
             <View style={[styles.statusDot, isActive ? styles.statusActive : styles.statusInactive]} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.appBar}>
        <IconButton icon="arrow-left" iconColor="#1E293B" size={24} onPress={() => navigation.goBack()} />
        <Text style={styles.appBarTitle}>Labour Force</Text>
        <IconButton icon="calendar-check" iconColor="#6366F1" size={24} onPress={() => navigation.navigate("LabourAttendance")} />
      </View>

      {loadingLabours ? (
        <View style={styles.center}>
          <ActivityIndicator color="#1E293B" />
        </View>
      ) : (
        <FlatList
          data={labours}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderLabourCard}
          contentContainerStyle={styles.listContainer}
        />
      )}

      <FAB icon="plus" label="Add New Staff" style={styles.fab} color="#FFFFFF" onPress={() => setShowAddForm(true)} />

      <Portal>
        <Dialog visible={showAddForm} onDismiss={() => setShowAddForm(false)} style={styles.dialog}>
          <ScrollView style={{ maxHeight: 650 }} showsVerticalScrollIndicator={false}>
            <Dialog.Content style={styles.dialogContent}>
              <Text style={styles.modalTitle}>Add New Staff</Text>

              {/* Photo Section */}
              <View style={styles.photoUploadContainer}>
                <TouchableOpacity onPress={onPickPhoto} style={styles.avatarWrapper}>
                  <View style={styles.avatarDashedBorder}>
                    {newPhotoUri ? (
                      <Avatar.Image size={96} source={{ uri: newPhotoUri }} />
                    ) : (
                      <Avatar.Icon size={96} icon="account" style={styles.avatarPlaceholderIcon} color="#94A3B8" />
                    )}
                  </View>
                  <View style={styles.cameraBadge}>
                    <IconButton icon="camera" size={16} iconColor="#FFF" />
                  </View>
                </TouchableOpacity>
                <Text style={styles.photoUploadSub}>{uploadingPhoto ? "Uploading..." : "Select Profile Photo"}</Text>
              </View>

              {/* Personal Details Section */}
              <Text style={styles.sectionHeader}>PERSONAL DETAILS</Text>
              
              <TextInput 
                label="Full Name" 
                value={newName} 
                onChangeText={setNewName} 
                mode="outlined" 
                style={styles.premiumInput}
                outlineColor="#e2e8f0"
                activeOutlineColor="#6366f1"
                left={<TextInput.Icon icon="account-outline" color={focusedField === 'name' ? "#6366f1" : "#94a3b8"} />}
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(null)}
              />

              <TextInput 
                label="Mobile Number" 
                value={newMobile} 
                onChangeText={setNewMobile} 
                mode="outlined" 
                keyboardType="phone-pad" 
                style={styles.premiumInput}
                outlineColor="#e2e8f0"
                activeOutlineColor="#6366f1"
                left={<TextInput.Icon icon="phone-outline" color={focusedField === 'mobile' ? "#6366f1" : "#94a3b8"} />}
                onFocus={() => setFocusedField('mobile')}
                onBlur={() => setFocusedField(null)}
              />

              <TouchableOpacity onPress={() => setDatePickerVisibility(true)}>
                <View pointerEvents="none">
                  <TextInput 
                    label="Joining Date" 
                    value={formatJoiningDate(newJoiningDate)} 
                    mode="outlined" 
                    style={styles.premiumInput}
                    outlineColor="#e2e8f0"
                    activeOutlineColor="#6366f1"
                    left={<TextInput.Icon icon="calendar-outline" color={focusedField === 'date' ? "#6366f1" : "#94a3b8"} />}
                  />
                </View>
              </TouchableOpacity>

              {/* Compensation Model Section */}
              <Text style={styles.sectionHeader}>COMPENSATION MODEL</Text>
              
              <View style={styles.wageGrid}>
                <TouchableOpacity 
                  style={[styles.premiumWageCard, newWageType === "DAILY" && styles.premiumWageCardActive]} 
                  onPress={() => setNewWageType("DAILY")}
                >
                  <IconButton icon="clock-outline" iconColor={newWageType === "DAILY" ? "#FFF" : "#64748B"} size={24} />
                  <Text style={[styles.premiumWageCardTitle, newWageType === "DAILY" && styles.premiumWageCardTextActive]}>Daily</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.premiumWageCard, newWageType === "MONTHLY" && styles.premiumWageCardActive]} 
                  onPress={() => setNewWageType("MONTHLY")}
                >
                  <IconButton icon="calendar-month" iconColor={newWageType === "MONTHLY" ? "#FFF" : "#64748B"} size={24} />
                  <Text style={[styles.premiumWageCardTitle, newWageType === "MONTHLY" && styles.premiumWageCardTextActive]}>Monthly</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.premiumWageCard, newWageType === "YEARLY" && styles.premiumWageCardActive]} 
                  onPress={() => setNewWageType("YEARLY")}
                >
                  <IconButton icon="briefcase-outline" iconColor={newWageType === "YEARLY" ? "#FFF" : "#64748B"} size={24} />
                  <Text style={[styles.premiumWageCardTitle, newWageType === "YEARLY" && styles.premiumWageCardTextActive]}>Yearly</Text>
                </TouchableOpacity>
              </View>

              {/* Salary Details */}
              <View style={styles.dynamicSalaryContainer}>
                {newWageType === "DAILY" ? (
                  <TextInput 
                    label="Daily Wage (₹)" 
                    value={newDailyWage} 
                    onChangeText={setNewDailyWage} 
                    keyboardType="numeric" 
                    mode="outlined" 
                    style={styles.premiumInput}
                    left={<TextInput.Icon icon="cash" color="#6366f1" />}
                  />
                ) : newWageType === "MONTHLY" ? (
                  <TextInput 
                    label="Monthly Salary (₹)" 
                    value={newMonthlySalary} 
                    onChangeText={setNewMonthlySalary} 
                    keyboardType="numeric" 
                    mode="outlined" 
                    style={styles.premiumInput}
                    left={<TextInput.Icon icon="bank-outline" color="#6366f1" />}
                  />
                ) : (
                  <>
                    <TextInput 
                      label="Annual Contract (₹)" 
                      value={newYearlySalary} 
                      onChangeText={setNewYearlySalary} 
                      keyboardType="numeric" 
                      mode="outlined" 
                      style={styles.premiumInput}
                      left={<TextInput.Icon icon="currency-inr" color="#6366f1" />}
                    />
                    <TextInput 
                      label="Allowed Leaves" 
                      value={newAllowedLeaves} 
                      onChangeText={setNewAllowedLeaves} 
                      keyboardType="numeric" 
                      mode="outlined" 
                      style={styles.premiumInput}
                      left={<TextInput.Icon icon="beach" color="#6366f1" />}
                    />
                  </>
                )}
              </View>

              <DateTimePickerModal
                isVisible={isDatePickerVisible}
                mode="date"
                date={newJoiningDate}
                onConfirm={(d) => { setDatePickerVisibility(false); setNewJoiningDate(d); }}
                onCancel={() => setDatePickerVisibility(false)}
              />
            </Dialog.Content>
          </ScrollView>

          <View style={styles.premiumActionButtons}>
            <TouchableOpacity onPress={() => setShowAddForm(false)} style={styles.ghostButton}>
              <Text style={styles.ghostButtonText}>DISCARD</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onAddLabour} disabled={savingNewLabour} style={styles.primaryActionButton}>
              {savingNewLabour ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.primaryActionButtonText}>CREATE STAFF</Text>
              )}
            </TouchableOpacity>
          </View>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F9FAFB" },
  appBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#FFFFFF", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  appBarTitle: { fontSize: 18, fontWeight: "700", color: "#1E293B" },
  listContainer: { padding: 16 },
  card: { backgroundColor: "#FFFFFF", borderRadius: 12, marginBottom: 12, elevation: 2, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4 },
  cardContent: { flexDirection: "row", alignItems: "center", padding: 16 },
  avatarPlaceholder: { backgroundColor: "#F1F5F9" },
  cardTextContainer: { flex: 1, marginLeft: 16 },
  workerName: { fontSize: 16, fontWeight: "700", color: "#0F172A" },
  workerRole: { fontSize: 13, color: "#64748B" },
  statusContainer: { paddingLeft: 10 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusActive: { backgroundColor: "#059669" },
  statusInactive: { backgroundColor: "#94A3B8" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  
  // 10x PREMIUM MODAL STYLES
  dialog: { 
    backgroundColor: "#FFFFFF", 
    borderRadius: 24, 
    overflow: 'hidden',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10
  },
  dialogContent: { padding: 0 },
  modalTitle: { fontSize: 22, fontWeight: '700', color: '#0f172a', marginBottom: 24 },
  
  // Photo Section
  photoUploadContainer: { alignItems: 'center', marginBottom: 24 },
  avatarWrapper: { position: 'relative' },
  avatarDashedBorder: { 
    padding: 4, 
    borderRadius: 100, 
    borderWidth: 2, 
    borderColor: '#cbd5e1', 
    borderStyle: 'dashed',
    backgroundColor: '#f8fafc'
  },
  avatarPlaceholderIcon: { backgroundColor: 'transparent' },
  cameraBadge: { 
    position: 'absolute', 
    bottom: 0, 
    right: 0, 
    backgroundColor: '#1e293b', 
    borderRadius: 12, 
    elevation: 4 
  },
  photoUploadSub: { fontSize: 13, color: '#64748b', marginTop: 12 },

  // Sections
  sectionHeader: { 
    fontSize: 12, 
    fontWeight: '700', 
    color: '#64748b', 
    letterSpacing: 1.5, 
    marginBottom: 16, 
    marginTop: 8 
  },
  
  // Premium Inputs
  premiumInput: { 
    marginBottom: 16, 
    backgroundColor: "#f1f5f9", 
    fontSize: 14,
    borderRadius: 12
  },

  // Wage Grid (Tactile Cards)
  wageGrid: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  premiumWageCard: { 
    flex: 1, 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    padding: 12, 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: '#e2e8f0' 
  },
  premiumWageCardActive: { 
    backgroundColor: '#1e293b', 
    borderColor: '#1e293b',
    shadowColor: '#1e293b',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5
  },
  premiumWageCardTitle: { fontSize: 13, fontWeight: '600', color: '#64748b', marginTop: -4 },
  premiumWageCardTextActive: { color: '#fff' },

  dynamicSalaryContainer: { marginBottom: 8 },

  // Premium Buttons
  premiumActionButtons: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 16,
    gap: 12 
  },
  ghostButton: { paddingVertical: 12, paddingHorizontal: 16 },
  ghostButtonText: { color: '#64748b', fontWeight: '700', fontSize: 14 },
  primaryActionButton: { 
    flex: 1, 
    backgroundColor: '#1e293b', 
    borderRadius: 14, 
    paddingVertical: 16, 
    alignItems: 'center',
    shadowColor: '#1e293b',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8
  },
  primaryActionButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  
  fab: { position: "absolute", margin: 16, right: 0, bottom: 20, backgroundColor: "#1E293B", borderRadius: 30 },
});
