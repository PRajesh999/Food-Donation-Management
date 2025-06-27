import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
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
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import axios from "axios";

const API_URL = "http://10.16.57.136:8000/api/users/signup";

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

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const pickImage = async () => {
    try {
      setImageLoading(true);

      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to upload a profile image.');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        const base64Image = result.assets[0].base64;

        updateFormData('profileImage', {
          uri: imageUri,
          base64: base64Image
        });

        // Clear any previous image error
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

  const validateField = (field, value) => {
    switch (field) {
      case "name":
        return value.trim().length < 2 ? "Name must be at least 2 characters" : "";
      case "email":
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return !emailRegex.test(value) ? "Please enter a valid email" : "";
      case "phone":
        const phoneRegex = /^[0-9]{7,15}$/;
        return !phoneRegex.test(value) ? "Please enter a valid phone number" : "";
      case "address":
        return value.trim().length < 5 ? "Address must be at least 5 characters" : "";
      case "occupation":
        return value.trim().length < 2 ? "Occupation must be at least 2 characters" : "";
      case "password":
        return value.length < 6 ? "Password must be at least 6 characters" : "";
      case "confirmPassword":
        return value !== formData.password ? "Passwords do not match" : "";
      case "dob":
        return !value ? "Please select your date of birth" : "";
      case "profileImage":
        return !value ? "Please select a profile image" : "";
      default:
        return "";
    }
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    // Validate all required fields
    Object.keys(formData).forEach(field => {
      const value = formData[field];
      if (!value || (typeof value === "string" && !value.trim())) {
        newErrors[field] = "This field is required";
        isValid = false;
      } else {
        const fieldError = validateField(field, value);
        if (fieldError) {
          newErrors[field] = fieldError;
          isValid = false;
        }
      }
    });

    // Validate confirm password separately
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
      isValid = false;
    }

    // Validate gender
    if (!formData.gender) {
      newErrors.gender = "Please select your gender";
      isValid = false;
    }

    // Validate terms
    if (!agreeTerms) {
      newErrors.terms = "Please agree to the terms and conditions";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Add FCM token registration function
  const registerForPushNotifications = async (userEmail) => {
    try {
      let token;
      if (Constants.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== 'granted') {
          console.log('Failed to get push token for push notification!');
          return;
        }
        token = (await Notifications.getExpoPushTokenAsync()).data;
        console.log('Expo push token:', token);
        
        // Send token to backend
        await axios.post('http://10.16.57.136:8000/api/users/update-fcm-token-by-email', {
          email: userEmail,
          fcmToken: token
        });
        console.log('FCM token saved to backend');
      } else {
        console.log('Must use physical device for Push Notifications');
      }
    } catch (error) {
      console.error('Error registering for push notifications:', error);
    }
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    setLoading(true);
    const userData = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      address: formData.address.trim(),
      dob: formData.dob,
      occupation: formData.occupation.trim(),
      gender: formData.gender,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
      profileImage: formData.profileImage?.base64 || null,
      agreeTerms,
    };

    try {
      await axios.post(API_URL, userData);
      
      // Register for push notifications after successful signup
      await registerForPushNotifications(formData.email.trim());
      
      Alert.alert("Success", "Account created successfully! Please log in.", [
        { text: "OK", onPress: () => navigation.replace("Login") }
      ]);
    } catch (error) {
      console.error("Signup error:", error);
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

  const InputField = ({
    icon,
    placeholder,
    value,
    onChangeText,
    field,
    secureTextEntry = false,
    keyboardType = "default",
    multiline = false,
    numberOfLines = 1,
    rightIcon,
    onRightIconPress
  }) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{placeholder} *</Text>
      <View style={[
        styles.inputContainer,
        errors[field] ? styles.inputError : null
      ]}>
        <Ionicons name={icon} size={20} color="#666" style={styles.inputIcon} />
        <TextInput
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
        />
        {rightIcon && (
          <TouchableOpacity onPress={onRightIconPress} style={styles.rightIcon}>
            <Ionicons name={rightIcon} size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>
      {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
    </View>
  );

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
              <Text style={styles.welcomeText}>Create Account</Text>
              <Text style={styles.subtitleText}>Join our community of food donors</Text>

              {/* Personal Information Section */}
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
                />

                <InputField
                  icon="mail-outline"
                  placeholder="Email Address"
                  value={formData.email}
                  field="email"
                  keyboardType="email-address"
                />

                <InputField
                  icon="call-outline"
                  placeholder="Phone Number"
                  value={formData.phone}
                  field="phone"
                  keyboardType="phone-pad"
                />

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Profile Image *</Text>
                  <View style={styles.imageUploadContainer}>
                    {formData.profileImage ? (
                      <View style={styles.imagePreviewContainer}>
                        <Image
                          source={{ uri: formData.profileImage.uri }}
                          style={styles.imagePreview}
                          resizeMode="cover"
                        />
                        <TouchableOpacity
                          style={styles.removeImageButton}
                          onPress={removeImage}
                        >
                          <Ionicons name="close-circle" size={24} color="#F44336" />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={[
                          styles.imageUploadButton,
                          errors.profileImage ? styles.inputError : null
                        ]}
                        onPress={pickImage}
                        disabled={imageLoading}
                      >
                        {imageLoading ? (
                          <ActivityIndicator size="small" color="#F47F24" />
                        ) : (
                          <>
                            <Ionicons name="camera-outline" size={32} color="#666" />
                            <Text style={styles.imageUploadText}>Tap to add photo</Text>
                            <Text style={styles.imageUploadSubtext}>Recommended: Square image</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                  {errors.profileImage && <Text style={styles.errorText}>{errors.profileImage}</Text>}
                </View>

                <InputField
                  icon="location-outline"
                  placeholder="Address"
                  value={formData.address}
                  field="address"
                  multiline={true}
                  numberOfLines={2}
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

                <InputField
                  icon="briefcase-outline"
                  placeholder="Occupation"
                  value={formData.occupation}
                  field="occupation"
                />

                {/* Gender Selection */}
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

              {/* Security Section */}
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
                />

                <InputField
                  icon="lock-closed-outline"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  field="confirmPassword"
                  secureTextEntry={!showConfirmPassword}
                  rightIcon={showConfirmPassword ? "eye-off" : "eye"}
                  onRightIconPress={() => setShowConfirmPassword(!showConfirmPassword)}
                />
              </View>

              {/* Terms and Conditions */}
              <View style={styles.termsSection}>
                <View style={styles.termsHeader}>
                  <Ionicons name="document-text-outline" size={24} color="#F47F24" />
                  <Text style={styles.termsSectionTitle}>Terms & Conditions</Text>
                </View>
                <View style={styles.termsContainer}>
                  <View style={styles.checkboxRow}>
                    <Checkbox
                      status={agreeTerms ? "checked" : "unchecked"}
                      onPress={() => setAgreeTerms(!agreeTerms)}
                      color="#F47F24"
                    />
                    <View style={styles.termsTextContainer}>
                      <Text style={styles.termsText}>
                        I agree to the{" "}
                        <Text style={styles.termsLink}>Terms of Service</Text>
                        {" "}and{" "}
                        <Text style={styles.termsLink}>Privacy Policy</Text>
                      </Text>
                      <Text style={styles.termsSubtext}>
                        By creating an account, you agree to our terms and privacy policy
                      </Text>
                    </View>
                  </View>
                  {errors.terms && <Text style={styles.errorText}>{errors.terms}</Text>}
                </View>
              </View>

              {/* Sign Up Button */}
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

              {/* Login Link */}
              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                  <Text style={styles.loginLink}>Sign In</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </TouchableWithoutFeedback>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <DateTimePicker
          value={formData.dob ? new Date(formData.dob) : new Date(2000, 0, 1)}
          mode="date"
          display="default"
          maximumDate={new Date()}
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate && event.type !== 'dismissed') {
              updateFormData("dob", selectedDate.toISOString().split("T")[0]);
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
  dateText: {
    flex: 1,
    fontSize: 16,
    color: "#333",
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
  termsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  termsSectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginLeft: 10,
  },
  termsContainer: {
    marginBottom: 15,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  termsTextContainer: {
    flex: 1,
    marginLeft: 10,
  },
  termsText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
    fontWeight: "500",
  },
  termsSubtext: {
    fontSize: 12,
    color: "#666",
    lineHeight: 16,
    marginTop: 4,
  },
  termsLink: {
    color: "#F47F24",
    fontWeight: "600",
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
  imageUploadContainer: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 120,
  },
  imagePreviewContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#F47F24",
  },
  removeImageButton: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "white",
    borderRadius: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  imageUploadButton: {
    width: "100%",
    height: 120,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8f9fa",
    borderWidth: 2,
    borderColor: "#e9ecef",
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 20,
  },
  imageUploadText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginTop: 8,
    textAlign: "center",
  },
  imageUploadSubtext: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    textAlign: "center",
  },
});
