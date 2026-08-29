import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import { RootStackParamList, Message } from "../types";
import { getSession, sendMessage } from "../services/api";

type Route = RouteProp<RootStackParamList, "Chat">;

export default function ChatScreen() {
  const route = useRoute<Route>();
  const { sessionId } = route.params;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadSession();
  }, []);

  const loadSession = async () => {
    try {
      const session = await getSession(sessionId);
      setMessages(session.messages);
      setExtractedText(session.extracted_text);
    } catch {
      // Handle error
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;

    setInput("");
    setSending(true);

    // Optimistic UI: show user message immediately
    const tempUserMsg: Message = {
      id: `temp-${Date.now()}`,
      session_id: sessionId,
      role: "user",
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const response = await sendMessage(sessionId, text);
      // Replace temp message and add AI response
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempUserMsg.id),
        { ...tempUserMsg, id: `user-${Date.now()}` },
        response,
      ]);
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === "user";
    return (
      <View style={[styles.msgRow, isUser && styles.msgRowUser]}>
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
          <Text style={[styles.msgText, isUser && styles.msgTextUser]}>{item.content}</Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      {/* Extracted text banner */}
      {extractedText && messages.length === 0 && (
        <View style={styles.extractedBanner}>
          <Text style={styles.extractedTitle}>📄 Extracted Text</Text>
          <Text style={styles.extractedText} numberOfLines={4}>
            {extractedText}
          </Text>
          <Text style={styles.extractedHint}>
            Ask a question about this content below!
          </Text>
        </View>
      )}

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        ListEmptyComponent={
          !extractedText ? (
            <View style={styles.emptyChat}>
              <Text style={styles.emptyChatIcon}>💬</Text>
              <Text style={styles.emptyChatText}>
                Ask a question about your study material
              </Text>
            </View>
          ) : null
        }
      />

      {/* Sending indicator */}
      {sending && (
        <View style={styles.typingRow}>
          <ActivityIndicator size="small" color="#4A90D9" />
          <Text style={styles.typingText}>AI is thinking...</Text>
        </View>
      )}

      {/* Input bar */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.textInput}
          placeholder="Ask about your material..."
          placeholderTextColor="#666"
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={5000}
          editable={!sending}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!input.trim() || sending}
        >
          <Text style={styles.sendBtnText}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f23" },
  messagesList: { padding: 16, paddingBottom: 8 },
  msgRow: { marginBottom: 12 },
  msgRowUser: { alignItems: "flex-end" },
  bubble: { maxWidth: "80%", borderRadius: 14, padding: 12 },
  bubbleUser: { backgroundColor: "#4A90D9", borderBottomRightRadius: 4 },
  bubbleAI: { backgroundColor: "#1a1a2e", borderBottomLeftRadius: 4 },
  msgText: { color: "#ddd", fontSize: 14, lineHeight: 20 },
  msgTextUser: { color: "#fff" },
  extractedBanner: {
    backgroundColor: "#1a2a3e",
    margin: 16,
    marginBottom: 0,
    padding: 14,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: "#4A90D9",
  },
  extractedTitle: { color: "#fff", fontWeight: "600", marginBottom: 6 },
  extractedText: { color: "#aaa", fontSize: 13, lineHeight: 18 },
  extractedHint: { color: "#4A90D9", fontSize: 12, marginTop: 8 },
  emptyChat: { alignItems: "center", paddingTop: 60 },
  emptyChatIcon: { fontSize: 40, marginBottom: 10 },
  emptyChatText: { color: "#666", fontSize: 14 },
  typingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 8,
    gap: 8,
  },
  typingText: { color: "#4A90D9", fontSize: 13 },
  inputBar: {
    flexDirection: "row",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#2a2a4e",
    backgroundColor: "#1a1a2e",
    alignItems: "flex-end",
  },
  textInput: {
    flex: 1,
    backgroundColor: "#0f0f23",
    color: "#fff",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
    marginRight: 8,
  },
  sendBtn: {
    backgroundColor: "#4A90D9",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { color: "#fff", fontSize: 18 },
});
