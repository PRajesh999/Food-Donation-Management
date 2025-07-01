import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ToastAndroid, 
  StatusBar,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import axios from 'axios';
import API_BASE_URL from '../config/apiConfig';

export default function VerifyCodeScreen({ route, navigation }) {
  const { email } = route.params;
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [codeError, setCodeError] = useState("");

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Start pulse animation
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
  }, []);

  const handleVerify = async () => {
    // Clear previous errors
    setCodeError("");

    // Validate code
    if (!code.trim()) {
      setCodeError("Verification code is required");
      return;
    }

    if (code.trim().length !== 6) {
      setCodeError("Please enter a 6-digit verification code");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/users/verify-code`, { 
        email, 
        code: code.trim() 
      });
      if (res.status === 200) {
        ToastAndroid.show("Code verified successfully", ToastAndroid.SHORT);
        navigation.navigate("ResetPassword", { email });
      }
    } catch (err) {
      console.log("Verify code error:", err.response?.data || err.message);
      const errorMessage = err.response?.data?.message || "Invalid verification code";
      setCodeError(errorMessage);
      ToastAndroid.show(errorMessage, ToastAndroid.SHORT);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    try {
      await axios.post("http://192.168.26.19:8000/api/users/forgot-password", { email });
      ToastAndroid.show("New verification code sent", ToastAndroid.SHORT);
    } catch (error) {
      ToastAndroid.show("Failed to resend code", ToastAndroid.SHORT);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <StatusBar barStyle="light-content" backgroundColor="#F47F24" />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={["#F47F24", "#FF6B35"]}
        style={styles.backgroundGradient}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        
        <Animated.View 
          style={[
            styles.iconContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          <Ionicons name="shield-checkmark" size={40} color="white" />
        </Animated.View>
      </View>

      {/* Main Content */}
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View 
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <View style={styles.formContainer}>
              <View style={styles.titleContainer}>
                <Text style={styles.title}>Verify Your Email</Text>
                <Text style={styles.subtitle}>
                  We've sent a 6-digit verification code to
                </Text>
                <Text style={styles.emailText}>{email}</Text>
              </View>

              {/* Code Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Verification Code</Text>
                <View style={[styles.inputContainer, codeError ? styles.inputError : null]}>
                  <Ionicons name="key-outline" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter 6-digit code"
                    placeholderTextColor="#999"
                    value={code}
                    onChangeText={(text) => {
                      setCode(text);
                      if (codeError) setCodeError("");
                    }}
                    keyboardType="numeric"
                    maxLength={6}
                    autoFocus={true}
                  />
                </View>
                {codeError ? <Text style={styles.errorText}>{codeError}</Text> : null}
              </View>

              {/* Verify Button */}
              <TouchableOpacity 
                style={[styles.verifyButton, loading && styles.verifyButtonDisabled]} 
                onPress={handleVerify} 
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Text style={styles.verifyButtonText}>Verify Code</Text>
                    <Ionicons name="checkmark-circle" size={20} color="white" />
                  </>
                )}
              </TouchableOpacity>

              {/* Resend Code */}
              <TouchableOpacity 
                style={styles.resendContainer}
                onPress={handleResendCode}
              >
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                  <Ionicons name="refresh" size={16} color="#F47F24" />
                </Animated.View>
                <Text style={styles.resendText}>Resend Code</Text>
              </TouchableOpacity>

              {/* Back to Forgot Password */}
              <TouchableOpacity 
                style={styles.backContainer}
                onPress={() => navigation.navigate("ForgotPassword")}
              >
                <Ionicons name="arrow-back" size={16} color="#666" />
                <Text style={styles.backText}>Back to Forgot Password</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  backgroundGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 300,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 20,
  },
  content: {
    flex: 1,
  },
  formContainer: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 30,
    paddingTop: 40,
    paddingBottom: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  titleContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
  },
  emailText: {
    fontSize: 16,
    color: "#F47F24",
    fontWeight: "600",
    textAlign: "center",
    marginTop: 4,
  },
  inputGroup: {
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  inputError: {
    borderColor: "#dc3545",
    backgroundColor: "#fff5f5",
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 18,
    color: "#333",
    textAlign: "center",
    letterSpacing: 2,
    fontWeight: "600",
  },
  errorText: {
    color: "#dc3545",
    fontSize: 14,
    marginTop: 6,
    marginLeft: 4,
  },
  verifyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F47F24",
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: "#F47F24",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  verifyButtonDisabled: {
    opacity: 0.7,
  },
  verifyButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginRight: 8,
  },
  resendContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    marginBottom: 20,
  },
  resendText: {
    color: "#F47F24",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  backContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  backText: {
    color: "#666",
    fontSize: 16,
    marginLeft: 8,
  },
});