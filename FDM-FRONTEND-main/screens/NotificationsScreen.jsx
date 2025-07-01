import React, { useState, useRef, useMemo, useEffect } from "react";
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  StatusBar,
  Dimensions,
  ScrollView,
  Animated,
  Alert,
  Linking,
  RefreshControl,
  Platform
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "./ThemeContext";
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import API_BASE_URL from '../config/apiConfig';

const { width, height } = Dimensions.get("window");

export default function NotificationsScreen({ navigation }) {
  const { theme } = useTheme();
  const [selectedFilter, setSelectedFilter] = useState("all");
  const { user } = useAuth();
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead } = useNotifications();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  const getFilteredNotifications = () => {
    if (selectedFilter === "all") return notifications;
    if (selectedFilter === "unread") return notifications.filter(n => !n.read);
    return notifications.filter(notification => notification.type === selectedFilter);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "donation_claimed": return "checkmark-circle";
      case "donation_expired": return "time";
      case "new_donation": return "add-circle";
      case "reminder": return "notifications";
      case "test": return "flask";
      case "location": return "location";
      case "warning": return "warning";
      case "success": return "checkmark-circle";
      case "info": return "information-circle";
      default: return "notifications";
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case "donation_claimed": return "#4CAF50";
      case "donation_expired": return "#FF9800";
      case "new_donation": return "#2196F3";
      case "reminder": return "#9C27B0";
      case "test": return "#607D8B";
      case "location": return "#2196F3";
      case "warning": return "#FF9800";
      case "success": return "#4CAF50";
      case "info": return "#2196F3";
      default: return "#F47F24";
    }
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const handlePress = (item) => {
    if (!item.read) {
      markAsRead(item._id);
    }
    
    if (item.data && item.data.mapUrl) {
      Linking.openURL(item.data.mapUrl);
    }
  };

  const clearNotifications = async () => {
    Alert.alert(
      "Clear All Notifications",
      "Are you sure you want to clear all notifications? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Clear All", 
          style: "destructive",
          onPress: async () => {
            try {
              await axios.delete(`${API_BASE_URL}/notifications/clear-all`, {
                data: { email: user.email }
              });
              console.log('✅ Cleared all notifications');
              fetchNotifications();
            } catch (error) {
              console.error('❌ Error clearing notifications:', error);
            }
          }
        }
      ]
    );
  };

  const handleMarkAllAsRead = () => {
    Alert.alert(
      "Mark All as Read",
      "Are you sure you want to mark all notifications as read?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Mark All Read", 
          onPress: () => markAllAsRead()
        }
      ]
    );
  };

  const renderNotificationCard = ({ item, index }) => {
    const notificationColor = getNotificationColor(item.type || 'default');
    const notificationIcon = getNotificationIcon(item.type || 'default');
    
    return (
      <Animated.View
        style={[
          styles.notificationCard, 
          { backgroundColor: theme.colors.card },
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <TouchableOpacity 
          style={styles.notificationContent}
          onPress={() => handlePress(item)}
          activeOpacity={0.7}
        >
          {/* Left Icon Section */}
          <View style={[styles.iconContainer, { backgroundColor: notificationColor + '20' }]}>
            <Ionicons name={notificationIcon} size={24} color={notificationColor} />
            {!item.read && <View style={[styles.unreadDot, { backgroundColor: notificationColor }]} />}
              </View>
              
          {/* Center Content Section */}
          <View style={styles.contentSection}>
            <View style={styles.headerRow}>
              <Text style={[styles.notificationTitle, { color: theme.colors.text }]} numberOfLines={2}>
                  {item.title}
                </Text>
              <Text style={[styles.timestamp, { color: theme.colors.textSecondary }]}>
                {getTimeAgo(item.timestamp)}
                  </Text>
              </View>
              
            <Text style={[styles.notificationMessage, { color: theme.colors.textSecondary }]} numberOfLines={3}>
                {item.message}
              </Text>
              
            {/* Action Buttons */}
            {item.data && item.data.mapUrl && (
                  <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => Linking.openURL(item.data.mapUrl)}
                  >
                <Ionicons name="map-outline" size={16} color={notificationColor} />
                <Text style={[styles.actionButtonText, { color: notificationColor }]}>
                  View Location
                    </Text>
                  </TouchableOpacity>
                )}
            </View>

          {/* Right Action Section */}
            <View style={styles.actionSection}>
            {!item.read && (
              <TouchableOpacity 
                style={styles.markReadButton}
                onPress={() => markAsRead(item._id)}
              >
                <Ionicons name="checkmark" size={16} color="#4CAF50" />
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderFilterChip = (filter, label, count = null) => {
    const isSelected = selectedFilter === filter;
    const filterColor = getNotificationColor(filter);
    
    return (
      <TouchableOpacity
        style={[
          styles.filterChip,
          isSelected && { backgroundColor: filterColor + '20', borderColor: filterColor }
        ]}
        onPress={() => setSelectedFilter(filter)}
        activeOpacity={0.7}
      >
        <Ionicons 
          name={getNotificationIcon(filter)} 
          size={16} 
          color={isSelected ? filterColor : theme.colors.textSecondary} 
        />
        <Text style={[
          styles.filterChipText,
          { color: isSelected ? filterColor : theme.colors.textSecondary }
        ]}>
          {label}
        </Text>
        {count !== null && count > 0 && (
          <View style={[styles.filterBadge, { backgroundColor: filterColor }]}>
            <Text style={styles.filterBadgeText}>{count}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const ListHeader = () => (
    <View style={styles.headerContainer}>
      {/* Filter Chips */}
      <View style={[styles.filterContainer, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
      <View style={{ flex: 1, alignItems: 'center' }}>
        {renderFilterChip("all", "All", notifications.length)}
      </View>
      <View style={{ flex: 1, alignItems: 'center' }}>
        {renderFilterChip("unread", "Unread", unreadCount)}
      </View>
      </View>
    </View>
  );

  const ListEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Animated.View style={[styles.emptyIcon, { opacity: fadeAnim }]}>
        <Ionicons name="notifications-off" size={80} color={theme.colors.textSecondary} />
      </Animated.View>
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
        No Notifications Yet
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
        You'll see your notifications here when they arrive
      </Text>
    </View>
  );

  useEffect(() => {
    fetchNotifications();
  }, [user?.email]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchNotifications();
    });

    return unsubscribe;
  }, [navigation, user?.email]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="#F47F24" />
      
      {/* Header */}
      <LinearGradient
        colors={["#F47F24", "#FF6B35"]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>Notifications</Text>
            {unreadCount > 0 && (
              <View style={styles.unreadCountBadge}>
                <Text style={styles.unreadCountText}>{unreadCount}</Text>
              </View>
            )}
          </View>
          
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={handleMarkAllAsRead}
              disabled={unreadCount === 0}
            >
              <Ionicons name="checkmark-done" size={20} color="white" />
              <Text style={styles.headerButtonText}>Mark All Read</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={clearNotifications}
            >
              <Ionicons name="trash-outline" size={20} color="white" />
              <Text style={styles.headerButtonText}>Clear All</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Content */}
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim }
            ]
          }
        ]}
      >
        <FlatList
          data={getFilteredNotifications()}
          keyExtractor={item => item._id?.toString() || Math.random().toString()}
          renderItem={renderNotificationCard}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={ListEmptyComponent}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#F47F24"
              colors={["#F47F24"]}
            />
          }
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
    marginRight: 10,
  },
  unreadCountBadge: {
    backgroundColor: "#FF6B35",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
  },
  unreadCountText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "white",
  },
  headerActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  headerButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  headerButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "white",
    marginLeft: 6,
  },
  content: {
    flex: 1,
    marginTop: 15,
  },
  listContainer: {
    paddingBottom: 20,
  },
  headerContainer: {
    marginBottom: 20,
  },
  filterContainer: {
    marginBottom: 0,
  },
  filterScroll: {
    paddingHorizontal: 20,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    marginRight: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  filterBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 6,
    minWidth: 18,
    alignItems: 'center',
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "white",
  },
  notificationCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor:"white"
  },
  notificationContent: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    backgroundColor:"white"
  },
  iconContainer: {
    marginRight: 16,
    alignItems: "center",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  contentSection: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    marginRight: 8,
  },
  timestamp: {
    fontSize: 12,
    fontWeight: "500",
  },
  notificationMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  actionSection: {
    marginLeft: 8,
    justifyContent: "center",
  },
  markReadButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(76, 175, 80, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    marginTop: 60,
  },
  emptyIcon: {
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
});

