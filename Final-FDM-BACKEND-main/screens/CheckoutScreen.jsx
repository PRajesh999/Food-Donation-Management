import React, { useCallback } from 'react';
import { Alert, Button } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../contexts/UserContext';
import { useCart } from '../contexts/CartContext';

const CheckoutScreen = () => {
  const navigation = useNavigation();
  const user = useUser();
  const cart = useCart();
  const isClaiming = React.useRef(false);

  const handleClaim = useCallback(async () => {
    // Validate all servings
    for (let item of cart.cartItems) {
      const val = cart.servings[item.donationId];
      if (!val || val < 1 || val > item.quantity) {
        Alert.alert("Invalid Input", `Please enter a valid number of servings for ${item.foodName}`);
        return;
      }
    }

    isClaiming.current = true;

    // Prepare the claimed items data for immediate navigation
    const claimedItemsData = cart.cartItems.map(item => ({
      ...item,
      claimed: cart.servings[item.donationId],
      coordinates: item.coordinates || {
        latitude: 16.9981,
        longitude: 82.2437
      }
    }));

    // Optimistically navigate to the map and show confetti
    cart.setShowConfetti(true);
    navigation.navigate("Map", { claimedItems: claimedItemsData });

    // Send claim to backend in the background
    try {
      const response = await fetch("http://192.168.1.5:8000/api/cart/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.email,
          claims: cart.cartItems.map(item => ({ donationId: item.donationId, servings: cart.servings[item.donationId] }))
        })
      });
      const data = await response.json();
      if (response.ok) {
        // Send notification to donor (example: to yourself)
        await fetch("http://192.168.1.5:8000/api/notifications/createNotification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: user.email, // or the donor's email if you want to notify the donor
            title: "Donation Claimed!",
            message: "Your donation has been claimed."
          })
        });
        // Clear cart and update in background
        setTimeout(async () => {
          try {
            await cart.clearCart();
            await cart.fetchCart();
            if (cart.triggerDonationUpdate) {
              cart.triggerDonationUpdate();
            }
          } catch (cartError) {
            console.log("Cart clearing error (non-critical):", cartError);
          } finally {
            isClaiming.current = false;
          }
        }, 1000);
        setTimeout(() => {
          cart.setShowConfetti(false);
        }, 1000);
      } else {
        console.error("Backend error:", data);
        Alert.alert("Error", data.message || "Failed to claim donations");
        isClaiming.current = false;
      }
    } catch (error) {
      console.error("Claim error:", error);
      isClaiming.current = false;
    }
  }, [cart.cartItems, cart.servings, user.email, cart.clearCart, cart.fetchCart, cart.triggerDonationUpdate, navigation]);

  return (
    <Button title="Claim" onPress={handleClaim} />
  );
};

export default CheckoutScreen; 