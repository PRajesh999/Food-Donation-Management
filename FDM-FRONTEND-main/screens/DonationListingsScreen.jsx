import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Animated,
  Modal,
  Dimensions,
  StatusBar,
  ScrollView,
  Linking,
  Alert,
  RefreshControl,
  Platform,
  ToastAndroid,
} from "react-native";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import LottieView from "lottie-react-native";
import { useTheme } from "./ThemeContext";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import Slider from '@react-native-community/slider';
import * as Location from 'expo-location';
import { useAuth } from "../context/AuthContext";
import ConfettiCannon from "react-native-confetti-cannon";
import { useCart } from "../context/CartContext";
import API_BASE_URL from '../config/apiConfig';

const { width, height } = Dimensions.get("window");
const API_URL = `${API_BASE_URL}/donations/get-donations`;

const foodTypeImages = {
  "Veg": require("../assets/Veg Curry.png"),
  "Non Veg": require("../assets/Non Veg Curry.png"),
  "Others": require("../assets/Non Veg Curry.png"),
};

export default function DonationListingsScreen({ navigation }) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [donations, setDonations] = useState([]);
  const [filteredDonations, setFilteredDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [reloading, setReloading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [foodTypeFilter, setFoodTypeFilter] = useState('All'); // 'All', 'Veg', 'Non Veg', 'Others'
  const DISTANCE_KM = 30;
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [cartLoading, setCartLoading] = useState({});

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [loadingDonor, setLoadingDonor] = useState(false);

  const { donationUpdateTrigger } = useAuth();

  useEffect(() => {
    fetchDonations();
  }, [donationUpdateTrigger]);

  const getUserLocation = async () => {
    setLocationLoading(true);
    try {
      // Check if location services are enabled
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        setLocationError('Location services are disabled. Please enable location/GPS and try again.');
        setUserLocation(null);
        setLocationLoading(false);
        return;
      }
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Permission to access location was denied. Please allow location access in your device settings.');
        setUserLocation(null);
        setLocationLoading(false);
        return;
      }
      let loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      setLocationError(null);
    } catch (e) {
      setLocationError('Could not get your location. Please ensure location is enabled and try again.');
      setUserLocation(null);
    } finally {
      setLocationLoading(false);
    }
  };

  useEffect(() => {
    getUserLocation();
  }, []);

  const fetchDonations = async () => {
    try {
      setLoading(true);
      const response = await axios.get(API_URL);
      if (!response.data || !response.data.data) {
        console.error('Failed to fetch donations:', response.data);
        setDonations([]);
        return;
      }
      setDonations(response.data.data);
    } catch (error) {
      console.log("Error fetching donations:", error);
      Alert.alert('Error', 'Could not fetch available donations.');
    } finally {
      setLoading(false);
      fadeInList();
    }
  };

  // Filtering logic in useEffect
  useEffect(() => {
    const now = new Date();
    let filtered = donations.filter((item) => new Date(item.expiryDate) > now);
    // Remove items with zero or less quantity
    filtered = filtered.filter(item => item.quantity > 0);
    if (searchQuery.trim().length > 0) {
      filtered = filtered.filter(
        (item) =>
          item.foodName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.donorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.locationName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (foodTypeFilter !== 'All') {
      filtered = filtered.filter(item => item.foodType === foodTypeFilter);
    }
    if (userLocation) {
      filtered = filtered.filter((item) => {
        if (!item.coordinates || !item.coordinates.latitude || !item.coordinates.longitude) return false;
        const dist = getDistanceFromLatLonInKm(
          userLocation.latitude,
          userLocation.longitude,
          item.coordinates.latitude,
          item.coordinates.longitude
        );
        return dist <= DISTANCE_KM;
      });
    }
    setFilteredDonations(filtered);
  }, [donations, searchQuery, foodTypeFilter, userLocation]);

  // Haversine formula for distance in km
  function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      0.5 -
      Math.cos(dLat) / 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        (1 - Math.cos(dLon)) / 2;
    return R * 2 * Math.asin(Math.sqrt(a));
  }

  const handleSearch = (text) => {
    setSearchQuery(text);
  };

  const handleReload = () => {
    setReloading(true);
    setTimeout(() => {
      setReloading(false);
      fetchDonations();
    }, 2000);
  };

  const fadeInList = () => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  };

  const handleContactDonor = (donor) => {
    setSelectedDonor(donor);
    setModalVisible(true);
    setLoadingDonor(true);
    setTimeout(() => {
      setLoadingDonor(false);
    }, 1500);
  };

  const handleClaimDonation = () => {
    setShowConfetti(true);
    setTimeout(() => {
      setShowConfetti(false);
      navigation.navigate("Map");
    }, 1500);
  };

  const getFoodTypeIcon = (foodType) => {
    switch (foodType) {
      case "Veg":
        return "leaf-outline";
      case "Non Veg":
        return "restaurant-outline";
      case "Others":
      default:
        return "fast-food-outline";
    }
  };

  const getFoodTypeColor = (foodType) => {
    switch (foodType) {
      case "Veg":
        return "#4CAF50"; // Green color for veg items
      case "Non Veg":
        return "#FF9800";
      case "Others":
      default:
        return "#F47F24";
    }
  };

  const handleAddToCart = async (donationId) => {
    try {
      setCartLoading(prev => ({ ...prev, [donationId]: true }));
      const result = await addToCart(donationId);
      if (result === 'exists') {
        if (Platform.OS === "android") {
          ToastAndroid.show("Item already exists in cart!", ToastAndroid.SHORT);
        } else {
          Alert.alert("Already in Cart", "This item is already in your cart.");
        }
      } else if (result === true) {
        if (Platform.OS === "android") {
          ToastAndroid.show("Added to cart!", ToastAndroid.SHORT);
        } else {
          Alert.alert("Success", "Item added to cart successfully!");
        }
      } else {
        Alert.alert("Error", "Failed to add item to cart");
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      Alert.alert("Error", "Failed to add item to cart");
    } finally {
      setCartLoading(prev => ({ ...prev, [donationId]: false }));
    }
  };

  const renderDonationCard = ({ item }) => (
    <Animated.View style={[styles.donationCard, { opacity: fadeAnim }]}>
      <LinearGradient
        colors={[theme.colors.card, theme.colors.background]}
        style={styles.cardGradient}
      >
        <View style={styles.cardHeader}>
          <View style={styles.foodTypeContainer}>
            <View style={[styles.foodTypeIcon, { backgroundColor: getFoodTypeColor(item.foodType) }]}>
              <Ionicons 
                name={getFoodTypeIcon(item.foodType)} 
                size={24} 
                color="white" 
              />
            </View>
            <View style={styles.foodInfo}>
              <Text style={[styles.foodName, { color: theme.colors.text }]}>{item.foodName}</Text>
              <Text style={[styles.foodType, { color: theme.colors.placeholder }]}>{item.foodType}</Text>
            </View>
          </View>
          <View style={styles.quantityBadge}>
            <Text style={styles.quantityText}>{item.quantity}</Text>
            <Text style={styles.quantityLabel}>servings</Text>
          </View>
        </View>

        <View style={styles.cardDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="person-outline" size={16} color={theme.colors.placeholder} />
            <Text style={[styles.detailText, { color: theme.colors.text }]}>{item.donorName}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={16} color={theme.colors.placeholder} />
            <Text style={[styles.detailText, { color: theme.colors.text }]}>{item.locationName}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={16} color={theme.colors.placeholder} />
            <Text style={[styles.detailText, { color: theme.colors.text }]}>
              Expires: {new Date(item.expiryDate).toLocaleDateString()}
            </Text>
          </View>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleContactDonor(item)}
          >
            <Ionicons name="call-outline" size={18} color="#F47F24" />
            <Text style={styles.actionButtonText}>Contact</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.cartButton]}
            onPress={() => handleAddToCart(item._id)}
            disabled={cartLoading[item._id]}
          >
            {cartLoading[item._id] ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="cart-outline" size={18} color="white" />
                <Text style={[styles.actionButtonText, { color: "white" }]}>Add to Cart</Text>
              </>
            )}
          </TouchableOpacity>
          
          {/* <TouchableOpacity 
            style={[styles.actionButton, styles.claimButton]}
            onPress={() => handleClaimDonation()}
          >
            <Ionicons name="checkmark-circle-outline" size={18} color="white" />
            <Text style={[styles.actionButtonText, { color: "white" }]}>Claim</Text>
          </TouchableOpacity> */}
        </View>
      </LinearGradient>
    </Animated.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="#F47F24" />
      
      {/* Header */}
      <LinearGradient
        colors={["#F47F24", "#FF6B35"]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Available Donations</Text>
          <Text style={styles.headerSubtitle}>Find food donations near you</Text>
        </View>
      </LinearGradient>

      {/* Search and Filter Section */}
      <View style={[styles.searchSection, { backgroundColor: theme.colors.card }]}>
        <View style={styles.searchContainer}>
          <View style={[styles.searchInputContainer, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
            <Ionicons name="search" size={20} color="#666" />
            <TextInput
              style={[styles.searchInput, { color: theme.colors.text }]}
              placeholder="Search donations..."
              placeholderTextColor={theme.colors.placeholder}
              value={searchQuery}
              onChangeText={handleSearch}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={20} color="#666" />
              </TouchableOpacity>
            )}
          </View>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', marginVertical: 10 }}>
        <TouchableOpacity
            style={[styles.filterButton, foodTypeFilter === 'All' && styles.filterButtonActive]}
            onPress={() => setFoodTypeFilter('All')}
        >
            <Text style={[styles.filterButtonText, foodTypeFilter === 'All' && styles.filterButtonTextActive]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity
            style={[styles.filterButton, foodTypeFilter === 'Veg' && styles.filterButtonActive]}
            onPress={() => setFoodTypeFilter('Veg')}
        >
            <Text style={[styles.filterButtonText, foodTypeFilter === 'Veg' && styles.filterButtonTextActive]}>Veg</Text>
        </TouchableOpacity>
        <TouchableOpacity
            style={[styles.filterButton, foodTypeFilter === 'Non Veg' && styles.filterButtonActive]}
            onPress={() => setFoodTypeFilter('Non Veg')}
        >
            <Text style={[styles.filterButtonText, foodTypeFilter === 'Non Veg' && styles.filterButtonTextActive]}>Non Veg</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, foodTypeFilter === 'Others' && styles.filterButtonActive]}
            onPress={() => setFoodTypeFilter('Others')}
          >
            <Text style={[styles.filterButtonText, foodTypeFilter === 'Others' && styles.filterButtonTextActive]}>Others</Text>
        </TouchableOpacity>
      </View>
      </View>

      {/* Content */}
      {reloading ? (
        <View style={styles.loadingContainer}>
          <LottieView
            source={require("../assets/Loading.json")}
            autoPlay
            loop={true}
            style={styles.lottie}
          />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>Refreshing donations...</Text>
        </View>
      ) : (
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#F47F24" />
              <Text style={[styles.loadingText, { color: theme.colors.text }]}>Loading donations...</Text>
            </View>
          ) : filteredDonations.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="restaurant-outline" size={80} color={theme.colors.placeholder} />
              <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No Donations Found</Text>
              <Text style={[styles.emptyText, { color: theme.colors.placeholder }]}>
                {searchQuery ? "Try adjusting your search or filters" : "Check back later for new donations"}
              </Text>
            </View>
          ) : (
            <>
              {locationLoading ? (
                <View style={{ alignItems: 'center', marginVertical: 20 }}>
                  <ActivityIndicator size="large" color="#F47F24" />
                  <Text style={{ color: '#F47F24', marginTop: 10 }}>Getting your location...</Text>
                </View>
              ) : locationError ? (
                <View style={{ alignItems: 'center', marginVertical: 20 }}>
                  <Text style={{ color: 'red', textAlign: 'center', marginBottom: 8 }}>{locationError}</Text>
                  <TouchableOpacity onPress={getUserLocation} style={{ backgroundColor: '#F47F24', padding: 10, borderRadius: 20 }}>
                    <Text style={{ color: 'white', fontWeight: 'bold' }}>Retry Location</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
              <FlatList
                data={filteredDonations}
                keyExtractor={(item) => item._id}
                renderItem={renderDonationCard}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
              />
            </>
          )}
        </Animated.View>
      )}

      {/* Donor Details Modal */}
      <Modal animationType="fade" transparent={true} visible={modalVisible}>
        <BlurView intensity={20} style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={[styles.modalBox, { backgroundColor: theme.colors.card }]}>
              {loadingDonor ? (
                <View style={styles.modalLoading}>
                  <LottieView
                    source={require("../assets/Loading.json")}
                    autoPlay
                    loop
                    style={styles.lottieSmall}
                  />
                  <Text style={[styles.modalLoadingText, { color: theme.colors.text }]}>Loading donor details...</Text>
                </View>
              ) : (
                <>
                  <View style={styles.modalHeader}>
                    <Ionicons name="person-circle" size={40} color="#F47F24" />
                    <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Donor Details</Text>
                  </View>
                  
                  <View style={styles.modalContent}>
                    <View style={styles.modalRow}>
                      <Ionicons name="person-outline" size={20} color={theme.colors.placeholder} />
                      <Text style={[styles.modalLabel, { color: theme.colors.text }]}>Name:</Text>
                      <Text style={[styles.modalValue, { color: theme.colors.text }]}>{selectedDonor?.donorName}</Text>
                    </View>
                    
                    <View style={styles.modalRow}>
                      <Ionicons name="call-outline" size={20} color={theme.colors.placeholder} />
                      <Text style={[styles.modalLabel, { color: theme.colors.text }]}>Phone:</Text>
                      <Text style={[styles.modalValue, { color: theme.colors.text }]}>{selectedDonor?.phoneNo || "N/A"}</Text>
                    </View>
                    
                    <View style={styles.modalRow}>
                      <Ionicons name="mail-outline" size={20} color={theme.colors.placeholder} />
                      <Text style={[styles.modalLabel, { color: theme.colors.text }]}>Email:</Text>
                      <Text style={[styles.modalValue, { color: theme.colors.text }]}>{selectedDonor?.email || "N/A"}</Text>
                    </View>
                    
                    <View style={styles.modalRow}>
                      <Ionicons name="location-outline" size={20} color={theme.colors.placeholder} />
                      <Text style={[styles.modalLabel, { color: theme.colors.text }]}>Location:</Text>
                      <Text style={[styles.modalValue, { color: theme.colors.text }]}>{selectedDonor?.locationName}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.modalFooterRow}>
                    <TouchableOpacity
                      style={styles.closeButton}
                      onPress={() => setModalVisible(false)}
                    >
                      <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.callButton}
                      onPress={() => {
                        if (selectedDonor?.phoneNo) {
                          Linking.openURL(`tel:${selectedDonor.phoneNo}`);
                        }
                      }}
                    >
                      <Ionicons name="call" size={24} color="#F47F24" />
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>
        </BlurView>
      </Modal>

      {/* Confetti */}
      {showConfetti && (
        <View style={styles.confettiContainer}>
          <LottieView
            source={require("../assets/Confetti.json")}
            autoPlay
            loop={false}
            style={styles.confetti}
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
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    paddingHorizontal: 20,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
  },
  searchSection: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 24,
    padding: 24,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    backgroundColor: "#fff",
    marginBottom: 18,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    paddingHorizontal: 18,
    borderWidth: 1.5,
    borderColor: "#e0e0e0",
    backgroundColor: "#f8f8f8",
    marginRight: 0,
    height: 48,
  },
  searchInput: {
    flex: 1,
    fontSize: 17,
    paddingVertical: 12,
    marginLeft: 10,
    color: "#222",
  },
  filterButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: "#f8f8f8",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  filterButtonActive: {
    backgroundColor: "#F47F24",
  },
  filterButtonText: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#F47F24",
  },
  filterButtonTextActive: {
    color: "white",
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    marginTop: 10,
  },
  lottie: {
    width: 200,
    height: 200,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  donationCard: {
    marginBottom: 20,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "#f0f0f0",
    backgroundColor: "#fff",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 10,
  },
  cardGradient: {
    borderRadius: 24,
    padding: 24,
    backgroundColor: "#fff",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  foodTypeContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  foodTypeIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 18,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 2,
    color: "#222",
  },
  foodType: {
    fontSize: 15,
    color: "#888",
  },
  quantityBadge: {
    backgroundColor: "#F47F24",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    alignItems: "center",
    minWidth: 60,
  },
  quantityText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
  quantityLabel: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.85)",
  },
  cardDetails: {
    marginBottom: 18,
    marginTop: 2,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  detailText: {
    fontSize: 15,
    marginLeft: 10,
    flex: 1,
    color: "#444",
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: "#F47F24",
    flex: 1,
    marginHorizontal: 6,
    backgroundColor: "#fff",
  },
  cartButton: {
    backgroundColor: "#F47F24",
    borderColor: "#F47F24",
  },
  claimButton: {
    backgroundColor: "#F47F24",
    borderColor: "#F47F24",
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#F47F24",
    marginLeft: 7,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    width:350,
  },
  modalBox: {
    borderRadius: 20,
    padding: 25,
    width: "100%",
    maxWidth: 350,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  modalLoading: {
    alignItems: "center",
    padding: 20,
  },
  lottieSmall: {
    width: 250,
    height: 250,
  },
  modalLoadingText: {
    fontSize: 16,
    color: "#666",
    marginTop: 10,
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginTop: 10,
  },
  modalContent: {
    marginBottom: 20,
  },
  modalRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginLeft: 8,
    width: 80,
  },
  modalValue: {
    fontSize: 16,
    color: "#666",
    flex: 1,
  },
  closeButton: {
    width: 100,
    backgroundColor: "#F47F24",
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: "center",
  },
  closeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  confettiContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  confetti: {
    width: width,
    height: height,
  },
  modalFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 18,
  },
  callButton: {
    marginLeft: 18,
    padding: 10,
    borderRadius: 20,
    backgroundColor: "#f8f8f8",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
});