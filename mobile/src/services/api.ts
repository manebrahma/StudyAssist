import axios from "axios";
import {
  Subject,
  SubjectCreate,
  Topic,
  TopicCreate,
  StudySession,
  SessionCreate,
  SessionDetail,
  SessionImage,
  Message,
  AIResponse,
  HealthStatus,
} from "../types";

// Change this to your backend server IP when testing on a real device
const BASE_URL = "http://localhost:8000/api";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

// ──── Health ────
export const getHealth = () => api.get<HealthStatus>("/health").then((r) => r.data);

// ──── Subjects ────
export const getSubjects = () => api.get<Subject[]>("/subjects").then((r) => r.data);

export const createSubject = (data: SubjectCreate) =>
  api.post<Subject>("/subjects", data).then((r) => r.data);

export const deleteSubject = (id: string) => api.delete(`/subjects/${id}`);

// ──── Topics ────
export const getTopics = (subjectId: string) =>
  api.get<Topic[]>(`/subjects/${subjectId}/topics`).then((r) => r.data);

export const createTopic = (subjectId: string, data: TopicCreate) =>
  api.post<Topic>(`/subjects/${subjectId}/topics`, data).then((r) => r.data);

export const deleteTopic = (subjectId: string, topicId: string) =>
  api.delete(`/subjects/${subjectId}/topics/${topicId}`);

// ──── Sessions ────
export const getSessions = (subjectId?: string, topicId?: string) => {
  const params: Record<string, string> = {};
  if (subjectId) params.subject_id = subjectId;
  if (topicId) params.topic_id = topicId;
  return api.get<StudySession[]>("/sessions", { params }).then((r) => r.data);
};

export const createSession = (data: SessionCreate) =>
  api.post<StudySession>("/sessions", data).then((r) => r.data);

export const getSession = (id: string) =>
  api.get<SessionDetail>(`/sessions/${id}`).then((r) => r.data);

export const deleteSession = (id: string) => api.delete(`/sessions/${id}`);

// ──── Capture ────
export const captureImage = async (sessionId: string, imageUri: string) => {
  const formData = new FormData();
  formData.append("session_id", sessionId);

  const filename = imageUri.split("/").pop() || "photo.jpg";
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : "image/jpeg";

  formData.append("file", {
    uri: imageUri,
    name: filename,
    type,
  } as unknown as Blob);

  return api
    .post<SessionImage>("/capture", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 60000,
    })
    .then((r) => r.data);
};

// ──── Chat ────
export const sendMessage = (sessionId: string, message: string) =>
  api.post<Message>("/chat", { session_id: sessionId, message }).then((r) => r.data);

// ──── Explain / Summarize ────
export const explainText = (text: string, level = "simple") =>
  api.post<AIResponse>("/explain", { text, level }).then((r) => r.data);

export const summarizeText = (text: string, length = "medium") =>
  api.post<AIResponse>("/summarize", { text, length }).then((r) => r.data);

export default api;
