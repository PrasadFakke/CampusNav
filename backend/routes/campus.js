const express = require('express');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const CampusState = require('../models/CampusState');

const router = express.Router();

async function getState() {
  let doc = await CampusState.findOne({ key: 'default' });
  if (!doc) doc = await CampusState.create({ key: 'default', blockedEdges: [] });
  return doc;
}

router.get('/blocked', requireAuth, async (req, res) => {
  const doc = await getState();
  res.json({ blockedEdges: doc.blockedEdges || [] });
});

router.post('/blocked', requireAuth, requireAdmin, async (req, res) => {
  const { key, u, v } = req.body;
  const edge = key || (u && v ? [u, v].sort().join('|') : null);
  if (!edge) return res.status(400).json({ message: 'edge key required' });
  const doc = await getState();
  if (!doc.blockedEdges.includes(edge)) {
    doc.blockedEdges.push(edge);
    await doc.save();
  }
  res.json({ blockedEdges: doc.blockedEdges });
});

router.delete('/blocked', requireAuth, requireAdmin, async (req, res) => {
  const { key, u, v } = req.body;
  const edge = key || (u && v ? [u, v].sort().join('|') : null);
  if (!edge) return res.status(400).json({ message: 'edge key required' });
  const doc = await getState();
  doc.blockedEdges = (doc.blockedEdges || []).filter((k) => k !== edge);
  await doc.save();
  res.json({ blockedEdges: doc.blockedEdges });
});

router.put('/blocked', requireAuth, requireAdmin, async (req, res) => {
  const list = Array.isArray(req.body.blockedEdges) ? req.body.blockedEdges : [];
  const doc = await getState();
  doc.blockedEdges = list;
  await doc.save();
  res.json({ blockedEdges: doc.blockedEdges });
});

module.exports = router;
