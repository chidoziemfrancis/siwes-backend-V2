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
const redisClient = require("../../utils/redisClient");
const Supervisor = require("./../../models/supervisor.model");

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
      const clientPayload = {
        id: user._id,
        secret: crypto.randomBytes(32).toString("hex"),
      };
      if (type === "coordinator") clientPayload.faculty = user.faculty;

      const clientId = { id: user._id, role: type };

      const accessToken = jwt.sign(
        clientPayload,
        process.env.ACCESS_TOKEN_SECRET,
        {
          expiresIn: "2h",
        }
      );
      const refreshToken = jwt.sign(
        clientPayload,
        process.env.REFRESH_TOKEN_SECRET,
        {
          expiresIn: "7d",
        }
      );
      const clientToken = jwt.sign(clientId, process.env.CLIENT_TOKEN_SECRET, {
        expiresIn: "2h",
      });

      // Update user's validation_secret
      const updateQuery = { validation_secret: clientPayload.secret };
      let updateInfo = null;
      switch (type) {
        case "student":
          updateInfo = await STUDENTS.updateOne({ _id: user._id }, updateQuery);
          break;
        case "coordinator":
          updateInfo = await COORDINATORS.updateOne(
            { _id: user._id },
            updateQuery
          );
          break;
        case "supervisor":
          updateInfo = await SUPERVISORS.updateOne(
            { _id: user._id },
            updateQuery
          );
          break;
        default:
          break;
      }

      if (!updateInfo || updateInfo.modifiedCount === 0) {
        throw new Error("Failed to update user validation secret");
      }

      const cookieOptions = {
        secure: process.env.NODE_ENV !== "development",
        domain:
          process.env.NODE_ENV === "development"
            ? process.env.DEV_SERVER
            : process.env.PROD_SERVER,
        sameSite: process.env.NODE_ENV === "development" ? "strict" : "none",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      };

      res.cookie("umis_siwesA", accessToken, cookieOptions);
      res.cookie("umis_siwesR", refreshToken, cookieOptions);
      res.cookie("umis_siwesC", clientToken, {
        sameSite: cookieOptions.sameSite,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      // Resolve the tokens
      resolve({
        accessToken,
        refreshToken,
        clientToken,
      });
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
      .json({ message: "Registration successful", data: student._id });
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
      res.status(400).json({ message: "Invalid Password" });
      return;
    }

    const tokens = await create_tokens(user, res, type);
    // await sendLoginAlertMail(
    //   user.email,
    //   new Date().toLocaleString("en-GB", { timeZone: "Africa/Lagos" })
    // );

    res
      .status(200)
      .json({ message: "Login successful", data: user._id, tokens });
  } catch (error) {
    handleError(error, res);
    console.log(error);
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

/**
 * Send OTP
 */
const send_OTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Invalid email address." });
    }
    // if (!email || !/^[a-zA-Z0-9._%+-]+@student\.babcock\.edu\.ng$/.test(email)) {
    //   return res.status(400).json({ message: "Invalid email address." });
    // }

    // Check if an OTP exists for this email in Redis
    const existingOtp = await redisClient.get(`otp:${email}`);
    if (existingOtp) {
      return res.status(429).json({
        message: "An OTP has already been sent. Please check your email.",
      });
    }

    // Generate and store new OTP
    const token = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP

    // Store OTP in Redis with a 5-minute expiry
    await redisClient.set(`otp:${email}`, token, { EX: 300 });

    // Store OTP in MongoDB
    await OTP.create({
      token,
      email,
    });

    // Send OTP email
    try {
      console.log(`Sending OTP ${token} to ${email}`);
      await sendOTPMail(email, token);
    } catch (emailError) {
      console.error("Error sending OTP email:", emailError);
      return res.status(500).json({ message: "Failed to send OTP email." });
    }

    res.status(200).json({ message: "OTP sent successfully." });
  } catch (error) {
    console.error("Error in send_OTP:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

/**
 * Verify OTP
 */
const verify_OTP = async (req, res) => {
  try {
    const { email, token } = req.body;

    if (!email || !token) {
      return res
        .status(400)
        .json({ message: "Please Input a valid email or token." });
    }
    // if (!email || !/student.babcock.edu.ng$/.test(email) || !token) {
    //   return res.status(400).json({ message: "Invalid input." });
    // }

    // Check OTP in Redis
    const storedOtp = await redisClient.get(`otp:${email}`);
    if (storedOtp === token) {
      // OTP is valid; delete it from Redis
      await redisClient.del(`otp:${email}`);

      // Generate reset token
      const resetToken = jwt.sign(
        { email }, // Payload
        process.env.RESET_PASSWORD_TOKEN_SECRET, // Secret
        { expiresIn: "15m" } // Token expiry
      );

      return res.status(200).json({
        message: "OTP verified successfully.",
        data: { resetToken }, // Send reset token
      });
    }

    // If not in Redis, check MongoDB
    const otpRecord = await OTP.findOne({ email, token });

    if (!otpRecord) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    // OTP is valid in MongoDB; delete it
    await OTP.deleteOne({ _id: otpRecord._id });

    // Generate reset token
    const resetToken = jwt.sign(
      { email }, // Payload
      process.env.RESET_PASSWORD_TOKEN_SECRET,
      { expiresIn: "15m" }
    );

    res.status(200).json({
      message: "OTP verified successfully.",
      data: { resetToken }, // Send reset token
    });
  } catch (error) {
    console.error("Error in verify_OTP:", error);
    res.status(500).json({ message: "Internal server error." });
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
      !token
      // /student.babcock.edu.ng$/.test(email) == false
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
    console.log(error);
  }
};
const supervisor_reset_password = async function (req, res) {
  try {
    const { email, password, token } = req.body;

    if (
      !email ||
      !password ||
      !token
      // /student.babcock.edu.ng$/.test(email) == false
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

    await Supervisor.updateOne({ email }, { password: hashedPassword });

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
    console.log(error);
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
  supervisor_reset_password,
};
