export const NavigationHelper = {
  // Safe navigation from drawer to stack screens
  navigateToStackScreen: (navigation, stackName, screenName, params = {}) => {
    try {
      console.log(`Navigating to ${stackName} -> ${screenName}`);
      navigation.getParent()?.navigate(stackName, { 
        screen: screenName,
        params 
      });
    } catch (error) {
      console.error('Navigation error:', error);
      // Optionally show an alert
    }
  },

  // Safe direct navigation
  navigate: (navigation, screenName, params = {}) => {
    try {
      console.log(`Navigating to ${screenName}`);
      navigation.navigate(screenName, params);
    } catch (error) {
      console.error('Navigation error:', error);
      // Optionally show an alert
    }
  }
}; 