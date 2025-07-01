import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Dimensions,
  Image,
  ActivityIndicator,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { BarChart } from "react-native-chart-kit";
import axios from "axios";
import { useTheme } from "./ThemeContext";
import { useAuth } from "../context/AuthContext";
import { NavigationHelper } from "../navigation/navigationHelpers";
import { useFocusEffect } from "@react-navigation/native";
import LottieView from "lottie-react-native";
import API_BASE_URL from '../config/apiConfig';

const { width, height } = Dimensions.get("window");

const foodTypeImages = {
  Veg: require("../assets/Veg Curry.png"),
  "Non Veg": require("../assets/Non Veg Curry.png"),
  Others: require("../assets/Non Veg Curry.png"),
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
      return "#4CAF50";
    case "Non Veg":
      return "#FF9800";
    case "Others":
    default:
      return "#F47F24";
  }
};

export default function PastDonationsScreen({ navigation, route }) {
  const { theme } = useTheme();
  const { user, donationUpdateTrigger, isTokenValid } = useAuth();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalDonations: 0,
    totalMeals: 0,
    totalRecipients: 0,
    averageRating: 4.8,
    totalQuantity: 0,
    monthlyData: []
  });
  const [showUpdateMessage, setShowUpdateMessage] = useState(false);
  const isFetchingRef = useRef(false);

  // Get the actual logged-in user's email
  const userEmail = user?.email;

  const fetchDonations = useCallback(async (isRefreshing = false) => {
    // Prevent multiple simultaneous requests
    if (isFetchingRef.current && !isRefreshing) {
      console.log("Already fetching data, skipping request");
      return;
    }

    // Check if user is authenticated
    if (!isTokenValid) {
      console.log("User not authenticated");
      setError("Please log in to view your donations.");
      setLoading(false);
      return;
    }

    if (!userEmail) {
      console.log("No user email found in AuthContext");
      console.log("Current user object:", user);
      setError("User email not found. Please log in again.");
      setLoading(false);
      return;
    }

    console.log("Fetching donations for user email:", userEmail);
    console.log("Current user object:", user);
    setError(null);
    isFetchingRef.current = true;
    
    if (isRefreshing) {
      setRefreshing(true);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/donations/user/${encodeURIComponent(userEmail)}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log("No donations found for user (404 response)");
          setDonations([]);
          setStats({
            totalDonations: 0,
            totalMeals: 0,
            totalRecipients: 0,
            averageRating: 4.8,
            totalQuantity: 0,
            monthlyData: []
          });
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Fetched donations:", data);
      
      if (Array.isArray(data)) {
        setDonations(data);
        calculateStats(data);
      } else {
        console.error("Unexpected data format:", data);
        setDonations([]);
        setStats({
          totalDonations: 0,
          totalMeals: 0,
          totalRecipients: 0,
          averageRating: 4.8,
          totalQuantity: 0,
          monthlyData: []
        });
      }
      } catch (error) {
        console.error("Error fetching donations:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
      
      // Handle 404 specifically - this means no donations found
      if (error.response?.status === 404) {
        console.log("No donations found for user (404 response)");
        setDonations([]);
        setStats({
          totalDonations: 0,
          totalMeals: 0,
          totalRecipients: 0,
          averageRating: 4.8,
          totalQuantity: 0,
          monthlyData: []
        });
        return; // Don't show error, just show empty state
      }
      
      setError("Failed to load your donations. Please try again.");
      
      if (error.response?.status === 401) {
        setError("Please log in again to view your donations.");
      } else if (error.code === 'NETWORK_ERROR') {
        setError("Network error. Please check your internet connection.");
      }
      } finally {
        setLoading(false);
      setRefreshing(false);
      isFetchingRef.current = false;
      }
  }, [isTokenValid, userEmail, user]);

  // Consolidated useEffect to handle all data fetching scenarios
  useEffect(() => {
    console.log("useEffect triggered - isTokenValid:", isTokenValid, "userEmail:", userEmail);
    
    // Only fetch if user is authenticated and has email
    if (isTokenValid && userEmail) {
      console.log("Fetching donations - Auth valid, user email:", userEmail);
      fetchDonations();
    } else if (!isTokenValid) {
      console.log("User not authenticated");
      setError("Please log in to view your donations.");
      setLoading(false);
    } else if (!userEmail) {
      console.log("No user email found");
      setError("User email not found. Please log in again.");
      setLoading(false);
    }
  }, [isTokenValid, userEmail, fetchDonations]); // Remove donationUpdateTrigger from here

  // Separate useEffect for donation updates
  useEffect(() => {
    if (donationUpdateTrigger > 0 && isTokenValid && userEmail) {
      console.log("Donation update triggered, refreshing data");
      // Add a small delay to prevent rapid successive calls
      const timer = setTimeout(() => {
        fetchDonations();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [donationUpdateTrigger]); // Only depend on donationUpdateTrigger

  // Show update message when triggered by new donation
  useEffect(() => {
    if (donationUpdateTrigger > 0 && donations.length > 0) {
      setShowUpdateMessage(true);
      setTimeout(() => setShowUpdateMessage(false), 3000);
    }
  }, [donationUpdateTrigger, donations.length]);

  const onRefresh = () => {
    fetchDonations(true);
  };

  const calculateStats = (donationsData) => {
    const totalDonations = donationsData.length;
    const totalQuantity = donationsData.reduce((sum, item) => sum + parseInt(item.quantity || 0), 0);
    const totalMeals = totalQuantity; // Each quantity represents meals/servings
    const totalRecipients = Math.floor(totalMeals * 0.8); // Assuming 80% of meals reach recipients

    // Calculate monthly data for chart
    const monthlyData = {};
    donationsData.forEach(donation => {
      const date = new Date(donation.createdDate);
      const month = date.toLocaleString('default', { month: 'short' });
      monthlyData[month] = (monthlyData[month] || 0) + parseInt(donation.quantity || 0);
    });

    setStats({
      totalDonations,
      totalMeals,
      totalRecipients,
      averageRating: 4.8,
      totalQuantity,
      monthlyData: Object.entries(monthlyData).map(([month, quantity]) => ({
        month,
        quantity
      }))
    });
  };

  // Safe navigation method
  const safeNavigate = (routeName, params = {}) => {
    try {
      if (routeName === "Donation Form") {
        // Navigate to Home stack first, then to Donation Form
        NavigationHelper.navigateToStackScreen(navigation, "Home", "Donation Form");
      } else {
        NavigationHelper.navigate(navigation, routeName, params);
      }
    } catch (error) {
      console.error("Navigation error:", error);
      Alert.alert("Navigation Error", "Unable to navigate to the requested screen.");
    }
  };

  // Debug function to check all donations
  const debugAllDonations = async () => {
    try {
      console.log("=== DEBUG: Checking all donations ===");
      const response = await axios.get(`${API_BASE_URL}/donations/get-donations`);
      console.log("All donations in database:", response.data.data);
      console.log("Current user email:", userEmail);
      
      // Check if any donations match the user's email
      const userDonations = response.data.data.filter(donation => 
        donation.email && donation.email.toLowerCase() === userEmail.toLowerCase()
      );
      console.log("Donations matching user email:", userDonations);
      
      Alert.alert(
        "Debug Info", 
        `Total donations: ${response.data.data.length}\nUser donations: ${userDonations.length}\nUser email: ${userEmail}`
      );
    } catch (error) {
      console.error("Debug error:", error);
      Alert.alert("Debug Error", "Failed to fetch debug information");
    }
  };

  const chartConfig = {
    backgroundGradientFrom: theme.colors.card,
    backgroundGradientTo: theme.colors.background,
    color: (opacity = 1) => `rgba(244, 127, 36, ${opacity})`,
    labelColor: (opacity = 1) => theme.colors.text,
    strokeWidth: 2,
    barPercentage: 0.7,
  };

  const barChartData = {
    labels: ["Donated", "Saved", "Wasted"],
    datasets: [{ 
      data: [stats.totalDonations, stats.totalRecipients, Math.max(0, stats.totalDonations - stats.totalRecipients)] 
    }],
  };

  const renderStatsCard = (icon, title, value, subtitle, color) => (
    <View style={[styles.statsCard, { backgroundColor: theme.colors.card, shadowColor: color, shadowOpacity: 0.15, shadowRadius: 8, borderRadius: 18, elevation: 4, marginRight: 16 }]}>
      <View style={[styles.statsIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={24} color={color} />
        </View>
      <View style={styles.statsContent}>
        <Text style={[styles.statsValue, { color: theme.colors.text }]}>{value}</Text>
        <Text style={[styles.statsTitle, { color: theme.colors.text }]}>{title}</Text>
        <Text style={[styles.statsSubtitle, { color: theme.colors.placeholder }]}>{subtitle}</Text>
      </View>
    </View>
  );

  const renderDonationCard = ({ item, index }) => {
    const isExpired = new Date(item.expiryDate) < new Date();
    const statusColor = isExpired ? "#FF6B6B" : "#4CAF50";
    const statusText = isExpired ? "Expired" : "Active";
    return (
      <TouchableOpacity
        activeOpacity={0.92}
        style={[
          styles.donationCard,
          {
            backgroundColor: theme.colors.card,
            shadowColor: statusColor,
            shadowOpacity: 0.13,
            shadowRadius: 10,
            borderRadius: 20,
            elevation: 6,
            marginBottom: 22,
            padding: 0,
            overflow: 'visible',
          },
        ]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'stretch', padding: 18 }}>
          {/* Left: Info */}
          <View style={{ flex: 1, justifyContent: 'center', paddingRight: 18 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <View style={[styles.foodTypeIcon, { backgroundColor: getFoodTypeColor(item.foodType), width: 38, height: 38 }]}> 
                  <Ionicons name={getFoodTypeIcon(item.foodType)} size={20} color="white" />
                </View>
              <View style={{ marginLeft: 10 }}>
                <Text style={[styles.foodName, { color: theme.colors.text, fontWeight: 'bold', fontSize: 17, marginBottom: 2 }]}>{item.foodName}</Text>
                  <Text style={[styles.foodType, { color: theme.colors.placeholder, fontSize: 13 }]}>{item.foodType}</Text>
                </View>
              </View>
            <View style={{ height: 1, backgroundColor: theme.colors.border, marginVertical: 8, opacity: 0.12 }} />
            <View style={{ flexDirection: 'column', flexWrap: 'wrap', gap: 2 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                <Ionicons name="person-outline" size={15} color={theme.colors.placeholder} />
                <Text style={[styles.detailText, { color: theme.colors.text, marginLeft: 6, fontSize: 13 }]}>Donor: {item.donorName}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                <Ionicons name="location-outline" size={15} color={theme.colors.placeholder} />
                <Text style={[styles.detailText, { color: theme.colors.text, marginLeft: 6, fontSize: 13 }]}>Location: {item.locationName}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                <Ionicons name="calendar-outline" size={15} color={theme.colors.placeholder} />
                <Text style={[styles.detailText, { color: theme.colors.text, marginLeft: 6, fontSize: 13 }]}>Created: {new Date(item.createdDate).toLocaleDateString()}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                <Ionicons name="time-outline" size={15} color={theme.colors.placeholder} />
                <Text style={[styles.detailText, { color: theme.colors.text, marginLeft: 6, fontSize: 13 }]}>Expires: {new Date(item.expiryDate).toLocaleDateString()}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                <Ionicons name="fast-food-outline" size={15} color={theme.colors.placeholder} />
                <Text style={[styles.detailText, { color: theme.colors.text, marginLeft: 6, fontSize: 13 }]}>Servings: {item.quantity}</Text>
              </View>
            </View>
          </View>
          {/* Right: Image and Status */}
          <View style={{ alignItems: 'center', justifyContent: 'flex-start', minWidth: 110, backgroundColor: 'white', borderRadius: 16, paddingVertical: 8, paddingHorizontal: 8, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, marginLeft: 8 }}>
            <Image
              source={foodTypeImages[item.foodType] || foodTypeImages["Veg"]}
              style={[
                styles.foodImageThumb,
                {
                  marginBottom: 10,
                  width: 110,
                  height: 110,
                  borderRadius: 16,
                  borderWidth: 2,
                  borderColor: statusColor + '55',
                  backgroundColor: 'white',
                  shadowColor: statusColor,
                  shadowOpacity: 0.12,
                  shadowRadius: 8,
                },
              ]}
            />
            <View style={{ alignItems: 'center', marginTop: 2 }}>
              <View style={{
                backgroundColor: statusColor + '22',
                borderRadius: 12,
                paddingHorizontal: 25,
                paddingVertical: 10,
                marginTop: 10,
                shadowColor: statusColor,
                shadowOpacity: 0.10,
                shadowRadius: 4,
                borderWidth: 1,
                borderColor: statusColor + '55',
              }}>
                <Text style={{ color: statusColor, fontWeight: 'bold', fontSize: 13, letterSpacing: 1 }}>{statusText}</Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const ListHeader = () => (
    <View style={styles.headerContainer}>
      {/* Header */}
      <LinearGradient
        colors={["#F47F24", "#FF6B35"]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>Past Donations</Text>
            <View style={[styles.authStatus, { backgroundColor: isTokenValid ? '#4CAF50' : '#F44336' }]}>
              <Ionicons 
                name={isTokenValid ? "checkmark-circle" : "close-circle"} 
                size={16} 
                color="white" 
              />
            </View>
          </View>
          <Text style={styles.headerSubtitle}>
            Your donation history and impact
          </Text>
          {userEmail && (
            <Text style={styles.userEmail}>
              {userEmail}
            </Text>
          )}
        </View>
      </LinearGradient>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsScroll}>
          {renderStatsCard("restaurant-outline", "Total Donations", stats.totalDonations, "Food items shared", "#F47F24")}
          {renderStatsCard("people-outline", "Meals Provided", stats.totalMeals, "People fed", "#4CAF50")}
          {renderStatsCard("heart-outline", "Recipients", stats.totalRecipients, "Lives touched", "#2196F3")}
          {renderStatsCard("star-outline", "Coming Soon", "Rating", "Community feedback", "#FF9800")}
        </ScrollView>
      </View>

      {/* Chart */}
      {stats.totalDonations > 0 && (
        <View style={[styles.chartContainer, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.chartTitle, { color: theme.colors.text }]}> Impact Overview</Text>
        <BarChart
          data={barChartData}
            width={width - 100}
          height={220}
          yAxisLabel=""
          chartConfig={chartConfig}
          fromZero
            showBarTops={true}
            style={[styles.chartStyle, { alignSelf: 'center' }]}
        />
      </View>
      )}

      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}> Recent Donations</Text>
      </View>
    );

  useFocusEffect(
    React.useCallback(() => {
      fetchDonations();
    }, [fetchDonations])
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="#F47F24" />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Loading your donations...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color={theme.colors.primary} />
          <Text style={[styles.errorTitle, { color: theme.colors.text }]}>Oops!</Text>
          <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>
            {error}
          </Text>
          <View style={styles.errorButtons}>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => fetchDonations()}
            >
              <Ionicons name="refresh" size={20} color="white" />
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.debugButton, { backgroundColor: theme.colors.secondary }]}
              onPress={debugAllDonations}
            >
              <Ionicons name="bug-outline" size={20} color="white" />
              <Text style={styles.debugButtonText}>Debug</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : donations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <LottieView
            source={require("../assets/Confetti.json")}
            autoPlay
            loop={false}
            style={styles.emptyAnimation}
          />
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
            No Donations Yet
          </Text>
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            You haven't made any donations yet. Start making a difference by donating food to those in need!
          </Text>
          <TouchableOpacity
            style={[styles.donateButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => {
              // Navigate to Home stack first, then to Donation Form
              safeNavigate("Donation Form");
            }}
          >
            <Ionicons name="add-circle-outline" size={20} color="white" />
            <Text style={styles.donateButtonText}>Make Your First Donation</Text>
          </TouchableOpacity>
        </View>
      ) : (
      <FlatList
        data={donations}
          renderItem={renderDonationCard}
          keyExtractor={(item) => item._id || item.id || Math.random().toString()}
        ListHeaderComponent={ListHeader}
        showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          onRefresh={onRefresh}
          refreshing={refreshing}
        />
      )}

      {/* Floating Refresh Button */}
      {!loading && !error && donations.length > 0 && (
        <TouchableOpacity
          style={[styles.floatingButton, { backgroundColor: theme.colors.primary }]}
          onPress={onRefresh}
          disabled={refreshing}
        >
          <Ionicons 
            name={refreshing ? "refresh" : "refresh-outline"} 
            size={24} 
            color="white" 
            style={refreshing ? styles.rotatingIcon : null}
          />
        </TouchableOpacity>
      )}

      {/* Update Message */}
      {showUpdateMessage && (
        <View style={[styles.updateMessage, { backgroundColor: theme.colors.primary }]}>
          <Ionicons name="checkmark-circle" size={20} color="white" />
          <Text style={styles.updateMessageText}>Donations updated!</Text>
        </View>
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
    padding: 20,
  },
  lottie: {
    width: 200,
    height: 200,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 15,
    textAlign: "center",
  },
  listContainer: {
    paddingBottom: 20,
  },
  headerContainer: {
    marginBottom: 20,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    paddingHorizontal: 20,
    alignItems: "center",
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 5,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    flex: 1,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
  },
  userEmail: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 5,
    fontStyle: "italic",
  },
  authStatus: {
    padding: 5,
    borderRadius: 10,
    marginLeft: 10,
  },
  statsContainer: {
    marginTop: -15,
    marginBottom: 20,
  },
  statsScroll: {
    paddingHorizontal: 20,
  },
  statsCard: {
    width: 150,
    padding: 20,
    borderRadius: 20,
    marginRight: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statsIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  statsContent: {
    alignItems: "center",
  },
  statsValue: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 5,
  },
  statsTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 3,
  },
  statsSubtitle: {
    fontSize: 12,
    textAlign: "center",
  },
  chartContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    padding: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chartTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  chartStyle: {
    borderRadius: 12,
    alignSelf: 'center',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginHorizontal: 20,
    marginBottom: 15,
  },
  donationCard: {
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  cardGradient: {
    borderRadius: 20,
    padding: 20,
  },
  cardHeader: {
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
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginLeft: 10,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
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
  cardDetails: {
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  cardImage: {
    alignItems: "center",
  },
  foodImage: {
    width: 120,
    height: 80,
    borderRadius: 12,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    padding: 15,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 10,
  },
  donateButton: {
    padding: 15,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  donateButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 10,
  },
  emptyAnimation: {
    width: 200,
    height: 200,
  },
  errorButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  debugButton: {
    padding: 15,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  debugButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 10,
  },
  floatingButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  rotatingIcon: {
    transform: [{ rotate: '360deg' }],
  },
  updateMessage: {
    position: "absolute",
    top: 100,
    left: 20,
    right: 20,
    padding: 15,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  updateMessageText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
    marginLeft: 10,
  },
  foodImageThumb: { width: 64, height: 64, borderRadius: 14, backgroundColor: '#eee' },
});

