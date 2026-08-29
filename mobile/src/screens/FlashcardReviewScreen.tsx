import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import { Flashcard } from "../types";
import { getReviewQueue, reviewFlashcard } from "../services/api";
import FlashCard from "../components/FlashCard";

const QUALITY_LABELS = [
  { value: 0, label: "Again", desc: "Complete blackout", color: "#E74C3C" },
  { value: 1, label: "Hard", desc: "Wrong, but familiar", color: "#E67E22" },
  { value: 2, label: "Okay", desc: "Wrong, but easy recall", color: "#F39C12" },
  { value: 3, label: "Good", desc: "Correct, hard recall", color: "#F1C40F" },
  { value: 4, label: "Easy", desc: "Correct, some thought", color: "#2ECC71" },
  { value: 5, label: "Perfect", desc: "Instant recall", color: "#27AE60" },
];

export default function FlashcardReviewScreen() {
  const navigation = useNavigation();
  const [queue, setQueue] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(0);

  const fetchQueue = useCallback(async () => {
    try {
      const data = await getReviewQueue();
      setQueue(data);
      setCurrentIndex(0);
      setFlipped(false);
      setCompleted(0);
    } catch {
      // offline
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchQueue();
    }, [fetchQueue])
  );

  const handleRate = async (quality: number) => {
    const card = queue[currentIndex];
    if (!card || submitting) return;

    setSubmitting(true);
    try {
      await reviewFlashcard(card.id, quality);
      setCompleted((c) => c + 1);

      if (currentIndex < queue.length - 1) {
        setCurrentIndex((i) => i + 1);
        setFlipped(false);
      } else {
        // All done — show completion
        setCurrentIndex(queue.length);
      }
    } catch {
      // failed to submit
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4A90D9" />
      </View>
    );
  }

  if (queue.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.doneIcon}>🎉</Text>
        <Text style={styles.doneTitle}>All caught up!</Text>
        <Text style={styles.doneText}>No flashcards due for review today.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Completed all reviews
  if (currentIndex >= queue.length) {
    return (
      <View style={styles.center}>
        <Text style={styles.doneIcon}>✅</Text>
        <Text style={styles.doneTitle}>Review Complete!</Text>
        <Text style={styles.doneText}>
          You reviewed {completed} flashcard{completed !== 1 ? "s" : ""} today.
        </Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const card = queue[currentIndex];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Progress */}
      <View style={styles.progressRow}>
        <Text style={styles.progressText}>
          {currentIndex + 1} / {queue.length}
        </Text>
        <View style={styles.progressBarBg}>
          <View
            style={[styles.progressBarFill, { width: `${((currentIndex) / queue.length) * 100}%` }]}
          />
        </View>
      </View>

      {/* Flashcard */}
      <FlashCard
        front={card.front}
        back={card.back}
        flipped={flipped}
        onFlip={() => setFlipped((f) => !f)}
      />

      {/* Quality rating buttons (show after flip) */}
      {flipped && (
        <View style={styles.ratingSection}>
          <Text style={styles.ratingPrompt}>How well did you recall?</Text>
          <View style={styles.ratingGrid}>
            {QUALITY_LABELS.map((q) => (
              <TouchableOpacity
                key={q.value}
                style={[styles.ratingBtn, { borderColor: q.color }]}
                onPress={() => handleRate(q.value)}
                disabled={submitting}
              >
                <Text style={[styles.ratingLabel, { color: q.color }]}>{q.label}</Text>
                <Text style={styles.ratingDesc}>{q.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {!flipped && (
        <Text style={styles.flipHint}>Tap the card to reveal the answer</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f23" },
  content: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0f0f23", padding: 20 },
  doneIcon: { fontSize: 56, marginBottom: 16 },
  doneTitle: { color: "#fff", fontSize: 22, fontWeight: "700", marginBottom: 8 },
  doneText: { color: "#888", fontSize: 15, textAlign: "center" },
  backBtn: {
    marginTop: 24,
    backgroundColor: "#4A90D9",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 10,
  },
  backBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  progressRow: { flexDirection: "row", alignItems: "center", marginBottom: 20, gap: 12 },
  progressText: { color: "#888", fontSize: 14, fontWeight: "600", minWidth: 50 },
  progressBarBg: { flex: 1, height: 6, backgroundColor: "#1a1a2e", borderRadius: 3 },
  progressBarFill: { height: 6, backgroundColor: "#4A90D9", borderRadius: 3 },
  ratingSection: { marginTop: 24 },
  ratingPrompt: { color: "#fff", fontSize: 15, fontWeight: "600", marginBottom: 12, textAlign: "center" },
  ratingGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" },
  ratingBtn: {
    backgroundColor: "#1a1a2e",
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    width: "31%",
    alignItems: "center",
  },
  ratingLabel: { fontWeight: "700", fontSize: 14, marginBottom: 2 },
  ratingDesc: { color: "#666", fontSize: 10, textAlign: "center" },
  flipHint: { color: "#555", textAlign: "center", marginTop: 24, fontSize: 14 },
});
