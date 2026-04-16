const COORDINATORS = require("./../../models/coordinator.model");
const STUDENTS = require("./../../models/student.model");
const SUPERVISORS = require("./../../models/supervisor.model");
const DIRECTORS = require("../../models/director.model");
const SUPPORT = require("../../models/support.model");
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
const {
  uploadImageFromBuffer,
  deleteAsset,
  ALLOWED_IMAGE_MIME_TYPES,
} = require("../../utils/cloudinary");

const STAFF_ACCOUNT_TYPES = [
  "supervisor",
  "coordinator",
  "director",
  "support",
];

const normalizeEmail = (email) =>
  typeof email === "string" ? email.trim().toLowerCase() : "";

const isStudentEmail = (email) =>
  /^[a-z0-9._%+-]+@student\.babcock\.edu\.ng$/i.test(email);

const inferAccountTypeFromEmail = (email) => {
  if (isStudentEmail(email)) return "student";
  return null;
};

function normalizeAccountTypeForRequest(email, bodyAccountType) {
  const inferred = inferAccountTypeFromEmail(email);
  if (inferred) {
    if (bodyAccountType && bodyAccountType !== "student") {
      return { error: "account_type_mismatch" };
    }
    return { accountType: "student" };
  }
  if (!bodyAccountType || !STAFF_ACCOUNT_TYPES.includes(bodyAccountType)) {
    return { error: "account_type_required" };
  }
  return { accountType: bodyAccountType };
}

async function findUserByAccountType(email, accountType) {
  switch (accountType) {
    case "student":
      return await STUDENTS.findOne({ email });
    case "supervisor":
      return await SUPERVISORS.findOne({ email });
    case "coordinator":
      return await COORDINATORS.findOne({ email });
    case "director":
      return await DIRECTORS.findOne({ email });
    case "support":
      return await SUPPORT.findOne({ email });
    default:
      return null;
  }
}

