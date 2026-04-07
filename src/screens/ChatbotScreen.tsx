// ------------------------------------------------------
//  MyDairy — AI Chatbot (Backend Integrated)
//  ✔ Hooks-safe
//  ✔ JWT secured
//  ✔ Real Groq response
// ------------------------------------------------------

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  FlatList,
  Platform,
  LayoutAnimation,
  UIManager,
  Animated,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import apiClient from "../services/apiClient"; // ✅ USE SAME apiClient

// Enable LayoutAnimation on Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/* =====================================================
   TYPES
===================================================== */

type ChatMessage = {
  id: string;
  from: "user" | "bot";
  text: string;
  streaming?: boolean;
};

/* =====================================================
   Typing Dots (OUTSIDE COMPONENT — FIXED)
===================================================== */

const TypingDots: React.FC = () => {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animate = (dot: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0.3,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    animate(dot1, 0);
    animate(dot2, 200);
    animate(dot3, 400);
  }, []);

  return (
    <View style={styles.dotsRow}>
      <Animated.View style={[styles.dot, { opacity: dot1 }]} />
      <Animated.View style={[styles.dot, { opacity: dot2 }]} />
      <Animated.View style={[styles.dot, { opacity: dot3 }]} />
    </View>
  );
};

/* =====================================================
   MAIN SCREEN
===================================================== */

const ChatbotScreen = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      from: "bot",
      text: "नमस्ते 👋\nमैं आपका MyDairy AI Assistant हूँ।",
    },
  ]);

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const listRef = useRef<FlatList>(null);

  const scrollToBottom = () =>
    listRef.current?.scrollToEnd({ animated: true });

  const pushMessage = (msg: ChatMessage) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setMessages((prev) => [...prev, msg]);
  };

  /* =====================================================
     STREAMING BOT TEXT
  ===================================================== */

  const streamBotReply = useCallback((fullText: string) => {
    setIsTyping(true);

    const id = Date.now().toString();
    pushMessage({
      id,
      from: "bot",
      text: "",
      streaming: true,
    });

    let index = 0;
    const interval = setInterval(() => {
      index += 3;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === id ? { ...m, text: fullText.slice(0, index) } : m
        )
      );
      scrollToBottom();

      if (index >= fullText.length) {
        clearInterval(interval);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === id ? { ...m, streaming: false } : m
          )
        );
        setIsTyping(false);
      }
    }, 30);
  }, []);

  /* =====================================================
     BACKEND AI CALL
  ===================================================== */

  const askBackendAI = async (question: string) => {
    try {
      setIsTyping(true);

      const res = await apiClient.post("/chat", {
        message: question,
      });

      streamBotReply(res.data.reply);
    } catch (err: any) {
      console.error("AI error:", err);
      streamBotReply("❌ AI service temporarily unavailable.");
    }
  };

  /* =====================================================
     SEND MESSAGE
  ===================================================== */

  const handleSend = () => {
    if (!input.trim()) return;

    const text = input.trim();
    setInput("");

    pushMessage({
      id: Date.now().toString(),
      from: "user",
      text,
    });

    scrollToBottom();
    askBackendAI(text);
  };

  /* =====================================================
     RENDER MESSAGE
  ===================================================== */

  const renderItem = ({ item }: { item: ChatMessage }) => {
    const isUser = item.from === "user";

    return (
      <View
        style={{
          alignItems: isUser ? "flex-end" : "flex-start",
          marginVertical: 6,
        }}
      >
        {!isUser && (
          <View style={styles.botRow}>
            <View style={styles.botAvatar}>
              <Text>🤖</Text>
            </View>
            <View style={styles.botBubble}>
              <Text style={styles.botText}>{item.text}</Text>
            </View>
          </View>
        )}

        {isUser && (
          <View style={styles.userBubble}>
            <Text style={styles.userText}>{item.text}</Text>
          </View>
        )}
      </View>
    );
  };

  /* =====================================================
     UI
  ===================================================== */

  return (
    <LinearGradient colors={["#E3F2FF", "#F8FBFF"]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.card}>
          <Text style={styles.header}>AI Assistant</Text>

          <FlatList
            ref={listRef}
            data={messages}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={
              isTyping ? (
                <View style={styles.typingBubble}>
                  <TypingDots />
                </View>
              ) : null
            }
          />
        </View>

        {/* INPUT */}
        <View style={styles.inputWrapper}>
          <View style={styles.inputCard}>
            <TextInput
              style={styles.input}
              placeholder="Ask anything..."
              value={input}
              onChangeText={setInput}
              placeholderTextColor="#94A3C7"
            />
            <Pressable onPress={handleSend}>
              <LinearGradient
                colors={["#4797FF", "#2F73F6"]}
                style={styles.sendBtn}
              >
                <Text style={{ color: "#fff", fontSize: 18 }}>➤</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default ChatbotScreen;

/* =====================================================
   STYLES
===================================================== */

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: 16,
    borderRadius: 24,
    padding: 16,
    backgroundColor: "#FFFFFF",
  },
  header: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1D4ED8",
    marginBottom: 10,
  },
  botRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  botAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#E0F0FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },
  botBubble: {
    maxWidth: "75%",
    padding: 12,
    backgroundColor: "#F1F5FF",
    borderRadius: 16,
  },
  botText: {
    color: "#0F172A",
    fontSize: 15,
  },
  userBubble: {
    backgroundColor: "#3B82F6",
    padding: 12,
    borderRadius: 16,
    maxWidth: "70%",
  },
  userText: {
    color: "#fff",
    fontSize: 15,
  },
  typingBubble: {
    marginLeft: 40,
    marginTop: 6,
  },
  dotsRow: {
    flexDirection: "row",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#3B82F6",
    marginHorizontal: 2,
  },
  inputWrapper: {
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 16,
  },
  inputCard: {
    flexDirection: "row",
    backgroundColor: "#F8FBFF",
    borderRadius: 24,
    padding: 8,
    alignItems: "center",
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#0F172A",
    paddingHorizontal: 10,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
  },
});
