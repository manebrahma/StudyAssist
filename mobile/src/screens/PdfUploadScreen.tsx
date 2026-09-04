import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { RootStackParamList, Subject, Topic } from "../types";
import { getSubjects, getTopics, uploadChapterPdf } from "../services/api";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function PdfUploadScreen() {
  const navigation = useNavigation<Nav>();
  const [document, setDocument] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [title, setTitle] = useState("");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [topicId, setTopicId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState("");

  useEffect(() => {
    getSubjects().then(setSubjects).catch(() => {});
  }, []);

  useEffect(() => {
    setTopicId(null);
    if (subjectId) {
      getTopics(subjectId).then(setTopics).catch(() => setTopics([]));
    } else {
      setTopics([]);
    }
  }, [subjectId]);

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: "application/pdf",
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;
    const selected = result.assets[0];
    setDocument(selected);
    if (!title.trim()) setTitle(selected.name.replace(/\.pdf$/i, ""));
  };

  const handleUpload = async () => {
    if (!document) {
      Alert.alert("Select a PDF", "Choose a text-based chapter PDF first.");
      return;
    }
    if (!title.trim()) {
      Alert.alert("Title required", "Enter a chapter title.");
      return;
    }

    setUploading(true);
    try {
      setProgress("Uploading chapter PDF...");
      setProgress("Extracting chapter text and generating study material...");
      const result = await uploadChapterPdf(document, title.trim(), subjectId || undefined, topicId || undefined);
      setProgress("Done");
      navigation.replace("SessionDetail", { sessionId: result.session.id });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Could not process the PDF.";
      Alert.alert("PDF import failed", message);
    } finally {
      setUploading(false);
      setProgress("");
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.filePicker} onPress={pickDocument} disabled={uploading}>
        <Text style={styles.fileIcon}>PDF</Text>
        <Text style={styles.fileTitle}>{document ? document.name : "Select chapter PDF"}</Text>
        <Text style={styles.fileMeta}>
          {document?.size ? `${Math.ceil(document.size / 1024)} KB` : "Text-based PDF, up to 25 MB / 100 pages"}
        </Text>
      </TouchableOpacity>

      <Text style={styles.label}>Chapter title</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="e.g. Biology Chapter 4"
        placeholderTextColor="#666"
        editable={!uploading}
      />

      <Text style={styles.label}>Subject</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
        <TouchableOpacity style={[styles.chip, !subjectId && styles.chipSelected]} onPress={() => setSubjectId(null)}>
          <Text style={[styles.chipText, !subjectId && styles.chipTextSelected]}>None</Text>
        </TouchableOpacity>
        {subjects.map((subject) => (
          <TouchableOpacity
            key={subject.id}
            style={[styles.chip, subjectId === subject.id && styles.chipSelected]}
            onPress={() => setSubjectId(subject.id)}
          >
            <Text style={[styles.chipText, subjectId === subject.id && styles.chipTextSelected]}>{subject.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {topics.length > 0 && (
        <>
          <Text style={styles.label}>Topic</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
            <TouchableOpacity style={[styles.chip, !topicId && styles.chipSelected]} onPress={() => setTopicId(null)}>
              <Text style={[styles.chipText, !topicId && styles.chipTextSelected]}>None</Text>
            </TouchableOpacity>
            {topics.map((topic) => (
              <TouchableOpacity
                key={topic.id}
                style={[styles.chip, topicId === topic.id && styles.chipSelected]}
                onPress={() => setTopicId(topic.id)}
              >
                <Text style={[styles.chipText, topicId === topic.id && styles.chipTextSelected]}>{topic.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </>
      )}

      {uploading ? (
        <View style={styles.progress}>
          <ActivityIndicator size="large" color="#4A90D9" />
          <Text style={styles.progressText}>{progress}</Text>
          <Text style={styles.progressHint}>Generation may take several minutes on local CPU.</Text>
        </View>
      ) : (
        <TouchableOpacity style={styles.importButton} onPress={handleUpload}>
          <Text style={styles.importButtonText}>Create Flashcards and Quiz</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f23" },
  content: { padding: 16, paddingBottom: 36 },
  filePicker: { backgroundColor: "#1a1a2e", borderWidth: 1, borderColor: "#2d5aa0", borderRadius: 12, padding: 22, alignItems: "center", marginBottom: 22 },
  fileIcon: { color: "#E74C3C", fontWeight: "800", fontSize: 18, marginBottom: 8 },
  fileTitle: { color: "#fff", fontWeight: "600", fontSize: 15, textAlign: "center" },
  fileMeta: { color: "#888", fontSize: 12, marginTop: 6, textAlign: "center" },
  label: { color: "#aaa", fontSize: 13, fontWeight: "500", marginBottom: 7 },
  input: { backgroundColor: "#1a1a2e", color: "#fff", borderRadius: 10, padding: 14, fontSize: 15, marginBottom: 18 },
  chips: { marginBottom: 18 },
  chip: { borderWidth: 1, borderColor: "#3a3a58", borderRadius: 16, paddingHorizontal: 13, paddingVertical: 8, marginRight: 8 },
  chipSelected: { backgroundColor: "#2d5aa0", borderColor: "#4A90D9" },
  chipText: { color: "#aaa", fontSize: 13 },
  chipTextSelected: { color: "#fff", fontWeight: "600" },
  progress: { alignItems: "center", paddingVertical: 28 },
  progressText: { color: "#fff", fontSize: 15, marginTop: 14, textAlign: "center" },
  progressHint: { color: "#777", fontSize: 12, textAlign: "center", marginTop: 8 },
  importButton: { backgroundColor: "#27ae60", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 8 },
  importButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});