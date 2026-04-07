import apiClient from "./apiClient";

/* ============================================================
   DTOs (MATCH BACKEND)
============================================================ */

export interface ChatRequest {
  message: string;
}

export interface ChatResponse {
  reply: string;
}

/* ============================================================
   SEND CHAT MESSAGE
============================================================ */

export const sendChatMessage = async (
  message: string
): Promise<ChatResponse> => {
  try {
    console.log("[aiChatService] Sending message:", message);

    const payload: ChatRequest = { message };

    const response = await apiClient.post<ChatResponse>(
      "/api/chat",
      payload
    );

    console.log("🤖 AI Reply:", response.data.reply);

    return response.data;

  } catch (error: any) {
    console.error(
      "❌ AI Chat failed:",
      error.response?.data || error.message
    );
    throw error;
  }
};
