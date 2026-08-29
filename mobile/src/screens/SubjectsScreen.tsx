import React, { useState, useEffect, useCallback } from "react";
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
import { Subject, Topic } from "../types";
import { getSubjects, createSubject, deleteSubject, getTopics, createTopic } from "../services/api";

const COLORS = ["#E74C3C", "#3498DB", "#2ECC71", "#9B59B6", "#F39C12", "#1ABC9C", "#E67E22", "#34495E"];

export default function SubjectsScreen() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Record<string, Topic[]>>({});
  const [newSubject, setNewSubject] = useState("");
  const [newTopic, setNewTopic] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSubjects = useCallback(async () => {
    try {
      const data = await getSubjects();
      setSubjects(data);
    } catch {
      // offline
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

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

    return (
      <View style={styles.subjectCard}>
        <TouchableOpacity
          style={styles.subjectHeader}
          onPress={() => toggleExpand(item.id)}
          onLongPress={() => handleDeleteSubject(item.id, item.name)}
        >
          <View style={[styles.colorDot, { backgroundColor: item.color }]} />
          <Text style={styles.subjectName}>{item.name}</Text>
          <Text style={styles.expandIcon}>{isExpanded ? "▼" : "▶"}</Text>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.topicsList}>
            {subjectTopics.map((topic) => (
              <View key={topic.id} style={styles.topicItem}>
                <Text style={styles.topicName}>  {topic.name}</Text>
              </View>
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
  subjectName: { color: "#fff", fontSize: 16, fontWeight: "600", flex: 1 },
  expandIcon: { color: "#888", fontSize: 12 },
  topicsList: {
    paddingHorizontal: 14,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: "#2a2a4e",
  },
  topicItem: { paddingVertical: 8 },
  topicName: { color: "#ccc", fontSize: 14 },
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
