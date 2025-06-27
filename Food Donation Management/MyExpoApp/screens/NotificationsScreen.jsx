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

const { width, height } = Dimensions.get("window");

const notifications = [
  { 
    id: "1", 
    type: "success",
    title: "Donation Claimed!",
    message: "Your rice donation was successfully claimed by John D.", 
    timestamp: "2 hours ago",
    icon: "checkmark-circle",
    color: "#4CAF50",
    unread: true,
    priority: "high"
  },
  { 
    id: "2", 
    type: "info",
    title: "New Donation Nearby",
    message: "Fresh vegetable curry available at Central Market", 
    timestamp: "5 hours ago",
    icon: "location",
    color: "#2196F3",
    unread: true,
    priority: "medium"
  },
  { 
    id: "3", 
    type: "warning",
    title: "Donation Expired",
    message: "Your milk donation has expired and was removed", 
    timestamp: "1 day ago",
    icon: "time",
    color: "#FF9800",
    unread: false,
    priority: "low"
  },
  { 
    id: "4", 
    type: "success",
    title: "Donation Claimed!",
    message: "Your sweets donation was claimed by Sarah M.", 
    timestamp: "2 days ago",
    icon: "checkmark-circle",
    color: "#4CAF50",
    unread: false,
    priority: "medium"
  },
  { 
    id: "5", 
    type: "info",
    title: "New Donation Nearby",
    message: "Fresh bread available at Community Center", 
    timestamp: "3 days ago",
    icon: "location",
    color: "#2196F3",
    unread: false,
    priority: "low"
  },
  { 
    id: "6", 
    type: "warning",
    title: "Donation Expired",
    message: "Your juice donation has expired and was removed", 
    timestamp: "4 days ago",
    icon: "time",
    color: "#FF9800",
    unread: false,
    priority: "low"
  },
];

export default function NotificationsScreen({ navigation }) {
  const { theme } = useTheme();
  const [selectedFilter, setSelectedFilter] = useState("all");
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const unreadCount = notifications.filter(n => !n.read).length;
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
      default: return "notifications";
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case "donation_claimed": return "#4CAF50";
      case "donation_expired": return "#FF9800";
      case "new_donation": return "#2196F3";
      case "reminder": return "#9C27B0";
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

  const markAsRead = async (notificationId) => {
    try {
      // Update local state
      const updatedNotifications = notifications.map(n => 
        n._id === notificationId ? { ...n, read: true } : n
      );
      setNotifications(updatedNotifications);
      
      // TODO: Update on backend
      await axios.put(`http://10.16.57.136:8000/api/notifications/${notificationId}/read`);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    Alert.alert(
      "Mark All as Read",
      "Are you sure you want to mark all notifications as read?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Mark All Read", 
          onPress: async () => {
            try {
              const updatedNotifications = notifications.map(n => ({ ...n, read: true }));
              setNotifications(updatedNotifications);
              
              // TODO: Update on backend
              await axios.put(`http://10.16.57.136:8000/api/notifications/mark-all-read`);
            } catch (error) {
              console.error('Error marking all notifications as read:', error);
            }
          }
        }
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const fetchNotifications = async () => {
    if (!user?.email) return;
    try {
      setLoading(true);
      const res = await axios.get(`http://10.16.57.136:8000/api/notifications/user/${encodeURIComponent(user.email)}`);
      setNotifications(res.data.notifications || []);
    } catch (e) {
      console.log('Error fetching notifications:', e);
    } finally {
      setLoading(false);
    }
  };

  const handlePress = (item) => {
    if (item.data && item.data.mapUrl) {
      Linking.openURL(item.data.mapUrl);
    }
    if (!item.read) {
      markAsRead(item._id);
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
          onPress: () => {
            setNotifications([]);
            // TODO: Clear on backend
          }
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
          {
            opacity: 1,
            transform: [
              { scale: 1 },
              { translateY: 0 }
            ]
          }
        ]}
      >
        <TouchableOpacity 
          onPress={() => handlePress(item)}
          style={[
            styles.cardContent,
            { backgroundColor: theme.colors.card },
            !item.read && styles.unreadCard
          ]}
          activeOpacity={0.7}
        >
          {/* Left Icon Section */}
          <View style={styles.iconSection}>
            <View style={[styles.iconContainer, { backgroundColor: notificationColor + '15' }]}>
              <Ionicons name={notificationIcon} size={24} color={notificationColor} />
            </View>
            {!item.read && (
              <View style={[styles.unreadIndicator, { backgroundColor: notificationColor }]} />
            )}
          </View>

          {/* Content Section */}
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
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {renderFilterChip("all", "All", notifications.length)}
          {renderFilterChip("unread", "Unread", unreadCount)}
        </ScrollView>
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
    const unsubscribe = navigation?.addListener?.('focus', fetchNotifications);
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
              onPress={markAllAsRead}
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
    marginTop: -15,
  },
  listContainer: {
    paddingBottom: 20,
  },
  headerContainer: {
    marginBottom: 20,
  },
  filterContainer: {
    marginBottom: 20,
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
  },
  cardContent: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#F47F24",
  },
  iconSection: {
    marginRight: 12,
    alignItems: "center",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  unreadIndicator: {
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
