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
  PdfUploadResult,
  Message,
  AIResponse,
  Flashcard,
  Quiz,
  QuizResult,
  HealthStatus,
} from "../types";
import { CONFIG } from "../config";

const api = axios.create({
  baseURL: CONFIG.BACKEND_URL,
  timeout: CONFIG.DEFAULT_TIMEOUT,
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
      timeout: CONFIG.UPLOAD_TIMEOUT,
    })
    .then((r) => r.data);
};

// ──── Chapter PDFs ────
export const uploadChapterPdf = async (
  file: { uri: string; name: string; mimeType?: string | null },
  title: string,
  subjectId?: string,
  topicId?: string,
) => {
  const formData = new FormData();
  formData.append("title", title);
  if (subjectId) formData.append("subject_id", subjectId);
  if (topicId) formData.append("topic_id", topicId);
  formData.append("file", {
    uri: file.uri,
    name: file.name,
    type: file.mimeType || "application/pdf",
  } as unknown as Blob);

  return api
    .post<PdfUploadResult>("/documents/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: CONFIG.AI_TIMEOUT,
    })
    .then((r) => r.data);
};

// ──── Chat ────
export const sendMessage = (sessionId: string, message: string) =>
  api.post<Message>("/chat", { session_id: sessionId, message }, { timeout: CONFIG.AI_TIMEOUT }).then((r) => r.data);

// ──── Explain / Summarize ────
export const explainText = (text: string, level = "simple") =>
  api.post<AIResponse>("/explain", { text, level }, { timeout: CONFIG.AI_TIMEOUT }).then((r) => r.data);

export const summarizeText = (text: string, length = "medium") =>
  api.post<AIResponse>("/summarize", { text, length }, { timeout: CONFIG.AI_TIMEOUT }).then((r) => r.data);

// ──── Flashcards ────
export const generateFlashcards = (sessionId: string, text?: string, count = 5) =>
  api
    .post<Flashcard[]>("/flashcards/generate", { session_id: sessionId, text, count }, { timeout: CONFIG.AI_TIMEOUT })
    .then((r) => r.data);

export const getFlashcards = (params?: { session_id?: string; subject_id?: string; topic_id?: string }) =>
  api.get<Flashcard[]>("/flashcards", { params }).then((r) => r.data);

export const getReviewQueue = () =>
  api.get<Flashcard[]>("/flashcards/review").then((r) => r.data);

export const reviewFlashcard = (id: string, quality: number) =>
  api.put<Flashcard>(`/flashcards/${id}/review`, { quality }).then((r) => r.data);

export const deleteFlashcard = (id: string) => api.delete(`/flashcards/${id}`);

// ──── Quiz ────
export const generateQuiz = (sessionId: string, text: string, questionType = "mcq", count = 5) =>
  api
    .post<Quiz>("/quiz/generate", { session_id: sessionId, text, question_type: questionType, count }, { timeout: CONFIG.AI_TIMEOUT })
    .then((r) => r.data);

export const submitQuiz = (quizId: string, answers: { question_id: string; answer: string }[]) =>
  api.post<QuizResult>(`/quiz/${quizId}/submit`, { answers }).then((r) => r.data);

export const getQuizHistory = (sessionId?: string) =>
  api.get<Quiz[]>("/quiz/history", { params: sessionId ? { session_id: sessionId } : {} }).then((r) => r.data);

export default api;
