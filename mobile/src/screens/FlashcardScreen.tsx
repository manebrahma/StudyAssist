import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import { useFocusEffect } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import { RootStackParamList, Flashcard } from "../types";
import { getFlashcards, deleteFlashcard } from "../services/api";

type Route = RouteProp<RootStackParamList, "Flashcards">;

export default function FlashcardScreen() {
  const route = useRoute<Route>();
  const { sessionId } = route.params;

  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchCards = useCallback(async () => {
    try {
      const data = await getFlashcards({ session_id: sessionId });
      setCards(data);
    } catch {
      // offline
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useFocusEffect(
    useCallback(() => {
      fetchCards();
    }, [fetchCards])
  );

  const handleDelete = (id: string) => {
    Alert.alert("Delete Flashcard", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteFlashcard(id);
            setCards((prev) => prev.filter((c) => c.id !== id));
          } catch {
            Alert.alert("Error", "Failed to delete flashcard");
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4A90D9" />
      </View>
    );
  }

  if (cards.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyIcon}>🃏</Text>
        <Text style={styles.emptyText}>No flashcards yet</Text>
        <Text style={styles.emptyHint}>
          Generate flashcards from your session's extracted text
        </Text>
      </View>
    );
  }

  const renderCard = ({ item }: { item: Flashcard }) => {
    const isExpanded = expanded === item.id;
    const dueDate = new Date(item.next_review);
    const isOverdue = dueDate <= new Date();

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => setExpanded(isExpanded ? null : item.id)}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardFront} numberOfLines={isExpanded ? undefined : 2}>
            {item.front}
          </Text>
          {isOverdue && <View style={styles.dueBadge}><Text style={styles.dueText}>Due</Text></View>}
        </View>

        {isExpanded && (
          <View style={styles.cardBody}>
            <View style={styles.divider} />
            <Text style={styles.cardBack}>{item.back}</Text>
            <View style={styles.cardMeta}>
              <Text style={styles.metaText}>
                EF: {item.easiness_factor.toFixed(1)} · Interval: {item.interval}d · Reps: {item.repetitions}
              </Text>
              <Text style={styles.metaText}>
                Next review: {dueDate.toLocaleDateString()}
              </Text>
            </View>
            <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.count}>{cards.length} flashcard{cards.length !== 1 ? "s" : ""}</Text>
      </View>
      <FlatList
        data={cards}
        keyExtractor={(item) => item.id}
        renderItem={renderCard}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f23" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0f0f23" },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: "#fff", fontSize: 18, fontWeight: "600" },
  emptyHint: { color: "#666", fontSize: 14, marginTop: 6, textAlign: "center", paddingHorizontal: 40 },
  header: { padding: 16, paddingBottom: 8 },
  count: { color: "#888", fontSize: 14 },
  list: { paddingHorizontal: 16, paddingBottom: 20 },
  card: {
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: "#8e44ad",
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  cardFront: { color: "#fff", fontSize: 15, fontWeight: "600", flex: 1 },
  dueBadge: {
    backgroundColor: "#E74C3C",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  dueText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  cardBody: { marginTop: 10 },
  divider: { height: 1, backgroundColor: "#2a2a4e", marginBottom: 10 },
  cardBack: { color: "#a8d8a8", fontSize: 14, lineHeight: 22 },
  cardMeta: { marginTop: 12, gap: 2 },
  metaText: { color: "#555", fontSize: 11 },
  deleteBtn: { alignSelf: "flex-end", marginTop: 8, padding: 6 },
  deleteText: { color: "#E74C3C", fontSize: 12, fontWeight: "600" },
});
