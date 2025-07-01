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

export default function ResetPasswordScreen({ route, navigation }) {
  const { email } = route.params;
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newPasswordError, setNewPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

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
  }, []);

  const validatePassword = (password) => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  };

  const handleReset = async () => {
    // Clear previous errors
    setNewPasswordError("");
    setConfirmPasswordError("");

    let hasError = false;

    // Validate new password
    if (!newPassword.trim()) {
      setNewPasswordError("New password is required");
      hasError = true;
    } else if (!validatePassword(newPassword.trim())) {
      setNewPasswordError("Password must be at least 8 characters with uppercase, lowercase, and number");
      hasError = true;
    }

    // Validate confirm password
    if (!confirmPassword.trim()) {
      setConfirmPasswordError("Please confirm your password");
      hasError = true;
    } else if (newPassword.trim() !== confirmPassword.trim()) {
      setConfirmPasswordError("Passwords do not match");
      hasError = true;
    }

    if (hasError) return;

    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/users/reset-password`, { 
        email, 
        newPassword: newPassword.trim() 
      });
      ToastAndroid.show("Password reset successfully", ToastAndroid.SHORT);
      
      // Add a small delay to ensure smooth transition
      setTimeout(() => {
        // Use replace to prevent flickering and clear the navigation stack
        navigation.replace("Login");
      }, 500);
      
    } catch (err) {
      console.log("Reset password error:", err.response?.data || err.message);
      const errorMessage = err.response?.data?.message || "Failed to reset password";
      ToastAndroid.show(errorMessage, ToastAndroid.SHORT);
    } finally {
      setLoading(false);
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
          <Ionicons name="key" size={40} color="white" />
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
                <Text style={styles.title}>Reset Your Password</Text>
                <Text style={styles.subtitle}>
                  Create a new secure password for your account
                </Text>
              </View>

              {/* New Password Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>New Password</Text>
                <View style={[styles.inputContainer, newPasswordError ? styles.inputError : null]}>
                  <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter new password"
                    placeholderTextColor="#999"
                    value={newPassword}
                    onChangeText={(text) => {
                      setNewPassword(text);
                      if (newPasswordError) setNewPasswordError("");
                    }}
                    secureTextEntry={!showNewPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    onPress={() => setShowNewPassword(!showNewPassword)}
                    style={styles.eyeIcon}
                  >
                    <Ionicons
                      name={showNewPassword ? "eye-off" : "eye"}
                      size={20}
                      color="#666"
                    />
                  </TouchableOpacity>
                </View>
                {newPasswordError ? <Text style={styles.errorText}>{newPasswordError}</Text> : null}
              </View>

              {/* Confirm Password Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm New Password</Text>
                <View style={[styles.inputContainer, confirmPasswordError ? styles.inputError : null]}>
                  <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm new password"
                    placeholderTextColor="#999"
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                      if (confirmPasswordError) setConfirmPasswordError("");
                    }}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeIcon}
                  >
                    <Ionicons
                      name={showConfirmPassword ? "eye-off" : "eye"}
                      size={20}
                      color="#666"
                    />
                  </TouchableOpacity>
                </View>
                {confirmPasswordError ? <Text style={styles.errorText}>{confirmPasswordError}</Text> : null}
              </View>

              {/* Password Requirements */}
              <View style={styles.requirementsContainer}>
                <Text style={styles.requirementsTitle}>Password Requirements:</Text>
                <View style={styles.requirementItem}>
                  <Ionicons 
                    name={newPassword.length >= 8 ? "checkmark-circle" : "ellipse-outline"} 
                    size={16} 
                    color={newPassword.length >= 8 ? "#4CAF50" : "#999"} 
                  />
                  <Text style={styles.requirementText}>At least 8 characters</Text>
                </View>
                <View style={styles.requirementItem}>
                  <Ionicons 
                    name={/[A-Z]/.test(newPassword) ? "checkmark-circle" : "ellipse-outline"} 
                    size={16} 
                    color={/[A-Z]/.test(newPassword) ? "#4CAF50" : "#999"} 
                  />
                  <Text style={styles.requirementText}>One uppercase letter</Text>
                </View>
                <View style={styles.requirementItem}>
                  <Ionicons 
                    name={/[a-z]/.test(newPassword) ? "checkmark-circle" : "ellipse-outline"} 
                    size={16} 
                    color={/[a-z]/.test(newPassword) ? "#4CAF50" : "#999"} 
                  />
                  <Text style={styles.requirementText}>One lowercase letter</Text>
                </View>
                <View style={styles.requirementItem}>
                  <Ionicons 
                    name={/\d/.test(newPassword) ? "checkmark-circle" : "ellipse-outline"} 
                    size={16} 
                    color={/\d/.test(newPassword) ? "#4CAF50" : "#999"} 
                  />
                  <Text style={styles.requirementText}>One number</Text>
                </View>
              </View>

              {/* Reset Button */}
              <TouchableOpacity 
                style={[styles.resetButton, loading && styles.resetButtonDisabled]} 
                onPress={handleReset} 
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Text style={styles.resetButtonText}>Reset Password</Text>
                    <Ionicons name="checkmark-circle" size={20} color="white" />
                  </>
                )}
              </TouchableOpacity>

              {/* Back to Login */}
              <TouchableOpacity 
                style={styles.backToLoginContainer}
                onPress={() => navigation.navigate("Login")}
              >
                <Ionicons name="arrow-back" size={16} color="#F47F24" />
                <Text style={styles.backToLoginText}>Back to Login</Text>
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
    marginTop:20,
    paddingTop: 30,
    paddingHorizontal: 20,
    paddingBottom: 20,
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
    marginTop:40,
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
    marginBottom: 30,
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
  inputGroup: {
    marginBottom: 20,
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
    fontSize: 16,
    color: "#333",
  },
  eyeIcon: {
    padding: 4,
  },
  errorText: {
    color: "#dc3545",
    fontSize: 14,
    marginTop: 6,
    marginLeft: 4,
  },
  requirementsContainer: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    marginBottom: 30,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  requirementItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  requirementText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
  },
  resetButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F47F24",
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 30,
    shadowColor: "#F47F24",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  resetButtonDisabled: {
    opacity: 0.7,
  },
  resetButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginRight: 8,
  },
  backToLoginContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  backToLoginText: {
    color: "#F47F24",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});