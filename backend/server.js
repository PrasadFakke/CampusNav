require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');

const authRoutes = require('./routes/auth');
const favouriteRoutes = require('./routes/favourites');
const campusRoutes = require('./routes/campus');
const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 3000;
const frontendPath = path.join(__dirname, '..', 'frontend');
const publicPath = path.join(frontendPath, 'public');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(publicPath));
app.use('/css', express.static(path.join(frontendPath, 'css')));
app.use('/js', express.static(path.join(frontendPath, 'js')));

app.use('/api/auth', authRoutes);
app.use('/api/favourites', favouriteRoutes);
app.use('/api/campus', campusRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campusnav';

async function seedAdmin() {
  const existing = await User.findOne({ username: 'admin' });
  if (existing) {
    if (existing.role !== 'admin') {
      existing.role = 'admin';
      await existing.save();
    }
    return;
  }
  const hashed = await bcrypt.hash('Admin@123', 10);
  await User.create({
    username: 'admin',
    email: 'admin@campusnav.local',
    password: hashed,
    role: 'admin'
  });
  console.log('Seeded admin user  username=admin  password=Admin@123');
}

mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    await seedAdmin();
    app.listen(PORT, '0.0.0.0', () => {
      console.log('Server running at http://localhost:' + PORT);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });
