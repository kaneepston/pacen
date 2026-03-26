import { useState, useEffect, useRef } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

let _id = 0;
const uid = () => ++_id;

const INITIAL_MESSAGES = [
  { id: uid(), role: 'ai', text: 'Hello. I am PACEN, your personal medical copilot. May I ask your name?' },
];

const GENERIC_REPLIES = [
  name => `Based on what you've shared, ${name}, I'd suggest focusing on consistent sleep schedules. Quality rest is foundational to everything I track.`,
  ()   => `I'm designed to detect patterns across your physiological signals over time. What aspect of your health matters most to you right now?`,
  name => `Your heart rate variability looks stable today, ${name}. That's a good sign — it suggests your nervous system is well-regulated.`,
  name => `You're in good hands, ${name}. Keep asking — the more context you give me, the better I can support you.`,
  ()   => `Cardiovascular coherence improves significantly with consistent breathing patterns. I can guide you through that if you'd like.`,
];

// ── Typing indicator ─────────────────────────────────────
function TypingIndicator() {
  const dot0 = useRef(new Animated.Value(0)).current;
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const make = (dot, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 400, useNativeDriver: true }),
          Animated.delay(200),
        ])
      );
    const a0 = make(dot0, 0);
    const a1 = make(dot1, 200);
    const a2 = make(dot2, 400);
    a0.start(); a1.start(); a2.start();
    return () => { a0.stop(); a1.stop(); a2.stop(); };
  }, []);

  const dotStyle = anim => ({
    opacity: anim,
    transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }],
  });

  return (
    <View style={styles.aiBubbleWrapper}>
      <BlurView intensity={60} tint="light" style={styles.aiBubbleBlur}>
        <View style={[styles.aiBubbleInner, styles.typingInner]}>
          <View style={styles.typingDots}>
            <Animated.View style={[styles.typingDot, dotStyle(dot0)]} />
            <Animated.View style={[styles.typingDot, dotStyle(dot1)]} />
            <Animated.View style={[styles.typingDot, dotStyle(dot2)]} />
          </View>
        </View>
      </BlurView>
    </View>
  );
}

// ── Health card ──────────────────────────────────────────
function HealthCard({ onConnect, onSkip }) {
  return (
    <View style={styles.healthCardWrapper}>
      <BlurView intensity={40} tint="light" style={styles.healthCardBlur}>
        <View style={styles.healthCardInner}>
          <View style={styles.heartIconContainer}>
            <Ionicons name="heart" size={28} color="#f87171" />
          </View>
          <Text style={styles.healthCardTitle}>Apple Health</Text>
          <Text style={styles.healthCardSubtitle}>
            Securely sync heart rate, activity, and sleep data for personalised analysis.
          </Text>
          <TouchableOpacity style={styles.connectButton} onPress={onConnect} activeOpacity={0.75}>
            <Text style={styles.connectButtonText}>Connect</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.skipButton} onPress={onSkip} activeOpacity={0.6}>
            <Text style={styles.skipButtonText}>Not now</Text>
          </TouchableOpacity>
        </View>
      </BlurView>
    </View>
  );
}

