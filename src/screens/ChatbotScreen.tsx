// ------------------------------------------------------
//  MyDairy — Dairy Cool Chatbot UI (Design 2)
//  - Light milk-blue theme
//  - Suggestion chips
//  - Simple streaming-like bot replies
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

const isAndroid = Platform.OS === "android";

// Enable LayoutAnimation on Android
if (isAndroid && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type MessageType = "text" | "card";

type ChatMessage = {
  id: string;
  from: "user" | "bot";
  type: MessageType;
  text?: string;
  data?: any;
  streaming?: boolean;
};

const suggestionChips = [
  "Check my live dairy data",
  "Milk summary for today",
  "Vaccination schedule",
  "Pending payments",
];

const ChatbotScreen = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      from: "bot",
      type: "text",
      text: "Hello 👋\nHow can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  const listRef = useRef<FlatList>(null);

  const scrollToBottom = () => {
    listRef.current?.scrollToEnd({ animated: true });
  };

  const pushMessage = (msg: ChatMessage) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setMessages((prev) => [...prev, msg]);
  };

  // ------------------------
  // Typing dots animation
  // ------------------------
  const TypingDots: React.FC = () => {
    const dot1 = useRef(new Animated.Value(0.3)).current;
    const dot2 = useRef(new Animated.Value(0.3)).current;
    const dot3 = useRef(new Animated.Value(0.3)).current;

    const animateDot = (dot: Animated.Value, delay: number) => {
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

    useEffect(() => {
      animateDot(dot1, 0);
      animateDot(dot2, 200);
      animateDot(dot3, 400);
    }, []);

    return (
      <View style={styles.dotsRow}>
        <Animated.View style={[styles.dot, { opacity: dot1 }]} />
        <Animated.View style={[styles.dot, { opacity: dot2 }]} />
        <Animated.View style={[styles.dot, { opacity: dot3 }]} />
      </View>
    );
  };

  // ------------------------
  // Streaming-like bot reply
  // ------------------------
  const streamBotReply = useCallback((fullText: string) => {
    setIsTyping(true);

    const id = Date.now().toString();
    const baseMsg: ChatMessage = {
      id,
      from: "bot",
      type: "text",
      text: "",
      streaming: true,
    };

    pushMessage(baseMsg);
    scrollToBottom();

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
    }, 35);
  }, []);

  // ------------------------
  // Very simple AI router
  // ------------------------
  const handleAIResponse = (prompt: string) => {
    const lower = prompt.toLowerCase();

    if (lower.includes("milk") || lower.includes("summary")) {
      streamBotReply(
        "Here is your milk summary for today. Soon this will show live data from your dairy records."
      );
      return;
    }

    if (lower.includes("payment") || lower.includes("pending")) {
      streamBotReply(
        "You have some pending payments. I can help you track them once connected to your dairy data."
      );
      return;
    }

    if (lower.includes("vaccination") || lower.includes("vaccine")) {
      streamBotReply(
        "Vaccination reminders will appear here as soon as your herd data is synced."
      );
      return;
    }

    streamBotReply(
      "Got it! I’ll soon be connected to your live dairy data to answer this better."
    );
  };

  // ------------------------
  // Send from input
  // ------------------------
  const handleSend = () => {
    if (!input.trim()) return;
    const text = input.trim();

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      from: "user",
      type: "text",
      text,
    };
    pushMessage(userMsg);
    setInput("");
    scrollToBottom();

    setTimeout(() => handleAIResponse(text), 400);
  };

  const handleChipPress = (chipText: string) => {
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      from: "user",
      type: "text",
      text: chipText,
    };
    pushMessage(userMsg);
    scrollToBottom();

    setTimeout(() => handleAIResponse(chipText), 400);
  };

  const handleScroll = (e: any) => {
    const { contentOffset, contentSize, layoutMeasurement } =
      e.nativeEvent;
    const distanceFromBottom =
      contentSize.height -
      (contentOffset.y + layoutMeasurement.height);
    setShowScrollToBottom(distanceFromBottom > 80);
  };

  const hasAnyUserMessage = messages.some((m) => m.from === "user");

  // ------------------------
  // Render message
  // ------------------------
  const renderMessageItem = ({ item }: { item: ChatMessage }) => {
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
              <Text style={{ fontSize: 20 }}>🤖</Text>
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

  // Typing indicator
  const TypingIndicator = () =>
    !isTyping ? null : (
      <View style={{ alignItems: "flex-start", marginTop: 6 }}>
        <View style={styles.botRow}>
          <View style={styles.botAvatarSmall}>
            <Text style={{ fontSize: 14 }}>🤖</Text>
          </View>
          <View style={styles.typingBubble}>
            <TypingDots />
          </View>
        </View>
      </View>
    );

  // ------------------------
  // UI
  // ------------------------
  return (
    <LinearGradient
      colors={["#E3F2FF", "#F2F7FF"]}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        {/* Main card */}
        <View style={styles.card}>
          {/* Header */}
          <Text style={styles.headerTitle}>AI Assistant</Text>
          <Text style={styles.headerSubtitle}>
            Ask anything about your dairy
          </Text>

          {/* Suggestion chips */}
          {!hasAnyUserMessage && (
            <View style={styles.chipsRow}>
              {suggestionChips.map((chip) => (
                <Pressable
                  key={chip}
                  style={styles.chip}
                  onPress={() => handleChipPress(chip)}
                >
                  <Text style={styles.chipText}>{chip}</Text>
                </Pressable>
              ))}
            </View>
          )}

          {/* Messages */}
          <FlatList
            ref={listRef}
            data={messages}
            renderItem={renderMessageItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{
              paddingTop: 8,
              paddingBottom: 140,
            }}
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            ListFooterComponent={<TypingIndicator />}
          />
        </View>

        {/* Scroll-to-bottom button */}
        {showScrollToBottom && (
          <Pressable
            style={styles.scrollBottomBtn}
            onPress={scrollToBottom}
          >
            <Text style={styles.scrollBottomIcon}>↓</Text>
          </Pressable>
        )}

        {/* Input bar */}
        <View style={styles.inputWrapper}>
          <View style={styles.inputCard}>
            <Pressable style={styles.micBtn} onPress={() => {}}>
              <Text style={styles.micIcon}>🎤</Text>
            </Pressable>

            <TextInput
              style={styles.input}
              placeholder="Ask something..."
              placeholderTextColor="#94A3C7"
              value={input}
              onChangeText={setInput}
            />

            <Pressable onPress={handleSend}>
              <LinearGradient
                colors={["#4797FF", "#2F73F6"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.sendBtn}
              >
                <Text style={styles.sendIcon}>➤</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default ChatbotScreen;

// ------------------------------------------------------
// Styles (Dairy Cool — Milk Blue Theme)
// ------------------------------------------------------
const styles = StyleSheet.create({
  card: {
    flex: 1,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 32,
    paddingHorizontal: 18,
    paddingTop: 18,
    backgroundColor: "#F8FBFF",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },

  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1D4ED8",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#4B5563",
    marginTop: 4,
    marginBottom: 10,
  },

  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 4,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#E3F0FF",
    marginRight: 8,
    marginBottom: 8,
  },
  chipText: {
    fontSize: 12,
    color: "#1E3A8A",
  },

  botRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  botAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#E0F0FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  botAvatarSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#E0F0FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 6,
  },

  botBubble: {
    maxWidth: "78%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DFE9FF",
  },
  botText: {
    fontSize: 15,
    color: "#0F172A",
  },

  userBubble: {
    maxWidth: "65%",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#3B82F6",
    marginRight: 4,
  },
  userText: {
    fontSize: 15,
    color: "#FFFFFF",
  },

  typingBubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: "#E5F0FF",
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
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
    bottom: Platform.OS === "android" ? 16 : 26,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
  },
  inputCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 26,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#F9FBFF",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
  },

  micBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#E2EDFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 6,
  },
  micIcon: {
    fontSize: 16,
    color: "#1D4ED8",
  },

  input: {
    flex: 1,
    fontSize: 15,
    color: "#0F172A",
    paddingVertical: 4,
    paddingHorizontal: 4,
  },

  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
  },
  sendIcon: {
    fontSize: 20,
    color: "#FFFFFF",
    fontWeight: "700",
    marginLeft: 1,
  },

  scrollBottomBtn: {
    position: "absolute",
    right: 26,
    bottom: 90,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#E2EDFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  scrollBottomIcon: {
    fontSize: 18,
    color: "#1D4ED8",
  },
});
