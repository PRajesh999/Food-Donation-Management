import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "./ThemeContext";
import { useAuth } from "../context/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { offlineMapManager } from '../utils/offlineMapManager';
import axios from 'axios';
import PasswordUpdateModal from '../Components/PasswordUpdateModal';
import API_BASE_URL from '../config/apiConfig';

export default function SettingsScreen({ navigation }) {
  const { theme, toggleDarkMode, darkMode } = useTheme();
  const { logout, user } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false);
  const [cacheSize, setCacheSize] = useState(0);
  const [isOfflineAvailable, setIsOfflineAvailable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    loadCacheInfo();
  }, []);

  const loadCacheInfo = async () => {
    try {
      const size = await offlineMapManager.getCacheSize();
      setCacheSize(size);
      
      const available = await offlineMapManager.isOfflineMapAvailable();
      setIsOfflineAvailable(available);
    } catch (error) {
      console.log('Error loading cache info:', error);
    }
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
            navigation.navigate('Logout');
          },
        },
      ]
    );
  };

  const handleClearCache = () => {
    Alert.alert(
      "Clear Cache",
      "This will clear all cached data. Are you sure?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              Alert.alert("Success", "Cache cleared successfully!");
            } catch (error) {
              Alert.alert("Error", "Failed to clear cache");
            }
          },
        },
      ]
    );
  };

  const handleHelpFAQ = () => {
    Alert.alert(
      "Help & FAQ",
      "Frequently Asked Questions:\n\n" +
      "❓ How do I donate food?\n" +
      "→ Go to 'Donate Food' and fill out the form with your food details.\n\n" +
      "❓ How do I find food donations?\n" +
      "→ Use 'Find Food' to browse available donations near you.\n\n" +
      "❓ Is my information safe?\n" +
      "→ Yes, we protect your privacy and only share necessary contact info.\n\n" +
      "❓ Can I cancel a donation?\n" +
      "→ Contact the recipient directly to arrange cancellation.\n\n" +
      "❓ How do I report an issue?\n" +
      "→ Use 'Contact Support' to reach our team.",
      [
        { text: "Contact Support", onPress: handleContactSupport },
        { text: "OK" }
      ]
    );
  };

  const handleContactSupport = () => {
    Alert.alert(
      "Contact Support",
      "Get in touch with our support team:\n\n" +
      "📧 Email: support@fooddonation.com\n" +
      "📱 Phone: +1 (555) 123-4567\n" +
      "🌐 Website: www.fooddonation.com\n\n" +
      "Response time: Within 24 hours",
      [
        { text: "Copy Email", onPress: () => {
          // In a real app, you'd copy to clipboard
          Alert.alert("Copied!", "Email address copied to clipboard");
        }},
        { text: "OK" }
      ]
    );
  };

  const handleAbout = () => {
    Alert.alert(
      "About Food Donation Management",
      "🍽️ Food Donation Management\n\n" +
      "Version: 1.0.0\n" +
      "Build: 2024.1.0\n\n" +
      "A community-driven platform dedicated to reducing food waste and helping those in need through food donations.\n\n" +
      "Features:\n" +
      "• Easy food donation process\n" +
      "• Real-time donation listings\n" +
      "• Location-based matching\n" +
      "• Secure user authentication\n\n" +
      "© 2024 Food Donation Management Team\n" +
      "All rights reserved",
      [
        { text: "Privacy Policy", onPress: () => Alert.alert("Privacy Policy", "Your privacy is important to us. We collect minimal data necessary for the app functionality and never share your personal information with third parties.") },
        { text: "Terms of Service", onPress: () => Alert.alert("Terms of Service", "By using this app, you agree to use it responsibly and treat other users with respect. We reserve the right to suspend accounts that violate our community guidelines.") },
        { text: "OK" }
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert(
      "Export Data",
      "Choose what data to export:\n\n" +
      "📊 Donation History\n" +
      "📋 User Profile\n" +
      "📍 Location Data\n\n" +
      "Data will be exported as a JSON file.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Export All", onPress: () => {
          Alert.alert("Export Started", "Your data export is being prepared. You'll receive a notification when it's ready to download.");
        }}
      ]
    );
  };

  const handleClearMapCache = async () => {
    Alert.alert(
      'Clear Map Cache',
      'This will remove all offline map data. The map will need to reload data when you next open it.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await offlineMapManager.clearMapCache();
              await loadCacheInfo();
              Alert.alert('Success', 'Map cache cleared successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear map cache');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const formatCacheSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const SettingItem = ({ icon, title, subtitle, onPress, showSwitch, switchValue, onSwitchChange, showArrow = true }) => (
    <TouchableOpacity
      style={[styles.settingItem, { backgroundColor: theme.colors.card }]}
      onPress={onPress}
      disabled={showSwitch}
    >
      <View style={styles.settingLeft}>
        <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '20' }]}>
          <Ionicons name={icon} size={24} color={theme.colors.primary} />
        </View>
        <View style={styles.settingText}>
          <Text style={[styles.settingTitle, { color: theme.colors.text }]}>{title}</Text>
          {subtitle && <Text style={[styles.settingSubtitle, { color: theme.colors.placeholder }]}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.settingRight}>
        {showSwitch ? (
          <Switch
            value={switchValue}
            onValueChange={onSwitchChange}
            trackColor={{ false: "#767577", true: theme.colors.primary }}
            thumbColor={switchValue ? "#fff" : "#f4f3f4"}
          />
        ) : showArrow ? (
          <Ionicons name="chevron-forward" size={20} color={theme.colors.placeholder} />
        ) : null}
      </View>
    </TouchableOpacity>
  );

  // Handler for updating password
  const handleUpdatePassword = () => {
    setShowPasswordModal(true);
  };

  const handlePasswordUpdate = async (newPassword) => {
    if (!user || !user.email) {
      Alert.alert("Error", "User email not found. Please re-login.");
      setShowPasswordModal(false);
      return;
    }
    setPasswordLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/users/reset-password`, {
        email: user.email,
        newPassword: newPassword.trim()
      });
      Alert.alert("Success", "Password updated successfully.");
      setShowPasswordModal(false);
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || "Failed to update password");
    } finally {
      setPasswordLoading(false);
    }
  };

  // Handler for deleting account
  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await axios.post(`${API_BASE_URL}/users/delete-account`, {
                email: user.email
              });
              Alert.alert("Account Deleted", "Your account has been deleted.");
              await logout();
              navigation.navigate('Logout');
            } catch (err) {
              Alert.alert("Error", err.response?.data?.message || "Failed to delete account");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.darkMode ? "light-content" : "dark-content"} backgroundColor={theme.colors.background} />
      
      {/* Header */}
      <LinearGradient
        colors={["#F47F24", "#FF6B35"]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>Customize your experience</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Appearance</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="moon"
              title="Dark Mode"
              subtitle={darkMode ? 'Enabled' : 'Disabled'}
              showSwitch={true}
              switchValue={darkMode}
              onSwitchChange={toggleDarkMode}
              showArrow={false}
            />
          </View>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Notifications</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="notifications"
              title="Push Notifications"
              subtitle="Receive updates about donations"
              showSwitch={true}
              switchValue={notificationsEnabled}
              onSwitchChange={setNotificationsEnabled}
              showArrow={false}
            />
          </View>
        </View>

        {/* Privacy & Security Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Privacy & Security</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="location"
              title="Location Services"
              subtitle="Allow location access for donations"
              showSwitch={true}
              switchValue={locationEnabled}
              onSwitchChange={setLocationEnabled}
              showArrow={false}
            />
            <SettingItem
              icon="save"
              title="Auto Save"
              subtitle="Automatically save form data"
              showSwitch={true}
              switchValue={autoSaveEnabled}
              onSwitchChange={setAutoSaveEnabled}
              showArrow={false}
            />
          </View>
        </View>

        {/* Data & Storage Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Data & Storage</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="trash"
              title="Clear Cache"
              subtitle="Free up storage space"
              onPress={handleClearCache}
            />
            <SettingItem
              icon="download"
              title="Export Data"
              subtitle="Download your donation history"
              onPress={handleExportData}
            />
            <SettingItem
              icon="analytics"
              title="Data Usage"
              subtitle="View app storage information"
              onPress={() => Alert.alert("Data Usage", "Current app data usage:\n\n📱 App Size: 45.2 MB\n💾 Cache: 12.8 MB\n📊 User Data: 2.1 MB\n🗺️ Maps: 8.5 MB\n\nTotal: 68.6 MB")}
            />
          </View>
        </View>

        {/* Map Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Map</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="cloud"
              title="Offline Map"
              subtitle={isOfflineAvailable ? 'Available' : 'Not available'}
              showSwitch={false}
              showArrow={false}
            />
            <SettingItem
              icon="hardware-chip"
              title="Cache Size"
              subtitle={formatCacheSize(cacheSize)}
              showSwitch={false}
              showArrow={false}
            />
            <TouchableOpacity
              style={[styles.settingItem, { backgroundColor: theme.colors.card }]}
              onPress={handleClearMapCache}
              disabled={loading}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '20' }]}>
                  <Ionicons name="trash" size={24} color={theme.colors.primary} />
                </View>
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
                    Clear Map Cache
                  </Text>
                  <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>
                    Free up storage space
                  </Text>
                </View>
              </View>
              {loading ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : (
                <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Manage Account Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Manage Account</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="key-outline"
              title="Update Password"
              subtitle="Change your account password"
              onPress={handleUpdatePassword}
            />
            <SettingItem
              icon="trash-outline"
              title="Delete Account"
              subtitle="Permanently remove your account"
              onPress={handleDeleteAccount}
            />
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Support</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="help-circle"
              title="Help & FAQ"
              subtitle="Get help and find answers"
              onPress={handleHelpFAQ}
            />
            <SettingItem
              icon="mail"
              title="Contact Support"
              subtitle="Reach out to our team"
              onPress={handleContactSupport}
            />
            <SettingItem
              icon="star"
              title="Rate App"
              subtitle="Share your feedback"
              onPress={() => Alert.alert("Rate App", "We'd love to hear from you!\n\nRate your experience:\n\n⭐ ⭐ ⭐ ⭐ ⭐ Excellent\n⭐ ⭐ ⭐ ⭐ Good\n⭐ ⭐ ⭐ Average\n⭐ ⭐ Poor\n⭐ Very Poor\n\nSend us your feedback at:\nfeedback@fooddonation.com", [
                { text: "Send Feedback", onPress: () => Alert.alert("Thank you!", "Your feedback helps us improve the app!") },
                { text: "OK" }
              ])}
            />
            <SettingItem
              icon="information-circle"
              title="About"
              subtitle="App version and information"
              onPress={handleAbout}
            />
          </View>
        </View>

        {/* Logout Section */}
        <View style={styles.section}>
          <View style={styles.sectionContent}>
            <TouchableOpacity
              style={[styles.logoutButton, { backgroundColor: "#FF4757" }]}
              onPress={handleLogout}
            >
              <Ionicons name="log-out" size={24} color="white" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.colors.placeholder }]}>
            © 2024 Food Donation Management Team
          </Text>
          <Text style={[styles.footerSubtext, { color: theme.colors.placeholder }]}>
            Version 1.0.0
          </Text>
        </View>
      </ScrollView>
      <PasswordUpdateModal
        visible={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSubmit={handlePasswordUpdate}
        loading={passwordLoading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  sectionContent: {
    paddingHorizontal: 20,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
  },
  settingRight: {
    alignItems: "center",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  logoutText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  footer: {
    alignItems: "center",
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 5,
  },
  footerSubtext: {
    fontSize: 12,
    textAlign: "center",
  },
});
