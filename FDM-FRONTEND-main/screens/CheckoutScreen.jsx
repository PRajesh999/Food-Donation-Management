import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
  Image,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "./ThemeContext";
import { useCart } from "../context/CartContext";
import LottieView from "lottie-react-native";
import { useAuth } from "../context/AuthContext";

const { width } = Dimensions.get("window");

const foodTypeImages = {
  "Veg": require("../assets/Veg Curry.png"),
  "Non Veg": require("../assets/Non Veg Curry.png"),
  "Others": require("../assets/FoodOnTable.png"),
};

export default function CheckoutScreen({ navigation }) {
  const { theme } = useTheme();
  const { cartItems, clearCart, fetchCart } = useCart();
  const { user, triggerDonationUpdate } = useAuth();
  const [servings, setServings] = useState(
    cartItems.reduce((acc, item) => {
      acc[item.donationId] = 1;
      return acc;
    }, {})
  );
  const [claiming, setClaiming] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const hasNavigatedToCart = useRef(false);
  const isClaiming = useRef(false); // Track if we're in the middle of claiming

  // Handle empty cart navigation - but not during claiming
  useEffect(() => {
    if (cartItems.length === 0 && !hasNavigatedToCart.current && !isClaiming.current) {
      hasNavigatedToCart.current = true;
      navigation.replace("Cart");
    }
  }, [cartItems.length, navigation]);

  // Initialize servings for all cart items, even if cart changes
  useEffect(() => {
    setServings((prev) => {
      const updated = { ...prev };
      cartItems.forEach(item => {
        if (updated[item.donationId] === undefined) {
          updated[item.donationId] = 1;
        }
      });
      // Remove servings for items no longer in cart
      Object.keys(updated).forEach(key => {
        if (!cartItems.find(item => item.donationId === key)) {
          delete updated[key];
        }
      });
      return updated;
    });
  }, [cartItems]);

  const handleChange = useCallback((donationId, value, max) => {
    if (value < 1) value = 1;
    if (value > max) value = max;
    setServings((prev) => ({ ...prev, [donationId]: value }));
  }, []);

  const handleClaim = useCallback(async () => {
    // Validate all servings
    for (let item of cartItems) {
      const val = servings[item.donationId];
      if (!val || val < 1 || val > item.quantity) {
        Alert.alert("Invalid Input", `Please enter a valid number of servings for ${item.foodName}`);
        return;
      }
    }
    
    setClaiming(true);
    isClaiming.current = true; // Set claiming flag to prevent cart navigation
    
    try {
      console.log("Starting claim process...");
      
      // Prepare the claimed items data for immediate navigation
      const claimedItemsData = cartItems.map(item => ({ 
        ...item, 
        claimed: servings[item.donationId],
        // Ensure coordinates exist for map display
        coordinates: item.coordinates || {
          latitude: 16.9981, // Default coordinates if not available
          longitude: 82.2437
        }
      }));
      
      console.log("Claimed items data:", claimedItemsData);

      // Send claim to backend
      console.log("Sending claim to backend...");
      const response = await fetch("http://192.168.1.2:8000/api/cart/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.email,
          claims: cartItems.map(item => ({ donationId: item.donationId, servings: servings[item.donationId] }))
        })
      });
      
      console.log("Backend response status:", response.status);
      const data = await response.json();
      console.log("Backend response data:", data);
      
      if (response.ok) {
        console.log("Claim successful, navigating to map...");
        
        // Show confetti briefly and navigate immediately
        setShowConfetti(true);
        
        // Navigate to map FIRST, then clear cart in background
        console.log("Navigating to Map with claimed items:", claimedItemsData);
        navigation.navigate("Map", { claimedItems: claimedItemsData });
        
        // Clear cart and update in background AFTER navigation
        setTimeout(async () => {
          try {
            await clearCart();
            await fetchCart();
            if (triggerDonationUpdate) {
              triggerDonationUpdate();
            }
          } catch (cartError) {
            console.log("Cart clearing error (non-critical):", cartError);
          } finally {
            isClaiming.current = false; // Reset claiming flag
          }
        }, 1000);
        
        // Hide confetti after a short delay
        setTimeout(() => {
          setShowConfetti(false);
        }, 1000);
      } else {
        console.error("Backend error:", data);
        Alert.alert("Error", data.message || "Failed to claim donations");
        isClaiming.current = false; // Reset claiming flag on error
      }
    } catch (error) {
      console.error("Claim error:", error);
      
      // If there's a network error, still try to navigate to map with the data we have
      if (error.message.includes("Network request failed")) {
        console.log("Network error, but navigating to map anyway...");
        
        const claimedItemsData = cartItems.map(item => ({ 
          ...item, 
          claimed: servings[item.donationId],
          // Ensure coordinates exist for map display
          coordinates: item.coordinates || {
            latitude: 16.9981, // Default coordinates if not available
            longitude: 82.2437
          }
        }));
        
        Alert.alert(
          "Network Error", 
          "Unable to connect to server, but you can still view your claimed items on the map.",
          [
            {
              text: "View Map",
              onPress: () => {
                setShowConfetti(true);
                navigation.navigate("Map", { claimedItems: claimedItemsData });
                setTimeout(() => {
                  setShowConfetti(false);
                  isClaiming.current = false; // Reset claiming flag
                }, 1000);
              }
            },
            {
              text: "Cancel",
              style: "cancel",
              onPress: () => {
                isClaiming.current = false; // Reset claiming flag
              }
            }
          ]
        );
      } else {
        Alert.alert("Error", "Failed to claim donations: " + error.message);
        isClaiming.current = false; // Reset claiming flag on error
      }
    } finally {
      setClaiming(false);
    }
  }, [cartItems, servings, user.email, clearCart, fetchCart, triggerDonationUpdate, navigation]);

  const allValid = cartItems.every(
    (item) => servings[item.donationId] && servings[item.donationId] >= 1 && servings[item.donationId] <= item.quantity
  );

  if (cartItems.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>Press back will Redirect you to cart...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}> 
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={[styles.header, { color: theme.colors.primary }]}>Checkout</Text>
        {cartItems.filter(item => item.quantity > 0 && servings[item.donationId] > 0).map((item) => (
          <View key={item.donationId} style={[styles.itemCard, { backgroundColor: theme.colors.card }]}> 
            <View style={styles.itemRow}>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.foodName, { color: theme.colors.text }]}>{item.foodName}</Text>
                <Text style={[styles.foodType, { color: theme.colors.placeholder }]}>{item.foodType}</Text>
                <Text style={[styles.available, { color: theme.colors.text }]}>Available: {item.quantity}</Text>
                <View style={styles.servingRow}>
                  <TouchableOpacity
                    style={styles.countButton}
                    onPress={() => handleChange(item.donationId, servings[item.donationId] - 1, item.quantity)}
                  >
                    <Ionicons name="remove-circle-outline" size={24} color={theme.colors.primary} />
                  </TouchableOpacity>
                  <Text style={[styles.servingCount, { color: theme.colors.text }]}>{servings[item.donationId]}</Text>
                  <TouchableOpacity
                    style={styles.countButton}
                    onPress={() => handleChange(item.donationId, servings[item.donationId] + 1, item.quantity)}
                  >
                    <Ionicons name="add-circle-outline" size={24} color={theme.colors.primary} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.servingLabel}>How many servings do you need?</Text>
              </View>
              <Image source={foodTypeImages[item.foodType] || foodTypeImages["Veg"]} style={styles.foodImage} />
            </View>
          </View>
        ))}
        <TouchableOpacity
          style={[styles.claimButton, { backgroundColor: allValid ? theme.colors.primary : '#ccc' }]}
          onPress={handleClaim}
          disabled={!allValid || claiming}
        >
          {claiming ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.claimButtonText}>Claim & View Map</Text>
          )}
        </TouchableOpacity>
        
        {/* Test button for debugging */}
        <TouchableOpacity
          style={[styles.testButton, { backgroundColor: theme.colors.primary, marginTop: 10 }]}
          onPress={() => {
            console.log("Test navigation to Map...");
            navigation.navigate("Map", { 
              claimedItems: cartItems.map(item => ({ 
                ...item, 
                claimed: 1,
                coordinates: { latitude: 16.9981, longitude: 82.2437 }
              }))
            });
          }}
        >
          <Text style={styles.claimButtonText}>Test Map Navigation</Text>
        </TouchableOpacity>
      </ScrollView>
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
  container: { flex: 1 },
  scrollContainer: { padding: 20, paddingBottom: 40 },
  header: { fontSize: 28, fontWeight: "bold", marginBottom: 10, textAlign: "center", marginTop:20 },
  itemCard: { borderRadius: 16, padding: 16, marginBottom: 18, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 },
  itemRow: { flexDirection: 'row', alignItems: 'center' },
  foodImage: { width: 120, height: 120, borderRadius: 12, backgroundColor: '#eee' },
  foodName: { fontSize: 17, fontWeight: 'bold' },
  foodType: { fontSize: 13, marginBottom: 2 },
  available: { fontSize: 13, marginBottom: 6 },
  servingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6,},
  countButton: { padding: 2,},
  servingCount: { fontSize: 18, fontWeight: 'bold', marginHorizontal: 12 },
  servingLabel: { fontSize: 12, color: '#888', marginTop: 2 },
  claimButton: { marginTop: 30, borderRadius: 24, paddingVertical: 16, alignItems: 'center' },
  claimButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  confettiContainer: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  confetti: { width: width, height: 300 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 18, color: '#888' },
  testButton: { marginTop: 10, borderRadius: 24, paddingVertical: 16, alignItems: 'center' },
}); 