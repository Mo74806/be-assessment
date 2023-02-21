const mongoose = require("mongoose");
const reportSchema = new mongoose.Schema(
  {
    check: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Check",
    },
    status: { type: String },
    availability: { type: Number, default: 0 },
    outages: { type: Number, default: 0 },
    downTime: { type: Number, default: 0 },
    upTime: { type: Number, default: 0 },
    responseTime: { type: Number, default: 0 },
    history: { type: [String] },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  }
);
const Report = mongoose.model("Report", reportSchema);
module.exports = Report;
