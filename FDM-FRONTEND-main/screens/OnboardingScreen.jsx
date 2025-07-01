import React, { useState, useRef } from "react";
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions, 
  StatusBar,
  Animated,
  ScrollView
} from "react-native";
import Swiper from "react-native-swiper";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const { height, width } = Dimensions.get("window");

const OnboardingScreen = () => {
  const navigation = useNavigation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const slides = [
    {
      id: 1,
      title: "Welcome to FoodShare",
      subtitle: "Join a community dedicated to reducing food waste and helping others.",
      description: "Connect with people who care about making a difference in their community through food sharing.",
      image: require("../assets/Applogo.png"),
      icon: "heart-outline",
      color: "#F47F24"
    },
    {
      id: 2,
      title: "How It Works",
      subtitle: "Simple steps to make a big impact",
      description: "List your excess food, find donations near you, and connect with others in your community.",
      image: require("../assets/Applogo.png"),
      icon: "settings-outline",
      color: "#4CAF50"
    },
    {
      id: 3,
      title: "Ready to Start?",
      subtitle: "Begin your journey today",
      description: "Join thousands of people who are already making a difference in their communities.",
      image: require("../assets/Applogo.png"),
      icon: "rocket-outline",
      color: "#2196F3"
    }
  ];

  const handleIndexChanged = (index) => {
    setCurrentIndex(index);
    // Trigger animations for new slide
    fadeAnim.setValue(0);
    slideAnim.setValue(30);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const renderSlide = (slide, index) => (
    <View key={slide.id} style={styles.slide}>
      <LinearGradient
        colors={[slide.color + '10', 'transparent']}
        style={styles.backgroundGradient}
      />
      
      <View style={styles.content}>
        {/* Header with Logo */}
        <View style={styles.header}>
          <Image source={require("../assets/Applogo.png")} style={styles.logo} />
          <Text style={styles.appName}>FoodShare</Text>
        </View>

        {/* Main Image */}
        <Animated.View 
          style={[
            styles.imageContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={[styles.imageWrapper, { borderColor: slide.color + '30' }]}>
            <Image source={slide.image} style={styles.image} resizeMode="contain" />
          </View>
        </Animated.View>

        {/* Content */}
        <Animated.View 
          style={[
            styles.textContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={[styles.iconContainer, { backgroundColor: slide.color + '20' }]}>
            <Ionicons name={slide.icon} size={32} color={slide.color} />
          </View>
          
          <Text style={styles.title}>{slide.title}</Text>
          <Text style={styles.subtitle}>{slide.subtitle}</Text>
          <Text style={styles.description}>{slide.description}</Text>
        </Animated.View>

        {/* Progress Dots */}
        <View style={styles.progressContainer}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[
                styles.progressDot,
                {
                  backgroundColor: i === index ? slide.color : '#E0E0E0',
                  width: i === index ? 24 : 8,
                }
              ]}
            />
          ))}
        </View>

        {/* Action Button */}
        {index === slides.length - 1 && (
          <Animated.View
            style={[
              styles.buttonContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <TouchableOpacity 
              style={[styles.button, { backgroundColor: slide.color }]} 
              onPress={() => navigation.replace("Login")}
            >
              <Text style={styles.buttonText}>Get Started</Text>
              <Ionicons name="arrow-forward" size={20} color="white" />
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <Swiper 
        loop={false} 
        activeDotColor={"#F47F24"}
        dotColor={"#E0E0E0"}
        onIndexChanged={handleIndexChanged}
        showsPagination={false}
        autoplay={false}
      >
        {slides.map((slide, index) => renderSlide(slide, index))}
      </Swiper>

      {/* Skip Button */}
      <TouchableOpacity 
        style={styles.skipButton} 
        onPress={() => navigation.replace("Login")}
      >
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  slide: {
    flex: 1,
    position: "relative",
  },
  backgroundGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
  },
  logo: {
    width: 40,
    height: 40,
    marginRight: 10,
  },
  appName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  imageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
  },
  imageWrapper: {
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: 20,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  image: {
    width: "80%",
    height: "80%",
  },
  textContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: "#666",
    textAlign: "center",
    marginBottom: 15,
    fontWeight: "500",
  },
  description: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
  },
  progressDot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  buttonContainer: {
    alignItems: "center",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginRight: 10,
  },
  skipButton: {
    position: "absolute",
    top: 50,
    right: 20,
    padding: 10,
  },
  skipText: {
    color: "#999",
    fontSize: 16,
    fontWeight: "500",
  },
});

export default OnboardingScreen;