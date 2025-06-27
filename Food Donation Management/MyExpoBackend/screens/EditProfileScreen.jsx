import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Alert,
  Dimensions,
  StatusBar,
} from "react-native";
import { TextInput, Button } from "react-native-paper";
import { Formik } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Picker } from "@react-native-picker/picker";
import { useTheme } from "./ThemeContext";

const { width } = Dimensions.get("window");
const API_BASE_URL = "http://10.16.57.136:8000/api";

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user, updateUser } = useAuth();
  const { theme } = useTheme();
  const [userData, setUserData] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dobValue, setDobValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const validationSchema = Yup.object().shape({
    name: Yup.string().required("Name is required"),
    email: Yup.string().email("Invalid email").required("Email is required"),
    phone: Yup.string()
      .matches(/^[0-9]{10}$/, "Phone must be 10 digits")
      .required("Phone number is required"),
    address: Yup.string().required("Address is required"),
    gender: Yup.string()
      .oneOf(["Male", "Female", "Other"], "Gender must be Male, Female, or Other")
      .required("Gender is required"),
    dob: Yup.string().required("Date of Birth is required"),
    occupation: Yup.string().required("Occupation is required"),
  });

  useEffect(() => {
    const initializeUserData = async () => {
      try {
        // First try to get user from route params (passed from ProfileScreen)
        if (route?.params?.userData) {
          setUserData(route.params.userData);
          setProfileImage(route.params.userData.profileImage || null);
          setDobValue(route.params.userData.dob || "");
          return;
        }

        // Fallback to AuthContext
        if (user && user.email) {
          setUserData(user);
          setProfileImage(user.profileImage || null);
          setDobValue(user.dob || "");
          return;
        }

        // If no user data available, show error
        Alert.alert("Error", "No user data available");
        navigation.goBack();
      } catch (error) {
        console.log("Error initializing user data:", error);
        Alert.alert("Error", "Failed to load user data");
        navigation.goBack();
      }
    };

    initializeUserData();
  }, [route?.params?.userData, user]);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Please grant camera roll permissions to select an image.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        setProfileImage(`data:image/jpeg;base64,${selectedAsset.base64}`);
      }
    } catch (error) {
      console.log("Error picking image:", error);
      Alert.alert("Error", "Failed to select image");
    }
  };

  const handleSave = async (values) => {
    if (!userData?.email) {
      Alert.alert("Error", "User email not found");
      return;
    }

    setSaving(true);
    try {
      const updatedUserData = {
        email: userData.email, // Required for backend
        name: values.name,
        phone: values.phone,
        address: values.address,
        gender: values.gender,
        dob: values.dob,
        occupation: values.occupation,
        profileImage: profileImage,
      };

      const response = await axios.put(
        `${API_BASE_URL}/users/update-user-by-email`,
        updatedUserData
      );

      if (response.data.success) {
        // Update AuthContext with new user data from backend response
        if (response.data.user) {
          await updateUser(response.data.user);
        } else {
          await updateUser(updatedUserData);
        }
        Toast.show({
          type: "success",
          text1: "Profile Updated",
          text2: "Your changes have been saved successfully",
        });
        setTimeout(() => navigation.goBack(), 1500);
      } else {
        throw new Error(response.data.message || "Update failed");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      Toast.show({
        type: "error",
        text1: "Update Failed",
        text2: error.response?.data?.message || "Please try again",
      });
    } finally {
      setSaving(false);
    }
  };

  const onDateChange = (event, selectedDate, setFieldValue) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split("T")[0];
      setDobValue(formattedDate);
      setFieldValue("dob", formattedDate);
    }
  };

  if (!userData) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#F47F24" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="#F47F24" />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={["#F47F24", "#FF6B35"]}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Edit Profile</Text>
            <View style={styles.placeholder} />
          </View>
        </LinearGradient>

        {/* Form Section */}
        <View style={[styles.formSection, { backgroundColor: theme.colors.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-circle-outline" size={24} color="#F47F24" />
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Personal Information</Text>
          </View>

          {/* Profile Image Section */}
          <View style={styles.imageSection}>
            <View style={styles.imageContainer}>
              <Image
                source={
                  profileImage
                    ? { uri: profileImage }
                    : userData.profileImage
                    ? { uri: userData.profileImage }
                    : require("../assets/Applogo.png")
                }
                style={styles.profileImage}
              />
              <TouchableOpacity style={styles.editImageButton} onPress={pickImage}>
                <Ionicons name="camera" size={20} color="white" />
              </TouchableOpacity>
            </View>
            <Text style={styles.imageText}>Tap to change profile picture</Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            <Formik
              initialValues={{
                name: userData.name || "",
                email: userData.email || "",
                phone: userData.phone || "",
                address: userData.address || "",
                gender: userData.gender || "",
                dob: dobValue || "",
                occupation: userData.occupation || "",
              }}
              validationSchema={validationSchema}
              onSubmit={handleSave}
              enableReinitialize
            >
              {({
                handleChange,
                handleBlur,
                handleSubmit,
                values,
                errors,
                touched,
                setFieldValue,
              }) => (
                <>
                  <TextInput
                    label="Full Name"
                    value={values.name}
                    onChangeText={handleChange("name")}
                    onBlur={handleBlur("name")}
                    mode="outlined"
                    style={styles.input}
                    error={touched.name && errors.name}
                    left={<TextInput.Icon icon="account" />}
                  />
                  {touched.name && errors.name && (
                    <Text style={styles.errorText}>{errors.name}</Text>
                  )}

                  <TextInput
                    label="Email"
                    value={values.email}
                    onChangeText={handleChange("email")}
                    onBlur={handleBlur("email")}
                    mode="outlined"
                    style={styles.input}
                    keyboardType="email-address"
                    error={touched.email && errors.email}
                    left={<TextInput.Icon icon="email" />}
                    disabled={true} // Email should not be editable
                  />
                  {touched.email && errors.email && (
                    <Text style={styles.errorText}>{errors.email}</Text>
                  )}

                  <TextInput
                    label="Phone Number"
                    value={values.phone}
                    onChangeText={handleChange("phone")}
                    onBlur={handleBlur("phone")}
                    mode="outlined"
                    style={styles.input}
                    keyboardType="phone-pad"
                    error={touched.phone && errors.phone}
                    left={<TextInput.Icon icon="phone" />}
                  />
                  {touched.phone && errors.phone && (
                    <Text style={styles.errorText}>{errors.phone}</Text>
                  )}

                  <TextInput
                    label="Address"
                    value={values.address}
                    onChangeText={handleChange("address")}
                    onBlur={handleBlur("address")}
                    mode="outlined"
                    style={styles.input}
                    error={touched.address && errors.address}
                    left={<TextInput.Icon icon="map-marker" />}
                    multiline
                  />
                  {touched.address && errors.address && (
                    <Text style={styles.errorText}>{errors.address}</Text>
                  )}

                  <View style={styles.pickerContainer}>
                    <Text style={styles.pickerLabel}>Gender</Text>
                    <View style={styles.pickerWrapper}>
                      <Picker
                        selectedValue={values.gender}
                        onValueChange={(itemValue) => setFieldValue("gender", itemValue)}
                        style={styles.picker}
                      >
                        <Picker.Item label="Select Gender" value="" />
                        <Picker.Item label="Male" value="Male" />
                        <Picker.Item label="Female" value="Female" />
                        <Picker.Item label="Other" value="Other" />
                      </Picker>
                    </View>
                    {touched.gender && errors.gender && (
                      <Text style={styles.errorText}>{errors.gender}</Text>
                    )}
                  </View>

                  <TouchableOpacity
                    style={styles.dateInput}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Text style={styles.dateLabel}>Date of Birth</Text>
                    <Text style={styles.dateValue}>
                      {values.dob || "Select Date"}
                    </Text>
                    <Ionicons name="calendar" size={20} color="#F47F24" />
                  </TouchableOpacity>
                  {touched.dob && errors.dob && (
                    <Text style={styles.errorText}>{errors.dob}</Text>
                  )}

                  <TextInput
                    label="Occupation"
                    value={values.occupation}
                    onChangeText={handleChange("occupation")}
                    onBlur={handleBlur("occupation")}
                    mode="outlined"
                    style={styles.input}
                    error={touched.occupation && errors.occupation}
                    left={<TextInput.Icon icon="briefcase" />}
                  />
                  {touched.occupation && errors.occupation && (
                    <Text style={styles.errorText}>{errors.occupation}</Text>
                  )}

                  {/* Save Button */}
                  <TouchableOpacity
                    style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <>
                        <Ionicons name="checkmark" size={20} color="white" />
                        <Text style={styles.saveButtonText}>Save Changes</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </Formik>
          </View>

          {/* Date Picker Modal */}
          {showDatePicker && (
            <DateTimePicker
              value={new Date()}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => onDateChange(event, selectedDate, setFieldValue)}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    height: 50,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    flex: 1,
  },
  placeholder: {
    flex: 1,
  },
  formSection: {
    flex: 1,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
  },
  imageSection: {
    alignItems: "center",
    paddingVertical: 30,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  imageContainer: {
    position: "relative",
    marginBottom: 10,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#F47F24",
  },
  editImageButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#F47F24",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  imageText: {
    fontSize: 14,
  },
  formContainer: {
    padding: 20,
  },
  input: {
    marginBottom: 15,
  },
  pickerContainer: {
    marginBottom: 15,
  },
  pickerLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
  },
  picker: {
    height: 50,
  },
  dateInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 15,
  },
  dateLabel: {
    fontSize: 16,
  },
  dateValue: {
    fontSize: 16,
    flex: 1,
    textAlign: "right",
    marginRight: 10,
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginTop: -10,
    marginBottom: 10,
    marginLeft: 5,
  },
  saveButton: {
    backgroundColor: "#F47F24",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderRadius: 25,
    marginTop: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  saveButtonDisabled: {
    backgroundColor: "#ccc",
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
});