async function resolveAccountTypeFromEmail(email) {
  if (await STUDENTS.findOne({ email })) return "student";
  if (await SUPERVISORS.findOne({ email })) return "supervisor";
  if (await COORDINATORS.findOne({ email })) return "coordinator";
  if (await DIRECTORS.findOne({ email })) return "director";
  if (await SUPPORT.findOne({ email })) return "support";
  return null;
}

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
        case "director":
          updateInfo = await DIRECTORS.updateOne(
            { _id: user._id },
            updateQuery
          );
          break;
        case "support":
          updateInfo = await SUPPORT.updateOne(
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
  const studentInfo = { ...req.body };
  let uploadedProfileImagePublicId = null;
  try {
    // Check for express-fileupload file size limit errors
    if (req.files && req.files.errors) {
      const fileErrors = req.files.errors;
      if (fileErrors.length > 0) {
        res.status(400).json({
          message: fileErrors[0] || "File upload error. Please ensure the file size does not exceed 5MB.",
        });
        return;
      }
    }

    if (
      typeof studentInfo !== "object" ||
      Object.keys(studentInfo).length === 0
    ) {
      res.status(400).json({ message: "Please fill all the required fields" });
      return;
    }

    // Validate email format - must be a Babcock student email
    if (
      !studentInfo.email ||
      !/^[a-zA-Z0-9._%+-]+@student\.babcock\.edu\.ng$/.test(studentInfo.email)
    ) {
      res.status(400).json({
        message:
          "Please use your Babcock student email (@student.babcock.edu.ng)",
      });
      return;
    }

    if (
      studentInfo.bankDetails &&
      typeof studentInfo.bankDetails === "string"
    ) {
      try {
        studentInfo.bankDetails = JSON.parse(studentInfo.bankDetails);
      } catch (error) {
        res.status(400).json({
          message: "Unable to process bank details. Please try again.",
        });
        return;
      }
    }

    if (
      (!studentInfo.bankDetails ||
        typeof studentInfo.bankDetails !== "object") &&
      (studentInfo["bankDetails[name]"] ||
        studentInfo["bankDetails[accountNumber]"] ||
        studentInfo["bankDetails[sortCode]"])
    ) {
      studentInfo.bankDetails = {
        name:
          studentInfo["bankDetails[name]"] ||
          studentInfo["bankDetails.name"] ||
          "",
        accountNumber:
          studentInfo["bankDetails[accountNumber]"] ||
          studentInfo["bankDetails.accountNumber"] ||
          "",
        sortCode:
          studentInfo["bankDetails[sortCode]"] ||
          studentInfo["bankDetails.sortCode"] ||
          "",
      };
    }

    if (
      !studentInfo.bankDetails ||
      typeof studentInfo.bankDetails !== "object" ||
      Object.keys(studentInfo.bankDetails).length === 0
    ) {
      res.status(400).json({
        message: "Bank details are required to complete registration",
      });
      return;
    }

    if (studentInfo.middleName === "") {
      delete studentInfo.middleName;
    }

    if (
      req.files &&
      req.files.profileImage
    ) {
      const profileImage = Array.isArray(req.files.profileImage)
        ? req.files.profileImage[0]
        : req.files.profileImage;

      // Validate that profileImage exists and has required properties
      if (!profileImage) {
        res.status(400).json({
          message: "Profile image file is missing or invalid.",
        });
        return;
      }

      // Validate mimetype
      if (!profileImage.mimetype || !ALLOWED_IMAGE_MIME_TYPES.includes(profileImage.mimetype)) {
        res.status(400).json({
          message:
            "Invalid image format. Please upload a JPG, PNG, or WEBP image.",
        });
        return;
      }

      // Validate file size
      if (!profileImage.size || profileImage.size === 0) {
        res.status(400).json({
          message: "The uploaded image file is empty. Please upload a valid image.",
        });
        return;
      }

      if (profileImage.size > 5 * 1024 * 1024) {
        const fileSizeMB = (profileImage.size / (1024 * 1024)).toFixed(2);
        res.status(400).json({
          message: `Image size (${fileSizeMB}MB) exceeds the maximum allowed size of 5MB. Please upload a smaller image.`,
        });
        return;
      }

      // Validate that profileImage.data exists and is a Buffer
      if (!profileImage.data || !Buffer.isBuffer(profileImage.data)) {
        res.status(400).json({
          message: "Invalid image data. The file may be corrupted. Please try uploading again.",
        });
        return;
      }

      // Validate buffer is not empty
      if (profileImage.data.length === 0) {
        res.status(400).json({
          message: "The image file appears to be empty. Please upload a valid image.",
        });
        return;
      }

      // Upload to Cloudinary with error handling
      try {
        const uploadResult = await uploadImageFromBuffer(
          profileImage.data,
          profileImage.mimetype,
          {
            eager: [
              {
                width: 320,
                height: 320,
                crop: "fill",
                gravity: "face",
                quality: "auto",
              },
            ],
          }
        );

        if (!uploadResult || !uploadResult.secure_url) {
          res.status(500).json({
            message: "Failed to upload image. Please try again later.",
          });
          return;
        }

        studentInfo.profileImageUrl = uploadResult.secure_url;
        studentInfo.profileImagePublicId = uploadResult.public_id;
        studentInfo.profileImageThumbnailUrl =
          uploadResult.eager?.[0]?.secure_url || uploadResult.secure_url;
        uploadedProfileImagePublicId = uploadResult.public_id;
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
        
        // Handle specific Cloudinary errors
        if (uploadError.message && uploadError.message.includes("Unsupported image format")) {
          res.status(400).json({
            message: "The image format is not supported. Please upload a JPG, PNG, or WEBP image.",
          });
          return;
        }

        if (uploadError.message && uploadError.message.includes("Invalid file buffer")) {
          res.status(400).json({
            message: "The image file appears to be corrupted. Please try uploading a different image.",
          });
          return;
        }

        // Generic Cloudinary error
        res.status(500).json({
          message: "Failed to upload image to storage. Please try again later or contact support if the problem persists.",
        });
        return;
      }
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

    // await sendWelcomeMail(student.email, student.firstName, student.lastName);

    res
      .status(200)
      .json({ message: "Registration successful", data: student._id });
  } catch (error) {
    if (uploadedProfileImagePublicId) {
      await deleteAsset(uploadedProfileImagePublicId);
    }
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
    if (
      ["student", "coordinator", "supervisor", "director", "support"].includes(type) ===
      false
    ) {
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

      case "director":
        user = await DIRECTORS.findOne({ email });
        break;

      case "support":
        user = await SUPPORT.findOne({ email });
        break;

      default:
        break;
    }
    if (user === null) {
      res.status(400).json({ 
        message: "User not found. Please sign up first.",
        code: "USER_NOT_FOUND"
      });
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
    const email = normalizeEmail(req.body?.email);
    const resend = Boolean(req.body?.resend);

    if (!email) {
      return res.status(400).json({ message: "Invalid email address." });
    }

    if (!isStudentEmail(email)) {
      if (!/^[a-z0-9._%+-]+@babcock\.edu\.ng$/i.test(email)) {
        return res.status(400).json({
          message:
            "Use your Babcock email (@student.babcock.edu.ng for students, or @babcock.edu.ng for staff).",
        });
      }
    }

    const typeResult = normalizeAccountTypeForRequest(
      email,
      req.body?.accountType
    );
    if (typeResult.error === "account_type_mismatch") {
      return res.status(400).json({
        message:
          "This email is a student address. Select Student as account type.",
      });
    }
    if (typeResult.error === "account_type_required") {
      return res.status(400).json({
        message:
          "For staff email, select your role (supervisor, coordinator, director, or support).",
      });
    }
    const { accountType } = typeResult;

    const user = await findUserByAccountType(email, accountType);
    if (!user) {
      return res.status(404).json({
        message: "No account found for this email.",
      });
    }

    if (resend) {
      await redisClient.del(`otp:${email}`);
      await OTP.deleteMany({ email });
    } else {
      const existingOtp = await redisClient.get(`otp:${email}`);
      if (existingOtp) {
        return res.status(429).json({
          message:
            "An OTP has already been sent. Please check your email or use Resend.",
        });
      }
    }

    const token = Math.floor(100000 + Math.random() * 900000).toString();

    try {
      console.log(`Attempting to send OTP ${token} to ${email}`);
      const result = await sendOTPMail(email, token);

      if (result && result.success) {
        await redisClient.set(`otp:${email}`, token, { EX: 300 });

        OTP.create({ token, email }).catch((err) => {
          console.error(
            `Failed to store OTP in MongoDB for ${email}:`,
            err.message
          );
        });

        console.log(`OTP ${token} successfully sent and stored for ${email}`);
        return res.status(200).json({ message: "OTP sent successfully." });
      } else {
        console.error(
          `Failed to send OTP to ${email}: Email service returned failure`
        );
        return res.status(500).json({ message: "Failed to send OTP email." });
      }
    } catch (emailError) {
      console.error("Error sending OTP email:", emailError);
      return res.status(500).json({
        message: "Failed to send OTP email. Please try again later.",
        error:
          process.env.NODE_ENV === "development"
            ? emailError.message
            : undefined,
      });
    }
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
    const email = normalizeEmail(req.body?.email);
    const token = req.body?.token;

    if (!email || !token) {
      return res
        .status(400)
        .json({ message: "Please Input a valid email or token." });
    }

    const typeResult = normalizeAccountTypeForRequest(
      email,
      req.body?.accountType
    );
    if (typeResult.error === "account_type_mismatch") {
      return res.status(400).json({
        message:
          "This email is a student address. Select Student as account type.",
      });
    }
    if (typeResult.error === "account_type_required") {
      return res.status(400).json({
        message:
          "For staff email, select your role (supervisor, coordinator, director, or support).",
      });
    }
    const { accountType } = typeResult;

    const user = await findUserByAccountType(email, accountType);
    if (!user) {
      return res.status(404).json({ message: "No account found for this email." });
    }

    const storedOtp = await redisClient.get(`otp:${email}`);
    if (storedOtp === String(token)) {
      await redisClient.del(`otp:${email}`);

      const resetToken = jwt.sign(
        { email, accountType },
        process.env.RESET_PASSWORD_TOKEN_SECRET,
        { expiresIn: "15m" }
      );

      return res.status(200).json({
        message: "OTP verified successfully.",
        data: { resetToken },
      });
    }

    try {
      const otpRecord = await Promise.race([
        OTP.findOne({ email, token: String(token) }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("MongoDB timeout")), 3000)
        ),
      ]);

      if (!otpRecord) {
        return res.status(400).json({ message: "Invalid or expired OTP." });
      }

      await OTP.deleteOne({ _id: otpRecord._id });

      const resetToken = jwt.sign(
        { email, accountType },
        process.env.RESET_PASSWORD_TOKEN_SECRET,
        { expiresIn: "15m" }
      );

      return res.status(200).json({
        message: "OTP verified successfully.",
        data: { resetToken },
      });
    } catch (dbError) {
      console.error("Error checking MongoDB for OTP:", dbError.message);
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }
  } catch (error) {
    console.error("Error in verify_OTP:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

/**
 * Reset password after OTP verification (all account types)
 */
const reset_password = async function (req, res) {
  try {
    const email = normalizeEmail(req.body?.email);
    const { password, token } = req.body;

    if (!email || !password || !token) {
      res.status(400).json({ message: "Invalid request" });
      return;
    }

    const decoded = jwt.verify(token, process.env.RESET_PASSWORD_TOKEN_SECRET);

    if (normalizeEmail(decoded.email) !== email) {
      res.status(400).json({ message: "Invalid request" });
      return;
    }

    let accountType = decoded.accountType;
    if (!accountType) {
      accountType = await resolveAccountTypeFromEmail(email);
    }
    if (!accountType) {
      res.status(400).json({ message: "Invalid request" });
      return;
    }

    const user = await findUserByAccountType(email, accountType);
    if (!user) {
      res.status(400).json({ message: "Invalid request" });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    switch (accountType) {
      case "student":
        await STUDENTS.updateOne({ email }, { password: hashedPassword });
        break;
      case "supervisor":
        await SUPERVISORS.updateOne({ email }, { password: hashedPassword });
        break;
      case "coordinator":
        await COORDINATORS.updateOne({ email }, { password: hashedPassword });
        break;
      case "director":
        await DIRECTORS.updateOne({ email }, { password: hashedPassword });
        break;
      case "support":
        await SUPPORT.updateOne({ email }, { password: hashedPassword });
        break;
      default:
        res.status(400).json({ message: "Invalid request" });
        return;
    }

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
 * Get all active OTPs (non-expired)
 * This endpoint is useful for debugging and monitoring
 */
const get_active_otps = async (req, res) => {
  try {
    const result = {
      redis_otps: [],
      mongodb_otps: [],
      total_count: 0,
    };

    // Get OTPs from Redis
    try {
      const keys = await redisClient.keys("otp:*");
      for (const key of keys) {
        const email = key.replace("otp:", "");
        const otp = await redisClient.get(key);
        const ttl = await redisClient.ttl(key);
        result.redis_otps.push({
          email,
          otp,
          expires_in_seconds: ttl,
          source: "redis",
        });
      }
    } catch (redisError) {
      console.error("Error fetching OTPs from Redis:", redisError.message);
    }

    // Get OTPs from MongoDB
    try {
      const mongoOtps = await OTP.find({
        createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) }, // Last 5 minutes
      }).lean();

      result.mongodb_otps = mongoOtps.map((otp) => ({
        email: otp.email,
        otp: otp.token,
        created_at: otp.createdAt,
        expires_at: new Date(otp.createdAt.getTime() + 5 * 60 * 1000),
        source: "mongodb",
      }));
    } catch (mongoError) {
      console.error("Error fetching OTPs from MongoDB:", mongoError.message);
    }

    result.total_count = result.redis_otps.length + result.mongodb_otps.length;

    res.status(200).json({
      message: "Active OTPs retrieved successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error in get_active_otps:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

/**
 * Get OTP by email
 * This endpoint is useful for debugging and testing
 */
const get_otp_by_email = async (req, res) => {
  try {
    const email = normalizeEmail(req.params?.email);

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const result = {
      found: false,
      redis_otp: null,
      mongodb_otp: null,
    };

    // Check Redis first
    try {
      const redisKey = `otp:${email}`;
      const otp = await redisClient.get(redisKey);
      if (otp) {
        const ttl = await redisClient.ttl(redisKey);
        result.redis_otp = {
          email,
          otp,
          expires_in_seconds: ttl,
          source: "redis",
        };
        result.found = true;
      }
    } catch (redisError) {
      console.error("Error fetching OTP from Redis:", redisError.message);
    }

    // Check MongoDB
    try {
      const mongoOtp = await OTP.findOne({ email }).lean();
      if (mongoOtp) {
        result.mongodb_otp = {
          email: mongoOtp.email,
          otp: mongoOtp.token,
          created_at: mongoOtp.createdAt,
          expires_at: new Date(mongoOtp.createdAt.getTime() + 5 * 60 * 1000),
          source: "mongodb",
        };
        result.found = true;
      }
    } catch (mongoError) {
      console.error("Error fetching OTP from MongoDB:", mongoError.message);
    }

    if (!result.found) {
      return res.status(404).json({
        message: "No active OTP found for this email",
        data: result,
      });
    }

    res.status(200).json({
      message: "OTP retrieved successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error in get_otp_by_email:", error);
    res.status(500).json({ message: "Internal server error." });
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
  get_active_otps,
  get_otp_by_email,
};
