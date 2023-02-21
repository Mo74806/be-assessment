const sendEmail = require("../utils/email");
const sendWebhook = require("../utils/webhook");
const sendPushover = require("../utils/pushOver");
module.exports = (check, message) => {
  // sendEmail({
  //   email: check.createdBy.email,
  //   subject: "Montoring server status",
  //   message: message,
  // });
  if (check.wechook) sendWebhook(check.webhook, check, message);
  if (check.pushOver) sendPushover(check.pushOver, check);
};
