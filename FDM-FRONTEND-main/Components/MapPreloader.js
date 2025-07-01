import React, { useEffect } from 'react';
import axios from 'axios';
import { cacheDonations, cacheCartItems } from '../utils/mapCache';
import { preloadMapForLocation } from '../utils/offlineMapManager';
import { useAuth } from '../context/AuthContext';
import API_BASE_URL from '../config/apiConfig';

// Component to preload map data in background
const MapPreloader = () => {
  const { user } = useAuth();
  
  useEffect(() => {
    const preloadMapData = async () => {
      try {
        console.log('Starting map data preloading...');
        
        // Preload donations data
        const donationsResponse = await axios.get(`${API_BASE_URL}/donations/get-donations`);
        if (donationsResponse.data?.data) {
          const donationsData = donationsResponse.data.data;
          cacheDonations(donationsData);
          
          // Preload offline map data if we have donations with coordinates
          if (donationsData.length > 0) {
            const firstItem = donationsData[0];
            if (firstItem.coordinates) {
              console.log('Preloading offline map data...');
              await preloadMapForLocation(
                firstItem.coordinates.latitude,
                firstItem.coordinates.longitude,
                donationsData
              );
            }
          }
        }

        // Preload cart items if user email is available
        if (user?.email) {
          const cartResponse = await fetch(`${API_BASE_URL}/cart/${encodeURIComponent(user.email)}`);
          if (cartResponse.ok) {
            const cartData = await cartResponse.json();
            if (cartData.items) {
              cacheCartItems(cartData.items);
            }
          }
        }
        
        console.log('Map data preloading completed successfully');
      } catch (error) {
        console.log('Map preloading failed:', error.message);
        // Silent fail - this is just for optimization
      }
    };

    // Preload data after a short delay to not block initial app load
    const timer = setTimeout(preloadMapData, 2000);
    
    return () => clearTimeout(timer);
  }, [user?.email]);

  // This component doesn't render anything
  return null;
};

export default MapPreloader; 