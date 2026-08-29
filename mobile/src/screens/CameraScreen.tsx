import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function CameraScreen() {
  const navigation = useNavigation<Nav>();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<"back" | "front">("back");
  const cameraRef = useRef<CameraView>(null);

  const takePicture = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (photo?.uri) {
        navigation.navigate("Preview", { imageUri: photo.uri });
      }
    } catch (err) {
      Alert.alert("Error", "Failed to take picture");
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      navigation.navigate("Preview", { imageUri: result.assets[0].uri });
    }
  };

  if (!permission) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Loading camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permIcon}>📷</Text>
        <Text style={styles.permTitle}>Camera Access Needed</Text>
        <Text style={styles.permText}>
          StudyAssist needs camera access to capture your study materials.
        </Text>
        <TouchableOpacity style={styles.permButton} onPress={requestPermission}>
          <Text style={styles.permButtonText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.galleryLink} onPress={pickImage}>
          <Text style={styles.galleryLinkText}>Or pick from gallery</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.flipBtn}
            onPress={() => setFacing((f) => (f === "back" ? "front" : "back"))}
          >
            <Text style={styles.flipText}>🔄</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom controls */}
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.galleryBtn} onPress={pickImage}>
            <Text style={styles.galleryBtnText}>🖼️</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.captureBtn} onPress={takePicture}>
            <View style={styles.captureBtnInner} />
          </TouchableOpacity>

          <View style={{ width: 50 }} />
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0f0f23",
    padding: 30,
  },
  camera: { flex: 1 },
  text: { color: "#fff", fontSize: 16 },
  // Permission screen
  permIcon: { fontSize: 60, marginBottom: 16 },
  permTitle: { color: "#fff", fontSize: 20, fontWeight: "700", marginBottom: 8 },
  permText: { color: "#aaa", fontSize: 14, textAlign: "center", marginBottom: 24 },
  permButton: {
    backgroundColor: "#4A90D9",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 10,
  },
  permButtonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  galleryLink: { marginTop: 16 },
  galleryLinkText: { color: "#4A90D9", fontSize: 14 },
  // Camera controls
  topBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 16,
    paddingTop: 50,
  },
  flipBtn: {
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 20,
    padding: 10,
  },
  flipText: { fontSize: 22 },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingBottom: 40,
    paddingTop: 20,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  galleryBtn: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  galleryBtnText: { fontSize: 24 },
  captureBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 4,
    borderColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  captureBtnInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#fff",
  },
});
