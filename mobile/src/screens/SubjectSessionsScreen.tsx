import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { RootStackParamList, StudySession } from "../types";
import { getSessions, deleteSession } from "../services/api";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, "SubjectSessions">;

export default function SubjectSessionsScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { subjectId, topicId } = route.params;

  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSessions = useCallback(async () => {
    try {
      const data = await getSessions(subjectId, topicId);
      setSessions(data);
    } catch {
      // offline
    } finally {
      setRefreshing(false);
    }
  }, [subjectId, topicId]);

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

  const renderSession = ({ item }: { item: StudySession }) => (
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

  return (
    <View style={styles.container}>
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
            <Text style={styles.emptyIcon}>📂</Text>
            <Text style={styles.emptyTitle}>No sessions yet</Text>
            <Text style={styles.emptyText}>
              Capture a page and assign it to this subject to see sessions here
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f23" },
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
  cardPreview: { color: "#aaa", fontSize: 12, marginTop: 8, lineHeight: 17 },
  cardFooter: { marginTop: 8, flexDirection: "row", justifyContent: "flex-end" },
  cardTime: { color: "#666", fontSize: 11 },
  empty: { alignItems: "center", paddingTop: 80 },
  emptyIcon: { fontSize: 40, marginBottom: 10 },
  emptyTitle: { color: "#fff", fontSize: 16, fontWeight: "600", marginBottom: 6 },
  emptyText: { color: "#888", fontSize: 13, textAlign: "center", paddingHorizontal: 40 },
});
