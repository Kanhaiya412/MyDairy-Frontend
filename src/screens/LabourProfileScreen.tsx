// src/screens/LabourProfileScreen.tsx

import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Text,
  Button,
  ActivityIndicator,
  Avatar,
  IconButton,
  Dialog,
  Portal,
  TextInput,
  Switch,
  Icon,
} from "react-native-paper";
import LinearGradient from "react-native-linear-gradient";
import { launchImageLibrary } from "react-native-image-picker";
import apiClient from "../services/apiClient";
import DateTimePickerModal from "react-native-modal-datetime-picker";

import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";

import {
  getLabourDashboard,
  LabourDashboardDTO,
  LabourEventDTO,
  updateLabour,
  uploadLabourPhoto,
} from "../services/labourService";

type Props = NativeStackScreenProps<RootStackParamList, "LabourProfile">;
type SectionKey = "summary" | "loan" | "penalty" | "timeline";

/* ---------------- Antigravity Styles (EXTREME COMPACT & CENTERED) ---------------- */

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F8FAFC" },
  scrollContainer: { paddingBottom: 60 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  muted: { color: "#94A3B8", marginTop: 8, fontSize: 13 },

  /* 1. HEADER (Tighter) */
  antigravityHeader: {
    padding: 20,
    paddingTop: 30,
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: "#64748B",
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
    marginBottom: 12
  },
  updatingBadge: { position: 'absolute', top: 10, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  updatingText: { fontSize: 9, color: '#6366F1', marginLeft: 4, fontWeight: '800', letterSpacing: 1 },
  headerTopRow: { flexDirection: 'row', alignItems: 'center' },
  avatarWrapper: { position: 'relative' },
  avatarPlaceholderContainer: { padding: 4, borderRadius: 100, borderWidth: 1.5, borderColor: '#6366F1', borderStyle: 'dashed' },
  avatarPlaceholderIcon: { backgroundColor: 'transparent' },
  statusIndicator: { position: 'absolute', right: 4, bottom: 4, width: 14, height: 14, borderRadius: 7, borderWidth: 3, borderColor: '#FFF' },
  headerInfo: { flex: 1, marginLeft: 16 },
  skeletonName: { fontSize: 22, fontWeight: '900', color: '#1E293B' },
  skeletonId: { fontSize: 13, color: '#94A3B8', fontWeight: '700' },
  pillContainer: { flexDirection: 'row', marginTop: 8, gap: 8 },
  pills: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', paddingRight: 8, borderRadius: 12 },
  pillIcon: { margin: 0 },
  pillText: { fontSize: 10, fontWeight: '800', color: '#64748B' },
  premiumEditButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#6366F1', justifyContent: 'center', alignItems: 'center', elevation: 12, zIndex: 10 },

  /* 2. STATS GRID (SUPER COMPACT) */
  statsGrid: { paddingHorizontal: 20, marginTop: 0 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  floatingCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 10,
    alignItems: 'center',
    shadowColor: "#64748B",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 5,
    borderTopWidth: 3
  },
  statIconArea: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  statIcon: { margin: 0 },
  statValue: { fontSize: 16, fontWeight: '900', color: '#1E293B' },
  statLabel: { fontSize: 9, fontWeight: '800', color: '#94A3B8', marginTop: 2, textTransform: 'uppercase' },

  /* 3. ACTION PILLS (FORCED CENTERING) */
  actionPillRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 20, marginTop: 4 },
  pillButton: {
    flex: 1,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2
  },
  pillGroup: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  pillButtonText: { fontSize: 11, fontWeight: '800', marginLeft: 2 },

  /* 4. TABS & CONTENT */
  glassNavigation: { flexDirection: 'row', marginHorizontal: 20, backgroundColor: '#F1F5F9', borderRadius: 18, padding: 4, marginBottom: 16 },
  glassTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 14 },
  glassTabActive: { backgroundColor: '#FFFFFF', elevation: 2 },
  glassTabText: { fontSize: 12, color: '#94A3B8', fontWeight: '800' },
  glassTabTextActive: { color: '#6366F1' },

  contentArea: { paddingHorizontal: 20 },
  cardDetail: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, elevation: 1 },
  detailHeader: { fontSize: 10, fontWeight: '900', color: '#6366F1', letterSpacing: 1, marginBottom: 12, textAlign: 'center' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  infoLabel: { fontSize: 13, color: '#94A3B8', fontWeight: '700' },
  infoValue: { fontSize: 13, color: '#1E293B', fontWeight: '800' },

  /* TIMELINE */
  timelineContainer: { gap: 16 },
  timelineItem: { flexDirection: 'row' },
  timelinePoint: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#6366F1', marginTop: 6, marginRight: 16, borderWidth: 3, borderColor: '#EEF2FF' },
  timelineContent: { flex: 1, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  timelineDate: { fontSize: 10, fontWeight: '900', color: '#94A3B8' },
  timelineTitle: { fontSize: 15, fontWeight: '900', color: '#1E293B', marginTop: 3 },
  timelineDescription: { fontSize: 12, color: '#64748B', marginTop: 4, lineHeight: 16 },
  timelineValue: { fontSize: 15, fontWeight: '900', color: '#10B981', marginTop: 8 },

  /* ----------------- MODAL OVERHAUL (ANTIGRAVITY RENDER) ----------------- */
  dialog: { backgroundColor: '#FFFFFF', borderRadius: 36, padding: 0, overflow: 'hidden' },
  modalHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingTop: 24, 
    paddingBottom: 16 
  },
  dialogTitle: { 
    fontSize: 20, 
    fontWeight: '900', 
    color: '#1E293B', 
    textAlign: 'center', 
    flex: 1, 
    marginLeft: 40 // Offset for the close button to center title
  },
  closeIconArea: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
  
  avatarEditWrapper: { position: 'relative', alignSelf: 'center', marginBottom: 28 },
  // Reusing avatarPlaceholderContainer from above
  camBadge: { 
    position: 'absolute', 
    bottom: 0, 
    right: 0, 
    backgroundColor: '#FFFFFF', 
    borderRadius: 18, 
    width: 36, 
    height: 36, 
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#FFF'
  },
  camIconInner: { backgroundColor: '#6366F1', borderRadius: 15, width: 30, height: 30, justifyContent: 'center', alignItems: 'center' },

  formInput: { 
    marginBottom: 16, 
    backgroundColor: '#F8FAFC', 
    borderRadius: 16, 
    fontSize: 15 
  },
  inputOutline: { borderRadius: 16, borderColor: '#E2E8F0', borderWidth: 1 },

  wageSelectionRow: { 
    marginVertical: 18,
    paddingHorizontal: 4
  },
  wageLabel: { fontSize: 13, fontWeight: '900', color: '#64748B', textTransform: 'uppercase', marginBottom: 10, letterSpacing: 0.5 },
  wageButtonsTrio: { 
    flexDirection: 'row', 
    backgroundColor: '#F1F5F9', 
    borderRadius: 16, 
    padding: 4,
    height: 48,
    alignItems: 'center'
  },
  wageBtn: { 
    flex: 1, 
    height: 40, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderRadius: 12 
  },
  wageBtnActive: { 
    backgroundColor: '#FFFFFF', 
    shadowColor: '#6366F1',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4
  },
  wageBtnText: { fontSize: 11, fontWeight: '900' },
  wageBtnTextActive: { color: '#6366F1' },
  wageBtnTextInactive: { color: '#64748B' },

  premiumPill: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: '#F1F5F9', 
    paddingVertical: 14, 
    paddingHorizontal: 20, 
    borderRadius: 24, 
    marginTop: 12,
    marginBottom: 20
  },
  deactivateLabel: { fontSize: 14, fontWeight: '900', color: '#DC2626' },

  modalActions: { 
    flexDirection: 'row', 
    paddingHorizontal: 20, 
    paddingBottom: 24, 
    gap: 12, 
    justifyContent: 'flex-end' 
  },
  ghostButton: { borderRadius: 16, minWidth: 100 },
  saveButtonContainer: { flex: 1, height: 50, borderRadius: 25, overflow: 'hidden' },
  saveGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
});

