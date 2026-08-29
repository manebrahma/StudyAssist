import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useFocusEffect } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList, Quiz, QuizQuestion } from "../types";
import { getSession, generateQuiz, submitQuiz } from "../services/api";

type Route = RouteProp<RootStackParamList, "Quiz">;
type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function QuizScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { sessionId } = route.params;

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [hasText, setHasText] = useState(true);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const session = await getSession(sessionId);
          setExtractedText(session.extracted_text);
          if (!session.extracted_text) {
            setHasText(false);
          }
        } catch {
          // offline
        }
      })();
    }, [sessionId])
  );

  const handleGenerate = async () => {
    if (!extractedText) {
      Alert.alert("No Text", "This session has no extracted text to generate a quiz from.");
      return;
    }

    setGenerating(true);
    try {
      const data = await generateQuiz(sessionId, extractedText, "mcq", 5);
      setQuiz(data);
      setAnswers({});
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to generate quiz";
      Alert.alert("Error", message);
    } finally {
      setGenerating(false);
    }
  };

  const handleSelectOption = (questionId: string, option: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleSubmit = async () => {
    if (!quiz) return;

    const unanswered = quiz.questions.filter((q) => !answers[q.id]);
    if (unanswered.length > 0) {
      Alert.alert("Incomplete", `Please answer all ${unanswered.length} remaining question(s).`);
      return;
    }

    setSubmitting(true);
    try {
      const answerList = quiz.questions.map((q) => ({
        question_id: q.id,
        answer: answers[q.id] || "",
      }));
      const result = await submitQuiz(quiz.id, answerList);
      navigation.replace("QuizResult", { quizId: quiz.id, result });
    } catch {
      Alert.alert("Error", "Failed to submit quiz");
    } finally {
      setSubmitting(false);
    }
  };

  const parseOptions = (q: QuizQuestion): string[] => {
    if (!q.options) return [];
    try {
      const parsed = JSON.parse(q.options);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  // Generate quiz UI
  if (!quiz) {
    return (
      <View style={styles.center}>
        {generating ? (
          <>
            <ActivityIndicator size="large" color="#4A90D9" />
            <Text style={styles.genText}>Generating quiz...</Text>
            <Text style={styles.genHint}>This may take a minute on CPU</Text>
          </>
        ) : (
          <>
            <Text style={styles.quizIcon}>❓</Text>
            <Text style={styles.genTitle}>Generate Quiz</Text>
            <Text style={styles.genDesc}>
              {hasText
                ? "Create a multiple-choice quiz from your session's extracted text."
                : "No extracted text available. Capture and process an image first."}
            </Text>
            {hasText && (
              <TouchableOpacity style={styles.generateBtn} onPress={handleGenerate}>
                <Text style={styles.generateBtnText}>Generate MCQ Quiz</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    );
  }

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = quiz.questions.length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Quiz</Text>
        <Text style={styles.headerSub}>
          {answeredCount} / {totalQuestions} answered
        </Text>
      </View>

      {/* Questions */}
      {quiz.questions.map((q, idx) => {
        const options = parseOptions(q);
        const selected = answers[q.id];

        return (
          <View key={q.id} style={styles.questionCard}>
            <Text style={styles.questionNum}>Question {idx + 1}</Text>
            <Text style={styles.questionText}>{q.question}</Text>

            {options.length > 0 ? (
              <View style={styles.optionsList}>
                {options.map((opt, oidx) => {
                  const letter = String.fromCharCode(65 + oidx);
                  const isSelected = selected === opt;
                  return (
                    <TouchableOpacity
                      key={oidx}
                      style={[styles.optionBtn, isSelected && styles.optionSelected]}
                      onPress={() => handleSelectOption(q.id, opt)}
                    >
                      <Text style={[styles.optionLetter, isSelected && styles.optionLetterSelected]}>
                        {letter}
                      </Text>
                      <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <Text style={styles.noOptions}>Short answer — type your response</Text>
            )}
          </View>
        );
      })}

      {/* Submit */}
      <TouchableOpacity
        style={[styles.submitBtn, answeredCount < totalQuestions && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitBtnText}>Submit Quiz</Text>
        )}
      </TouchableOpacity>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f23" },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0f0f23", padding: 20 },
  quizIcon: { fontSize: 56, marginBottom: 16 },
  genTitle: { color: "#fff", fontSize: 22, fontWeight: "700", marginBottom: 8 },
  genDesc: { color: "#888", fontSize: 14, textAlign: "center", paddingHorizontal: 30, marginBottom: 24 },
  genText: { color: "#fff", fontSize: 16, marginTop: 16 },
  genHint: { color: "#666", fontSize: 13, marginTop: 6 },
  generateBtn: {
    backgroundColor: "#27ae60",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  generateBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "700" },
  headerSub: { color: "#888", fontSize: 14 },
  questionCard: {
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
  },
  questionNum: { color: "#4A90D9", fontSize: 12, fontWeight: "700", marginBottom: 8, letterSpacing: 1 },
  questionText: { color: "#fff", fontSize: 15, lineHeight: 23, marginBottom: 14 },
  optionsList: { gap: 8 },
  optionBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0f0f23",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#2a2a4e",
  },
  optionSelected: {
    borderColor: "#4A90D9",
    backgroundColor: "#1e3a5f",
  },
  optionLetter: {
    color: "#666",
    fontWeight: "700",
    fontSize: 14,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#1a1a2e",
    textAlign: "center",
    lineHeight: 28,
    marginRight: 12,
  },
  optionLetterSelected: {
    backgroundColor: "#4A90D9",
    color: "#fff",
  },
  optionText: { color: "#ccc", fontSize: 14, flex: 1 },
  optionTextSelected: { color: "#fff" },
  noOptions: { color: "#666", fontSize: 13, fontStyle: "italic" },
  submitBtn: {
    backgroundColor: "#27ae60",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
