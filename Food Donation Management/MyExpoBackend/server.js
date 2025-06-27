const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db'); // Import the DB connection function
const authRoutes = require('./routes/authRoutes');
const donationRoutes = require('./routes/donationRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const userRoutes = require('./routes/userRoutes');
const cartRoutes = require('./routes/cartRoutes');
const bodyParser = require("body-parser");
const config = require('./config/config');
const cron = require('node-cron');
const Donation = require('./models/Donation');

dotenv.config();

const app = express();
const PORT = config.PORT;

// Allow larger payloads (up to 10MB)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));


// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cart', cartRoutes);

  
app.get('/', (req, res) => {
    res.send('Server is running...');
});

// Scheduled job to reset expired claims (not received within 150 min)
cron.schedule('*/5 * * * *', async () => {
  const now = new Date();
  const threshold = new Date(now.getTime() - 150 * 60 * 1000);
  try {
    const result = await Donation.updateMany(
      {
        status: 'claimed',
        claimedAt: { $lte: threshold }
      },
      {
        $set: { status: 'available' },
        $unset: { claimedAt: '', claimedBy: '' }
      }
    );
    if (result.nModified > 0) {
      console.log(`[CRON] Reset ${result.nModified} expired claimed donations to available.`);
    }
  } catch (err) {
    console.error('[CRON] Error resetting expired claims:', err);
  }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
