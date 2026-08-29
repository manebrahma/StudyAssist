import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList, StudySession, Subject } from "../types";
import { getSessions, deleteSession, getSubjects } from "../services/api";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function HistoryScreen() {
  const navigation = useNavigation<Nav>();
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [filterSubjectId, setFilterSubjectId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    getSubjects().then(setSubjects).catch(() => {});
  }, []);

  const fetchSessions = useCallback(async () => {
    try {
      const data = await getSessions(filterSubjectId || undefined);
      setSessions(data);
    } catch {
      // offline
    } finally {
      setRefreshing(false);
    }
  }, [filterSubjectId]);

  useFocusEffect(
    useCallback(() => {
      fetchSessions();
    }, [fetchSessions])
  );

  const handleDelete = (id: string, title: string) => {
    Alert.alert("Delete Session", `Delete "${title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteSession(id);
            fetchSessions();
          } catch {
            Alert.alert("Error", "Failed to delete session");
          }
        },
      },
    ]);
  };

  const getSubjectForSession = (subjectId: string | null) => {
    if (!subjectId) return null;
    return subjects.find((s) => s.id === subjectId) || null;
  };

  const renderSession = ({ item }: { item: StudySession }) => {
    const subject = getSubjectForSession(item.subject_id);
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate("SessionDetail", { sessionId: item.id })}
        onLongPress={() => handleDelete(item.id, item.title)}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.cardDate}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
        {subject && (
          <View style={styles.subjectBadge}>
            <View style={[styles.badgeDot, { backgroundColor: subject.color }]} />
            <Text style={styles.badgeText}>{subject.name}</Text>
          </View>
        )}
        {item.extracted_text && (
          <Text style={styles.cardPreview} numberOfLines={2}>
            {item.extracted_text}
          </Text>
        )}
        <View style={styles.cardFooter}>
          <Text style={styles.cardTime}>
            {new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Filter Bar */}
      {subjects.length > 0 && (
        <View style={styles.filterBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent}>
            <TouchableOpacity
              style={[styles.filterChip, !filterSubjectId && styles.filterChipActive]}
              onPress={() => setFilterSubjectId(null)}
            >
              <Text style={[styles.filterChipText, !filterSubjectId && styles.filterChipTextActive]}>All</Text>
            </TouchableOpacity>
            {subjects.map((s) => (
              <TouchableOpacity
                key={s.id}
                style={[styles.filterChip, filterSubjectId === s.id && styles.filterChipActive]}
                onPress={() => setFilterSubjectId(filterSubjectId === s.id ? null : s.id)}
              >
                <View style={[styles.filterDot, { backgroundColor: s.color }]} />
                <Text style={[styles.filterChipText, filterSubjectId === s.id && styles.filterChipTextActive]}>
                  {s.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        renderItem={renderSession}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchSessions(); }} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>
              {filterSubjectId ? "No sessions for this subject" : "No sessions yet"}
            </Text>
            <Text style={styles.emptyText}>
              {filterSubjectId
                ? "Capture a page and assign it to this subject"
                : "Capture a page to create your first study session"}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f23" },
  filterBar: {
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a4e",
    paddingVertical: 10,
  },
  filterContent: { paddingHorizontal: 16, gap: 8 },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a2e",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: "#2a2a4e",
  },
  filterChipActive: {
    backgroundColor: "#2d5aa0",
    borderColor: "#4A90D9",
  },
  filterDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  filterChipText: { color: "#ccc", fontSize: 13 },
  filterChipTextActive: { color: "#fff", fontWeight: "600" },
  list: { padding: 16 },
  card: {
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: { color: "#fff", fontSize: 15, fontWeight: "600", flex: 1, marginRight: 10 },
  cardDate: { color: "#888", fontSize: 12 },
  subjectBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  badgeText: { color: "#999", fontSize: 11 },
  cardPreview: { color: "#aaa", fontSize: 12, marginTop: 8, lineHeight: 17 },
  cardFooter: { marginTop: 8, flexDirection: "row", justifyContent: "flex-end" },
  cardTime: { color: "#666", fontSize: 11 },
  empty: { alignItems: "center", paddingTop: 80 },
  emptyIcon: { fontSize: 40, marginBottom: 10 },
  emptyTitle: { color: "#fff", fontSize: 16, fontWeight: "600", marginBottom: 6 },
  emptyText: { color: "#888", fontSize: 13, textAlign: "center", paddingHorizontal: 40 },
});
