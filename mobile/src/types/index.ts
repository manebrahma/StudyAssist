// ──── Subject ────
export interface Subject {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface SubjectCreate {
  name: string;
  color?: string;
}

// ──── Topic ────
export interface Topic {
  id: string;
  subject_id: string;
  name: string;
  created_at: string;
}

export interface TopicCreate {
  name: string;
}

// ──── Study Session ────
export interface StudySession {
  id: string;
  title: string;
  subject_id: string | null;
  topic_id: string | null;
  extracted_text: string | null;
  created_at: string;
  updated_at: string;
}

export interface SessionCreate {
  title: string;
  subject_id?: string;
  topic_id?: string;
}

export interface SessionDetail extends StudySession {
  images: SessionImage[];
  messages: Message[];
}

// ──── Image ────
export interface SessionImage {
  id: string;
  session_id: string;
  file_path: string;
  extracted_text: string | null;
  ocr_method: string | null;
  created_at: string;
}

// ──── Message ────
export interface Message {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface ChatRequest {
  session_id: string;
  message: string;
}

// ──── AI Responses ────
export interface AIResponse {
  content: string;
  model: string;
}

// ──── Flashcard ────
export interface Flashcard {
  id: string;
  session_id: string;
  front: string;
  back: string;
  easiness_factor: number;
  interval: number;
  repetitions: number;
  next_review: string;
  created_at: string;
  last_reviewed: string | null;
}

// ──── Quiz ────
export interface QuizQuestion {
  id: string;
  question: string;
  options: string | null;
  question_type: string;
}

export interface Quiz {
  id: string;
  session_id: string;
  questions: QuizQuestion[];
  created_at: string;
}

export interface QuizResultQuestion {
  question_id: string;
  question: string;
  student_answer: string;
  correct_answer: string;
  is_correct: boolean;
  explanation: string;
}

export interface QuizResult {
  quiz_id: string;
  score: number;
  total_questions: number;
  correct_count: number;
  results: QuizResultQuestion[];
}

// ──── Health ────
export interface HealthStatus {
  status: string;
  version: string;
  ollama_status: string;
  database_status: string;
}

// ──── Navigation ────
export type RootTabParamList = {
  Home: undefined;
  Camera: undefined;
  Subjects: undefined;
  History: undefined;
  Progress: undefined;
};

export type RootStackParamList = {
  MainTabs: undefined;
  Preview: { imageUri: string };
  Chat: { sessionId: string; title: string };
  SessionDetail: { sessionId: string };
  SubjectSessions: { subjectId: string; subjectName: string; topicId?: string; topicName?: string };
  Flashcards: { sessionId: string };
  FlashcardReview: undefined;
  Quiz: { sessionId: string };
  QuizResult: { quizId: string; result: QuizResult };
};
