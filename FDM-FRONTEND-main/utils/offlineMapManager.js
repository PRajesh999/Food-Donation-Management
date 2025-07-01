import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

class OfflineMapManager {
  constructor() {
    this.mapCacheKey = 'offline_map_data';
    this.tileCacheKey = 'map_tiles_cache';
    this.cacheExpiry = 7 * 24 * 60 * 60 * 1000; // 7 days
  }

  // Check if offline map is available
  async isOfflineMapAvailable() {
    try {
      const mapData = await AsyncStorage.getItem(this.mapCacheKey);
      if (!mapData) return false;

      const parsedData = JSON.parse(mapData);
      const isExpired = Date.now() - parsedData.timestamp > this.cacheExpiry;
      
      return !isExpired && parsedData.region;
    } catch (error) {
      console.log('Error checking offline map availability:', error);
      return false;
    }
  }

  // Get cached map region
  async getCachedMapRegion() {
    try {
      const mapData = await AsyncStorage.getItem(this.mapCacheKey);
      if (!mapData) {
        return null;
      }

      const parsedData = JSON.parse(mapData);
      return parsedData.region;
    } catch (error) {
      console.log('Error getting cached map region:', error);
      return null;
    }
  }

  // Cache map region and data
  async cacheMapRegion(region, mapItems = []) {
    try {
      const mapData = {
        region,
        mapItems,
        timestamp: Date.now()
      };

      await AsyncStorage.setItem(this.mapCacheKey, JSON.stringify(mapData));
    } catch (error) {
      console.log('Error caching map region:', error);
    }
  }

  // Get cached map items
  async getCachedMapItems() {
    try {
      const mapData = await AsyncStorage.getItem(this.mapCacheKey);
      if (!mapData) {
        return [];
      }

      const parsedData = JSON.parse(mapData);
      return parsedData.mapItems || [];
    } catch (error) {
      console.log('Error getting cached map items:', error);
      return [];
    }
  }

  // Preload map data for faster loading
  async preloadMapData(region, mapItems) {
    try {
      // Cache the region and items
      await this.cacheMapRegion(region, mapItems);
      
      // Store map items in memory for instant access
      this.memoryCache = {
        region,
        mapItems,
        timestamp: Date.now()
      };
    } catch (error) {
      console.log('Error preloading map data:', error);
    }
  }

  // Get map data from memory cache (fastest)
  getMemoryCachedData() {
    if (this.memoryCache && Date.now() - this.memoryCache.timestamp < this.cacheExpiry) {
      return this.memoryCache;
    }
    return null;
  }

  // Clear all cached map data
  async clearMapCache() {
    try {
      await AsyncStorage.removeItem(this.mapCacheKey);
      await AsyncStorage.removeItem(this.tileCacheKey);
      this.memoryCache = null;
      console.log('Map cache cleared successfully');
    } catch (error) {
      console.log('Error clearing map cache:', error);
    }
  }

  // Get cache size
  async getCacheSize() {
    try {
      const mapData = await AsyncStorage.getItem(this.mapCacheKey);
      return mapData ? JSON.stringify(mapData).length : 0;
    } catch (error) {
      console.log('Error getting cache size:', error);
      return 0;
    }
  }

  // Check if we should use offline mode
  async shouldUseOfflineMode() {
    const isAvailable = await this.isOfflineMapAvailable();
    const memoryData = this.getMemoryCachedData();
    
    return isAvailable || memoryData !== null;
  }
}

// Global instance
export const offlineMapManager = new OfflineMapManager();

// Default map region for your area
export const DEFAULT_MAP_REGION = {
  latitude: 16.9981,
  longitude: 82.2437,
  latitudeDelta: 0.2,
  longitudeDelta: 0.2,
};

// Utility functions
export const preloadMapForLocation = async (latitude, longitude, mapItems = []) => {
  const region = {
    latitude,
    longitude,
    latitudeDelta: 0.2,
    longitudeDelta: 0.2,
  };
  
  await offlineMapManager.preloadMapData(region, mapItems);
};

export const getOfflineMapData = async () => {
  // First try memory cache (fastest)
  const memoryData = offlineMapManager.getMemoryCachedData();
  if (memoryData) {
    return memoryData;
  }

  // Then try storage cache
  const region = await offlineMapManager.getCachedMapRegion();
  const mapItems = await offlineMapManager.getCachedMapItems();
  
  if (region) {
    return { region, mapItems };
  }

  // Fallback to default
  return {
    region: DEFAULT_MAP_REGION,
    mapItems: []
  };
};

export default offlineMapManager; 