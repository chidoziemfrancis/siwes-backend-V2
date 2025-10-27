const router = require("express").Router();
const {
  register,
  login,
  logout,
  send_OTP,
  verify_OTP,
  reset_password,
  supervisor_reset_password,
  get_active_otps,
  get_otp_by_email,
} = require("./../controllers/auth/auth.controller");

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: API for user authentication and password management
 */

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: test@student.babcock.edu.ng
 *               password:
 *                 type: string
 *                 example: "password123"
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Bad request, invalid input
 */
router.post("/register", register);

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Log in a user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: test@student.babcock.edu.ng
 *               password:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: User logged in successfully
 *       401:
 *         description: Unauthorized, invalid credentials
 */
router.post("/login", login);

/**
 * @swagger
 * /logout:
 *   post:
 *     summary: Log out a user
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: User logged out successfully
 */
router.post("/logout", logout);

/**
 * @swagger
 * /sendOTP:
 *   post:
 *     summary: Send an OTP to a user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: The user's email
 *                 example: test@student.babcock.edu.ng
 *               purpose:
 *                 type: string
 *                 description: Purpose of the OTP (e.g., registration)
 *                 example: registration
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       400:
 *         description: Invalid email or other validation error
 */
router.post("/sendOTP", send_OTP);

/**
 * @swagger
 * /verifyOTP:
 *   post:
 *     summary: Verify an OTP
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: test@student.babcock.edu.ng
 *               token:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *       400:
 *         description: Invalid OTP or token expired
 */
router.post("/verifyOTP", verify_OTP);

/**
 * @swagger
 * /forgotPassword/changePassword:
 *   patch:
 *     summary: Reset a user's password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: test@student.babcock.edu.ng
 *               newPassword:
 *                 type: string
 *                 example: "newPassword123"
 *               confirmPassword:
 *                 type: string
 *                 example: "newPassword123"
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid input or passwords do not match
 */
router.patch("/forgotPassword/changePassword", reset_password);

router.patch(
  "/forgotPassword/changePassword/supervisor",
  supervisor_reset_password
);

/**
 * @swagger
 * /activeOTPs:
 *   get:
 *     summary: Get all active OTPs (non-expired)
 *     description: This endpoint is useful for debugging and monitoring. Returns active OTPs from both Redis and MongoDB.
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Active OTPs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     redis_otps:
 *                       type: array
 *                     mongodb_otps:
 *                       type: array
 *                     total_count:
 *                       type: number
 */
router.get("/activeOTPs", get_active_otps);

/**
 * @swagger
 * /otp/{email}:
 *   get:
 *     summary: Get OTP by email
 *     description: This endpoint is useful for debugging and testing. Returns the active OTP for a specific email from both Redis and MongoDB.
 *     tags: [Authentication]
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *         description: The email address to look up
 *         example: test@student.babcock.edu.ng
 *     responses:
 *       200:
 *         description: OTP retrieved successfully
 *       404:
 *         description: No active OTP found for this email
 */
router.get("/otp/:email", get_otp_by_email);

module.exports = router;
