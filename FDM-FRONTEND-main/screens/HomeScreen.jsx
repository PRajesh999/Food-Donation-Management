import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  Animated,
  StatusBar,
  Image,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import LottieView from "lottie-react-native";
import Toast from "react-native-toast-message";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "./ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import API_BASE_URL from '../config/apiConfig';

const { width, height } = Dimensions.get("window");
const slideWidth = width * 0.85;
const slideMargin = 16;
const slideSpacing = slideMargin * 2;

const slides = [
  {
    text: "Waste Less, Feed More",
    image: require("../assets/Swiper_Image_1.jpeg"),
  },
  {
    text: "One meal can make a difference",
    image: require("../assets/Swiper_Image_2.jpg"),
  },
  {
    text: "Be the reason someone eats today",
    image: require("../assets/Swiper_Image_3.jpg"),
  },
];
const fullSlides = [slides[slides.length - 1], ...slides, slides[0]];

export default function HomeScreen({ route }) {
  const [currentSlide, setCurrentSlide] = useState(1);
  const scrollRef = useRef(null);
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [userData, setUserData] = useState(null);
  const fadeAnimLoader = useRef(new Animated.Value(1)).current;
  const fadeAnimScreen = useRef(new Animated.Value(0)).current;
  const { user } = useAuth();
  const { theme } = useTheme();

  useEffect(() => {
    const timer = setInterval(() => {
      let nextIndex = currentSlide + 1;

      scrollRef.current?.scrollTo({
        x: nextIndex * (slideWidth + slideSpacing),
        animated: true,
      });

      if (nextIndex === slides.length + 1) {
        setTimeout(() => {
          scrollRef.current?.scrollTo({
            x: slideWidth + slideSpacing,
            animated: false,
          });
          setCurrentSlide(1);
        }, 300);
      } else {
        setCurrentSlide(nextIndex);
      }
    }, 4000);

    return () => clearInterval(timer);
  }, [currentSlide]);

  useEffect(() => {
    const fetchUserData = async () => {
      // First try to get user from AuthContext
      if (user && user.email) {
        setUserData(user);
        setUserName(user.name);
        console.log("User data from AuthContext:", user.name);
        return;
      }

      // Fallback to route params
      const userEmail = route?.params?.email || "";
      if (!userEmail) {
        console.log("No email provided in route params or AuthContext");
        setIsLoading(false);
        return;
      }

      try {
        console.log("Fetching user data for email:", userEmail);
        const response = await axios.get(`${API_BASE_URL}/users/get-user-by-email?email=${encodeURIComponent(userEmail)}`);

        if (response.data.success && response.data.user) {
          const user = response.data.user;
          setUserData(user);
          setUserName(user.name);
          console.log("User data fetched successfully:", user.name);
        } else {
          console.log("User not found or invalid response");
          setUserName("User");
        }
      } catch (error) {
        console.log("Error fetching user:", error.message);
        setUserName("User");
      }
    };

    fetchUserData();
  }, [user, route?.params?.email]);

  useEffect(() => {
    if (!userName) return;

    Toast.show({
      type: "success",
      text1: `Welcome back, ${userName}!`,
      text2: "Ready to make a difference today?",
      position: "top",
      visibilityTime: 3000,
    });

    Animated.parallel([
      Animated.timing(fadeAnimLoader, {
        toValue: 0,
        duration: 1500,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnimScreen, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
    ]).start(() => setIsLoading(false));
  }, [userName]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="#F47F24" />

      {isLoading && (
        <Animated.View style={[styles.loaderContainer, { opacity: fadeAnimLoader }]}>
          <LottieView
            source={require("../assets/Loading.json")}
            autoPlay
            loop
            style={{ width: 200, height: 200 }}
          />
          <Text style={[styles.loadingText, { color: theme.colors.placeholder }]}>Loading your dashboard...</Text>
        </Animated.View>
      )}

      <Animated.View style={[styles.content, { opacity: fadeAnimScreen }]}>
        {/* Header Section */}
        {/* <LinearGradient
          colors={["#F47F24", "#FF6B35"]}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.userName}>{userName || "User"}! 👋</Text>
            </View>
          </View>
        </LinearGradient> */}

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Motivational Quotes Carousel */}
          <View style={styles.carouselContainer}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}> Daily Inspiration</Text>
            <ScrollView
              ref={scrollRef}
              horizontal
              bounces={false}
              showsHorizontalScrollIndicator={false}
              snapToInterval={slideWidth + slideSpacing}
              decelerationRate="fast"
              contentContainerStyle={{
                paddingHorizontal: (width - slideWidth) / 2,
              }}
              onMomentumScrollEnd={(e) => {
                const offsetX = e.nativeEvent.contentOffset.x;
                const index = Math.round(offsetX / (slideWidth + slideSpacing));
                let newIndex = index;

                if (index === 0) {
                  setTimeout(() => {
                    scrollRef.current?.scrollTo({
                      x: slides.length * (slideWidth + slideSpacing),
                      animated: false,
                    });
                  }, 300);
                  newIndex = slides.length;
                } else if (index === slides.length + 1) {
                  setTimeout(() => {
                    scrollRef.current?.scrollTo({
                      x: slideWidth + slideSpacing,
                      animated: false,
                    });
                  }, 300);
                  newIndex = 1;
                }

                setCurrentSlide(newIndex);
              }}
            >
              {fullSlides.map((item, index) => (
                <View
                  key={index}
                  style={[styles.quoteCard, { backgroundColor: theme.colors.card }]}
                >
                  <Image
                    source={item.image}
                    style={styles.slideImageFull}
                    resizeMode="cover"
                  />
                </View>
              ))}
            </ScrollView>

            <View style={styles.dotsContainer}>
              {slides.map((_, index) => {
                const isActive = currentSlide - 1 === index;
                return (
                  <View
                    key={index}
                    style={[
                      styles.dot,
                      {
                        backgroundColor: isActive ? "#F47F24" : theme.colors.placeholder,
                        transform: [{ scale: isActive ? 1.2 : 1 }],
                      },
                    ]}
                  />
                );
              })}
            </View>
          </View>

          {/* Action Cards */}
          <View style={styles.actionSection}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}> Quick Actions</Text>
            <View style={styles.actionCards}>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => navigation.navigate("Donation Form")}
              >
                <LinearGradient
                  colors={["#4CAF50", "#45A049"]}
                  style={styles.actionCardGradient}
                >
                  <View style={styles.actionCardContent}>
                    <View style={styles.actionIconContainer}>
                      <Ionicons name="gift" size={40} color="white" />
                    </View>
                    <View style={styles.actionTextContainer}>
                      <Text style={styles.actionTitle}>Donate Food</Text>
                      <Text style={styles.actionDescription}>
                        Share your surplus food with those in need
                      </Text>
                    </View>
                    <View style={styles.actionArrow}>
                      <Ionicons name="arrow-forward" size={24} color="white" />
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => navigation.navigate("Donation Listings")}
              >
                <LinearGradient
                  colors={["#2196F3", "#1976D2"]}
                  style={styles.actionCardGradient}
                >
                  <View style={styles.actionCardContent}>
                    <View style={styles.actionIconContainer}>
                      <Ionicons name="search" size={40} color="white" />
                    </View>
                    <View style={styles.actionTextContainer}>
                      <Text style={styles.actionTitle}>Find Food</Text>
                      <Text style={styles.actionDescription}>
                        Discover available donations near you
                      </Text>
                    </View>
                    <View style={styles.actionArrow}>
                      <Ionicons name="arrow-forward" size={24} color="white" />
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              {/* <TouchableOpacity
                style={styles.actionCard}
                onPress={() => {
                  Alert.alert("Coming Soon", "Orphan Donation feature will be available soon!");
                }}
              >
                <LinearGradient
                  colors={["#9C27B0", "#7B1FA2"]}
                  style={styles.actionCardGradient}
                >
                  <View style={styles.actionCardContent}>
                    <View style={styles.actionIconContainer}>
                      <Ionicons name="heart" size={40} color="white" />
                    </View>
                    <View style={styles.actionTextContainer}>
                      <Text style={styles.actionTitle}>Orphan Donation</Text>
                      <Text style={styles.actionDescription}>
                        Support orphanages with food donations
                      </Text>
                    </View>
                    <View style={styles.actionArrow}>
                      <Ionicons name="time-outline" size={24} color="white" />
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity> */}
            </View>
          </View>

          {/* App Logo and Copyright */}
          <View style={styles.footerContainer}>
            <View style={[styles.logoCard, { backgroundColor: theme.colors.card }]}>
              <Image
                source={require("../assets/Applogo.png")}
                style={styles.logo}
              />
              <Text style={[styles.logoText, { color: theme.colors.placeholder }]}>Making a difference, one meal at a time</Text>
            </View>

            {/* <View style={styles.copyrightContainer}>
              <Text style={[styles.copyrightText, { color: theme.colors.text }]}>
                © 2024 Food Donation Management Team
              </Text>
              <Text style={[styles.copyrightSubtext, { color: theme.colors.placeholder }]}>
                All rights reserved
              </Text>
            </View> */}
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    width: "100%",
    height: "100%",
    zIndex: 1000,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 10,
  },
  content: {
    flex: 1,
  },
  header: {
    paddingTop: 20,
    height: 100,
    paddingBottom: 10,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    paddingHorizontal: 10,
  },
  welcomeSection: {
    alignItems: "center",
  },
  welcomeText: {
    fontSize: 18,
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: 5,
  },
  userName: {
    fontSize: 26,
    fontWeight: "bold",
    color: "white",
  },
  scrollView: {
    flex: 1,
  },
  carouselContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  quoteCard: {
    width: slideWidth,
    height: 200,
    marginRight: slideSpacing,
    borderRadius: 20,
    // padding: 25,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#F47F24",
    overflow:"hidden"
  },
  quoteText: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 26,
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 15,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  actionSection: {
    marginBottom: 20,
  },
  actionCards: {
    paddingHorizontal: 20,
  },
  actionCard: {
    marginBottom: 20,
    borderRadius: 20,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  actionCardGradient: {
    borderRadius: 20,
    padding: 25,
  },
  actionCardContent: {
    flexDirection: "row",
    height: 50,
    alignItems: "center",
  },
  actionIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 20,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "white",
    marginBottom: 8,
  },
  actionDescription: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    lineHeight: 22,
  },
  actionArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  footerContainer: {
    alignItems: "center",
    marginBottom: 10,
  },
  logoCard: {
    borderRadius: 20,
    padding: 10,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    marginBottom: 20,
  },
  logo: {
    width: 120,
    height: 100,
    borderRadius: 30,
    marginBottom: 10,
  },
  logoText: {
    fontSize: 14,
    textAlign: "center",
    fontStyle: "italic",
  },
  copyrightContainer: {
    alignItems: "center",
  },
  copyrightText: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  copyrightSubtext: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 2,
  },
  slideImageFull: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
});