// ── Heart rate widget ────────────────────────────────────
function HeartRateWidget() {
  const [bpm, setBpm] = useState(72);
  const heartScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const iv = setInterval(() => {
      setBpm(prev => Math.min(95, Math.max(58, prev + Math.floor(Math.random() * 5) - 2)));
      Animated.sequence([
        Animated.timing(heartScale, { toValue: 1.35, duration: 150, useNativeDriver: true }),
        Animated.timing(heartScale, { toValue: 1,    duration: 150, useNativeDriver: true }),
      ]).start();
    }, 2200);
    return () => clearInterval(iv);
  }, []);

  return (
    // Solid background so messages scrolling beneath don't show through
    <View style={styles.widgetWrapper}>
      <View style={styles.widgetCard}>
        <View style={styles.widgetRow}>
          <View style={styles.widgetMetric}>
            <Animated.Text style={[styles.widgetHeart, { transform: [{ scale: heartScale }] }]}>♥</Animated.Text>
            <View style={styles.widgetValues}>
              <Text style={styles.widgetNumber}>{bpm}</Text>
              <Text style={styles.widgetUnit}>BPM</Text>
            </View>
            <Text style={styles.widgetLabel}>HEART RATE</Text>
          </View>
          <View style={styles.widgetDivider} />
          <View style={styles.widgetMetric}>
            <Text style={styles.widgetIcon}>◎</Text>
            <View style={styles.widgetValues}>
              <Text style={styles.widgetNumber}>6,842</Text>
              <Text style={styles.widgetUnit}>steps</Text>
            </View>
            <Text style={styles.widgetLabel}>ACTIVITY</Text>
          </View>
          <View style={styles.widgetDivider} />
          <View style={styles.widgetMetric}>
            <Text style={styles.widgetIcon}>◐</Text>
            <View style={styles.widgetValues}>
              <Text style={styles.widgetNumber}>7.2</Text>
              <Text style={styles.widgetUnit}>hrs</Text>
            </View>
            <Text style={styles.widgetLabel}>SLEEP</Text>
          </View>
        </View>
        <View style={styles.widgetStatus}>
          <View style={styles.widgetDot} />
          <Text style={styles.widgetStatusText}>Live · Apple Health</Text>
        </View>
      </View>
    </View>
  );
}

// ── Message bubble ───────────────────────────────────────
function MsgBubble({ msg, onConnect, onSkip }) {
  if (msg.role === 'widget')      return <HeartRateWidget />;
  if (msg.role === 'health-card') return <HealthCard onConnect={onConnect} onSkip={onSkip} />;
  if (msg.role === 'ai') return (
    <View style={styles.aiBubbleWrapper}>
      <BlurView intensity={60} tint="light" style={styles.aiBubbleBlur}>
        <View style={styles.aiBubbleInner}>
          <Text style={styles.aiBubbleText}>{msg.text}</Text>
        </View>
      </BlurView>
    </View>
  );
  return (
    <View style={styles.userBubbleWrapper}>
      <View style={styles.userBubble}>
        <Text style={styles.userBubbleText}>{msg.text}</Text>
      </View>
    </View>
  );
}

