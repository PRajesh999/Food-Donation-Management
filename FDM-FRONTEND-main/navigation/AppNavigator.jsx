import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { createStackNavigator } from "@react-navigation/stack";
import { NavigationContainer } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../screens/ThemeContext";
import { View, ActivityIndicator, Text, StyleSheet, TouchableOpacity, Image, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import CartIcon from "../Components/CartIcon";
import { NavigationHelper } from "./navigationHelpers";

// Import Screens
import SplashScreen from "../screens/SplashScreen";
import OnboardingScreen from "../screens/OnboardingScreen";
import LoginScreen from "../screens/LoginScreen";
import SignupScreen from "../screens/SignupScreen";
import FoodDetailsScreen from "../screens/FoodDetailsScreen";
import MapScreen from "../screens/MapScreen";
import NotificationsScreen from "../screens/NotificationsScreen";
import SettingsScreen from "../screens/SettingsScreen";
import HomeScreen from "../screens/HomeScreen";
import DonationListingsScreen from "../screens/DonationListingsScreen";
import DonationFormScreen from "../screens/DonationFormScreen";
import ProfileScreen from "../screens/ProfileScreen";
import EditProfileScreen from "../screens/EditProfileScreen";
import PastDonationScreen from "../screens/PastDonationsScreen";
import ForgotPasswordScreen from "../screens/ForgotPasswordScreen";
import VerifyCodeScreen from "../screens/VerifyCodeScreen";
import ResetPasswordScreen from "../screens/ResetPasswordScreen";
import LogoutScreen from "../screens/LogoutScreen";
import CartScreen from "../screens/CartScreen";
import CheckoutScreen from "../screens/CheckoutScreen";

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();
const ProfileStack = createStackNavigator();
const RootStack = createStackNavigator();

// Preload MapScreen for faster navigation
const PreloadedMapScreen = React.memo(MapScreen);

// Custom Drawer Content Component
function CustomDrawerContent(props) {
  const { user } = useAuth();
  const { theme } = useTheme();

  // Safety check for theme
  if (!theme) {
    return (
      <View style={styles.drawerContainer}>
        <ActivityIndicator size="large" color="#F47F24" style={{ flex: 1, justifyContent: 'center' }} />
      </View>
    );
  }

  const handleNavigation = (routeName) => {
    if (routeName === 'Logout') {
      Alert.alert(
        "Logout",
        "Are you sure you want to logout?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Logout",
            style: "destructive",
            onPress: () => {
              props.navigation.navigate(routeName);
              props.navigation.closeDrawer();
            },
          },
        ]
      );
      return;
    }
    try {
      console.log('Attempting to navigate to:', routeName);
      console.log('Available routes:', props.state.routes.map(r => r.name));
      
      // Check if the route exists
      const routeExists = props.state.routes.some(route => route.name === routeName);
      if (!routeExists) {
        console.error('Route not found:', routeName);
        Alert.alert('Navigation Error', `Screen "${routeName}" not found.`);
        return;
      }
      
      props.navigation.navigate(routeName);
      props.navigation.closeDrawer();
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.alert('Navigation Error', 'Unable to navigate to the requested screen.');
      props.navigation.closeDrawer();
    }
  };

  const renderUserAvatar = () => {
    if (user?.profileImage) {
      return (
        <Image 
          source={{ uri: user.profileImage }} 
          style={styles.userAvatarImage}
          resizeMode="cover"
        />
      );
    } else {
      return (
        <Ionicons name="person" size={40} color="white" />
      );
    }
  };

  return (
    <View style={[styles.drawerContainer, { backgroundColor: theme.colors.background }]}>
      {/* User Profile Section */}
      <LinearGradient
        colors={["#F47F24", "#FF6B35"]}
        style={styles.userSection}
      >
        <View style={styles.userAvatar}>
          {renderUserAvatar()}
        </View>
        <Text style={styles.userName}>{user?.name || "User"}</Text>
        <Text style={styles.userEmail}>{user?.email || "user@example.com"}</Text>
      </LinearGradient>

      {/* Drawer Items */}
      <View style={styles.drawerItems}>
        {props.state.routes.map((route, index) => {
          const isFocused = props.state.index === index;
          const { options } = props.descriptors[route.key];
          
          return (
            <TouchableOpacity
              key={route.key}
              style={[
                styles.drawerItem,
                isFocused && styles.drawerItemActive,
                { backgroundColor: isFocused ? theme.colors.primary + '20' : 'transparent' }
              ]}
              onPress={() => handleNavigation(route.name)}
            >
              <View style={[
                styles.drawerIconContainer,
                { backgroundColor: isFocused ? theme.colors.primary : theme.colors.primary + '20' }
              ]}>
                {options.drawerIcon && options.drawerIcon({ 
                  color: isFocused ? 'white' : theme.colors.primary,
                  size: 24 
                })}
              </View>
              <Text style={[
                styles.drawerLabel,
                { 
                  color: isFocused ? theme.colors.primary : theme.colors.text,
                  fontWeight: isFocused ? '600' : '400'
                }
              ]}>
                {options.drawerLabel || route.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Footer */}
      <View style={[styles.drawerFooter, { borderTopColor: theme.colors.border }]}>
        <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
          Food Waste Management
        </Text>
        <Text style={[styles.footerVersion, { color: theme.colors.textMuted }]}>
          Version 1.0.0
        </Text>
      </View>
    </View>
  );
}

// Auth Stack (for unauthenticated users)
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="VerifyCode" component={VerifyCodeScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </Stack.Navigator>
  );
}

// Home Stack
function HomeStack() {
  const { theme } = useTheme();
  
  return (
    <Stack.Navigator screenOptions={{ 
      headerStyle: { backgroundColor: theme.colors.primary }, 
      headerTitleAlign: "center",
      headerTintColor: "white"
    }}>
      <Stack.Screen
        name="HomeScreen"
        component={HomeScreen}
        options={({ navigation }) => ({
          title: "Food Waste Management",
          headerLeft: () => (
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => navigation.getParent()?.openDrawer()}
            >
              <Ionicons name="menu" size={28} color="white" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <CartIcon navigation={navigation} />
          ),
        })}
      />
      <Stack.Screen 
        name="Donation Form" 
        component={DonationFormScreen} 
        options={({ navigation }) => ({ 
          title: "Donate Food",
          headerLeft: () => (
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={28} color="white" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <CartIcon navigation={navigation} />
          ),
        })} 
      />
      <Stack.Screen 
        name="Donation Listings" 
        component={DonationListingsScreen} 
        options={({ navigation }) => ({ 
          title: "Find Food",
          headerLeft: () => (
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={28} color="white" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <CartIcon navigation={navigation} />
          ),
        })} 
      />
      <Stack.Screen 
        name="Food Details" 
        component={FoodDetailsScreen} 
        options={({ navigation }) => ({ 
          title: "Food Details",
          headerRight: () => (
            <CartIcon navigation={navigation} />
          ),
        })} 
      />
      <Stack.Screen 
        name="Map" 
        component={PreloadedMapScreen} 
        options={({ navigation }) => ({ 
          title: "Map View",
          headerRight: () => (
            <CartIcon navigation={navigation} />
          ),
        })} 
      />
      <Stack.Screen 
        name="Notifications" 
        component={NotificationsScreen} 
        options={({ navigation }) => ({ 
          title: "Notifications",
          headerRight: () => (
            <CartIcon navigation={navigation} />
          ),
        })} 
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={({ navigation }) => ({ 
          title: "Settings",
          headerRight: () => (
            <CartIcon navigation={navigation} />
          ),
        })} 
      />
      <Stack.Screen name="Logout" component={LogoutScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Cart" component={CartScreen} options={{ title: "Cart" }} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

// Profile Stack
function ProfileStackScreen() {
  const { theme } = useTheme();
  
  return (
    <ProfileStack.Navigator screenOptions={{
      headerStyle: { backgroundColor: theme.colors.primary },
      headerTintColor: "white",
      headerTitleAlign: "center"
    }}>
      <ProfileStack.Screen
        name="UserProfile"
        component={ProfileScreen}
        options={({ navigation }) => ({
          title: "Profile",
          headerLeft: () => (
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => navigation.getParent()?.openDrawer()}
            >
              <Ionicons name="menu" size={28} color="white" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <CartIcon navigation={navigation} />
          ),
        })}
      />
      <ProfileStack.Screen 
        name="EditProfile" 
        component={EditProfileScreen} 
        options={({ navigation }) => ({ 
          title: "Edit Profile",
          headerLeft: () => (
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={28} color="white" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <CartIcon navigation={navigation} />
          ),
        })} 
      />
    </ProfileStack.Navigator>
  );
}

// Root Navigator
function RootNavigator() {
  const { user, isLoading, isTokenValid } = useAuth();
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="Splash" component={SplashScreen} />
      {user && isTokenValid ? (
        <RootStack.Screen name="MainApp" component={AppDrawer} />
      ) : (
        <RootStack.Screen name="Auth" component={AuthStack} />
      )}
    </RootStack.Navigator>
  );
}

function AppDrawer() {
  const { theme } = useTheme();
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        drawerStyle: {
          backgroundColor: theme.colors.background,
          width: "75%",
          borderRightWidth: 1,
          borderRightColor: theme.colors.border,
        },
        headerShown: false,
      }}
    >
      <Drawer.Screen
        name="Home"
        component={HomeStack}
        options={{
          drawerLabel: "Home",
          drawerIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="Profile"
        component={ProfileStackScreen}
        options={{
          drawerLabel: "Profile",
          drawerIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="Past Donations"
        component={PastDonationScreen}
        options={({ navigation }) => ({
          drawerLabel: "Past Donations",
          drawerIcon: ({ color, size }) => <Ionicons name="time-outline" size={size} color={color} />,
          headerStyle: { backgroundColor: theme.colors.primary },
          headerTintColor: "white",
          headerTitleAlign: "center",
          headerLeft: ({ navigation }) => (
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => navigation.getParent()?.openDrawer()}
            >
              <Ionicons name="menu" size={28} color="white" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <CartIcon navigation={navigation} />
          ),
        })}
      />
      <Drawer.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={({ navigation }) => ({
          drawerLabel: "Notifications",
          drawerIcon: ({ color, size }) => <Ionicons name="notifications-outline" size={size} color={color} />,
          headerStyle: { backgroundColor: theme.colors.primary },
          headerTintColor: "white",
          headerTitleAlign: "center",
          headerLeft: ({ navigation }) => (
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => navigation.getParent()?.openDrawer()}
            >
              <Ionicons name="menu" size={28} color="white" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <CartIcon navigation={navigation} />
          ),
        })}
      />
      <Drawer.Screen
        name="Settings"
        component={SettingsScreen}
        options={({ navigation }) => ({
          drawerLabel: "Settings",
          drawerIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} />,
          headerStyle: { backgroundColor: theme.colors.primary },
          headerTintColor: "white",
          headerTitleAlign: "center",
          headerLeft: ({ navigation }) => (
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => navigation.getParent()?.openDrawer()}
            >
              <Ionicons name="menu" size={28} color="white" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <CartIcon navigation={navigation} />
          ),
        })}
      />
      <Drawer.Screen
        name="Logout"
        component={LogoutScreen}
        options={{
          drawerLabel: "Logout",
          drawerIcon: ({ color, size }) => <Ionicons name="log-out-outline" size={size} color={color} />,
          headerShown: false,
        }}
      />
    </Drawer.Navigator>
  );
}

function AppNavigator() {
  return (
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  drawerContainer: {
    flex: 1,
  },
  userSection: {
    padding: 20,
    paddingTop: 40,
    paddingBottom: 30,
    alignItems: 'center',
  },
  userAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  userAvatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  drawerItems: {
    flex: 1,
    paddingTop: 20,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginHorizontal: 10,
    marginVertical: 2,
    borderRadius: 12,
  },
  drawerItemActive: {
    backgroundColor: 'rgba(244, 127, 36, 0.1)',
  },
  drawerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  drawerLabel: {
    fontSize: 16,
    flex: 1,
  },
  drawerFooter: {
    padding: 20,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 5,
  },
  footerVersion: {
    fontSize: 12,
  },
  menuButton: {
    padding: 8,
    marginLeft: 10,
  },
});

export default AppNavigator;