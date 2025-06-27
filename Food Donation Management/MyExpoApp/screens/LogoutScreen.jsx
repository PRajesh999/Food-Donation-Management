import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

export default function LogoutScreen({ navigation }) {
  const { logout } = useAuth();

  useEffect(() => {
    const handleLogout = async () => {
      try {
        // Clear user data and token from AuthContext
        await logout();
        // Navigation will be handled automatically by AuthContext
      } catch (error) {
        console.log("Logout error:", error);
        // Still logout even if there's an error
        await logout();
      }
    };

    // Add a small delay to show the logout screen
    const timer = setTimeout(() => {
      handleLogout();
    }, 1000);

    return () => clearTimeout(timer);
  }, [navigation, logout]);

  return (
    <LinearGradient
      colors={["#F47F24", "#FF6B35"]}
      style={styles.container}
    >
      <View style={styles.content}>
        <Ionicons name="log-out-outline" size={60} color="white" />
        <Text style={styles.title}>Logging Out</Text>
        <Text style={styles.subtitle}>Please wait while we sign you out...</Text>
        <ActivityIndicator size="large" color="white" style={styles.loader} />
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
  content: {
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginTop: 20,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    marginBottom: 30,
  },
  loader: {
    marginTop: 20,
  },
});
