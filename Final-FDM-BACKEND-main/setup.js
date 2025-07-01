const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up environment variables...\n');

const envContent = `# Server Configuration
PORT=5000

# MongoDB Configuration
MONGO_URI=mongodb://localhost:27017/foodwasteapp

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random_please_change_in_production

# Email Configuration (for password reset)
EMAIL_USERNAME=your_email@gmail.com
EMAIL_PASSWORD=your_email_app_password

# Firebase Configuration (if needed)
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY=your_firebase_private_key
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
`;

const envPath = path.join(__dirname, '.env');

if (fs.existsSync(envPath)) {
    console.log('⚠️  .env file already exists. Skipping creation.');
} else {
    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env file created successfully!');
    console.log('📝 Please update the values in .env file with your actual configuration.');
}

console.log('\n🚀 You can now start the server with: npm start');
console.log('💡 Make sure to update the JWT_SECRET with a strong, random string for production!'); 