const Pushover = require("pushover-js").Pushover;
const axios = require("axios");
const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });
module.exports = function PushoverNotfication(userPushover, check) {
  const pushover = new Pushover({
    token: process.env.PUSHOVER_TOKEN,
    user: userPushover,
  });
  pushover.send({
    message: `Check ${check.name} failed`,
    title: "Check failed",
  });
};