const InfoRow = ({ label, value }: { label: string; value: any }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value ?? "—"}</Text>
  </View>
);

const formatDate = (d: any) => {
  if (!d) return "";
  const [y, m, day] = String(d).split("-");
  return `${day}-${m}-${y}`;
};

const formatNumber = (n?: number | null) =>
  n ? Math.floor(Number(n)).toLocaleString("en-IN") : "0";

const mapEventTypeLabel = (t: string) => t.replace(/_/g, " ").toUpperCase();

export default function LabourProfileScreen({ route, navigation }: Props) {
  const { labourId } = route.params;

  const [data, setData] = useState<LabourDashboardDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionKey>("summary");

  // EDIT STATES
  const [showEditForm, setShowEditForm] = useState(false);
  const [editName, setEditName] = useState("");
  const [editMobile, setEditMobile] = useState("");
  const [editWageType, setEditWageType] = useState<"DAILY" | "MONTHLY" | "YEARLY">("DAILY");
  const [editDailyWage, setEditDailyWage] = useState("");
  const [editMonthlySalary, setEditMonthlySalary] = useState("");
  const [editYearlySalary, setEditYearlySalary] = useState("");
  const [editAllowedLeaves, setEditAllowedLeaves] = useState("");
  const [isDeactivated, setIsDeactivated] = useState(false);
  const [editJoiningDate, setEditJoiningDate] = useState<Date>(new Date());
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  const [editPhotoUri, setEditPhotoUri] = useState<string | null>(null);
  const [editPhotoType, setEditPhotoType] = useState("");
  const [editPhotoName, setEditPhotoName] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const formatJoiningDateStr = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getLabourDashboard(labourId);
      setData(res);
    } catch (e) {
      console.log("Dashboard load error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [labourId]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  const openEditForm = () => {
    if (!data) return;
    setEditName(data.labourName || "");
    setEditMobile(data.mobile || "");
    setEditWageType((data.wageType as any) || "DAILY");
    setEditDailyWage(data.dailyWage ? String(data.dailyWage) : "");
    setEditMonthlySalary(data.monthlySalary ? String(data.monthlySalary) : "");
    setEditYearlySalary(data.yearlySalary ? String(data.yearlySalary) : "");
    setEditAllowedLeaves(data.allowedLeaves ? String(data.allowedLeaves) : "21");
    setIsDeactivated(data.endDate != null);
    if (data.joiningDate) {
      setEditJoiningDate(new Date(data.joiningDate));
    } else {
      setEditJoiningDate(new Date());
    }
    setEditPhotoUri(null);
    setShowEditForm(true);
  };

  const onPickEditPhoto = async () => {
    try {
      const result = await launchImageLibrary({ mediaType: "photo", quality: 0.5 });
      if (result.didCancel) return;
      if (result.assets && result.assets.length > 0) {
        setEditPhotoUri(result.assets[0].uri || null);
        setEditPhotoType(result.assets[0].type || "image/jpeg");
        setEditPhotoName(result.assets[0].fileName || "photo.jpg");
      }
    } catch (err) { }
  };

  const onSaveEdit = async () => {
    try {
      setSavingEdit(true);
      let finalPhotoUrl = data?.photoUrl;

      if (editPhotoUri) {
        setUploadingPhoto(true);
        finalPhotoUrl = await uploadLabourPhoto(editPhotoUri, editPhotoType, editPhotoName);
        setUploadingPhoto(false);
      }

      await updateLabour(labourId, {
        labourName: editName.trim(),
        mobile: editMobile,
        photoUrl: finalPhotoUrl,
        wageType: editWageType,
        dailyWage: Number(editDailyWage) || 0,
        monthlySalary: Number(editMonthlySalary) || 0,
        yearlySalary: Number(editYearlySalary) || 0,
        allowedLeaves: Number(editAllowedLeaves) || 0,
        joiningDate: formatJoiningDateStr(editJoiningDate),
        status: isDeactivated ? "INACTIVE" : "ACTIVE",
      });

      setShowEditForm(false);
      await loadDashboard();
    } catch (e: any) {
      console.log(e);
    } finally {
      setSavingEdit(false);
      setUploadingPhoto(false);
    }
  };

  if (loading && !data) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#6366F1" />
        <Text style={styles.muted}>Loading profile…</Text>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.centered}>
        <Text style={styles.muted}>System link failed</Text>
        <Button mode="contained" onPress={loadDashboard} buttonColor="#1E1B4B">
          Try Again
        </Button>
      </View>
    );
  }

  const serverUrl = apiClient.defaults.baseURL?.replace('/api', '') || "http://10.249.237.26:8080";
  const fullPhotoUrl = data.photoUrl ? `${serverUrl}${data.photoUrl}` : null;

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContainer} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366F1" />}>

        {/* HEADER */}
        <View style={styles.antigravityHeader}>
          <View style={styles.headerTopRow}>
            <View style={styles.avatarWrapper}>
              <View style={styles.avatarPlaceholderContainer}>
                {fullPhotoUrl ? (
                  <Avatar.Image size={76} source={{ uri: fullPhotoUrl }} />
                ) : (
                  <Avatar.Icon size={76} icon="account" style={styles.avatarPlaceholderIcon} color="#6366F1" />
                )}
              </View>
              <View style={[styles.statusIndicator, data.status === "ACTIVE" ? { backgroundColor: '#10B981' } : { backgroundColor: '#94A3B8' }]} />
            </View>

            <View style={styles.headerInfo}>
              <Text style={styles.skeletonName} numberOfLines={1}>{data.labourName || "NAME"}</Text>
              <Text style={styles.skeletonId}>{data.mobile || "80099XXXXX"}</Text>
              <View style={styles.pillContainer}>
                <View style={styles.pills}>
                  <IconButton icon="phone" size={12} iconColor="#6366F1" style={styles.pillIcon} />
                  <Text style={styles.pillText}>{data.mobile || "CALL"}</Text>
                </View>
                <View style={styles.pills}>
                  <IconButton icon="calendar" size={12} iconColor="#6366F1" style={styles.pillIcon} />
                  <Text style={styles.pillText}>{formatDate(data.joiningDate)}</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.premiumEditButton} onPress={openEditForm}>
              <View pointerEvents="none">
                <Avatar.Icon icon="pencil" size={24} color="#FFFFFF" style={{ backgroundColor: 'transparent' }} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* STATS */}
        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <View style={[styles.floatingCard, { borderColor: '#7C3AED' }]}>
              <View style={styles.statIconArea}><Avatar.Icon icon="calendar-check" size={32} color="#7C3AED" style={{ backgroundColor: 'transparent' }} /></View>
              <Text style={styles.statValue}>{data.totalWorkingDays || 0}</Text>
              <Text style={styles.statLabel}>Work Days</Text>
            </View>
            <View style={[styles.floatingCard, { borderColor: '#F97316' }]}>
              <View style={styles.statIconArea}><Avatar.Icon icon="clock-fast" size={32} color="#F97316" style={{ backgroundColor: 'transparent' }} /></View>
              <Text style={styles.statValue}>₹{formatNumber(data.pendingSalary)}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={[styles.floatingCard, { borderColor: '#10B981' }]}>
              <View style={styles.statIconArea}><Avatar.Icon icon="shield-check" size={32} color="#10B981" style={{ backgroundColor: 'transparent' }} /></View>
              <Text style={styles.statValue}>₹{formatNumber(data.totalSalaryPaid)}</Text>
              <Text style={styles.statLabel}>Total Paid</Text>
            </View>
            <View style={[styles.floatingCard, { borderColor: '#6366F1' }]}>
              <View style={styles.statIconArea}><Avatar.Icon icon="bank-transfer-out" size={32} color="#6366F1" style={{ backgroundColor: 'transparent' }} /></View>
              <Text style={styles.statValue}>₹{formatNumber(data.outstandingWithInterest)}</Text>
              <Text style={styles.statLabel}>Active Debt</Text>
            </View>
          </View>
        </View>

        {/* ACTION HUB */}
        <View style={styles.actionPillRow}>
          <TouchableOpacity style={[styles.pillButton, { borderColor: '#BBF7D0' }]} onPress={() => navigation.navigate("LabourAttendance", { labourId })}>
            <View style={styles.pillGroup} pointerEvents="none">
              <Avatar.Icon icon="account-check" size={32} color="#16A34A" style={{ backgroundColor: 'transparent' }} />
              <Text style={[styles.pillButtonText, { color: '#16A34A' }]}>Attendance</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.pillButton, { borderColor: '#BAE6FD' }]} onPress={() => navigation.navigate("LabourSalary", { labourId })}>
            <View style={styles.pillGroup} pointerEvents="none">
              <Avatar.Icon icon="cash-multiple" size={32} color="#0284C7" style={{ backgroundColor: 'transparent' }} />
              <Text style={[styles.pillButtonText, { color: '#0284C7' }]}>Salaries</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.pillButton, { borderColor: '#FFEDD5' }]} onPress={() => navigation.navigate("LabourLoan", { labourId })}>
            <View style={styles.pillGroup} pointerEvents="none">
              <Avatar.Icon icon="handshake" size={32} color="#EA580C" style={{ backgroundColor: 'transparent' }} />
              <Text style={[styles.pillButtonText, { color: '#EA580C' }]}>Udhar</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* TABS */}
        <View style={styles.glassNavigation}>
          {(["summary", "loan", "penalty", "timeline"] as SectionKey[]).map((key) => (
            <Pressable key={key} onPress={() => setActiveSection(key)} style={[styles.glassTab, activeSection === key && styles.glassTabActive]}>
              <Text style={[styles.glassTabText, activeSection === key && styles.glassTabTextActive]}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
            </Pressable>
          ))}
        </View>

        {/* CONTENT */}
        <View style={styles.contentArea}>
          {activeSection === "summary" && (
            <View style={styles.cardDetail}>
              <Text style={styles.detailHeader}>SUMMARY PROFILE</Text>
              <InfoRow label="Wage Model" value={data.wageType} />
              {data.wageType === "DAILY" && <InfoRow label="Daily Rate" value={`₹${formatNumber(data.dailyWage)}`} />}
              {data.wageType === "MONTHLY" && <InfoRow label="Monthly Package" value={`₹${formatNumber(data.monthlySalary)}`} />}
              {data.wageType === "YEARLY" && (
                <>
                  <InfoRow label="Yearly Package" value={`₹${formatNumber(data.yearlySalary)}`} />
                  <InfoRow label="Allowed Leaves" value={`${data.allowedLeaves} days`} />
                </>
              )}
              <InfoRow label="Joining Date" value={formatDate(data.joiningDate)} />
            </View>
          )}

          {activeSection === "loan" && (
            <View style={styles.cardDetail}>
              <Text style={styles.detailHeader}>FINANCIAL STATUS</Text>
              <InfoRow label="Outstanding Dept" value={`₹${formatNumber(data.outstandingWithInterest)}`} />
              <InfoRow label="Total Disbursed" value={`₹${formatNumber(data.totalDisbursed)}`} />
              <InfoRow label="Total Repaid" value={`₹${formatNumber(data.totalRepaid)}`} />
            </View>
          )}

          {activeSection === "timeline" && (
            <View style={styles.cardDetail}>
              <Text style={styles.detailHeader}>ACTIVITY LOG</Text>
              <View style={styles.timelineContainer}>
                {!data.timeline || data.timeline.length === 0 ? (
                  <Text style={styles.muted}>No events found</Text>
                ) : (
                  data.timeline.map((ev: LabourEventDTO, i: number) => (
                    <View key={i} style={styles.timelineItem}>
                      <View style={styles.timelinePoint} />
                      <View style={styles.timelineContent}>
                        <Text style={styles.timelineDate}>{formatDate(ev.date)}</Text>
                        <Text style={styles.timelineTitle}>{mapEventTypeLabel(ev.type)}</Text>
                        <Text style={styles.timelineDescription}>{ev.description}</Text>
                        {ev.amount > 0 && <Text style={styles.timelineValue}>₹{formatNumber(ev.amount)}</Text>}
                      </View>
                    </View>
                  ))
                )}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* EDIT MODAL OVERHAUL (FULL RESTORED) */}
      <Portal>
        <Dialog visible={showEditForm} onDismiss={() => setShowEditForm(false)} style={styles.dialog}>
          {/* Custom Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.dialogTitle}>Update Staff Details</Text>
            <TouchableOpacity onPress={() => setShowEditForm(false)} style={styles.closeIconArea}>
              <Icon source="close" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ maxHeight: 600 }} showsVerticalScrollIndicator={false}>
            <Dialog.Content>
              {/* Avatar with Camera Badge */}
              <View style={styles.avatarEditWrapper}>
                <Pressable onPress={onPickEditPhoto} style={styles.avatarPlaceholderContainer}>
                  {editPhotoUri ? (
                    <Avatar.Image size={96} source={{ uri: editPhotoUri }} />
                  ) : fullPhotoUrl ? (
                    <Avatar.Image size={96} source={{ uri: fullPhotoUrl }} />
                  ) : (
                    <Avatar.Icon size={96} icon="account" style={{ backgroundColor: '#F8FAFC' }} color="#6366F1" />
                  )}
                  <View style={styles.camBadge}>
                    <View style={styles.camIconInner}>
                      <Icon source="camera-outline" size={16} color="#FFFFFF" />
                    </View>
                  </View>
                </Pressable>
              </View>

              {/* Form Inputs */}
              <TextInput 
                label="Full Name" 
                value={editName} 
                onChangeText={setEditName} 
                mode="outlined" 
                style={styles.formInput} 
                outlineStyle={styles.inputOutline}
                activeOutlineColor="#6366F1"
                left={<TextInput.Icon icon="account-outline" color="#94A3B8" />}
              />
              
              <TextInput 
                label="Mobile Number" 
                value={editMobile} 
                onChangeText={setEditMobile} 
                mode="outlined" 
                keyboardType="phone-pad"
                style={styles.formInput} 
                outlineStyle={styles.inputOutline}
                activeOutlineColor="#6366F1"
                left={<TextInput.Icon icon="phone-outline" color="#94A3B8" />}
              />

              <TouchableOpacity onPress={() => setDatePickerVisibility(true)}>
                <View pointerEvents="none">
                  <TextInput 
                    label="Joining Date" 
                    value={formatJoiningDateStr(editJoiningDate)} 
                    mode="outlined" 
                    style={styles.formInput} 
                    outlineStyle={styles.inputOutline}
                    left={<TextInput.Icon icon="calendar-month-outline" color="#94A3B8" />}
                    right={<TextInput.Icon icon="chevron-down" color="#94A3B8" />}
                  />
                </View>
              </TouchableOpacity>

              <DateTimePickerModal 
                isVisible={isDatePickerVisible} 
                mode="date" 
                date={editJoiningDate} 
                onConfirm={(d) => { setDatePickerVisibility(false); setEditJoiningDate(d); }} 
                onCancel={() => setDatePickerVisibility(false)} 
              />
              
              {/* Wage Trio (Responsive Segmented Layout) */}
              <View style={styles.wageSelectionRow}>
                <Text style={styles.wageLabel}>Wage Model</Text>
                <View style={styles.wageButtonsTrio}>
                  <TouchableOpacity 
                    onPress={() => setEditWageType("DAILY")} 
                    style={[styles.wageBtn, editWageType === "DAILY" && styles.wageBtnActive]}
                  >
                    <Text style={[styles.wageBtnText, editWageType === "DAILY" ? styles.wageBtnTextActive : styles.wageBtnTextInactive]}>DAILY</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    onPress={() => setEditWageType("MONTHLY")} 
                    style={[styles.wageBtn, editWageType === "MONTHLY" && styles.wageBtnActive]}
                  >
                    <Text style={[styles.wageBtnText, editWageType === "MONTHLY" ? styles.wageBtnTextActive : styles.wageBtnTextInactive]}>MONTHLY</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    onPress={() => setEditWageType("YEARLY")} 
                    style={[styles.wageBtn, editWageType === "YEARLY" && styles.wageBtnActive]}
                  >
                    <Text style={[styles.wageBtnText, editWageType === "YEARLY" ? styles.wageBtnTextActive : styles.wageBtnTextInactive]}>YEARLY</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Dynamic Fields */}
              {editWageType === "DAILY" && (
                <TextInput 
                  label="Daily Wage (₹)" 
                  value={editDailyWage} 
                  onChangeText={setEditDailyWage} 
                  keyboardType="numeric" 
                  mode="outlined" 
                  style={styles.formInput} 
                  outlineStyle={styles.inputOutline}
                  left={<TextInput.Icon icon="currency-inr" color="#94A3B8" />}
                />
              )}
              {editWageType === "MONTHLY" && (
                <TextInput 
                  label="Monthly Salary (₹)" 
                  value={editMonthlySalary} 
                  onChangeText={setEditMonthlySalary} 
                  keyboardType="numeric" 
                  mode="outlined" 
                  style={styles.formInput} 
                  outlineStyle={styles.inputOutline}
                  left={<TextInput.Icon icon="currency-inr" color="#94A3B8" />}
                />
              )}
              {editWageType === "YEARLY" && (
                <>
                  <TextInput 
                    label="Yearly Package (₹)" 
                    value={editYearlySalary} 
                    onChangeText={setEditYearlySalary} 
                    keyboardType="numeric" 
                    mode="outlined" 
                    style={styles.formInput} 
                    outlineStyle={styles.inputOutline}
                    left={<TextInput.Icon icon="currency-inr" color="#94A3B8" />}
                  />
                  <TextInput 
                    label="Leaves Allowed" 
                    value={editAllowedLeaves} 
                    onChangeText={setEditAllowedLeaves} 
                    keyboardType="numeric" 
                    mode="outlined" 
                    style={styles.formInput} 
                    outlineStyle={styles.inputOutline}
                    left={<TextInput.Icon icon="calendar-clock-outline" color="#94A3B8" />}
                  />
                </>
              )}
              
              {/* Deactivate Pill */}
              <View style={styles.premiumPill}>
                <Text style={styles.deactivateLabel}>Deactivate Staff</Text>
                <Switch value={isDeactivated} onValueChange={setIsDeactivated} color="#DC2626" />
              </View>
            </Dialog.Content>
          </ScrollView>

          {/* Action Hub */}
          <View style={styles.modalActions}>
            <Button 
              onPress={() => setShowEditForm(false)} 
              textColor="#64748B" 
              style={styles.ghostButton}
              labelStyle={{ fontWeight: '800' }}
            >Cancel</Button>
            
            <TouchableOpacity 
              onPress={onSaveEdit} 
              style={styles.saveButtonContainer}
              disabled={savingEdit}
            >
              <LinearGradient 
                colors={['#FFFFFF', '#6366F1']} 
                start={{ x: 0, y: 0 }} 
                end={{ x: 1, y: 1 }} 
                style={styles.saveGradient}
              >
                {savingEdit ? (
                  <ActivityIndicator color="#FFF" size={20} />
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Dialog>
      </Portal>

    </SafeAreaView>
  );
}
