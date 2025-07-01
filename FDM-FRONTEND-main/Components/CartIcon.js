import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';

const CartIcon = ({ navigation, color = "white", size = 28 }) => {
  const { cartItemCount } = useCart();

  return (
    <TouchableOpacity
      style={styles.cartIconContainer}
      onPress={() => navigation.navigate("Cart")}
    >
      <Ionicons name="cart-outline" size={size} color={color} />
      {cartItemCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {cartItemCount > 99 ? '99+' : cartItemCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cartIconContainer: {
    position: 'relative',
    padding: 20,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default CartIcon; 