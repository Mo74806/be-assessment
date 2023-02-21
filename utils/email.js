const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });
const sendEmail = async (options) => {
  var transport = nodemailer.createTransport({
    // host: 'smtp.mailtrap.io',
    // port: 25,
    // auth: {
    //   user: 'b8545adabb298f',
    //   pass: '5c5205fe568cfd'
    // }
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.USERMAIL,
      pass: process.env.USERPASS,
    },
  });

  const mailOption = {
    // from: 'mostafa khaled<hell@smou.io>',
    from: "m.khaled201700@gmail.com",
    to: options.email,
    subject: options.subject,
    text: options.message,
    // to: "m.khaled201774@gmail.com",
    // subject: options.subject,
    // text: options.message,
  };
  transport.sendMail(mailOption, function (err, data) {
    if (err) {
      console.log("Error Occurs");
      console.log(err);
    } else {
      console.log("Email sent successfully");
    }
  });
};

module.exports = sendEmail;
