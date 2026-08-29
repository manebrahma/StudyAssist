import React, { useState } from "react";
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
import { RootStackParamList } from "../types";
import { createSession, captureImage } from "../services/api";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, "Preview">;

export default function PreviewScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { imageUri } = route.params;

  const [title, setTitle] = useState("");
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState("");

  const processImage = async () => {
    if (!title.trim()) {
      Alert.alert("Title required", "Please enter a title for this study session.");
      return;
    }

    setProcessing(true);
    try {
      // Step 1: Create session
      setStep("Creating session...");
      const session = await createSession({ title: title.trim() });

      // Step 2: Upload & process image
      setStep("Extracting text from image...");
      await captureImage(session.id, imageUri);

      setStep("Done!");

      // Navigate to chat screen
      navigation.replace("Chat", { sessionId: session.id, title: session.title });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to process image. Is the backend running?";
      Alert.alert("Error", message);
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
  actions: { gap: 12 },
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
});
