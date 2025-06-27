// components/CustomTabBar.js
import React, { useEffect } from "react";
import { View, TouchableOpacity, Text, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

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
            <Ionicons name={iconName} size={28} color={isFocused ? "black" : "black"} />
            <Text style={{ fontSize: 11, color: isFocused ? "black" : "black" }}>{route.name}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}