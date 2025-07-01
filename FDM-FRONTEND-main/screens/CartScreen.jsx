import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StatusBar,
  Dimensions,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "./ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import LottieView from "lottie-react-native";
import { useFocusEffect } from '@react-navigation/native';

const { width, height } = Dimensions.get("window");

const foodTypeImages = {
  "Veg": require("../assets/Veg Curry.png"),
  "Non Veg": require("../assets/Non Veg Curry.png"),
  "Others": require("../assets/Non Veg Curry.png"),
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

export default function CartScreen({ navigation }) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { cartItems, cartLoading, removeFromCart, clearCart, checkoutCart, fetchCart } = useCart();
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      fetchCart();
    }, [user?.email])
  );

  const handleRemoveFromCart = async (donationId) => {
    try {
      const success = await removeFromCart(donationId);
      if (success) {
        Alert.alert("Success", "Item removed from cart");
      } else {
        Alert.alert("Error", "Failed to remove item from cart");
      }
    } catch (error) {
      console.error("Error removing from cart:", error);
      Alert.alert("Error", "Failed to remove item from cart");
    }
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      Alert.alert("Empty Cart", "Your cart is empty. Add some items first!");
      return;
    }
    navigation.navigate("Checkout");
  };

  const handleClearCart = async () => {
    Alert.alert(
      "Clear Cart",
      "Are you sure you want to remove all items from your cart?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Clear", style: "destructive", onPress: performClearCart },
      ]
    );
  };

  const performClearCart = async () => {
    try {
      const success = await clearCart();
      if (success) {
        Alert.alert("Success", "Cart cleared successfully");
      } else {
        Alert.alert("Error", "Failed to clear cart");
      }
    } catch (error) {
      console.error("Error clearing cart:", error);
      Alert.alert("Error", "Failed to clear cart");
    }
  };

  const renderCartItem = ({ item, index }) => (
    <View style={[styles.cartItem, { backgroundColor: theme.colors.card }]}>
      <LinearGradient
        colors={[getFoodTypeColor(item.foodType) + '20', 'transparent']}
        style={styles.itemGradient}
      >
        <View style={styles.itemHeader}>
          <View style={styles.foodInfo}>
            <View style={styles.foodTypeContainer}>
              <View style={[styles.foodTypeIcon, { backgroundColor: getFoodTypeColor(item.foodType) }]}>
                <Ionicons name={getFoodTypeIcon(item.foodType)} size={20} color="white" />
              </View>
              <View style={styles.foodDetails}>
                <Text style={[styles.foodName, { color: theme.colors.text }]}>{item.foodName}</Text>
                <Text style={[styles.foodType, { color: theme.colors.placeholder }]}>{item.foodType}</Text>
              </View>
            </View>
            <View style={styles.quantityContainer}>
              <Text style={[styles.quantityText, { color: theme.colors.text }]}>{item.quantity}</Text>
              <Text style={[styles.quantityLabel, { color: theme.colors.placeholder }]}>servings</Text>
            </View>
          </View>
        </View>

        <View style={styles.itemDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="person-outline" size={16} color={theme.colors.placeholder} />
            <Text style={[styles.detailText, { color: theme.colors.text }]}>Donor: {item.donorName}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={16} color={theme.colors.placeholder} />
            <Text style={[styles.detailText, { color: theme.colors.text }]}>Location: {item.locationName}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={16} color={theme.colors.placeholder} />
            <Text style={[styles.detailText, { color: theme.colors.text }]}>
              Added: {new Date(item.addedAt).toLocaleDateString()}
            </Text>
          </View>
        </View>

        <View style={styles.itemImage}>
          <Image
            source={foodTypeImages[item.foodType] || foodTypeImages["Veg"]}
            style={styles.foodImage}
          />
        </View>

        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveFromCart(item.donationId)}
        >
          <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
          <Text style={styles.removeButtonText}>Remove</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );

  if (cartLoading && cartItems.length === 0) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}> 
        <LottieView
          source={require("../assets/Loading.json")}
          autoPlay
          loop
          style={styles.loadingAnimation}
        />
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>Loading your cart...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.dark ? "light-content" : "dark-content"} />
      
      {/* Header */}
      <LinearGradient
        colors={["#F47F24", "#FF6B35"]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Ionicons name="cart-outline" size={28} color="white" />
            <Text style={styles.headerTitle}>My Cart</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.itemCount}>{cartItems.length} items</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Cart Content */}
      {cartItems.length === 0 ? (
        <View style={styles.emptyCartContainer}>
          <LottieView
            source={require("../assets/Loading.json")}
            autoPlay
            loop
            style={styles.emptyCartAnimation}
          />
          <Text style={[styles.emptyCartTitle, { color: theme.colors.text }]}>Your cart is empty</Text>
          <Text style={[styles.emptyCartSubtitle, { color: theme.colors.placeholder }]}>
            Browse donations and add items to your cart
          </Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => navigation.navigate("Donation Listings")}
          >
            <Text style={styles.browseButtonText}>Browse Donations</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={cartItems}
            renderItem={renderCartItem}
            keyExtractor={(item) => item.donationId}
            contentContainerStyle={styles.cartList}
            showsVerticalScrollIndicator={false}
          />

          {/* Checkout Section */}
          <View style={[styles.checkoutSection, { backgroundColor: theme.colors.card }]}>
            <View style={styles.checkoutSummary}>
              <Text style={[styles.summaryText, { color: theme.colors.text }]}>
                Total Items: {cartItems.length}
              </Text>
              <Text style={[styles.summaryText, { color: theme.colors.text }]}>
                Total Servings: {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
              </Text>
            </View>
            
            <View style={styles.checkoutButtons}>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleClearCart}
              >
                <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
                <Text style={styles.clearButtonText}>Clear Cart</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.checkoutButton, checkoutLoading && styles.checkoutButtonDisabled]}
                onPress={handleCheckout}
                disabled={checkoutLoading}
              >
                {checkoutLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={20} color="white" />
                    <Text style={styles.checkoutButtonText}>Checkout</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingAnimation: {
    width: 200,
    height: 200,
  },
  loadingText: {
    fontSize: 18,
    marginTop: 20,
  },
  header: {
    paddingTop: 15,
    paddingBottom: 15,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginLeft: 12,
  },
  headerRight: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  itemCount: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyCartContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyCartAnimation: {
    width: 200,
    height: 200,
  },
  emptyCartTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
  },
  emptyCartSubtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 30,
  },
  browseButton: {
    backgroundColor: "#F47F24",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  browseButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  cartList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    marginTop:20
  },
  cartItem: {
    marginBottom: 20,
    borderRadius: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  itemGradient: {
    borderRadius: 20,
    padding: 20,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  foodInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  foodTypeContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  foodTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  foodDetails: {
    flex: 1,
  },
  foodName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 2,
  },
  foodType: {
    fontSize: 14,
  },
  quantityContainer: {
    alignItems: "center",
    marginLeft: 15,
  },
  quantityText: {
    fontSize: 20,
    fontWeight: "bold",
  },
  quantityLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  itemDetails: {
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    marginLeft: 10,
    flex: 1,
  },
  itemImage: {
    position: "absolute",
    top: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: "hidden",
  },
  foodImage: {
    width: "100%",
    height: "100%",
  },
  removeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    marginTop: 10,
  },
  removeButtonText: {
    color: "#FF6B6B",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 5,
  },
  checkoutSection: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  checkoutSummary: {
    marginBottom: 20,
  },
  summaryText: {
    fontSize: 16,
    marginBottom: 5,
  },
  checkoutButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#FF6B6B",
    flex: 1,
    marginRight: 10,
  },
  clearButtonText: {
    color: "#FF6B6B",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 5,
  },
  checkoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    backgroundColor: "#F47F24",
    flex: 2,
  },
  checkoutButtonDisabled: {
    backgroundColor: "#ccc",
  },
  checkoutButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 5,
  },
}); 