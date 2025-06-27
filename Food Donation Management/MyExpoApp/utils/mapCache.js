// Map cache utility for better performance
class MapCache {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Set cache with timestamp
  set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  // Get cache if not expired
  get(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > this.cacheTimeout;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  // Clear expired cache entries
  cleanup() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.cacheTimeout) {
        this.cache.delete(key);
      }
    }
  }

  // Clear all cache
  clear() {
    this.cache.clear();
  }

  // Get cache size
  size() {
    return this.cache.size;
  }
}

// Global map cache instance
export const mapCache = new MapCache();

// Cache keys
export const CACHE_KEYS = {
  DONATIONS: 'donations',
  CART_ITEMS: 'cart_items',
  USER_LOCATION: 'user_location'
};

// Utility functions for map data
export const cacheDonations = (donations) => {
  mapCache.set(CACHE_KEYS.DONATIONS, donations);
};

export const getCachedDonations = () => {
  return mapCache.get(CACHE_KEYS.DONATIONS);
};

export const cacheCartItems = (cartItems) => {
  mapCache.set(CACHE_KEYS.CART_ITEMS, cartItems);
};

export const getCachedCartItems = () => {
  return mapCache.get(CACHE_KEYS.CART_ITEMS);
};

// Cleanup cache periodically
setInterval(() => {
  mapCache.cleanup();
}, 60000); // Cleanup every minute

export default mapCache; 