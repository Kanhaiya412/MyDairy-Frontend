// src/screens/LabourAttendanceScreen.tsx

import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Text,
  Avatar,
  IconButton,
  ActivityIndicator,
  Button,
  Portal,
  Dialog,
  TextInput,
  Chip,
} from "react-native-paper";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import LinearGradient from "react-native-linear-gradient";
import { useNavigation } from "@react-navigation/native";

import {
  getLaboursByUser,
  LabourEntry,
  markBatchAttendance,
} from "../services/labourService";
import apiClient from "../services/apiClient";

type AttendanceStatus = "PRESENT" | "ABSENT" | "HALF_DAY" | "PAID_LEAVE" | "OFF_DAY";

interface WorkerAttendance {
  labourId: number;
  labourName: string;
  status: AttendanceStatus;
  shift: string;
  workHours: number;
  remarks: string;
}

export default function LabourAttendanceScreen() {
  const navigation = useNavigation<any>();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [labours, setLabours] = useState<LabourEntry[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<number, WorkerAttendance>>({});
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  // Detail Modal States
  const [detailLabourId, setDetailLabourId] = useState<number | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  const serverUrl = apiClient.defaults.baseURL?.replace('/api', '') || "http://10.249.237.26:8080";

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const list = await getLaboursByUser();
      const activeOnly = (list || []).filter(l => l.status === "ACTIVE");
      setLabours(activeOnly);
      
      // Fetch existing records for this date
      const dateStr = selectedDate.toISOString().split('T')[0];
      // We need an endpoint to get attendance for ALL workers on a date, 
      // but for now we can rely on a per-worker check or a new service method.
      // Assuming getAttendanceByDate exists or we use the month list and filter.
      // Let's use getAttendanceForMonth and filter for simplicity for now.
      
      const initialMap: Record<number, WorkerAttendance> = {};
      
      // Default to PRESENT
      activeOnly.forEach(l => {
        initialMap[l.id] = {
          labourId: l.id,
          labourName: l.labourName,
          status: "PRESENT",
          shift: "DAY",
          workHours: 8.0,
          remarks: "",
        };
      });

      // Try to overlay existing data
      try {
        const month = selectedDate.getMonth() + 1;
        const year = selectedDate.getFullYear();
        
        for (const l of activeOnly) {
           const res = await apiClient.get(`/labour/attendance/${l.id}?month=${month}&year=${year}`);
           const existing = (res.data as any[]).find(a => a.date === dateStr);
           if (existing) {
             initialMap[l.id] = {
               labourId: l.id,
               labourName: l.labourName,
               status: existing.status,
               shift: existing.shift || "DAY",
               workHours: existing.workHours || 8.0,
               remarks: existing.remarks || "",
             };
           }
        }
      } catch (e) {
        console.log("Could not fetch existing attendance", e);
      }

      setAttendanceMap(initialMap);
    } catch {
      Alert.alert("Error", "Failed to fetch staff list");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = (id: number, status: AttendanceStatus) => {
    setAttendanceMap(prev => ({
      ...prev,
      [id]: { ...prev[id], status }
    }));
  };

  const updateDetail = (id: number, field: keyof WorkerAttendance, value: any) => {
    setAttendanceMap(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value }
    }));
  };

  const onSubmit = async () => {
    try {
      setSubmitting(true);
      const dateStr = selectedDate.toISOString().split('T')[0];
      const payload = {
        date: dateStr,
        entries: Object.values(attendanceMap).map(a => ({
          labourId: a.labourId,
          status: a.status,
          remarks: a.remarks,
          shift: a.shift,
          workHours: a.workHours,
        }))
      };
      
      await markBatchAttendance(payload);
      Alert.alert("Success", "Attendance submitted successfully!");
      // Don't go back, just refresh to show the saved state
      loadData();
    } catch (e: any) {
      Alert.alert("Error", e.response?.data || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDisplayDate = (d: Date) => {
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const stats = {
    P: Object.values(attendanceMap).filter(a => a.status === "PRESENT").length,
    A: Object.values(attendanceMap).filter(a => a.status === "ABSENT").length,
    H: Object.values(attendanceMap).filter(a => a.status === "HALF_DAY").length,
  };

  const renderWorkerItem = ({ item }: { item: LabourEntry }) => {
    const att = attendanceMap[item.id];
    if (!att) return null;

    const fullPhotoUrl = item.photoUrl ? `${serverUrl}${item.photoUrl}` : null;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.workerInfo}>
            {fullPhotoUrl ? (
              <Avatar.Image size={40} source={{ uri: fullPhotoUrl }} />
            ) : (
              <Avatar.Text size={40} label={item.labourName.substring(0, 2).toUpperCase()} style={styles.avatarPlaceholder} />
            )}
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.workerName}>{item.labourName}</Text>
              <Text style={styles.workerSub}>{att.shift} • {att.workHours}h</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.detailTrigger} 
            onPress={() => { setDetailLabourId(item.id); setShowDetailDialog(true); }}
          >
            <IconButton icon="dots-vertical" size={20} iconColor="#94A3B8" />
          </TouchableOpacity>
        </View>

        <View style={styles.statusRow}>
          {(["PRESENT", "ABSENT", "HALF_DAY", "PAID_LEAVE", "OFF_DAY"] as AttendanceStatus[]).map((s) => {
            const isActive = att.status === s;
            const label = s === "HALF_DAY" ? "HALF" : s === "PAID_LEAVE" ? "LEAVE" : s === "OFF_DAY" ? "OFF" : s;
            
            return (
              <TouchableOpacity
                key={s}
                style={[
                  styles.statusBtn,
                  isActive && styles[`btnActive_${s}` as keyof typeof styles]
                ]}
                onPress={() => updateStatus(item.id, s)}
              >
                <Text style={[styles.statusBtnText, isActive && styles.statusBtnTextActive]}>
                  {label.substring(0, 1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#6366F1" />
        <Text style={styles.muted}>Preparing Roll Call…</Text>
      </View>
    );
  }

  const currentDetail = detailLabourId ? attendanceMap[detailLabourId] : null;

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.appBar}>
        <IconButton icon="arrow-left" iconColor="#1E293B" size={24} onPress={() => navigation.goBack()} />
        <View style={styles.appBarInfo}>
          <Text style={styles.appBarTitle}>Daily Roll Call</Text>
          <TouchableOpacity onPress={() => setDatePickerVisibility(true)} style={styles.datePickerTrigger}>
            <Text style={styles.appBarDate}>{formatDisplayDate(selectedDate)}</Text>
            <IconButton icon="chevron-down" size={16} iconColor="#6366F1" style={{ margin: 0 }} />
          </TouchableOpacity>
        </View>
        <View style={{ width: 48 }} />
      </View>

      {/* MINI STATS */}
      <View style={styles.miniStats}>
        <View style={[styles.miniStatCard, { backgroundColor: '#ECFDF5' }]}>
          <Text style={[styles.miniStatVal, { color: '#059669' }]}>{stats.P}</Text>
          <Text style={styles.miniStatLbl}>Present</Text>
        </View>
        <View style={[styles.miniStatCard, { backgroundColor: '#FEF2F2' }]}>
          <Text style={[styles.miniStatVal, { color: '#DC2626' }]}>{stats.A}</Text>
          <Text style={styles.miniStatLbl}>Absent</Text>
        </View>
        <View style={[styles.miniStatCard, { backgroundColor: '#FFFBEB' }]}>
          <Text style={[styles.miniStatVal, { color: '#D97706' }]}>{stats.H}</Text>
          <Text style={styles.miniStatLbl}>Half Day</Text>
        </View>
      </View>

      <FlatList
        data={labours}
        keyExtractor={(l) => l.id.toString()}
        renderItem={renderWorkerItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      {/* FOOTER ACTION */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.submitBtn} onPress={onSubmit} disabled={submitting}>
          <LinearGradient
            colors={['#4F46E5', '#6366F1']}
            style={styles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {submitting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.submitText}>Submit Attendance</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        date={selectedDate}
        onConfirm={(d) => { setDatePickerVisibility(false); setSelectedDate(d); }}
        onCancel={() => setDatePickerVisibility(false)}
      />

      {/* DETAIL DIALOG */}
      <Portal>
        <Dialog visible={showDetailDialog} onDismiss={() => setShowDetailDialog(false)} style={styles.dialog}>
          <Dialog.Title style={styles.dialogTitle}>Attendance Details</Dialog.Title>
          <Dialog.Content>
            {currentDetail && (
              <View>
                <Text style={styles.dialogSub}>{currentDetail.labourName}</Text>
                
                <Text style={styles.inputLabel}>Shift</Text>
                <View style={styles.shiftRow}>
                  {['DAY', 'NIGHT', 'EVENING'].map(sh => (
                    <Chip 
                      key={sh} 
                      selected={currentDetail.shift === sh} 
                      onPress={() => updateDetail(detailLabourId!, 'shift', sh)}
                      style={styles.chip}
                      selectedColor="#FFF"
                      showSelectedOverlay
                    >{sh}</Chip>
                  ))}
                </View>

                <TextInput
                  label="Work Hours"
                  value={String(currentDetail.workHours)}
                  onChangeText={(v) => updateDetail(detailLabourId!, 'workHours', parseFloat(v) || 0)}
                  keyboardType="numeric"
                  mode="outlined"
                  style={styles.input}
                />

                <TextInput
                  label="Remarks"
                  value={currentDetail.remarks}
                  onChangeText={(v) => updateDetail(detailLabourId!, 'remarks', v)}
                  mode="outlined"
                  multiline
                  numberOfLines={3}
                  style={styles.input}
                />
              </View>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDetailDialog(false)} textColor="#6366F1">DONE</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  muted: { color: "#94A3B8", marginTop: 8, fontSize: 13, fontWeight: '600' },

  appBar: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF", paddingVertical: 8, elevation: 2 },
  appBarInfo: { flex: 1, alignItems: 'center' },
  appBarTitle: { fontSize: 16, fontWeight: '900', color: '#1E293B' },
  datePickerTrigger: { flexDirection: 'row', alignItems: 'center', marginTop: -4 },
  appBarDate: { fontSize: 12, fontWeight: '700', color: '#6366F1' },

  miniStats: { flexDirection: 'row', padding: 16, gap: 10 },
  miniStatCard: { flex: 1, borderRadius: 16, padding: 12, alignItems: 'center' },
  miniStatVal: { fontSize: 15, fontWeight: '900' },
  miniStatLbl: { fontSize: 9, fontWeight: '800', color: '#64748B', textTransform: 'uppercase', marginTop: 2 },

  list: { padding: 16, paddingBottom: 100 },
  card: { backgroundColor: '#FFF', borderRadius: 20, padding: 16, marginBottom: 12, elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  workerInfo: { flexDirection: 'row', alignItems: 'center' },
  avatarPlaceholder: { backgroundColor: '#F1F5F9' },
  workerName: { fontSize: 15, fontWeight: '800', color: '#1E293B' },
  workerSub: { fontSize: 11, color: '#94A3B8', fontWeight: '700' },
  detailTrigger: { padding: 4 },

  statusRow: { flexDirection: 'row', marginTop: 16, gap: 8 },
  statusBtn: { flex: 1, height: 36, borderRadius: 10, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
  statusBtnText: { fontSize: 12, fontWeight: '900', color: '#64748B' },
  statusBtnTextActive: { color: '#FFF' },

  btnActive_PRESENT: { backgroundColor: '#10B981', borderColor: '#10B981' },
  btnActive_ABSENT: { backgroundColor: '#EF4444', borderColor: '#EF4444' },
  btnActive_HALF_DAY: { backgroundColor: '#F59E0B', borderColor: '#F59E0B' },
  btnActive_PAID_LEAVE: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  btnActive_OFF_DAY: { backgroundColor: '#64748B', borderColor: '#64748B' },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  submitBtn: { height: 56, borderRadius: 28, overflow: 'hidden', elevation: 8, shadowColor: '#6366F1', shadowOpacity: 0.3, shadowRadius: 10 },
  gradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  submitText: { color: '#FFF', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },

  dialog: { borderRadius: 24, backgroundColor: '#FFF' },
  dialogTitle: { fontSize: 18, fontWeight: '900', color: '#1E293B' },
  dialogSub: { fontSize: 14, color: '#6366F1', fontWeight: '800', marginBottom: 16 },
  inputLabel: { fontSize: 12, fontWeight: '800', color: '#94A3B8', marginBottom: 8 },
  shiftRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: { backgroundColor: '#F1F5F9' },
  input: { marginBottom: 12, backgroundColor: '#F8FAFC' }
});

