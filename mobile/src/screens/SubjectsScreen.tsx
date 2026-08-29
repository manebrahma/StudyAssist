import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList, Subject, Topic } from "../types";
import { getSubjects, createSubject, deleteSubject, getTopics, createTopic, deleteTopic, getSessions } from "../services/api";

const COLORS = ["#E74C3C", "#3498DB", "#2ECC71", "#9B59B6", "#F39C12", "#1ABC9C", "#E67E22", "#34495E"];

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function SubjectsScreen() {
  const navigation = useNavigation<Nav>();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Record<string, Topic[]>>({});
  const [sessionCounts, setSessionCounts] = useState<Record<string, number>>({});
  const [newSubject, setNewSubject] = useState("");
  const [newTopic, setNewTopic] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSubjects = useCallback(async () => {
    try {
      const data = await getSubjects();
      setSubjects(data);
      // Fetch session counts per subject
      const counts: Record<string, number> = {};
      await Promise.all(
        data.map(async (s) => {
          try {
            const sessions = await getSessions(s.id);
            counts[s.id] = sessions.length;
          } catch {
            counts[s.id] = 0;
          }
        })
      );
      setSessionCounts(counts);
    } catch {
      // offline
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchSubjects();
    }, [fetchSubjects])
  );

  const handleAddSubject = async () => {
    if (!newSubject.trim()) return;
    try {
      const color = COLORS[subjects.length % COLORS.length];
      await createSubject({ name: newSubject.trim(), color });
      setNewSubject("");
      fetchSubjects();
    } catch {
      Alert.alert("Error", "Failed to create subject");
    }
  };

  const handleDeleteSubject = (id: string, name: string) => {
    Alert.alert("Delete Subject", `Delete "${name}" and all its topics?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteSubject(id);
            fetchSubjects();
          } catch {
            Alert.alert("Error", "Failed to delete subject");
          }
        },
      },
    ]);
  };

  const handleDeleteTopic = (subjectId: string, topicId: string, name: string) => {
    Alert.alert("Delete Topic", `Delete "${name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteTopic(subjectId, topicId);
            const data = await getTopics(subjectId);
            setTopics((prev) => ({ ...prev, [subjectId]: data }));
          } catch {
            Alert.alert("Error", "Failed to delete topic");
          }
        },
      },
    ]);
  };

  const toggleExpand = async (subjectId: string) => {
    if (expandedId === subjectId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(subjectId);
    if (!topics[subjectId]) {
      try {
        const data = await getTopics(subjectId);
        setTopics((prev) => ({ ...prev, [subjectId]: data }));
      } catch {
        // offline
      }
    }
  };

  const handleAddTopic = async (subjectId: string) => {
    if (!newTopic.trim()) return;
    try {
      await createTopic(subjectId, { name: newTopic.trim() });
      setNewTopic("");
      const data = await getTopics(subjectId);
      setTopics((prev) => ({ ...prev, [subjectId]: data }));
    } catch {
      Alert.alert("Error", "Failed to create topic");
    }
  };

  const renderSubject = ({ item }: { item: Subject }) => {
    const isExpanded = expandedId === item.id;
    const subjectTopics = topics[item.id] || [];
    const count = sessionCounts[item.id] || 0;

    return (
      <View style={styles.subjectCard}>
        <TouchableOpacity
          style={styles.subjectHeader}
          onPress={() => toggleExpand(item.id)}
          onLongPress={() => handleDeleteSubject(item.id, item.name)}
        >
          <View style={[styles.colorDot, { backgroundColor: item.color }]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.subjectName}>{item.name}</Text>
            <Text style={styles.sessionCount}>
              {count} {count === 1 ? "session" : "sessions"}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.viewSessionsBtn}
            onPress={() => navigation.navigate("SubjectSessions", { subjectId: item.id, subjectName: item.name })}
          >
            <Text style={styles.viewSessionsBtnText}>View</Text>
          </TouchableOpacity>
          <Text style={styles.expandIcon}>{isExpanded ? "▼" : "▶"}</Text>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.topicsList}>
            {subjectTopics.map((topic) => (
              <TouchableOpacity
                key={topic.id}
                style={styles.topicItem}
                onPress={() => navigation.navigate("SubjectSessions", { subjectId: item.id, subjectName: item.name, topicId: topic.id, topicName: topic.name })}
                onLongPress={() => handleDeleteTopic(item.id, topic.id, topic.name)}
              >
                <Text style={styles.topicName}>  {topic.name}</Text>
                <Text style={styles.topicArrow}>›</Text>
              </TouchableOpacity>
            ))}
            <View style={styles.addTopicRow}>
              <TextInput
                style={styles.topicInput}
                placeholder="Add topic..."
                placeholderTextColor="#666"
                value={newTopic}
                onChangeText={setNewTopic}
                onSubmitEditing={() => handleAddTopic(item.id)}
              />
              <TouchableOpacity
                style={styles.addTopicBtn}
                onPress={() => handleAddTopic(item.id)}
              >
                <Text style={styles.addTopicBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Add Subject */}
      <View style={styles.addRow}>
        <TextInput
          style={styles.addInput}
          placeholder="New subject (e.g. Physics, Biology)"
          placeholderTextColor="#666"
          value={newSubject}
          onChangeText={setNewSubject}
          onSubmitEditing={handleAddSubject}
        />
        <TouchableOpacity style={styles.addBtn} onPress={handleAddSubject}>
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={subjects}
        keyExtractor={(item) => item.id}
        renderItem={renderSubject}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchSubjects(); }} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📚</Text>
            <Text style={styles.emptyTitle}>No subjects yet</Text>
            <Text style={styles.emptyText}>Add your first subject above to organize your study sessions</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f23" },
  addRow: {
    flexDirection: "row",
    padding: 16,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a4e",
  },
  addInput: {
    flex: 1,
    backgroundColor: "#1a1a2e",
    color: "#fff",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  addBtn: {
    backgroundColor: "#4A90D9",
    borderRadius: 10,
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  addBtnText: { color: "#fff", fontWeight: "600" },
  list: { padding: 16 },
  subjectCard: {
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    marginBottom: 10,
    overflow: "hidden",
  },
  subjectHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
  },
  colorDot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  subjectName: { color: "#fff", fontSize: 16, fontWeight: "600" },
  sessionCount: { color: "#888", fontSize: 11, marginTop: 2 },
  viewSessionsBtn: {
    backgroundColor: "#2a2a4e",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 10,
  },
  viewSessionsBtnText: { color: "#4A90D9", fontSize: 12, fontWeight: "600" },
  expandIcon: { color: "#888", fontSize: 12 },
  topicsList: {
    paddingHorizontal: 14,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: "#2a2a4e",
  },
  topicItem: { paddingVertical: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  topicName: { color: "#ccc", fontSize: 14, flex: 1 },
  topicArrow: { color: "#666", fontSize: 16, marginLeft: 8 },
  addTopicRow: { flexDirection: "row", marginTop: 8, gap: 8 },
  topicInput: {
    flex: 1,
    backgroundColor: "#0f0f23",
    color: "#fff",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
  },
  addTopicBtn: {
    backgroundColor: "#2a2a4e",
    borderRadius: 8,
    width: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  addTopicBtnText: { color: "#4A90D9", fontSize: 18, fontWeight: "700" },
  empty: { alignItems: "center", paddingTop: 60 },
  emptyIcon: { fontSize: 40, marginBottom: 10 },
  emptyTitle: { color: "#fff", fontSize: 16, fontWeight: "600", marginBottom: 6 },
  emptyText: { color: "#888", fontSize: 13, textAlign: "center", paddingHorizontal: 40 },
});
