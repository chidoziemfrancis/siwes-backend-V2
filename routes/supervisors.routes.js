const router = require("express").Router();
const { isSupervisor } = require("./../middlewares/auth.middleware");
const {
  get_a_supervisor,
  get_assigned_students_for_defense,
  get_assigned_students_for_inspection,
  get_forms,
  change_password,
  update_supervisor_details,
  update_defense_time,
  update_inspection_time,
  assign_grade,
  download_form,
  download_assigned_supervisor_students,
} = require("./../controllers/supervisors.controller");

/**
 * @swagger
 * tags:
 *   name: Supervisors
 *   description: Supervisor operations and student management
 */

/**
 * @swagger
 * /supervisor/get/{id}:
 *   get:
 *     summary: Get supervisor details by ID
 *     tags: [Supervisors]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Supervisor ID
 *     responses:
 *       200:
 *         description: Supervisor details retrieved successfully
 *       404:
 *         description: Supervisor not found
 *       401:
 *         description: Unauthorized
 */
router.get("/get/:id", isSupervisor, get_a_supervisor);

/**
 * @swagger
 * /supervisor/assignedStudentsForDefense:
 *   get:
 *     summary: Get students assigned for defense supervision
 *     tags: [Supervisors]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of assigned students for defense
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/assignedStudentsForDefense",
  isSupervisor,
  get_assigned_students_for_defense
);

/**
 * @swagger
 * /supervisor/assignedStudentsForInspection:
 *   get:
 *     summary: Get students assigned for inspection supervision
 *     tags: [Supervisors]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of assigned students for inspection
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/assignedStudentsForInspection",
  isSupervisor,
  get_assigned_students_for_inspection
);

/**
 * @swagger
 * /supervisor/forms:
 *   get:
 *     summary: Get supervisor forms
 *     tags: [Supervisors]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Forms retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/forms", isSupervisor, get_forms);

/**
 * @swagger
 * /supervisor/downloadForm:
 *   get:
 *     summary: Download a specific form
 *     tags: [Supervisors]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Form downloaded successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/downloadForm", isSupervisor, download_form);

/**
 * @swagger
 * /supervisor/changePassword:
 *   patch:
 *     summary: Change supervisor password
 *     tags: [Supervisors]
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
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.patch("/changePassword", isSupervisor, change_password);

/**
 * @swagger
 * /supervisor/update:
 *   patch:
 *     summary: Update supervisor details
 *     tags: [Supervisors]
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
 *               email:
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
router.patch("/update", isSupervisor, update_supervisor_details);

/**
 * @swagger
 * /supervisor/updateInspectionTime:
 *   patch:
 *     summary: Update inspection time for a student
 *     tags: [Supervisors]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               studentId:
 *                 type: string
 *               inspectionTime:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Inspection time updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.patch("/updateInspectionTime", isSupervisor, update_inspection_time);

/**
 * @swagger
 * /supervisor/updateDefenseTime:
 *   patch:
 *     summary: Update defense time for a student
 *     tags: [Supervisors]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               studentId:
 *                 type: string
 *               defenseTime:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Defense time updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.patch("/updateDefenseTime", isSupervisor, update_defense_time);

/**
 * @swagger
 * /supervisor/assignGrade:
 *   post:
 *     summary: Assign grade to a student
 *     tags: [Supervisors]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               studentId:
 *                 type: string
 *               grade:
 *                 type: string
 *                 example: "A"
 *               score:
 *                 type: number
 *                 example: 85
 *     responses:
 *       200:
 *         description: Grade assigned successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post("/assignGrade", isSupervisor, assign_grade);

/**
 * @swagger
 * /supervisor/inspection/download-assigned:
 *   get:
 *     summary: Download list of assigned students for inspection
 *     tags: [Supervisors]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: File downloaded successfully
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/inspection/download-assigned",
  isSupervisor,
  download_assigned_supervisor_students
);

module.exports = router;
