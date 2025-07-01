import React from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import colors from "../styles/colors";

const topDonors = [
  { id: "1", name: "Alice", donations: 15 },
  { id: "2", name: "Bob", donations: 12 },
  { id: "3", name: "Charlie", donations: 10 },
];

export default function LeaderboardScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Top Donors of the Month</Text>
      <FlatList
        data={topDonors}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <View style={styles.card}>
            <Text style={styles.rank}>{index + 1}.</Text>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.donations}>{item.donations} Donations</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: colors.background },
  title: { fontSize: 24, fontWeight: "bold", color: colors.primary, marginBottom: 10 },
  card: { flexDirection: "row", justifyContent: "space-between", padding: 15, backgroundColor: "#F0F0F0", borderRadius: 5, marginBottom: 10 },
  rank: { fontSize: 18, fontWeight: "bold", color: colors.primary },
  name: { fontSize: 18, fontWeight: "bold" },
  donations: { fontSize: 16, color: colors.text },
});
