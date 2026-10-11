const mongoose = require('mongoose');

const campusStateSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, default: 'default' },
    blockedEdges: { type: [String], default: [] }
  },
  { timestamps: true }
);

module.exports = mongoose.model('CampusState', campusStateSchema);
