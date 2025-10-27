const { createTransport } = require("nodemailer");
const hbs = require("nodemailer-express-handlebars");
const { promisify } = require("util");
const path = require("path");

// Create a reusable transporter instance
let transporter = null;

/**
 * Initialize or get the email transporter
 * This ensures we reuse the same transporter instance
 */
const getTransporter = () => {
  if (!transporter) {
    transporter = createTransport({
      host: process.env.MAIL_HOST,
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
      },
      // Add connection timeout and better error handling
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000,
    });

    // Configure handlebars template engine once
    const handlebarOptions = {
      viewEngine: {
        extName: ".handlebars",
        partialsDir: path.join(__dirname, "mail-templates"),
        defaultLayout: false,
      },
      viewPath: path.join(__dirname, "mail-templates"),
      extName: ".handlebars",
    };

    transporter.use("compile", hbs(handlebarOptions));
  }
  return transporter;
};

/**
 * This sends the mail for OTP to the specified email address
 * @param {string} email
 * @param {string} token
 * @returns {Promise<{success: boolean, messageId?: string}>}
 */
const sendOTPMail = async (email, token) => {
  try {
    // Get or create transporter
    const mailTransporter = getTransporter();

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

    // Send the email and wait for completion
    const info = await mailTransporter.sendMail(mailOptions);

    console.log(
      `OTP email sent successfully to ${email}. MessageId: ${info.messageId}`
    );

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending OTP email:", error);
    throw new Error(`Failed to send OTP email: ${error.message}`);
  }
};

/**
 * This sends the mail for errors to the main mail
 * @param {Error} error
 * @returns {Promise<void>}
 */
const sendErrorMail = async (error) => {
  try {
    const mailTransporter = getTransporter();

    const mailOptions = {
      from: `"BNXN from Babcock" <${process.env.EMAIL}>`,
      to: process.env.EMAIL,
      subject: "Error Occured",
      template: "error",
      context: {
        error: JSON.stringify(error),
      },
    };

    await mailTransporter.sendMail(mailOptions);
    console.log("Error mail sent successfully");
  } catch (err) {
    console.error("Error sending error mail:", err);
    throw new Error(`Failed to send error email: ${err.message}`);
  }
};

/**
 * This sends the mail for login alerts to the specified email address
 * @param {string} email
 * @param {string} ipAddress
 * @param {Date} loginTime
 * @returns
 */
const sendLoginAlertMail = async (email, loginTime) => {
  try {
    const mailTransporter = getTransporter();

    const mailOptions = {
      from: `"BNXN from Babcock" <${process.env.EMAIL}>`,
      to: email,
      subject: "Login Alert",
      template: "login",
      context: {
        email: email,
        loginTime,
      },
    };

    await mailTransporter.sendMail(mailOptions);
    console.log(`Login alert email sent to ${email}`);
  } catch (error) {
    console.error("Error sending login alert email:", error);
    throw new Error(`Failed to send login alert email: ${error.message}`);
  }
};

/**
 * This sends the mail for welcome to the specified email address
 * @param {string} firstName
 * @param {string} lastName
 * @returns
 */
const sendWelcomeMail = async (email, firstName, lastName) => {
  try {
    const mailTransporter = getTransporter();

    const mailOptions = {
      from: `"BNXN from Babcock" <${process.env.EMAIL}>`,
      to: email,
      subject: "Welcome to Babcock University's SIWES portal",
      template: "registration",
      context: {
        firstName: firstName,
        lastName: lastName,
      },
    };

    await mailTransporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${email}`);
  } catch (error) {
    console.error("Error sending welcome email:", error);
    throw new Error(`Failed to send welcome email: ${error.message}`);
  }
};

/**
 * This sends a mail with login credentials to supervisors
 * @param {string} firstName
 * @param {string} lastName
 * @returns
 */
const sendMailToSupervisorEmail = async ({
  email,
  firstName,
  lastName,
  password,
}) => {
  try {
    const mailTransporter = getTransporter();

    const mailOptions = {
      from: `"SIWES TEAM from Babcock" <${process.env.EMAIL}>`,
      to: email,
      subject: "Welcome to Babcock University's SIWES portal",
      template: "supervisor-registration",
      context: {
        firstName,
        lastName,
        email,
        password,
      },
    };

    await mailTransporter.sendMail(mailOptions);
    console.log(`Supervisor registration email sent to ${email}`);
  } catch (error) {
    console.error("Error sending supervisor registration email:", error);
    throw new Error(
      `Failed to send supervisor registration email: ${error.message}`
    );
  }
};

module.exports = {
  sendOTPMail,
  sendErrorMail,
  sendLoginAlertMail,
  sendWelcomeMail,
  sendMailToSupervisorEmail,
};
