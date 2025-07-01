import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  Linking,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../screens/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import axios from "axios";
import * as Location from 'expo-location';
import API_BASE_URL from '../config/apiConfig';

const { width, height } = Dimensions.get("window");

export default function MapScreen({ navigation, route }) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { cartItems, clearCart } = useCart();
  
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 16.9981,
    longitude: 82.2437,
    latitudeDelta: 0.2,
    longitudeDelta: 0.2,
  });
  const [userLocation, setUserLocation] = useState(null);

  // Check if we're coming from checkout with claimed items
  const claimedItems = route.params?.claimedItems;

  useEffect(() => {
    if (claimedItems) {
      setDonations([]);
      setLoading(false);
    } else {
      fetchDonations();
    }
  }, [claimedItems]);

  // Get user location on mount
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setUserLocation(null);
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      setUserLocation(location.coords);
    })();
  }, []);

  const fetchDonations = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/donations/get-donations`);
      const donationsData = res.data.data || [];
      setDonations(donationsData);
    } catch (err) {
      console.error("Failed to load donations:", err);
      setDonations([]);
    } finally {
      setLoading(false);
    }
  };

  // Memoized map items
  const mapItems = useMemo(() => {
    if (claimedItems) {
      return claimedItems;
    }
    return donations;
  }, [claimedItems, donations]);

  // Memoized marker color function
  const getMarkerColor = useCallback((donation) => {
    if (claimedItems) return "#4CAF50"; // Green for claimed items
    return "#FF6B6B"; // Red for available donations
  }, [claimedItems]);

  // Haversine formula for distance in km
  const getDistance = (lat1, lon1, lat2, lon2) => {
    function toRad(x) { return x * Math.PI / 180; }
    const R = 6371; // km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Memoized markers to prevent re-rendering
  const mapMarkers = useMemo(() => {
    if (!mapItems || mapItems.length === 0) {
      return [];
    }

    return mapItems
      .filter(donation => {
        return donation.coordinates && donation.coordinates.latitude && donation.coordinates.longitude;
      })
      .map((donation) => {
        const coords = donation.coordinates;
        return (
          <Marker
            key={donation._id || donation.id}
            coordinate={{
              latitude: parseFloat(coords.latitude),
              longitude: parseFloat(coords.longitude),
            }}
            title={donation.foodName}
            description={`${donation.claimed ?? donation.quantity} - ${donation.locationName}`}
            onPress={() => {
              setSelectedLocation({
                ...donation,
                latitude: parseFloat(coords.latitude),
                longitude: parseFloat(coords.longitude),
              });
            }}
          >
            <View style={[styles.marker, { backgroundColor: getMarkerColor(donation) }]}>
              <Ionicons name="restaurant" size={16} color="white" />
            </View>
          </Marker>
        );
      });
  }, [mapItems, getMarkerColor]);

  const handleClaimDonation = async (donation) => {
    if (!user?.email) {
      Alert.alert("Error", "Please login to claim donations");
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/donations/claim-donation`,
        {
          donationId: donation._id,
          userEmail: user.email,
        }
      );

      if (response.data.success) {
        Alert.alert(
          "Success!",
          "Donation claimed successfully. You can now view it in your cart.",
          [
            {
              text: "View Cart",
              onPress: () => navigation.navigate("Cart"),
            },
            {
              text: "Continue Browsing",
              style: "cancel",
            },
          ]
        );
        
        // Refresh donations to show updated status
        fetchDonations();
      }
    } catch (error) {
      console.error("Error claiming donation:", error);
      Alert.alert("Error", "Failed to claim donation. Please try again.");
    }
  };

  const handleViewCart = () => {
    navigation.navigate("Cart");
  };

  const handleViewDonations = () => {
    navigation.navigate("DonationListings");
  };

  // Open directions in Google Maps
  const openDirections = (latitude, longitude, locationName) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    Linking.openURL(url);
  };

  // Start navigation in Google Maps
  const startNavigation = (latitude, longitude, locationName) => {
    const url = `google.navigation:q=${latitude},${longitude}`;
    Linking.openURL(url);
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>
          Loading map...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={mapRegion}
        onRegionChangeComplete={setMapRegion}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {mapMarkers}
      </MapView>

      {/* Popup Card for Selected Location */}
      {selectedLocation && (
        <View style={styles.selectedCardContainer}>
          <View style={styles.selectedCard}>
            <Text style={styles.selectedCardTitle}>{selectedLocation.foodName}</Text>
            <Text style={styles.selectedCardDetail}>Quantity: {selectedLocation.claimed ?? selectedLocation.quantity}</Text>
            <Text style={styles.selectedCardDetail}>Location: {selectedLocation.locationName}</Text>
            {userLocation && (
              <Text style={styles.selectedCardDetail}>
                Distance: {getDistance(userLocation.latitude, userLocation.longitude, selectedLocation.latitude, selectedLocation.longitude).toFixed(2)} km
              </Text>
            )}
            <View style={styles.selectedCardButtons}>
              <TouchableOpacity
                style={[styles.selectedCardButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => openDirections(selectedLocation.latitude, selectedLocation.longitude, selectedLocation.locationName)}
              >
                <Ionicons name="map" size={18} color="white" />
                <Text style={styles.selectedCardButtonText}>Get Directions</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.selectedCardButton, { backgroundColor: '#4CAF50' }]}
                onPress={() => startNavigation(selectedLocation.latitude, selectedLocation.longitude, selectedLocation.locationName)}
              >
                <Ionicons name="navigate" size={18} color="white" />
                <Text style={styles.selectedCardButtonText}>Start</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.closeCardButton}
              onPress={() => setSelectedLocation(null)}
            >
              <Ionicons name="close" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Stats Card */}
      {!claimedItems && (
        <View style={[styles.statsCard, { backgroundColor: 'white' }]}>
          <View style={styles.statItem}>
            <Ionicons name="restaurant" size={24} color={theme.colors.primary} />
            <Text style={[styles.statNumber, { color: '#333' }]}>
              {mapItems.length}
            </Text>
            <Text style={[styles.statLabel, { color: '#666' }]}>
              Available
            </Text>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <Ionicons name="location" size={24} color={theme.colors.primary} />
            <Text style={[styles.statNumber, { color: '#333' }]}>
              {mapItems.filter(d => d.coordinates).length}
            </Text>
            <Text style={[styles.statLabel, { color: '#666' }]}>
              Mapped
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 10,
    flex: 1,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 6,
    fontSize: 15,
  },
  statsCard: {
    position: 'absolute',
    top: 150,
    right: 15,
    padding: 18,
    borderRadius: 15,
    backgroundColor: 'white',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  statItem: {
    alignItems: 'center',
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 6,
    color: '#333',
  },
  statLabel: {
    fontSize: 13,
    marginTop: 3,
    color: '#666',
  },
  statDivider: {
    width: '100%',
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 8,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  marker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  selectedCardContainer: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  selectedCard: {
    padding: 20,
    borderRadius: 15,
    backgroundColor: 'white',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedCardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  selectedCardDetail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  selectedCardButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  selectedCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  selectedCardButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 6,
    fontSize: 15,
  },
  closeCardButton: {
    position: 'absolute',
    top: -12,
    right: -12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F44336',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});
