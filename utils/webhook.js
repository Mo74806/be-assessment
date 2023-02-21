const axios = require("axios");
const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });

module.exports = function WebhookNotify(userWebhook, check, message) {
  axios
    .post(userwebhook, {
      checkUrl: check.url,
      checkName: check.name,
      checkId: check._id,
      message,
    })
    .then((res) => {
      console.log(message);
      console.log(res);
    })
    .catch((error) => {
      console.error(error);
    });
};
