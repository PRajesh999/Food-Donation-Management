<View style={{ alignItems: 'center', justifyContent: 'flex-start', minWidth: 110, backgroundColor: '#F7F7F7', borderRadius: 16, paddingVertical: 8, paddingHorizontal: 8, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, marginLeft: 8, flex: 1 }}>
  <Image
    source={foodTypeImages[item.foodType] || foodTypeImages["Veg"]}
    style={[
      styles.foodImageThumb,
      {
        marginBottom: 12,
        width: 110, // Increased size
        height: 110, // Increased size
        borderRadius: 20,
        borderWidth: 2,
        borderColor: statusColor + '55',
        backgroundColor: '#fff',
        shadowColor: statusColor,
        shadowOpacity: 0.12,
        shadowRadius: 8,
      },
    ]}
  />
  <View style={{ flex: 1 }} />
  <View style={{ alignItems: 'center', marginTop: 'auto', marginBottom: 2 }}>
    <View style={{
      backgroundColor: statusColor + '22',
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 5,
      marginTop: 2,
      shadowColor: statusColor,
      shadowOpacity: 0.10,
      shadowRadius: 4,
      borderWidth: 1,
      borderColor: statusColor + '55',
    }}>
      <Text style={{ color: statusColor, fontWeight: 'bold', fontSize: 13, letterSpacing: 0.5 }}>{statusText}</Text>
    </View>
  </View>
</View> 