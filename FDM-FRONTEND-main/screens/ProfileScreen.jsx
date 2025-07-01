import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Alert,
  StatusBar,
} from "react-native";
import { useNavigation, useRoute, useIsFocused } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import LottieView from "lottie-react-native";
import { useTheme } from "./ThemeContext";
import API_BASE_URL from '../config/apiConfig';
import { registerForPushNotificationsAsync } from '../utils/notifications';

const { width } = Dimensions.get("window");

export default function ProfileScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const isFocused = useIsFocused();
  const { user, logout } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    if (isFocused) {
      fetchUserData();
    }
  }, [isFocused, user]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      // First try to get user from AuthContext
      if (user && user.email) {
        setUserData(user);
        setLoading(false);
        return;
      }

      // Fallback to route params or stored email
      const userEmail = route?.params?.email || user?.email;
      if (!userEmail) {
        console.log("No email available for profile");
        setLoading(false);
        return;
      }

      console.log("Fetching user data for email:", userEmail);
      const response = await axios.get(`${API_BASE_URL}/users/get-user-by-email?email=${encodeURIComponent(userEmail)}`);
      
      if (response.data.success && response.data.user) {
        setUserData(response.data.user);
        console.log("User data fetched successfully");
      } else {
        console.log("User not found");
      }
    } catch (error) {
      console.log("Error fetching user data:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchUserData();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            await logout();
            navigation.navigate("Logout");
          },
        },
      ]
    );
  };

  const handleEditProfile = () => {
    if (userData) {
      navigation.navigate("EditProfile", { userData });
    }
  };

  const handleTestNotification = async () => {
    try {
      console.log("🧪 Testing notification...");
      const fcmToken = await registerForPushNotificationsAsync();
      
      if (!fcmToken) {
        Alert.alert("Error", "Failed to get FCM token. Make sure you're on a physical device.");
        return;
      }

      console.log("🧪 FCM Token:", fcmToken);
      
      const response = await axios.post(`${API_BASE_URL}/cart/test-notification`, {
        email: userData.email,
        fcmToken: fcmToken
      });

      if (response.data.success) {
        Alert.alert("Success", "Test notification sent! Check your device for the notification.");
        console.log("✅ Test notification sent successfully");
      } else {
        Alert.alert("Error", "Failed to send test notification");
        console.log("❌ Test notification failed:", response.data);
      }
    } catch (error) {
      console.error("Test notification error:", error);
      Alert.alert("Error", "Failed to send test notification: " + error.message);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loaderContainer, { backgroundColor: theme.colors.background }]}>
        <LottieView
          source={require("../assets/Loading.json")}
          autoPlay
          loop
          style={{ width: 200, height: 200 }}
        />
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>Loading your profile...</Text>
      </View>
    );
  }

  if (!userData) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.colors.background }]}>
        <Ionicons name="person-circle-outline" size={80} color="#F47F24" />
        <Text style={[styles.errorTitle, { color: theme.colors.text }]}>Profile Not Found</Text>
        <Text style={[styles.errorText, { color: theme.colors.placeholder }]}>Unable to load your profile information.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} showsVerticalScrollIndicator={false}>
      {/* Profile Header with Image */}
      <LinearGradient
        colors={["#F47F24", "#FF6B35"]}
        style={styles.headerGradient}
      >
        <View style={styles.profileHeader}>
          <View style={styles.profileImageContainer}>
            <Image
              source={
                userData.profileImage
                  ? { uri: userData.profileImage }
                  : require("../assets/Applogo.png")
              }
              style={styles.profileImage}
            />
            <View style={styles.onlineIndicator} />
          </View>
          <Text style={styles.userName}>{userData.name || "User"}</Text>
          <Text style={styles.userEmail}>{userData.email}</Text>
          <Text style={styles.userLocation}>
            <Ionicons name="location-outline" size={16} color="white" />
            {" "}{userData.address || "Location not available"}
          </Text>
        </View>
      </LinearGradient>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
          <Ionicons name="create-outline" size={20} color="white" />
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
        {/* <TouchableOpacity style={styles.testButton} onPress={handleTestNotification}>
          <Ionicons name="notifications-outline" size={20} color="white" />
          <Text style={styles.testButtonText}>Test Notification</Text>
        </TouchableOpacity> */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#F47F24" />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* User Stats */}
      <View style={[styles.statsContainer, { backgroundColor: theme.colors.card }]}>
        <View style={styles.statCard}>
          <Ionicons name="restaurant-outline" size={24} color="#F47F24" />
          <Text style={[styles.statNumber, { color: theme.colors.text }]}>12</Text>
          <Text style={[styles.statLabel, { color: theme.colors.placeholder }]}>Donations</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="heart-outline" size={24} color="#F47F24" />
          <Text style={[styles.statNumber, { color: theme.colors.text }]}>8</Text>
          <Text style={[styles.statLabel, { color: theme.colors.placeholder }]}>Received</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="star-outline" size={24} color="#F47F24" />
          <Text style={[styles.statNumber, { color: theme.colors.text }]}>4.8</Text>
          <Text style={[styles.statLabel, { color: theme.colors.placeholder }]}>Rating</Text>
        </View>
      </View>

      {/* User Information */}
      <View style={styles.infoContainer}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Personal Information</Text>
        
        <View style={[styles.infoCard, { backgroundColor: theme.colors.card }]}>
          <InfoRow 
            icon="call-outline" 
            label="Phone Number" 
            value={userData.phone || "Not specified"} 
          />
          <InfoRow 
            icon="person-outline" 
            label="Gender" 
            value={userData.gender || "Not specified"} 
          />
          <InfoRow 
            icon="calendar-outline" 
            label="Date of Birth" 
            value={userData.dob || "Not specified"} 
          />
          <InfoRow 
            icon="briefcase-outline" 
            label="Occupation" 
            value={userData.occupation || "Not specified"} 
          />
          <InfoRow 
            icon="mail-outline" 
            label="Email" 
            value={userData.email} 
          />
        </View>
      </View>

      {/* Pull to Refresh */}
      {refreshing && (
        <View style={styles.refreshContainer}>
          <ActivityIndicator size="small" color="#F47F24" />
          <Text style={styles.refreshText}>Refreshing...</Text>
        </View>
      )}
    </ScrollView>
  );
}

