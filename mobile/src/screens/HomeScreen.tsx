import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList, StudySession, HealthStatus } from "../types";
import { getSessions, getHealth, getReviewQueue } from "../services/api";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [reviewCount, setReviewCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [sessionsData, healthData] = await Promise.all([
        getSessions(),
        getHealth(),
      ]);
      setSessions(sessionsData);
      setHealth(healthData);
      // Fetch review count (non-blocking)
      getReviewQueue().then((q) => setReviewCount(q.length)).catch(() => {});
    } catch {
      setHealth(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4A90D9" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Status Banner */}
      <View style={[styles.statusBanner, { backgroundColor: health ? "#1e3a2f" : "#3a1e1e" }]}>
        <Text style={styles.statusDot}>{health ? "🟢" : "🔴"}</Text>
        <Text style={styles.statusText}>
          {health
            ? `Backend connected · AI: ${health.ollama_status}`
            : "Backend offline — start the server"}
        </Text>
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: "#2d5aa0" }]}
          onPress={() => navigation.navigate("MainTabs")}
        >
          <Text style={styles.actionIcon}>📷</Text>
          <Text style={styles.actionText}>Capture</Text>
          <Text style={styles.actionSub}>Snap a photo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: "#8e44ad" }]}
          onPress={() => navigation.navigate("FlashcardReview")}
        >
          <Text style={styles.actionIcon}>🃏</Text>
          <Text style={styles.actionText}>Review</Text>
          <Text style={styles.actionSub}>
            {reviewCount > 0 ? `${reviewCount} card${reviewCount !== 1 ? "s" : ""} due` : "All caught up"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: "#27ae60" }]}
          onPress={() => {}}
        >
          <Text style={styles.actionIcon}>❓</Text>
          <Text style={styles.actionText}>Quiz</Text>
          <Text style={styles.actionSub}>Practice test</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Sessions */}
      <Text style={styles.sectionTitle}>Recent Sessions</Text>
      {sessions.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>📸</Text>
          <Text style={styles.emptyTitle}>No study sessions yet</Text>
          <Text style={styles.emptyText}>
            Capture your first page to get started!
          </Text>
        </View>
      ) : (
        sessions.slice(0, 5).map((session) => (
          <TouchableOpacity
            key={session.id}
            style={styles.sessionCard}
            onPress={() =>
              navigation.navigate("SessionDetail", {
                sessionId: session.id,
              })
            }
          >
            <View style={styles.sessionHeader}>
              <Text style={styles.sessionTitle}>{session.title}</Text>
              <Text style={styles.sessionDate}>
                {new Date(session.created_at).toLocaleDateString()}
              </Text>
            </View>
            {session.extracted_text && (
              <Text style={styles.sessionPreview} numberOfLines={2}>
                {session.extracted_text}
              </Text>
            )}
          </TouchableOpacity>
        ))
      )}

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f23", padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0f0f23" },
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
  },
  statusDot: { fontSize: 12, marginRight: 8 },
  statusText: { color: "#ccc", fontSize: 13 },
  sectionTitle: { color: "#fff", fontSize: 18, fontWeight: "700", marginBottom: 12, marginTop: 8 },
  actionsRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  actionCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  actionIcon: { fontSize: 28, marginBottom: 6 },
  actionText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  actionSub: { color: "rgba(255,255,255,0.6)", fontSize: 11, marginTop: 2 },
  emptyCard: {
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    padding: 30,
    alignItems: "center",
  },
  emptyIcon: { fontSize: 40, marginBottom: 10 },
  emptyTitle: { color: "#fff", fontSize: 16, fontWeight: "600", marginBottom: 6 },
  emptyText: { color: "#888", fontSize: 13, textAlign: "center" },
  sessionCard: {
    backgroundColor: "#1a1a2e",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  sessionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sessionTitle: { color: "#fff", fontSize: 15, fontWeight: "600", flex: 1 },
  sessionDate: { color: "#888", fontSize: 12 },
  sessionPreview: { color: "#aaa", fontSize: 12, marginTop: 6 },
});
