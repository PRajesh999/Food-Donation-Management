const ListHeader = () => (
  <View style={styles.headerContainer}>
    {/* Filter Chips */}
    <View style={[styles.filterContainer, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}> 
      <View style={{ flex: 1, alignItems: 'flex-start' }}>
        {renderFilterChip("all", "All", notifications.length)}
      </View>
      <View style={{ flex: 1, alignItems: 'flex-end' }}>
        {renderFilterChip("unread", "Unread", unreadCount)}
      </View>
    </View>
  </View>
); 