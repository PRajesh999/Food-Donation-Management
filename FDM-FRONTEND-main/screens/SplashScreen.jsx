import React, { useEffect, useRef } from "react";
import { View, Text, Animated, StyleSheet, Image, Dimensions, StatusBar } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import LottieView from "lottie-react-native";
import { useAuth } from "../context/AuthContext";

const { width, height } = Dimensions.get("window");

export default function SplashScreen({ navigation }) {
  const { user, isTokenValid } = useAuth();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Start pulse animation
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    // Main animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (user && isTokenValid) {
        navigation.replace("MainApp");
      } else {
        navigation.replace("Auth");
      }
    });
  }, [user, isTokenValid]);

  return (
    <LinearGradient
      colors={["#F47F24", "#FF6B35", "#FF8A65"]}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="#F47F24" />
      
      {/* Background Pattern */}
      <View style={styles.backgroundPattern}>
        <View style={styles.circle1} />
        <View style={styles.circle2} />
        <View style={styles.circle3} />
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Animated Logo */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [
                { scale: scaleAnim },
                { translateY: slideAnim }
              ]
            }
          ]}
        >
          <Animated.View
            style={[
              styles.logoWrapper,
              {
                transform: [{ scale: pulseAnim }]
              }
            ]}
          >
            <Image
              source={require("../assets/Applogo.png")}
              style={styles.logo}
            />
          </Animated.View>
        </Animated.View>

        {/* Animated Text */}
        <Animated.Text 
          style={[
            styles.title, 
            { 
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          Food Waste Management
        </Animated.Text>
        
        <Animated.Text 
          style={[
            styles.subtitle, 
            { 
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          Making a difference, one meal at a time
        </Animated.Text>

        {/* Loading Animation */}
        <Animated.View
          style={[
            styles.loadingContainer,
            { opacity: fadeAnim }
          ]}
        >
          <LottieView
            source={require("../assets/Loading.json")}
            autoPlay
            loop
            style={styles.loadingAnimation}
          />
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  backgroundPattern: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  circle1: {
    position: "absolute",
    top: height * 0.1,
    right: width * 0.1,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  circle2: {
    position: "absolute",
    bottom: height * 0.2,
    left: width * 0.1,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  circle3: {
    position: "absolute",
    top: height * 0.6,
    right: width * 0.2,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  logoContainer: {
    marginBottom: 30,
  },
  logoWrapper: {
    padding: 20,
    borderRadius: 100,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: "contain",
    borderRadius: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    marginBottom: 10,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    marginBottom: 40,
    fontStyle: "italic",
  },
  loadingContainer: {
    marginTop: 20,
  },
  loadingAnimation: {
    width: 60,
    height: 60,
  },
});