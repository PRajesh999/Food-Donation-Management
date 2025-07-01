import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import API_BASE_URL from '../config/apiConfig';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [cartLoading, setCartLoading] = useState(false);
  const { user } = useAuth();

  const fetchCart = async () => {
    if (!user?.email) return;
    
    try {
      setCartLoading(true);
      const response = await fetch(`${API_BASE_URL}/cart/${encodeURIComponent(user.email)}`);
      
      if (response.ok) {
        const data = await response.json();
        setCartItems(data.items || []);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setCartLoading(false);
    }
  };

  const addToCart = async (donationId) => {
    if (!user?.email) return false;
    try {
      const url = `${API_BASE_URL}/cart/add`;
      const payload = {
        userId: user.email,
        donationId,
      };
      console.log("[CartContext] addToCart URL:", url);
      console.log("[CartContext] addToCart payload:", payload);
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      console.log("[CartContext] addToCart response status:", response.status);
      let responseData;
      try {
        responseData = await response.json();
        console.log("[CartContext] addToCart response data:", responseData);
      } catch (e) {
        responseData = null;
        console.log("[CartContext] addToCart response not JSON");
      }
      if (response.ok) {
        await fetchCart(); // Refresh cart
        return true;
      }
      // Check for already exists error from backend
      if (responseData && (responseData.message?.toLowerCase().includes('already') || responseData.error?.toLowerCase().includes('already'))) {
        return 'exists';
      }
      return false;
    } catch (error) {
      console.error('[CartContext] Error adding to cart:', error);
      return false;
    }
  };

  const removeFromCart = async (donationId) => {
    if (!user?.email) return false;
    
    try {
      const response = await fetch(`${API_BASE_URL}/cart/remove`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.email,
          donationId,
        }),
      });

      if (response.ok) {
        await fetchCart(); // Refresh cart
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error removing from cart:', error);
      return false;
    }
  };

  const clearCart = async () => {
    if (!user?.email) return false;
    
    try {
      const response = await fetch(`${API_BASE_URL}/cart/clear/${encodeURIComponent(user.email)}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setCartItems([]);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error clearing cart:', error);
      return false;
    }
  };

  const checkoutCart = async () => {
    if (!user?.email) return false;
    
    try {
      const response = await fetch(`${API_BASE_URL}/cart/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.email,
        }),
      });

      if (response.ok) {
        setCartItems([]);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error checking out cart:', error);
      return false;
    }
  };

  useEffect(() => {
    if (user?.email) {
      fetchCart();
    } else {
      setCartItems([]);
    }
  }, [user?.email]);

  const value = {
    cartItems,
    cartLoading,
    cartItemCount: cartItems.length,
    fetchCart,
    addToCart,
    removeFromCart,
    clearCart,
    checkoutCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}; 