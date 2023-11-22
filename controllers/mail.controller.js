const { createTransport } = require("nodemailer");
const hbs = require("nodemailer-express-handlebars");
const { promisify } = require("util");

/**
 * This sends the mail for OTP to the specified email address
 * @param {string} email
 * @param {string} token
 */
const sendOTPMail = (email, token) => {
  return new Promise(async (resolve, reject) => {
    try {
      const transporter = createTransport({
        host: process.env.MAIL_HOST,
        port: 465,
        secure: true,
        auth: {
          user: process.env.EMAIL,
          pass: process.env.EMAIL_PASSWORD,
        },
      });

      const handlebarOptions = {
        viewEngine: {
          defaultLayout: false,
          // this will make sure it requests a new template each time
        },
        viewPath: "./controllers/mail-templates",
      };

      transporter.use("compile", hbs(handlebarOptions));

      const promisifiedTransporterSendMail = promisify(
        transporter.sendMail
      ).bind(transporter);

      const mailOptions = {
        from: `"BNXN from Babcock" <${process.env.EMAIL}>`,
        to: email,
        subject: "Account Security Information",
        template: "otp",
        context: {
          email: email.split("@")[0],
          token,
        },
      };

      await promisifiedTransporterSendMail(mailOptions);

      resolve();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  sendOTPMail,
};
