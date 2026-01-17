const router = require("express").Router();
const {
  create_support,
  get_all_students,
  delete_student,
} = require("./../controllers/support.controller");
const { isSupport, isDirector } = require("./../middlewares/auth.middleware");

/**
 * @swagger
 * tags:
 *   name: Support
 *   description: Support user management and student operations
 */

/**
 * @swagger
 * /support/create:
 *   post:
 *     summary: Create a new support user (Director only)
 *     tags: [Support]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - phone
 *               - password
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: "John"
 *               lastName:
 *                 type: string
 *                 example: "Doe"
 *               email:
 *                 type: string
 *                 example: "support@support.babcock.edu.ng"
 *               phone:
 *                 type: string
 *                 example: "08012345678"
 *               password:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       201:
 *         description: Support user created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post("/create", isDirector, create_support);

/**
 * @swagger
 * /support/students:
 *   get:
 *     summary: Get all students (Support only)
 *     tags: [Support]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of students per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [course]
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of all students
 *       404:
 *         description: No students found
 *       401:
 *         description: Unauthorized
 */
router.get("/students", isSupport, get_all_students);

/**
 * @swagger
 * /support/students/:id:
 *   delete:
 *     summary: Delete a student and all related data (Support only)
 *     tags: [Support]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Student ID
 *     responses:
 *       200:
 *         description: Student and all related data deleted successfully
 *       404:
 *         description: Student not found
 *       401:
 *         description: Unauthorized
 */
router.delete("/students/:id", isSupport, delete_student);

module.exports = router;
