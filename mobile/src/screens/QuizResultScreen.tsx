import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../types";

type Route = RouteProp<RootStackParamList, "QuizResult">;

export default function QuizResultScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation();
  const { result } = route.params;

  const scoreColor =
    result.score >= 80 ? "#27AE60" : result.score >= 50 ? "#F39C12" : "#E74C3C";

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Score Card */}
      <View style={styles.scoreCard}>
        <Text style={styles.scoreIcon}>
          {result.score >= 80 ? "🏆" : result.score >= 50 ? "📝" : "📖"}
        </Text>
        <Text style={[styles.scorePercent, { color: scoreColor }]}>
          {Math.round(result.score)}%
        </Text>
        <Text style={styles.scoreDetail}>
          {result.correct_count} of {result.total_questions} correct
        </Text>
        <Text style={styles.scoreMessage}>
          {result.score >= 80
            ? "Excellent work! Keep it up!"
            : result.score >= 50
            ? "Good effort! Review the wrong answers."
            : "Keep studying — you'll improve!"}
        </Text>
      </View>

      {/* Results Breakdown */}
      <Text style={styles.sectionTitle}>Review Answers</Text>
      {result.results.map((r, idx) => (
        <View
          key={r.question_id}
          style={[styles.resultCard, { borderLeftColor: r.is_correct ? "#27AE60" : "#E74C3C" }]}
        >
          <View style={styles.resultHeader}>
            <Text style={styles.resultNum}>Q{idx + 1}</Text>
            <Text style={[styles.resultBadge, { backgroundColor: r.is_correct ? "#27AE60" : "#E74C3C" }]}>
              {r.is_correct ? "Correct" : "Wrong"}
            </Text>
          </View>
          <Text style={styles.resultQuestion}>{r.question}</Text>

          {!r.is_correct && (
            <View style={styles.answerRow}>
              <Text style={styles.answerLabel}>Your answer:</Text>
              <Text style={styles.answerWrong}>{r.student_answer || "(no answer)"}</Text>
            </View>
          )}
          <View style={styles.answerRow}>
            <Text style={styles.answerLabel}>Correct answer:</Text>
            <Text style={styles.answerCorrect}>{r.correct_answer}</Text>
          </View>

          {r.explanation ? (
            <View style={styles.explanationBox}>
              <Text style={styles.explanationText}>{r.explanation}</Text>
            </View>
          ) : null}
        </View>
      ))}

      {/* Actions */}
      <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.doneBtnText}>Done</Text>
      </TouchableOpacity>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f23" },
  content: { padding: 16, paddingBottom: 40 },
  scoreCard: {
    backgroundColor: "#1a1a2e",
    borderRadius: 16,
    padding: 28,
    alignItems: "center",
    marginBottom: 20,
  },
  scoreIcon: { fontSize: 48, marginBottom: 8 },
  scorePercent: { fontSize: 48, fontWeight: "800", marginBottom: 4 },
  scoreDetail: { color: "#888", fontSize: 15, marginBottom: 8 },
  scoreMessage: { color: "#ccc", fontSize: 14, textAlign: "center" },
  sectionTitle: { color: "#fff", fontSize: 17, fontWeight: "700", marginBottom: 12 },
  resultCard: {
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 3,
  },
  resultHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  resultNum: { color: "#888", fontSize: 13, fontWeight: "700" },
  resultBadge: {
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  resultQuestion: { color: "#fff", fontSize: 14, lineHeight: 21, marginBottom: 10 },
  answerRow: { flexDirection: "row", gap: 6, marginBottom: 4, flexWrap: "wrap" },
  answerLabel: { color: "#666", fontSize: 13 },
  answerWrong: { color: "#E74C3C", fontSize: 13, fontWeight: "600" },
  answerCorrect: { color: "#27AE60", fontSize: 13, fontWeight: "600" },
  explanationBox: {
    backgroundColor: "#0f0f23",
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
  },
  explanationText: { color: "#aaa", fontSize: 13, lineHeight: 20 },
  doneBtn: {
    backgroundColor: "#4A90D9",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 12,
  },
  doneBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
