import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  StatusBar,
  ActivityIndicator,
  Animated,
  Image,
} from "react-native";
import { Checkbox } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from 'expo-image-picker';
import axios from "axios";
import API_BASE_URL from '../config/apiConfig';
import { registerForPushNotificationsAsync } from '../utils/notifications';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

export default function SignupScreen({ navigation }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    dob: "",
    occupation: "",
    gender: null,
    password: "",
    confirmPassword: "",
    profileImage: null,
  });
  const [errors, setErrors] = useState({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  // Individual refs for each input field
  const nameRef = useRef(null);
  const emailRef = useRef(null);
  const phoneRef = useRef(null);
  const addressRef = useRef(null);
  const occupationRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);

  useEffect(() => {
    startAnimations();
  }, []);

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const updateFormData = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  }, [errors]);

  const pickImage = async () => {
    try {
      setImageLoading(true);
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to upload a profile image.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        updateFormData('profileImage', {
          uri: result.assets[0].uri,
          base64: result.assets[0].base64
        });
        if (errors.profileImage) {
          setErrors(prev => ({ ...prev, profileImage: "" }));
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    } finally {
      setImageLoading(false);
    }
  };

  const removeImage = () => {
    updateFormData('profileImage', null);
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
        isValid = false;
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
          isValid = false;
        }
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone is required";
      isValid = false;
    }
    if (!formData.address.trim()) {
      newErrors.address = "Address is required";
      isValid = false;
    }
    if (!formData.occupation.trim()) {
      newErrors.occupation = "Occupation is required";
      isValid = false;
    }
    if (!formData.dob) {
      newErrors.dob = "Date of birth is required";
      isValid = false;
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
      isValid = false;
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
      isValid = false;
    }
    if (!formData.gender) {
      newErrors.gender = "Please select gender";
      isValid = false;
    }
    if (!agreeTerms) {
      newErrors.terms = "Please agree to terms";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSignup = async () => {
    Keyboard.dismiss();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const fcmToken = await registerForPushNotificationsAsync();
      
      // Prepare the data exactly as the backend expects it
      const signupData = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      address: formData.address.trim(),
        dob: formData.dob || new Date().toISOString().split('T')[0], // Ensure dob is provided
      occupation: formData.occupation.trim(),
      gender: formData.gender,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
        agreeTerms: agreeTerms, // Include agreeTerms
        fcmToken: fcmToken,
        profileImage: formData.profileImage?.base64 || null
      };

      console.log('Sending signup data:', { ...signupData, password: '[HIDDEN]', confirmPassword: '[HIDDEN]' });
      
      const response = await axios.post(`${API_BASE_URL}/users/signup`, signupData);
      
      Alert.alert("Success", "Account created successfully! Please log in.", [
        { text: "OK", onPress: () => navigation.replace("Login") }
      ]);
    } catch (error) {
      console.error("Signup error:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
      console.error("Request URL:", `${API_BASE_URL}/signup`);
      console.error("Request data:", { ...signupData, password: '[HIDDEN]', confirmPassword: '[HIDDEN]' });
      const errorMessage = error.response?.data?.message || "Something went wrong. Please try again.";
      Alert.alert("Signup Failed", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // InputField component with proper keyboard handling
  const InputField = useCallback(React.memo(React.forwardRef(({
    icon,
    placeholder,
    value,
    field,
    secureTextEntry = false,
    keyboardType = "default",
    multiline = false,
    numberOfLines = 1,
    rightIcon,
    onRightIconPress,
    returnKeyType = "next",
    onSubmitEditing
  }, ref) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{placeholder} *</Text>
      <View style={[
        styles.inputContainer,
        errors[field] ? styles.inputError : null
      ]}>
        <Ionicons name={icon} size={20} color="#666" style={styles.inputIcon} />
        <TextInput
          ref={ref}
          style={[styles.textInput, multiline && styles.multilineInput]}
          placeholder={placeholder}
          placeholderTextColor="#999"
          value={value}
          onChangeText={(text) => updateFormData(field, text)}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={numberOfLines}
          autoCapitalize={field === "email" ? "none" : "words"}
          autoCorrect={false}
          textContentType={field === "email" ? "emailAddress" : field === "password" ? "password" : "none"}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          blurOnSubmit={multiline ? false : returnKeyType === "done"}
        />
        {rightIcon && (
          <TouchableOpacity onPress={onRightIconPress} style={styles.rightIcon}>
            <Ionicons name={rightIcon} size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>
      {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
    </View>
  ))), [updateFormData, errors]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 80}
    >
      <StatusBar barStyle="light-content" backgroundColor="#F47F24" />

      <LinearGradient
        colors={["#F47F24", "#FF6B35"]}
        style={styles.backgroundGradient}
      />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate("Onboarding")}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          <View style={styles.logoWrapper}>
            <Ionicons name="person-add" size={32} color="white" />
          </View>
        </Animated.View>

        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAwareScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        enableOnAndroid={true}
        extraScrollHeight={20}
        enableAutomaticScroll={true}
        keyboardOpeningTime={0}
        keyboardDismissMode="none"
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
              <Text style={styles.welcomeText}>Create Account</Text>
              <Text style={styles.subtitleText}>Join our community of food donors</Text>

              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="person-circle-outline" size={24} color="#F47F24" />
                  <Text style={styles.sectionTitle}>Personal Information</Text>
                </View>

                <InputField
                  icon="person-outline"
                  placeholder="Full Name"
                  value={formData.name}
                  field="name"
                ref={nameRef}
                onSubmitEditing={() => emailRef.current?.focus()}
                />

                <InputField
                  icon="mail-outline"
                  placeholder="Email Address"
                  value={formData.email}
                  field="email"
                  keyboardType="email-address"
                ref={emailRef}
                onSubmitEditing={() => phoneRef.current?.focus()}
                />

                <InputField
                  icon="call-outline"
                  placeholder="Phone Number"
                  value={formData.phone}
                  field="phone"
                  keyboardType="phone-pad"
                ref={phoneRef}
                onSubmitEditing={() => addressRef.current?.focus()}
              />

                <InputField
                  icon="location-outline"
                  placeholder="Address"
                  value={formData.address}
                  field="address"
                  multiline={true}
                  numberOfLines={2}
                ref={addressRef}
                returnKeyType="next"
                onSubmitEditing={() => occupationRef.current?.focus()}
              />

                <InputField
                  icon="briefcase-outline"
                  placeholder="Occupation"
                  value={formData.occupation}
                  field="occupation"
                  ref={occupationRef}
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  />

                {/* Date of Birth */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Date of Birth *</Text>
                  <TouchableOpacity
                    style={[
                      styles.inputContainer,
                      errors.dob ? styles.inputError : null
                    ]}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Ionicons name="calendar-outline" size={20} color="#666" style={styles.inputIcon} />
                    <Text style={[
                      styles.dateText,
                      { color: formData.dob ? "#333" : "#999" }
                    ]}>
                      {formData.dob ? formatDate(new Date(formData.dob)) : "Select your date of birth"}
                    </Text>
                  </TouchableOpacity>
                  {errors.dob && <Text style={styles.errorText}>{errors.dob}</Text>}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Gender *</Text>
                  <View style={styles.genderContainer}>
                    {["Male", "Female", "Other"].map((g) => (
                      <TouchableOpacity
                        key={g}
                        style={[
                          styles.genderButton,
                          formData.gender === g && styles.genderSelected
                        ]}
                        onPress={() => updateFormData("gender", g)}
                      >
                        <Ionicons
                          name={g === "Male" ? "male" : g === "Female" ? "female" : "person"}
                          size={20}
                          color={formData.gender === g ? "white" : "#666"}
                        />
                        <Text style={[
                          styles.genderText,
                          formData.gender === g && styles.genderTextSelected
                        ]}>
                          {g}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {errors.gender && <Text style={styles.errorText}>{errors.gender}</Text>}
                </View>
              </View>

              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="shield-checkmark-outline" size={24} color="#F47F24" />
                  <Text style={styles.sectionTitle}>Security</Text>
                </View>

                <InputField
                  icon="lock-closed-outline"
                  placeholder="Password"
                  value={formData.password}
                  field="password"
                  secureTextEntry={!showPassword}
                  rightIcon={showPassword ? "eye-off" : "eye"}
                  onRightIconPress={() => setShowPassword(!showPassword)}
                ref={passwordRef}
                onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                />

                <InputField
                  icon="lock-closed-outline"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  field="confirmPassword"
                  secureTextEntry={!showConfirmPassword}
                  rightIcon={showConfirmPassword ? "eye-off" : "eye"}
                  onRightIconPress={() => setShowConfirmPassword(!showConfirmPassword)}
                ref={confirmPasswordRef}
                returnKeyType="done"
                onSubmitEditing={() => Keyboard.dismiss()}
                />
              </View>

              <View style={styles.termsSection}>
                  <View style={styles.checkboxRow}>
                    <Checkbox
                      status={agreeTerms ? "checked" : "unchecked"}
                      onPress={() => setAgreeTerms(!agreeTerms)}
                      color="#F47F24"
                    />
                      <Text style={styles.termsText}>
                  I agree to the Terms of Service and Privacy Policy
                      </Text>
                  </View>
                  {errors.terms && <Text style={styles.errorText}>{errors.terms}</Text>}
              </View>

              <TouchableOpacity
                style={[styles.signupButton, loading && styles.signupButtonDisabled]}
                onPress={handleSignup}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Text style={styles.signupText}>Create Account</Text>
                    <Ionicons name="arrow-forward" size={20} color="white" />
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                  <Text style={styles.loginLink}>Sign In</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
      </KeyboardAwareScrollView>

      {showDatePicker && (
        <DateTimePicker
          value={formData.dob ? new Date(formData.dob) : new Date(2000, 0, 1)}
          mode="date"
          display="default"
          maximumDate={new Date()}
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate && event.type !== 'dismissed') {
              // Use local date parts to avoid UTC offset issues
              const year = selectedDate.getFullYear();
              const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
              const day = String(selectedDate.getDate()).padStart(2, '0');
              const localDate = `${year}-${month}-${day}`;
              updateFormData("dob", localDate);
            }
          }}
        />
      )}
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
    left: 0,
    right: 0,
    top: 0,
    height: 100,
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 50 : 30,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logoWrapper: {
    width: 50,
    height: 50,
    marginLeft: 250,
    borderRadius: 25,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerSpacer: {
    width: 10,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 40,
    flexGrow: 1,
  },
  content: {
    paddingHorizontal: 20,
    flex: 1,
  },
  formContainer: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 25,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
  },
  section: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginLeft: 10,
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#e9ecef",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    minHeight: 50,
  },
  inputError: {
    borderColor: "#dc3545",
    backgroundColor: "#fff5f5",
  },
  inputIcon: {
    marginRight: 12,
    color: "#666",
    width: 20,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    paddingVertical: 0,
    minHeight: 20,
  },
  multilineInput: {
    height: 80,
    textAlignVertical: "top",
  },
  rightIcon: {
    padding: 5,
  },
  errorText: {
    color: "#dc3545",
    fontSize: 12,
    marginTop: 5,
    marginLeft: 5,
    fontWeight: "500",
  },
  genderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  genderButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#e9ecef",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    gap: 6,
  },
  genderSelected: {
    backgroundColor: "#F47F24",
    borderColor: "#F47F24",
  },
  genderText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  genderTextSelected: {
    color: "white",
    fontWeight: "600",
  },
  termsSection: {
    marginBottom: 25,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  termsText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
    fontWeight: "500",
    flex: 1,
    marginLeft: 10,
  },
  signupButton: {
    backgroundColor: "#F47F24",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#F47F24",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    marginTop: 10,
  },
  signupButtonDisabled: {
    backgroundColor: "#ccc",
    shadowOpacity: 0,
    elevation: 0,
  },
  signupText: {
    fontSize: 18,
    fontWeight: "600",
    color: "white",
    marginRight: 8,
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  loginText: {
    fontSize: 14,
    color: "#666",
  },
  loginLink: {
    fontSize: 14,
    color: "#F47F24",
    fontWeight: "600",
  },
  dateText: {
    fontSize: 16,
    color: "#999",
  },
});