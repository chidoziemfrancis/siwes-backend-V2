const router = require("express").Router();
const {
    get_all_supervisors,
    get_a_specific_supervisor,
    get_all_coordinators,
    get_a_specific_coordinator,
    get_all_students,
    get_a_specific_student
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
