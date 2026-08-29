import React, { useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native";

const { width } = Dimensions.get("window");

interface FlashCardProps {
  front: string;
  back: string;
  flipped: boolean;
  onFlip: () => void;
}

export default function FlashCard({ front, back, flipped, onFlip }: FlashCardProps) {
  const flipAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.spring(flipAnim, {
      toValue: flipped ? 1 : 0,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();
  }, [flipped]);

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["180deg", "360deg"],
  });

  const frontOpacity = flipAnim.interpolate({
    inputRange: [0, 0.5, 0.5, 1],
    outputRange: [1, 1, 0, 0],
  });

  const backOpacity = flipAnim.interpolate({
    inputRange: [0, 0.5, 0.5, 1],
    outputRange: [0, 0, 1, 1],
  });

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onFlip} style={styles.container}>
      {/* Front */}
      <Animated.View
        style={[
          styles.card,
          styles.front,
          { transform: [{ rotateY: frontInterpolate }], opacity: frontOpacity },
        ]}
      >
        <Text style={styles.label}>QUESTION</Text>
        <Text style={styles.text}>{front}</Text>
        <Text style={styles.hint}>Tap to reveal</Text>
      </Animated.View>

      {/* Back */}
      <Animated.View
        style={[
          styles.card,
          styles.back,
          { transform: [{ rotateY: backInterpolate }], opacity: backOpacity },
        ]}
      >
        <Text style={styles.label}>ANSWER</Text>
        <Text style={styles.text}>{back}</Text>
        <Text style={styles.hint}>Rate your recall below</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: width - 40,
    height: 280,
    alignSelf: "center",
  },
  card: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: 16,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
    backfaceVisibility: "hidden",
  },
  front: {
    backgroundColor: "#1e3a5f",
    borderWidth: 1,
    borderColor: "#2d5aa0",
  },
  back: {
    backgroundColor: "#1a3a2e",
    borderWidth: 1,
    borderColor: "#27ae60",
  },
  label: {
    position: "absolute",
    top: 16,
    left: 20,
    color: "#666",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  text: {
    color: "#fff",
    fontSize: 17,
    textAlign: "center",
    lineHeight: 26,
  },
  hint: {
    position: "absolute",
    bottom: 16,
    color: "#555",
    fontSize: 12,
  },
});
