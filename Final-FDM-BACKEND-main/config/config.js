// config/config.js
require('dotenv').config();

const config = {
    // Server Configuration
    PORT: process.env.PORT || 8000,
    
    // MongoDB Configuration
    MONGO_URI: process.env.MONGO_URI || 'mongodb+srv://AbhishekNallam:Abhi$hek5090@cluster0.hjq0k.mongodb.net/',
    
    // JWT Configuration
    JWT_SECRET: process.env.JWT_SECRET || 'your_super_secret_jwt_key_here_make_it_long_and_random_please_change_in_production',
    
    // Email Configuration (for password reset)
    EMAIL_USERNAME: process.env.EMAIL_USERNAME || 'fooddonationmanagement07@gmail.com',
    EMAIL_PASSWORD: process.env.EMAIL_PASSWORD || 'skntjniykqeawcyq',
    
    // Firebase Configuration (if needed)
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || 'food-donation-management-52d84',
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY || 'your_firebase_private_key',
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || 'your_firebase_client_email'
};

module.exports = config; 