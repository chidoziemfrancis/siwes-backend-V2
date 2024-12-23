const COORDINATORS = require("./../../models/coordinator.model");
const STUDENTS = require("./../../models/student.model");
const SUPERVISORS = require("./../../models/supervisor.model");
const DEADLINE = require("./../../models/deadline.model");
const OTP = require("../../models/otp.model");
const { request, response } = require("express");
const { handleError } = require("./../../utils/handleError");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { ObjectId } = require("mongoose").Types;
const { randomBytes } = require("crypto");
const {
  sendOTPMail,
  sendWelcomeMail,
  sendLoginAlertMail,
} = require("../../controllers/mail.controller");
const crypto = require("crypto");


/**
 * Creates and appends the access and refresh tokens to the cookies of the client
 * @param {userInfo} user
 * @param {response} res
 * @param {String} type
 *
 * @returns {Promise<null | Error>}
 */
const create_tokens = function (user, res, type) {
  return new Promise(async (resolve, reject) => {
    try {
      const salt = await bcrypt.genSalt(10);
      const clientPayload = {
        id: user._id,
        secret: await bcrypt.hash(new Date().getTime().toString(), salt),
      };
      const clientId = {
        id: user._id,
        role: type,
      };

      if (type === "coordinator") {
        clientPayload.faculty = user.faculty;
      }

      const accessToken = jwt.sign(
        clientPayload,
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "15m" }
      );
      const refreshToken = jwt.sign(
        clientPayload,
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "7d" }
      );
      const clientToken = jwt.sign(clientId, process.env.CLIENT_TOKEN_SECRET, {
        expiresIn: "15m",
      });

      // update the user record to include the most recent token secret
      let updateInfo = null;
      switch (type) {
        case "student":
          updateInfo = await STUDENTS.updateOne(
            { _id: user._id },
            { validation_secret: clientPayload.secret }
          );
          break;

        case "coordinator":
          updateInfo = await COORDINATORS.updateOne(
            { _id: user._id },
            { validation_secret: clientPayload.secret }
          );
          break;

        case "supervisor":
          updateInfo = await SUPERVISORS.updateOne(
            { _id: user._id },
            { validation_secret: clientPayload.secret }
          );
          break;

        default:
          break;
      }

      if (updateInfo === null || updateInfo.modifiedCount === 0) {
        throw Error(
          "Something went wrong while logging you in, please try again"
        ); // TODO: will need an error code
      }

      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "development" ? false : true,
        domain:
          process.env.NODE_ENV === "development"
            ? process.env.DEV_SERVER
            : process.env.PROD_SERVER,
        sameSite: process.env.NODE_ENV === "development" ? "strict" : "none",
        maxAge: 604800000, // 7 days
      };

      res.cookie("umis_siwesA", accessToken, cookieOptions);
      res.cookie("umis_siwesR", refreshToken, cookieOptions);
      res.cookie("umis_siwesC", clientToken, {
        sameSite: process.env.NODE_ENV === "development" ? "strict" : "none",
        maxAge: 604800000,
      });

      resolve();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Register's a new student
 * @param {request} req
 * @param {response} res
 */
const register = async function (req, res) {
  const studentInfo = req.body;

  try {
    if (
      typeof studentInfo !== "object" ||
      Object.keys(studentInfo).length === 0
    ) {
      res.status(400).json({ message: "Please fill all the required fields" });
      return;
    }

    let currentTime = Date.now();
    const deadline = await DEADLINE.findOne({});

    if (deadline === null) {
      res.status(400).json({
        message:
          "We couldn't find a registration deadline, this may be because it is not yet open Please contact your SIWES coordinator",
      });
      return;
    }

    if (currentTime > deadline.time) {
      res.status(400).json({
        message: "Registration couldn't be completed as it is closed",
      });
      return;
    }

    const student = await STUDENTS.create(studentInfo);

    await create_tokens(student, res, "student");

    await sendWelcomeMail(student.email, student.firstName, student.lastName);

    res
      .status(200)
      .json({ message: "Registration successfull", data: student._id });
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * Login with email and password
 * @param {request} req
 * @param {response} res
 */
const login = async function (req, res) {
  const { email, password, type } = req.body;

  try {
    if (["student", "coordinator", "supervisor"].includes(type) === false) {
      res.status(400).json({ message: "Invalid request" });
      return;
    }

    if (email.trim().length === 0 || password.length === 0) {
      res.status(400).json({ message: "Invalid request" });
      return;
    }

    let user = null;

    switch (type) {
      case "student":
        user = await STUDENTS.findOne({ email });
        break;

      case "coordinator":
        user = await COORDINATORS.findOne({ email });
        break;

      case "supervisor":
        user = await SUPERVISORS.findOne({ email });
        break;

      default:
        break;
    }

    if (user === null) {
      res.status(400).json({ message: "Invalid credentials" });
      return;
    }

    const passwordIsValid = await bcrypt.compare(password, user.password);

    if (!passwordIsValid) {
      res.status(400).json({ message: "Invalid credentials" });
      return;
    }

    await create_tokens(user, res, type);

    await sendLoginAlertMail(
      user.email,
      new Date().toLocaleString("en-GB", { timeZone: "Africa/Lagos" })
    );

    res.status(200).json({ message: "Login successful", data: user._id });
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * Logout
 * @param {request} req
 * @param {response} res
 */
const logout = async function (req, res) {
  res.clearCookie("umis_siwesA");
  res.clearCookie("umis_siwesR");
  res.clearCookie("umis_siwesC");

  res.status(200).json({ message: "Success" });
};

/**
 * Send a 5 minutes OTP to the user's email
 * @param {request} req
 * @param {response} res
 */
const send_OTP = async function (req, res) {
  try {
    console.log("Request received:", req.body); // Log the request body

    const { email, purpose } = req.body;
    console.log("Email:", email, "Purpose:", purpose); // Log email and purpose

    if (!email || /student.babcock.edu.ng/.test(email) === false) {
      console.log("Invalid email address provided");
      res.status(400).json({
        message: "Invalid email address, please enter a valid babcock mail",
      });
      return;
    }

    if (purpose !== "registration") {
      console.log("Checking if student exists for email:", email);
      const studentExists = await STUDENTS.findOne({ email });

      if (!studentExists) {
        console.log("Student does not exist");
        res.status(400).json({
          message: "An OTP will be sent to the account if it exists.",
        });
        return;
      }
      console.log("Student exists:", studentExists);
    }

    console.log("Checking for existing OTP for email:", email);
    const existingOtp = await OTP.findOne({ email });
    console.log("Existing OTP:", existingOtp);

    if (existingOtp && existingOtp.expiry > Date.now()) {
      console.log("An active OTP already exists");
      res.status(400).json({
        message: "An OTP has already been sent, please check your spam folder.",
      });
      return;
    }

    console.log("Generating new OTP");
    const token = randomBytes(3).toString("hex").padStart(6, "0");
    const expiry = new Date(Date.now() + 5 * 60 * 1000);
    console.log("Generated token:", token,"Expiry:", expiry);

    console.log("Saving OTP to database");
    await OTP.findOneAndUpdate(
      { email },
      { token: token, email, expiry },
      { upsert: true }
    );

    console.log("Adding email to queue:", { email, token });
    emailQueue.add({ email, token });
    sendOTPMail(email, token);
    console.log("Responding to client");
    res
      .status(200)
      .json({ message: "An OTP will be sent to the account if it exists." });
  } catch (error) {
    console.error("Error occurred:", error); // Log the error
    handleError(error, res);
  }
};


/**
 * Verifies the OTP
 * @param {request} req
 * @param {response} res
 */
const verify_OTP = async function (req, res) {
  try {
    const { email, token } = req.body;

    // Validate input
    if (
      !email ||
      /student.babcock.edu.ng$/.test(email) === false ||
      !token ||
      token.length !== 6
    ) {
      res.status(400).json({ message: "Invalid OTP or email address." });
      return;
    }

    // Find OTP in database
    const doc = await OTP.findOne({ email, token });

    // Check if OTP exists and is not expired
    if (!doc || doc.expiry < Date.now()) {
      res.status(400).json({ message: "Invalid or expired OTP." });
      return;
    }

    // Delete OTP to prevent reuse
    await OTP.deleteOne({ email });

    const resetToken = jwt.sign(
      { email },
      process.env.RESET_PASSWORD_TOKEN_SECRET,
      { expiresIn: "5m" }
    );

    // Respond with success
    res.status(200).json({
      message: "OTP verified successfully.",
      data: { resetToken },
    });
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * Allows a student specifically to reset their password if they forget it
 */
const reset_password = async function (req, res) {
  try {
    const { email, password, token } = req.body;

    if (
      !email ||
      !password ||
      !token ||
      /student.babcock.edu.ng$/.test(email) == false
    ) {
      res.status(400).json({ message: "Invalid request" });
      return;
    }

    const decoded = jwt.verify(token, process.env.RESET_PASSWORD_TOKEN_SECRET);

    if (decoded.email !== email) {
      res.status(400).json({ message: "Invalid request" });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await STUDENTS.updateOne({ email }, { password: hashedPassword });

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      res.status(400).json({
        message:
          "Reset token is expired, please try to reset the password again starting from OTP verification",
      });
      return;
    }

    handleError(error, res);
  }
};

/**
 * @typedef userInfo
 * @property {ObjectId} _id
 */

module.exports = {
  login,
  logout,
  register,
  send_OTP,
  verify_OTP,
  reset_password,
};
