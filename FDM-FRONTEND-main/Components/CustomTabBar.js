// components/CustomTabBar.js
import React, { useEffect } from "react";
import { View, TouchableOpacity, Text, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { useNotifications } from "../context/NotificationContext";

const { width } = Dimensions.get("window");
const TAB_WIDTH = width / 5; // 5 tabs

const icons = {
  Home: "home-outline",
  PastDonations: "time-outline",
  Notifications: "notifications-outline",
  Settings: "settings-outline",
  Profile: "person-outline",
};

const activeIcons = {
  Home: "home",
  PastDonations: "time",
  Notifications: "notifications",
  Settings: "settings",
  Profile: "person",
};

export default function CustomTabBar({ state, descriptors, navigation }) {
  const translateX = useSharedValue(state.index * TAB_WIDTH);
  const { unreadCount } = useNotifications();

  useEffect(() => {
    translateX.value = withTiming(state.index * TAB_WIDTH, { duration: 300 });
  }, [state.index]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={{ flexDirection: "row", height: 70, backgroundColor: "white", borderTopWidth: 1, borderTopColor: "#F47F24" }}>
      <Animated.View
        style={[
          {
            position: "absolute",
            top: 0,
            width: TAB_WIDTH,
            height: 5,
            backgroundColor: "white",
            borderRadius: 3,
          },
          animatedStyle,
        ]}
      />
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const iconName = isFocused ? activeIcons[route.name] : icons[route.name];

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={index}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            onPress={onPress}
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
          >
            <View style={{ position: 'relative' }}>
            <Ionicons name={iconName} size={28} color={isFocused ? "black" : "black"} />
              {route.name === 'Notifications' && unreadCount > 0 && (
                <View style={{
                  position: 'absolute',
                  top: -5,
                  right: -8,
                  backgroundColor: '#FF4444',
                  borderRadius: 10,
                  minWidth: 20,
                  height: 20,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 2,
                  borderColor: 'white',
                }}>
                  <Text style={{
                    color: 'white',
                    fontSize: 10,
                    fontWeight: 'bold',
                  }}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </View>
            <Text style={{ fontSize: 11, color: isFocused ? "black" : "black" }}>{route.name}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}