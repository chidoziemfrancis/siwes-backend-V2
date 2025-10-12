const router = require("express").Router();
const {
  add_director,
  get_all_directors,
  get_current_director,
  get_a_specific_director,
  get_all_supervisors,
  get_a_specific_supervisor,
  get_all_coordinators,
  get_a_specific_coordinator,
  get_all_students,
  get_a_specific_student,
  update_director_details,
  change_password,
} = require("./../controllers/director.controller");
const { isDirector } = require("./../middlewares/auth.middleware");

/**
 * @swagger
 * tags:
 *   name: Directors
 *   description: Director management and administrative operations
 */

// might need to change all /:id to refrence req.user._id to prevent accidentally creating a super admin and IDOR

/**
 * @swagger
 * /directors/add:
 *   post:
 *     summary: Add a new director
 *     tags: [Directors]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               password:
 *                 type: string
 *               office:
 *                 type: string
 *     responses:
 *       201:
 *         description: Director added successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post("/add", isDirector, add_director);

/**
 * @swagger
 * /directors/supervisors:
 *   get:
 *     summary: Get all supervisors
 *     tags: [Directors]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of all supervisors
 *       401:
 *         description: Unauthorized
 */
router.get("/supervisors", isDirector, get_all_supervisors);

/**
 * @swagger
 * /directors/supervisors/{id}:
 *   get:
 *     summary: Get a specific supervisor by ID
 *     tags: [Directors]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Supervisor details
 *       404:
 *         description: Supervisor not found
 *       401:
 *         description: Unauthorized
 */

router.get("/supervisors/:id", isDirector, get_a_specific_supervisor);

/**
 * @swagger
 * /directors/coordinators:
 *   get:
 *     summary: Get all coordinators
 *     tags: [Directors]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of all coordinators
 *       401:
 *         description: Unauthorized
 */
router.get("/coordinators", isDirector, get_all_coordinators);

/**
 * @swagger
 * /directors/coordinators/{id}:
 *   get:
 *     summary: Get a specific coordinator by ID
 *     tags: [Directors]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Coordinator details
 *       404:
 *         description: Coordinator not found
 *       401:
 *         description: Unauthorized
 */
router.get("/coordinators/:id", isDirector, get_a_specific_coordinator);

/**
 * @swagger
 * /directors/students:
 *   get:
 *     summary: Get all students
 *     tags: [Directors]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of all students
 *       401:
 *         description: Unauthorized
 */
router.get("/students", isDirector, get_all_students);

/**
 * @swagger
 * /directors/students/{id}:
 *   get:
 *     summary: Get a specific student by ID
 *     tags: [Directors]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Student details
 *       404:
 *         description: Student not found
 *       401:
 *         description: Unauthorized
 */
router.get("/students/:id", isDirector, get_a_specific_student);

/**
 * @swagger
 * /directors/changePassword:
 *   patch:
 *     summary: Change director password
 *     tags: [Directors]
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
 *                 example: "oldPass123"
 *               newPassword:
 *                 type: string
 *                 example: "newPass123"
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Bad request - incorrect old password or missing parameters
 *       401:
 *         description: Unauthorized
 */
router.patch("/changePassword", isDirector, change_password);

/**
 * @swagger
 * /directors/update/{id}:
 *   patch:
 *     summary: Update director details
 *     tags: [Directors]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Director ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               office:
 *                 type: string
 *     responses:
 *       200:
 *         description: Director updated successfully
 *       404:
 *         description: Director not found
 *       401:
 *         description: Unauthorized
 */
router.patch("/update/:id", isDirector, update_director_details);

/**
 * @swagger
 * /directors:
 *   get:
 *     summary: Get all directors
 *     tags: [Directors]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of all directors
 *       401:
 *         description: Unauthorized
 */
router.get("/", isDirector, get_all_directors);

/**
 * @swagger
 * /directors/get:
 *   get:
 *     summary: Get current logged-in director's details
 *     tags: [Directors]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Current director details
 *       404:
 *         description: Director not found
 *       401:
 *         description: Unauthorized
 */
router.get("/get", isDirector, get_current_director);

/**
 * @swagger
 * /directors/{id}:
 *   get:
 *     summary: Get a specific director by ID
 *     tags: [Directors]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Director details
 *       404:
 *         description: Director not found
 *       401:
 *         description: Unauthorized
 */
router.get("/:id", isDirector, get_a_specific_director);

module.exports = router;
