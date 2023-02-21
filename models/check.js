const mongoose = require("mongoose");
const UserModel = require("./user");
const removeFromCheckList = require("../controllers/checkController");
const addToCheckList = require("../controllers/checkController");

const ReportModel = require("./Report");
const checkSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "A check must have a name"],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    method: {
      type: String,
      enum: ["GET", "POST", "PUT", "DELETE"],
      default: "GET",
    },
    url: {
      type: String,
      required: [true, "please provide the URL for the check"],
    },
    protocol: {
      type: String,
      enum: ["http", "https", "tcp"],
      default: "http",
    },
    path: {
      type: String,
      default: "/",
    },
    port: {
      type: Number,
    },
    webhook: {
      type: String,
    },
    pushOver: {
      type: String,
    },
    timeout: {
      type: Number,
      min: 5,
      default: 5,
    },
    interval: {
      type: Number,
      min: 10,
      default: 10,
    },
    threshold: {
      type: Number,
      min: 1,
      default: 1,
    },
    authentication: {
      type: {
        username: String,
        password: String,
      },
    },
    httpHeaders: { type: [{ key: String, value: String }] },
    assert: {
      statusCode: {
        type: Number,
      },
    },
    tags: { type: [String] },
    ignoreSSL: {
      type: Boolean,
      default: false,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  }
);
/*postSave middleware to add the check in user schema*/
checkSchema.pre("save", function (next) {
  console.log(this);
  UserModel.findById(this.createdBy).then((user) => {
    user.checks.push(this.id);
    user.save({ validateBeforeSave: false });
    next();
  });
});

checkSchema.pre("findByIdAndDelete", async function (next) {
  const check = this;
  removeFromCheckList(check);
  await ReportModel.findByIdAndDelete(this.id);
  next();
});

checkSchema.pre("findByIdAndUpdate", async function (next) {
  const check = this;
  removeFromCheckList(check);
  addToCheckList(check);
  next();
});

/* make an index on user and check to prevent creating duplicate checks*/
checkSchema.index({ createdBy: 1, name: 1 }, { unique: true });
const Check = mongoose.model("Check", checkSchema);
module.exports = Check;
