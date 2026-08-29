import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { RootStackParamList, Subject, Topic } from "../types";
import {
  createSession,
  captureImage,
  getSubjects,
  getTopics,
  explainText,
  generateFlashcards,
  generateQuiz,
} from "../services/api";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, "Preview">;

export default function PreviewScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { imageUri } = route.params;

  const [title, setTitle] = useState("");
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState("");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [availableTopics, setAvailableTopics] = useState<Topic[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);

  useEffect(() => {
    getSubjects().then(setSubjects).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedSubjectId) {
      getTopics(selectedSubjectId).then(setAvailableTopics).catch(() => setAvailableTopics([]));
      setSelectedTopicId(null);
    } else {
      setAvailableTopics([]);
      setSelectedTopicId(null);
    }
  }, [selectedSubjectId]);

  const processImage = async () => {
    if (!title.trim()) {
      Alert.alert("Title required", "Please enter a title for this study session.");
      return;
    }

    setProcessing(true);
    try {
      // Step 1: Create session
      setStep("Creating session...");
      const session = await createSession({
        title: title.trim(),
        subject_id: selectedSubjectId || undefined,
        topic_id: selectedTopicId || undefined,
      });

      // Step 2: Upload & OCR
      setStep("Extracting text from image...");
      const image = await captureImage(session.id, imageUri);

      const text = image.extracted_text;
      if (!text || text.trim().length < 10) {
        setStep("Done! (limited text extracted)");
        navigation.replace("SessionDetail", { sessionId: session.id });
        return;
      }

      // Step 3: Auto-generate explanation in background
      setStep("AI is explaining the content...");
      try {
        const explanation = await explainText(text);
        // Send explanation as first AI message in the session chat
        // (The explain endpoint doesn't save to session, so we send it as chat context)
      } catch {
        // Non-critical — user can still explain from SessionDetail
      }

      setStep("Done!");
      navigation.replace("SessionDetail", { sessionId: session.id });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to process image. Is the backend running?";
      Alert.alert("Processing Error", message);
    } finally {
      setProcessing(false);
      setStep("");
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Image Preview */}
      <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />

      {/* Title Input */}
      <Text style={styles.label}>Session Title</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Physics Chapter 3 - Thermodynamics"
        placeholderTextColor="#666"
        value={title}
        onChangeText={setTitle}
        editable={!processing}
      />

      {/* Subject Picker */}
      <Text style={styles.label}>Subject (optional)</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
        <TouchableOpacity
          style={[styles.chip, !selectedSubjectId && styles.chipSelected]}
          onPress={() => setSelectedSubjectId(null)}
        >
          <Text style={[styles.chipText, !selectedSubjectId && styles.chipTextSelected]}>None</Text>
        </TouchableOpacity>
        {subjects.map((s) => (
          <TouchableOpacity
            key={s.id}
            style={[styles.chip, selectedSubjectId === s.id && styles.chipSelected, { borderColor: s.color }]}
            onPress={() => setSelectedSubjectId(s.id)}
          >
            <View style={[styles.chipDot, { backgroundColor: s.color }]} />
            <Text style={[styles.chipText, selectedSubjectId === s.id && styles.chipTextSelected]}>{s.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Topic Picker */}
      {availableTopics.length > 0 && (
        <>
          <Text style={styles.label}>Topic (optional)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            <TouchableOpacity
              style={[styles.chip, !selectedTopicId && styles.chipSelected]}
              onPress={() => setSelectedTopicId(null)}
            >
              <Text style={[styles.chipText, !selectedTopicId && styles.chipTextSelected]}>None</Text>
            </TouchableOpacity>
            {availableTopics.map((t) => (
              <TouchableOpacity
                key={t.id}
                style={[styles.chip, selectedTopicId === t.id && styles.chipSelected]}
                onPress={() => setSelectedTopicId(t.id)}
              >
                <Text style={[styles.chipText, selectedTopicId === t.id && styles.chipTextSelected]}>{t.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </>
      )}

      {/* Action Buttons */}
      {processing ? (
        <View style={styles.processingContainer}>
          <ActivityIndicator size="large" color="#4A90D9" />
          <Text style={styles.processingText}>{step}</Text>
        </View>
      ) : (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.processBtn} onPress={processImage}>
            <Text style={styles.processBtnText}>📸 Process & Study</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelBtnText}>Retake</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f23" },
  content: { padding: 16 },
  image: {
    width: "100%",
    height: 350,
    borderRadius: 12,
    backgroundColor: "#1a1a2e",
    marginBottom: 20,
  },
  label: { color: "#aaa", fontSize: 13, marginBottom: 6, fontWeight: "500" },
  input: {
    backgroundColor: "#1a1a2e",
    color: "#fff",
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#2a2a4e",
  },
  actions: { gap: 12, marginTop: 8 },
  processBtn: {
    backgroundColor: "#4A90D9",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  processBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  cancelBtn: {
    backgroundColor: "#2a2a4e",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  cancelBtnText: { color: "#aaa", fontWeight: "500", fontSize: 14 },
  processingContainer: { alignItems: "center", paddingVertical: 30 },
  processingText: { color: "#4A90D9", marginTop: 12, fontSize: 14 },
  chipScroll: { marginBottom: 16 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a2e",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#2a2a4e",
  },
  chipSelected: {
    backgroundColor: "#2d5aa0",
    borderColor: "#4A90D9",
  },
  chipDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  chipText: { color: "#ccc", fontSize: 13 },
  chipTextSelected: { color: "#fff", fontWeight: "600" },
});
