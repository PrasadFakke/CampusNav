const express = require('express');
const { requireAuth } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  res.json({ favourites: req.user.favourites || [] });
});

router.post('/', async (req, res) => {
  try {
    const { locationId } = req.body;
    if (!locationId) return res.status(400).json({ message: 'locationId required' });
    const user = await User.findById(req.user._id);
    if (!user.favourites.includes(locationId)) {
      user.favourites.push(locationId);
      await user.save();
    }
    res.json({ favourites: user.favourites });
  } catch (err) {
    res.status(500).json({ message: 'Could not save favourite' });
  }
});

router.delete('/:locationId', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.favourites = (user.favourites || []).filter((id) => id !== req.params.locationId);
    await user.save();
    res.json({ favourites: user.favourites });
  } catch (err) {
    res.status(500).json({ message: 'Could not remove favourite' });
  }
});

module.exports = router;
