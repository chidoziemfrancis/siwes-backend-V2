const router = require("express").Router();
const {
  get_details,
  get_weekly_reports,
  add_work_details,
  add_weekly_reports,
  change_password,
  update_details,
} = require("./../controllers/students.controller");
const { isStudent } = require("./../middlewares/auth.middleware");

/**
 * @swagger
 * tags:
 *   name: Students
 *   description: Student management and operations
 */

/**
 * @swagger
 * /student/getDetails:
 *   get:
 *     summary: Get student details
 *     tags: [Students]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Student details retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/getDetails", isStudent, get_details);

/**
 * @swagger
 * /student/getWeeklyReports:
 *   get:
 *     summary: Get student's weekly reports
 *     tags: [Students]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Weekly reports retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/getWeeklyReports", isStudent, get_weekly_reports);

/**
 * @swagger
 * /student/workDetails:
 *   post:
 *     summary: Add work details for student
 *     tags: [Students]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               companyName:
 *                 type: string
 *               position:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Work details added successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post("/workDetails", isStudent, add_work_details);

/**
 * @swagger
 * /student/weeklyReports:
 *   post:
 *     summary: Add a weekly report
 *     tags: [Students]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               weekNumber:
 *                 type: number
 *               activities:
 *                 type: string
 *               challenges:
 *                 type: string
 *     responses:
 *       201:
 *         description: Weekly report added successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post("/weeklyReports", isStudent, add_weekly_reports);

/**
 * @swagger
 * /student/changePassword:
 *   patch:
 *     summary: Change student password
 *     tags: [Students]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               oldPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.patch("/changePassword", isStudent, change_password);

/**
 * @swagger
 * /student/details:
 *   patch:
 *     summary: Update student details
 *     tags: [Students]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Details updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.patch("/details", isStudent, update_details);

module.exports = router;
