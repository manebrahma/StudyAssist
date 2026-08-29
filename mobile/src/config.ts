// Central configuration for the mobile app
// Change BACKEND_HOST when testing on a real device or emulator

// For Expo Go on a real device, use your computer's local IP (e.g., "192.168.1.100")
// For Android emulator: "10.0.2.2"
// For iOS simulator or web: "localhost"
const BACKEND_HOST = "localhost";
const BACKEND_PORT = 8000;

export const CONFIG = {
  BACKEND_URL: `http://${BACKEND_HOST}:${BACKEND_PORT}/api`,
  BACKEND_STATIC_URL: `http://${BACKEND_HOST}:${BACKEND_PORT}`,

  // Timeouts (ms)
  DEFAULT_TIMEOUT: 30_000,
  AI_TIMEOUT: 300_000, // 5 min for AI generation on CPU
  UPLOAD_TIMEOUT: 60_000,
};
