import React from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import colors from "../styles/colors";

export default function FoodDetailsScreen({ route, navigation }) {
  const { food } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{food.foodName}</Text>
      <Text style={styles.text}>Quantity: {food.quantity}</Text>
      <Text style={styles.text}>Expiry Date: {food.expiry}</Text>
      <Text style={styles.text}>Pickup Location: {food.location}</Text>
      <Button title="Contact Donor" color={colors.button} onPress={() => {}} />
      <Button title="Claim Donation" color={colors.button} onPress={() => navigation.navigate("Map")} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20, backgroundColor:"black" },
  title: { fontSize: 24, fontWeight: "bold", color: colors.primary, marginBottom: 10 },
  text: { fontSize: 16, color: "white", marginBottom: 5 },
});
