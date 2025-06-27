const admin = require("firebase-admin");

const initializeFirebase = () => {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_CONFIG)),
    });
    console.log("✅ Firebase Initialized");
  }
};

module.exports = { initializeFirebase };