// ── App ──────────────────────────────────────────────────
export default function App() {
  const [messages, setMessages]     = useState(INITIAL_MESSAGES);
  const [input, setInput]           = useState('');
  const [isTyping, setIsTyping]     = useState(false);
  const [step, setStep]             = useState('ask_name');
  const [userName, setUserName]     = useState('');
  const [replyIndex, setReplyIndex] = useState(0);

  const scrollRef = useRef(null);

  // Scroll to end on every new message or typing change
  useEffect(() => {
    const t = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 60);
    return () => clearTimeout(t);
  }, [messages, isTyping]);

  const addMsg = (role, text) => {
    const id = uid();
    setMessages(prev => [...prev, { id, role, text }]);
    return id;
  };

  const pacenSays = (text, delay = 1300, after = null) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      addMsg('ai', text);
      after?.();
    }, delay);
  };

  const handleConnect = () => {
    setMessages(prev => prev.filter(m => m.role !== 'health-card'));
    addMsg('user', 'Connect');
    setStep('connected');
    pacenSays(
      `Apple Health connected. Your live data is now syncing — I can see your heart rate, activity, and sleep.`,
      1200,
      () => {
        // Widget appears as a message in the chat flow, just like the web app
        addMsg('widget');
        pacenSays(
          `What would you like to explore today? I can analyse your sleep quality, activity trends, or cardiovascular patterns.`,
          1600
        );
      }
    );
  };

  const handleSkip = () => {
    setMessages(prev => prev.filter(m => m.role !== 'health-card'));
    setStep('chat');
    addMsg('user', 'Not now');
    pacenSays(`No worries — you can connect Apple Health anytime from settings. How can I help you today, ${userName}?`);
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text || isTyping) return;
    setInput('');
    addMsg('user', text);

    if (step === 'ask_name') {
      const name = text.split(/[\s,!.]+/)[0];
      const cap  = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
      setUserName(cap);
      setStep('ask_health');
      pacenSays(
        `It's a pleasure to meet you, ${cap}. To provide accurate insights, I need to synchronise with your physiological signals.`,
        1400,
        () => setTimeout(() => addMsg('health-card'), 500)
      );
    } else if (step === 'chat' || step === 'connected') {
      const reply = GENERIC_REPLIES[replyIndex % GENERIC_REPLIES.length](userName);
      setReplyIndex(i => i + 1);
      pacenSays(reply);
    } else {
      pacenSays(`I'm here to help, ${userName}. Once we set up your health data sync, I can provide much more personalised insights.`);
    }
  };

  // stickyHeaderIndices pins the widget in place once the scroll passes it,
  // exactly mirroring the web app's `position: sticky; top: 0` behaviour.
  const widgetIndex = messages.findIndex(m => m.role === 'widget');
  const stickyIndices = widgetIndex >= 0 ? [widgetIndex] : [];

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['#FFFDF9', '#FBF7F2', '#F5EFEB']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      <View style={styles.orbTopRight} />
      <View style={styles.orbBottomLeft} />

      <View style={styles.header}>
        <Text style={styles.headerText}>PACEN</Text>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        stickyHeaderIndices={stickyIndices}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {messages.map(msg => (
          <MsgBubble key={msg.id} msg={msg} onConnect={handleConnect} onSkip={handleSkip} />
        ))}
        {isTyping && <TypingIndicator />}
      </ScrollView>

      <View style={styles.inputBarWrapper}>
        <BlurView intensity={20} tint="light" style={styles.inputBarBlur}>
          <View style={styles.inputBarInner}>
            <TextInput
              style={styles.textInput}
              placeholder="Ask anything..."
              placeholderTextColor="rgba(122, 152, 165, 0.4)"
              value={input}
              onChangeText={setInput}
              onSubmitEditing={handleSend}
              returnKeyType="send"
              editable={!isTyping}
              multiline={false}
            />
            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleSend}
              activeOpacity={0.7}
              disabled={isTyping || !input.trim()}
            >
              <Ionicons
                name="arrow-up"
                size={18}
                color={input.trim() ? 'rgba(122,152,165,0.85)' : 'rgba(122,152,165,0.35)'}
              />
            </TouchableOpacity>
          </View>
        </BlurView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFDF9' },

  orbTopRight: {
    position: 'absolute', top: -80, right: -80,
    width: 400, height: 400, borderRadius: 200,
    backgroundColor: 'rgba(232,216,205,0.4)',
  },
  orbBottomLeft: {
    position: 'absolute', bottom: -120, left: -120,
    width: 500, height: 500, borderRadius: 250,
    backgroundColor: 'rgba(122,152,165,0.15)',
  },

  header: { paddingTop: 56, paddingBottom: 16, alignItems: 'center' },
  headerText: {
    fontSize: 11, fontWeight: '500', letterSpacing: 4,
    textTransform: 'uppercase', color: 'rgba(122,152,165,0.5)',
  },

  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 120, paddingTop: 8 },

  // Widget — in chat flow, sticky via stickyHeaderIndices
  // Solid background required so messages scrolling beneath don't show through
  widgetWrapper: {
    backgroundColor: '#F5EFEB',
    paddingVertical: 8,
  },
  widgetCard: {
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: 24, paddingVertical: 14, paddingHorizontal: 20,
    borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.45)',
  },
  widgetRow: { flexDirection: 'row', alignItems: 'center' },
  widgetMetric: { flex: 1, alignItems: 'center', paddingVertical: 2 },
  widgetHeart: { fontSize: 16, color: '#f87171', marginBottom: 4 },
  widgetIcon: { fontSize: 15, color: 'rgba(122,152,165,0.6)', marginBottom: 4 },
  widgetValues: { flexDirection: 'row', alignItems: 'baseline' },
  widgetNumber: { fontSize: 22, fontWeight: '300', color: 'rgba(24,28,34,0.85)', letterSpacing: -0.5 },
  widgetUnit: { fontSize: 11, color: 'rgba(24,28,34,0.35)', marginLeft: 3 },
  widgetLabel: { fontSize: 9, fontWeight: '500', color: 'rgba(122,152,165,0.5)', letterSpacing: 0.8, marginTop: 3 },
  widgetDivider: { width: 0.5, height: 48, backgroundColor: 'rgba(122,152,165,0.15)' },
  widgetStatus: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  widgetDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#86efac', marginRight: 5 },
  widgetStatusText: { fontSize: 10, color: 'rgba(122,152,165,0.45)', letterSpacing: 0.3 },

  // AI bubble
  aiBubbleWrapper: { alignSelf: 'flex-start', maxWidth: '85%', marginVertical: 4 },
  aiBubbleBlur: { borderRadius: 28, borderBottomLeftRadius: 8, overflow: 'hidden' },
  aiBubbleInner: {
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 28, borderBottomLeftRadius: 8,
    paddingVertical: 20, paddingHorizontal: 24,
  },
  aiBubbleText: { fontSize: 15, fontWeight: '300', color: 'rgba(24,28,34,0.9)', lineHeight: 24 },

  // Typing
  typingInner: { paddingVertical: 18, paddingHorizontal: 24 },
  typingDots: { flexDirection: 'row', alignItems: 'center', height: 20 },
  typingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(122,152,165,0.45)', marginHorizontal: 2.5 },

  // User bubble
  userBubbleWrapper: { alignSelf: 'flex-end', maxWidth: '85%', marginVertical: 4 },
  userBubble: {
    backgroundColor: 'rgba(122,152,165,0.08)',
    borderRadius: 28, borderBottomRightRadius: 8,
    borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 14, paddingHorizontal: 24,
  },
  userBubbleText: { fontSize: 15, fontWeight: '500', color: 'rgba(122,152,165,0.9)' },

  // Health card
  healthCardWrapper: { alignSelf: 'flex-start', width: '90%', marginTop: 4 },
  healthCardBlur: { borderRadius: 32, overflow: 'hidden' },
  healthCardInner: {
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.4)',
    borderRadius: 32, padding: 24, alignItems: 'center',
  },
  heartIconContainer: {
    width: 48, height: 48, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center', justifyContent: 'center',
  },
  healthCardTitle: { fontSize: 14, fontWeight: '500', color: 'rgba(24,28,34,0.8)', marginTop: 12 },
  healthCardSubtitle: {
    fontSize: 12, color: 'rgba(24,28,34,0.5)',
    textAlign: 'center', lineHeight: 18, marginTop: 4, paddingHorizontal: 16,
  },
  connectButton: {
    width: '100%', paddingVertical: 12, backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 16, marginTop: 16, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)',
  },
  connectButtonText: { fontSize: 14, fontWeight: '500', color: '#7A98A5' },
  skipButton: { paddingVertical: 10, alignItems: 'center', marginTop: 4 },
  skipButtonText: { fontSize: 13, color: 'rgba(122,152,165,0.5)' },

  // Input bar
  inputBarWrapper: { paddingBottom: 32, paddingHorizontal: 24, paddingTop: 16 },
  inputBarBlur: { borderRadius: 50, overflow: 'hidden' },
  inputBarInner: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 50, flexDirection: 'row', alignItems: 'center',
  },
  textInput: {
    flex: 1, paddingVertical: 16, paddingLeft: 24, paddingRight: 56,
    fontSize: 15, color: '#181c22', fontWeight: '300',
  },
  sendButton: {
    position: 'absolute', right: 16,
    width: 36, height: 36, alignItems: 'center', justifyContent: 'center',
  },
});