const InfoRow = ({ icon, label, value }) => {
  const { theme } = useTheme();
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconContainer}>
        <Ionicons name={icon} size={20} color="#F47F24" />
      </View>
      <View style={styles.infoContent}>
        <Text style={[styles.infoLabel, { color: theme.colors.text }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: theme.colors.placeholder }]}>{value}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 10,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 5,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#F47F24",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    marginTop: 15,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  headerGradient: {
    paddingTop: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  profileHeader: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  profileImageContainer: {
    position: "relative",
    marginBottom: 15,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: "white",
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 5,
    right: 5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#4CAF50",
    borderWidth: 3,
    borderColor: "white",
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: 5,
  },
  userLocation: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    flexDirection: "row",
    alignItems: "center",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: -15,
    marginBottom: 20,
  },
  editButton: {
    backgroundColor: "#F47F24",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    flex: 1,
    marginRight: 10,
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  editButtonText: {
    color: "white",
    fontWeight: "bold",
    marginLeft: 5,
  },
  testButton: {
    backgroundColor: "#F47F24",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    flex: 1,
    marginRight: 10,
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  testButtonText: {
    color: "white",
    fontWeight: "bold",
    marginLeft: 5,
  },
  logoutButton: {
    backgroundColor: "white",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    flex: 1,
    marginLeft: 10,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F47F24",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  logoutButtonText: {
    color: "#F47F24",
    fontWeight: "bold",
    marginLeft: 5,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    alignItems: "center",
    padding: 10,
    borderRadius: 15,
    backgroundColor:"white",
    flex: 1,
    marginHorizontal: 5,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#F47F24",
    marginTop: 5,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  infoContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  infoCard: {
    borderRadius: 15,
    padding: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF3E0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color:"#F24F47",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "500",
    color:"#F24F47",
  },
  refreshContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
  },
  refreshText: {
    marginLeft: 10,
  },
});
