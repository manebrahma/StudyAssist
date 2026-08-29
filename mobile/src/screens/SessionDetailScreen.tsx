import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { RootStackParamList, SessionDetail } from "../types";
import { getSession } from "../services/api";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, "SessionDetail">;

export default function SessionDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { sessionId } = route.params;

  const [session, setSession] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSession = useCallback(async () => {
    try {
      const data = await getSession(sessionId);
      setSession(data);
    } catch {
      // offline
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [sessionId]);

  useFocusEffect(
    useCallback(() => {
      fetchSession();
    }, [fetchSession])
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4A90D9" />
      </View>
    );
  }

  if (!session) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Session not found</Text>
      </View>
    );
  }

  const messageCount = session.messages?.length || 0;
  const imageCount = session.images?.length || 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchSession(); }} />
      }
    >
      {/* Session Info */}
      <View style={styles.infoCard}>
        <Text style={styles.title}>{session.title}</Text>
        <Text style={styles.date}>
          Created {new Date(session.created_at).toLocaleDateString()} at{" "}
          {new Date(session.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </Text>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{imageCount}</Text>
          <Text style={styles.statLabel}>{imageCount === 1 ? "Image" : "Images"}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{messageCount}</Text>
          <Text style={styles.statLabel}>{messageCount === 1 ? "Message" : "Messages"}</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <Text style={styles.sectionTitle}>Actions</Text>
      <View style={styles.actionsGrid}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: "#2d5aa0" }]}
          onPress={() => navigation.navigate("Chat", { sessionId: session.id, title: session.title })}
        >
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={styles.actionText}>Continue Chat</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: "#8e44ad" }]}
          onPress={() => navigation.navigate("Flashcards", { sessionId: session.id })}
        >
          <Text style={styles.actionIcon}>🃏</Text>
          <Text style={styles.actionText}>Flashcards</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: "#27ae60" }]}
          onPress={() => navigation.navigate("Quiz", { sessionId: session.id })}
        >
          <Text style={styles.actionIcon}>❓</Text>
          <Text style={styles.actionText}>Take Quiz</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: "#e67e22" }]}
          onPress={() => {}}
        >
          <Text style={styles.actionIcon}>📝</Text>
          <Text style={styles.actionText}>Summarize</Text>
        </TouchableOpacity>
      </View>

      {/* Captured Images */}
      {imageCount > 0 && (
        <>
          <Text style={styles.sectionTitle}>Captured Images</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
            {session.images.map((img) => (
              <View key={img.id} style={styles.imageCard}>
                <Image
                  source={{ uri: `http://localhost:8000/${img.file_path}` }}
                  style={styles.thumbnail}
                  resizeMode="cover"
                />
                {img.ocr_method && (
                  <Text style={styles.ocrBadge}>{img.ocr_method}</Text>
                )}
              </View>
            ))}
          </ScrollView>
        </>
      )}

      {/* Extracted Text */}
      {session.extracted_text && (
        <>
          <Text style={styles.sectionTitle}>Extracted Text</Text>
          <View style={styles.textCard}>
            <Text style={styles.extractedText} numberOfLines={10}>
              {session.extracted_text}
            </Text>
          </View>
        </>
      )}

      {/* Recent Chat */}
      {messageCount > 0 && (
        <>
          <Text style={styles.sectionTitle}>Recent Chat</Text>
          {session.messages.slice(-4).map((msg) => (
            <View
              key={msg.id}
              style={[styles.messageBubble, msg.role === "user" ? styles.userBubble : styles.aiBubble]}
            >
              <Text style={styles.messageRole}>{msg.role === "user" ? "You" : "AI"}</Text>
              <Text style={styles.messageText} numberOfLines={3}>
                {msg.content}
              </Text>
            </View>
          ))}
          <TouchableOpacity
            style={styles.viewAllBtn}
            onPress={() => navigation.navigate("Chat", { sessionId: session.id, title: session.title })}
          >
            <Text style={styles.viewAllText}>View full chat →</Text>
          </TouchableOpacity>
        </>
      )}

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f23" },
  content: { padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0f0f23" },
  errorText: { color: "#E74C3C", fontSize: 16 },
  infoCard: {
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  title: { color: "#fff", fontSize: 20, fontWeight: "700", marginBottom: 6 },
  date: { color: "#888", fontSize: 12 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1,
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  statNumber: { color: "#4A90D9", fontSize: 24, fontWeight: "700" },
  statLabel: { color: "#888", fontSize: 12, marginTop: 4 },
  sectionTitle: { color: "#fff", fontSize: 16, fontWeight: "700", marginBottom: 10, marginTop: 8 },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },
  actionBtn: {
    width: "47%",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  actionIcon: { fontSize: 24, marginBottom: 6 },
  actionText: { color: "#fff", fontWeight: "600", fontSize: 13 },
  imageScroll: { marginBottom: 16 },
  imageCard: { marginRight: 10, position: "relative" },
  thumbnail: {
    width: 140,
    height: 100,
    borderRadius: 10,
    backgroundColor: "#2a2a4e",
  },
  ocrBadge: {
    position: "absolute",
    bottom: 6,
    right: 6,
    backgroundColor: "rgba(0,0,0,0.7)",
    color: "#4A90D9",
    fontSize: 9,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: "hidden",
  },
  textCard: {
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  extractedText: { color: "#ccc", fontSize: 13, lineHeight: 20 },
  messageBubble: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    maxWidth: "90%",
  },
  userBubble: {
    backgroundColor: "#2d5aa0",
    alignSelf: "flex-end",
  },
  aiBubble: {
    backgroundColor: "#1a1a2e",
    alignSelf: "flex-start",
  },
  messageRole: { color: "#999", fontSize: 10, marginBottom: 4 },
  messageText: { color: "#fff", fontSize: 13, lineHeight: 18 },
  viewAllBtn: {
    alignItems: "center",
    paddingVertical: 10,
  },
  viewAllText: { color: "#4A90D9", fontSize: 14, fontWeight: "600" },
});
