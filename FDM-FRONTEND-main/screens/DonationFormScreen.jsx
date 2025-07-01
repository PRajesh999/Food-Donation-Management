import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
  BackHandler,
  ScrollView,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  Image,
  ToastAndroid,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Location from "expo-location";
import { useFocusEffect } from "@react-navigation/native";
import ConfettiCannon from "react-native-confetti-cannon";
import MapView, { Marker } from "react-native-maps";
import { Picker } from "@react-native-picker/picker";
import { useTheme } from "./ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import LottieView from "lottie-react-native";
import { useAuth } from "../context/AuthContext";
import { NavigationHelper } from "../navigation/navigationHelpers";
import API_BASE_URL from '../config/apiConfig';

const { width, height } = Dimensions.get("window");

export const foodTypeImages = {
  Veg: require("../assets/Veg Curry.png"),
  "Non Veg": require("../assets/Non Veg Curry.png"),
  Others: require("../assets/Non Veg Curry.png"),
};

export default function DonationFormScreen({ navigation }) {
  const { theme } = useTheme();
  const { triggerDonationUpdate } = useAuth();

  // Donor/location info
  const [donorName, setDonorName] = useState("");
  const [email, setEmail] = useState("");
  const [contact, setContact] = useState("");
  const [locationName, setLocationName] = useState("");
  const [createdDate, setCreatedDate] = useState(new Date());
  const [showCreatedPicker, setShowCreatedPicker] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [region, setRegion] = useState({
    latitude: 20.5937,
    longitude: 78.9629,
    latitudeDelta: 10,
    longitudeDelta: 10,
  });
  const [markerCoords, setMarkerCoords] = useState(null);

  // Food item mini-form
  const [foodName, setFoodName] = useState("");
  const [foodType, setFoodType] = useState("");
  const [quantity, setQuantity] = useState("");
  const [expiryDate, setExpiryDate] = useState(new Date());
  const [showExpiryPicker, setShowExpiryPicker] = useState(false);

  // Multiple food items
  const [foodItems, setFoodItems] = useState([]); // {foodName, foodType, quantity, expiryDate}

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.navigate("Home");
        return true;
      };
      const sub = BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () => sub.remove();
    }, [navigation])
  );

  useEffect(() => {
    const handle = setTimeout(() => {
      if (locationName.trim().length > 3) {
        updateMapLocation();
      }
    }, 1500);
    return () => clearTimeout(handle);
  }, [locationName]);

  const updateMapLocation = async () => {
    try {
      if (!locationName.trim()) return;
      setIsLocationLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setIsLocationLoading(false);
        Alert.alert(
          "Location Permission", 
          "Location permission is needed to show your donation location on the map."
        );
        return;
      }
      const results = await Location.geocodeAsync(locationName);
      if (results && results.length > 0) {
        const { latitude, longitude } = results[0];
        setRegion({
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
        setMarkerCoords({ latitude, longitude });
        console.log("Location updated:", { latitude, longitude, locationName });
      } else {
        setMarkerCoords(null);
        setRegion({
          latitude: 20.5937,
          longitude: 78.9629,
          latitudeDelta: 10,
          longitudeDelta: 10,
        });
        Alert.alert(
          "Location Error",
          "Could not find the exact location. Please try a more specific address or landmark."
        );
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      setMarkerCoords(null);
      setRegion({
        latitude: 20.5937,
        longitude: 78.9629,
        latitudeDelta: 10,
        longitudeDelta: 10,
      });
      Alert.alert(
        "Location Error", 
        "Could not find the exact location. Please try a more specific address or landmark."
      );
    } finally {
      setIsLocationLoading(false);
    }
  };

  const getCurrentLocation = async () => {
    try {
      setIsLocationLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setIsLocationLoading(false);
        Alert.alert(
          "Location Permission", 
          "Location permission is needed to get your current location."
        );
        return;
      }
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const { latitude, longitude } = location.coords;
      let addressString = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
      try {
        const addressResults = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (addressResults && addressResults.length > 0) {
          const address = addressResults[0];
          addressString = [
            address.street,
            address.city,
            address.region,
            address.country
          ].filter(Boolean).join(', ');
        } else {
          Alert.alert("Location Warning", "Could not get a readable address. Using coordinates.");
        }
      } catch (err) {
        Alert.alert("Location Warning", "Could not get a readable address. Using coordinates.");
      }
      setLocationName(addressString);
      setRegion({
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      setMarkerCoords({ latitude, longitude });
    } catch (error) {
      console.error("Error getting current location:", error);
      Alert.alert("Error", "Could not get your current location. Please enter the address manually.");
    } finally {
      setIsLocationLoading(false);
    }
  };

  const validateDonorInfo = () => {
    if (!donorName.trim() || donorName.length < 2)
      return Alert.alert("Validation Error", "Enter a valid donor name.");
    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRx.test(email.trim()))
      return Alert.alert("Validation Error", "Enter a valid email address.");
    const phoneRx = /^[0-9]{7,15}$/;
    if (!phoneRx.test(contact.trim()))
      return Alert.alert("Validation Error", "Enter a valid contact number.");
    if (!locationName.trim() || !markerCoords)
      return Alert.alert("Validation Error", "Enter a valid location.");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const created = new Date(createdDate);
    created.setHours(0, 0, 0, 0);
    if (created > today)
      return Alert.alert("Validation Error", "Created date cannot be in the future.");
    return true;
  };

  const validateFoodItem = () => {
    if (!foodName.trim() || foodName.length < 2)
      return Alert.alert("Validation Error", "Enter a valid food name.");
    if (!foodType)
      return Alert.alert("Validation Error", "Select a food type.");
    const qty = parseInt(quantity, 10);
    if (!qty || qty <= 0)
      return Alert.alert("Validation Error", "Enter a valid quantity.");
    return true;
  };

  // Helper to check if mini-form is valid
  const isFoodItemValid = () => {
    if (!foodName.trim() || foodName.length < 2) return false;
    if (!foodType) return false;
    const qty = parseInt(quantity, 10);
    if (!qty || qty <= 0) return false;
    return true;
  };

  const handleAddFoodItem = () => {
    if (!validateFoodItem()) return;
    // Prevent duplicate foodName+foodType
    if (foodItems.some(item => item.foodName.trim().toLowerCase() === foodName.trim().toLowerCase() && item.foodType === foodType)) {
      Alert.alert("Duplicate Item", "This food item is already added.");
      return;
    }
    setFoodItems([
      ...foodItems,
      {
        foodName: foodName.trim(),
        foodType: foodType.trim(),
        quantity: parseInt(quantity, 10),
        expiryDate,
      },
    ]);
    setFoodName("");
    setFoodType("");
    setQuantity("");
    setExpiryDate(new Date());
    if (Platform.OS === "android") {
      ToastAndroid.show("Food item added!", ToastAndroid.SHORT);
    }
  };

  const handleRemoveFoodItem = (idx) => {
    setFoodItems(foodItems.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!validateDonorInfo()) return;
    if (foodItems.length === 0) {
      Alert.alert("Validation Error", "Add at least one food item.");
      return;
    }
    setIsSubmitting(true);
    const donationPayload = {
      donorName: donorName.trim(),
      email: email.trim(),
      phoneNo: contact.trim(),
      locationName: locationName.trim(),
      createdDate,
      coordinates: markerCoords,
      foodItems: foodItems.map(item => ({
        ...item,
        expiryDate: item.expiryDate,
      })),
    };
    try {
      const res = await fetch(`${API_BASE_URL}/donations/create-donations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(donationPayload),
      });
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Submission failed:", errorText);
        Alert.alert("Error", "Could not submit donation: " + errorText);
        setIsSubmitting(false);
        return;
      }
      const text = await res.text();
      const data = JSON.parse(text);
      console.log("Success:", data);
      Alert.alert("Success", "Donation submitted successfully");
      setShowConfetti(true);
      setDonorName("");
      setEmail("");
      setContact("");
      setLocationName("");
      setCreatedDate(new Date());
      setMarkerCoords(null);
      setFoodItems([]);
      setTimeout(() => setShowConfetti(false), 4000);
      triggerDonationUpdate();
    } catch (err) {
      console.error("Network / Parse Error:", err);
      Alert.alert("Error", "Could not submit donation. " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="#F47F24" />
      
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Form Section */}
        <View style={[styles.formSection, { backgroundColor: theme.colors.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-circle-outline" size={24} color="#F47F24" />
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Donor Information</Text>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Donor Name *</Text>
            <View style={[styles.inputContainer, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
              <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={[styles.textInput, { color: theme.colors.text }]}
                placeholder="Enter your full name"
                placeholderTextColor={theme.colors.placeholder}
                value={donorName}
                onChangeText={setDonorName}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Email Address *</Text>
            <View style={[styles.inputContainer, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
              <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={[styles.textInput, { color: theme.colors.text }]}
                placeholder="Enter your email"
                placeholderTextColor={theme.colors.placeholder}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Contact Number *</Text>
            <View style={[styles.inputContainer, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
              <Ionicons name="call-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={[styles.textInput, { color: theme.colors.text }]}
                placeholder="Enter your phone number"
                placeholderTextColor={theme.colors.placeholder}
                value={contact}
                onChangeText={setContact}
                keyboardType="phone-pad"
              />
            </View>
          </View>
        </View>

        {/* Food Information */}
        <View style={[styles.formSection, { backgroundColor: theme.colors.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="restaurant-outline" size={24} color="#F47F24" />
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Food Items</Text>
          </View>
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Food Name *</Text>
            <View style={[styles.inputContainer, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
              <Ionicons name="fast-food-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={[styles.textInput, { color: theme.colors.text }]}
                placeholder="What food are you donating?"
                placeholderTextColor={theme.colors.placeholder}
                value={foodName}
                onChangeText={setFoodName}
              />
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Food Type *</Text>
            <View style={[styles.pickerContainer, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
              <Picker
                selectedValue={foodType}
                onValueChange={(itemValue) => setFoodType(itemValue)}
                style={[styles.picker, { color: theme.colors.text }]}
              >
                <Picker.Item label="Select Food Type" value="" color={theme.colors.placeholder} />
                <Picker.Item label="Veg" value="Veg" color={theme.colors.text} />
                <Picker.Item label="Non Veg" value="Non Veg" color={theme.colors.text} />
                <Picker.Item label="Others" value="Others" color={theme.colors.text} />
              </Picker>
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Quantity *</Text>
            <View style={[styles.inputContainer, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
              <Ionicons name="scale-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={[styles.textInput, { color: theme.colors.text }]}
                placeholder="Number of servings/quantity"
                placeholderTextColor={theme.colors.placeholder}
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
              />
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Expiry Date *</Text>
            <TouchableOpacity
              style={[styles.dateButton, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}
              onPress={() => setShowExpiryPicker(true)}
            >
              <Ionicons name="time-outline" size={20} color="#666" />
              <Text style={[styles.dateButtonText, { color: theme.colors.text }]}>
                {formatDate(expiryDate)}
              </Text>
            </TouchableOpacity>
            {showExpiryPicker && (
              <DateTimePicker
                value={expiryDate}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={(event, selectedDate) => {
                  setShowExpiryPicker(false);
                  if (selectedDate) setExpiryDate(selectedDate);
                }}
                minimumDate={new Date()}
              />
            )}
          </View>
          <TouchableOpacity
            style={[styles.addFoodButton, !isFoodItemValid() && { opacity: 0.5 }]}
            onPress={handleAddFoodItem}
            disabled={!isFoodItemValid()}
          >
            <Ionicons name="add-circle-outline" size={20} color="#fff" />
            <Text style={styles.addFoodButtonText}>Add Food Item</Text>
          </TouchableOpacity>
          {foodItems.length > 0 && (
            <View style={styles.foodItemsList}>
              {foodItems.map((item, idx) => (
                <View key={idx} style={styles.foodItemRow}>
                  <Text style={styles.foodItemText}>{item.foodName} ({item.foodType}) - {item.quantity} servings, Exp: {formatDate(item.expiryDate)}</Text>
                  <TouchableOpacity onPress={() => handleRemoveFoodItem(idx)}>
                    <Ionicons name="trash" size={20} color="#F47F24" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Location Information */}
        <View style={[styles.formSection, { backgroundColor: theme.colors.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location-outline" size={24} color="#F47F24" />
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Location Details</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Location Name *</Text>
            <View style={styles.locationInputContainer}>
              <View style={[styles.inputContainer, styles.locationTextInputContainer, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                <Ionicons name="map-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={[styles.textInput, { color: theme.colors.text }]}
                  placeholder="Enter pickup location"
                  placeholderTextColor={theme.colors.placeholder}
                  value={locationName}
                  onChangeText={setLocationName}
                />
              </View>
              <TouchableOpacity
                style={[styles.currentLocationButton, styles.squircleButton, { backgroundColor: theme.colors.primary }]}
                onPress={getCurrentLocation}
                disabled={isLocationLoading}
              >
                {isLocationLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Ionicons name="location" size={20} color="white" />
                )}
              </TouchableOpacity>
            </View>
            <Text style={[styles.locationHint, { color: theme.colors.textSecondary }]}>
              Enter a specific address, landmark, or use your current location
            </Text>
          </View>

          <View style={styles.mapContainer}>
            <Text style={[styles.mapLabel, { color: theme.colors.text }]}>Location Preview</Text>
            <MapView
              style={styles.map}
              region={region}
              customMapStyle={lightMapStyle}
            >
              {markerCoords && (
                <Marker
                  coordinate={markerCoords}
                  title={foodName || "Donation Location"}
                  description={locationName}
                  pinColor="#F47F24"
                />
              )}
            </MapView>
            {isLocationLoading && (
              <View style={[styles.mapLoadingOverlay, { backgroundColor: theme.colors.background + 'E6' }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={[styles.mapLoadingText, { color: theme.colors.text }]}>
                  Finding location...
                </Text>
              </View>
            )}
            {!markerCoords && !isLocationLoading && (
              <View style={[styles.mapPlaceholder, { backgroundColor: theme.colors.background + 'E6' }]}>
                <Ionicons name="location-outline" size={40} color={theme.colors.placeholder} />
                <Text style={[styles.mapPlaceholderText, { color: theme.colors.text }]}>
                  Enter a location above to see it on the map
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <View style={styles.submitButtonContent}>
              <ActivityIndicator color="white" size="small" />
              <Text style={styles.submitButtonText}>Submitting...</Text>
            </View>
          ) : (
            <View style={styles.submitButtonContent}>
              <Ionicons name="gift-outline" size={24} color="white" />
              <Text style={styles.submitButtonText}>Submit Donation</Text>
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Confetti */}
      {showConfetti && (
        <View style={styles.confettiContainer}>
          <ConfettiCannon
            count={200}
            origin={{ x: width / 2, y: height }}
            autoStart={true}
            colors={['#F47F24', '#4CAF50', '#2196F3', '#FFC107']}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 30,
  },
  formSection: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 20,
    padding: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 15,
  },
  pickerContainer: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  picker: {
    height: 50,
  },
  dateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dateGroup: {
    flex: 1,
    marginRight: 10,
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderWidth: 1,
  },
  dateButtonText: {
    fontSize: 16,
    marginLeft: 10,
  },
  mapContainer: {
    marginTop: 10,
    position: "relative",
  },
  mapLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },
  map: {
    height: 200,
    borderRadius: 12,
  },
  mapLoadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  mapLoadingText: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 10,
    paddingHorizontal: 10,
  },
  mapPlaceholder: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  mapPlaceholderText: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 10,
    paddingHorizontal: 20,
  },
  submitButton: {
    backgroundColor: "#F47F24",
    marginHorizontal: 20,
    marginTop: 30,
    borderRadius: 25,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  submitButtonDisabled: {
    backgroundColor: "#ccc",
  },
  submitButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
  },
  submitButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
  },
  confettiContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  locationInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: '100%',
  },
  locationTextInputContainer: {
    flex: 1,
    marginRight: 2,
  },
  currentLocationButton: {
    padding: 10,
    borderRadius: 12,
    marginRight: 80,
  },
  locationHint: {
    marginTop: 5,
    marginLeft: 10,
  },
  addFoodButton: {
    backgroundColor: "#F47F24",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  addFoodButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  foodItemsList: {
    marginTop: 10,
  },
  foodItemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  foodItemText: {
    fontSize: 16,
  },
  squircleButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
    marginRight: 0,
    padding: 0,
  },
});

const lightMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "on" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#333333" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#c9c9c9" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#c9c9c9" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#333333" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#eeeeee" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#333333" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#e5e5e5" }] },
  { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
];