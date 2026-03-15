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
  bulk_assign_defense_grade,
  upload_csv_assign_grades,
  download_form,
  download_assigned_supervisor_students,
  fetch_supervisor_weekly_report_scores,
  get_supervisor_weekly_reports,
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
 *                 description: ID of the student
 *               type:
 *                 type: string
 *                 enum: [inspection, mini_inspection, main_inspection, defense, reports]
 *                 description: Type of grade (inspection 0-30, mini_inspection 0-20, main_inspection 0-10, defense 0-60, reports 0-20)
 *               score:
 *                 type: number
 *                 description: Score value based on type
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
 * /supervisor/bulkAssignDefenseGrade:
 *   post:
 *     summary: Bulk assign defense grade to multiple students
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
 *               score:
 *                 type: number
 *                 example: 50
 *                 description: Defense score between 0 and 60
 *               studentIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["64a8b9c1d2e3f4a5b6c7d8e9", "64a8b9c1d2e3f4a5b6c7d8ea"]
 *     responses:
 *       200:
 *         description: Bulk defense grade assignment completed
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post("/bulkAssignDefenseGrade", isSupervisor, bulk_assign_defense_grade);

/**
 * @swagger
 * /supervisor/uploadCsvGrades:
 *   post:
 *     summary: Upload CSV file to assign defense grades to students
 *     tags: [Supervisors]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               csvFile:
 *                 type: string
 *                 format: binary
 *                 description: CSV file containing Student ID, Student Name, and Grade columns (defense grades 0-60)
 *             required:
 *               - csvFile
 *     responses:
 *       200:
 *         description: CSV defense grade assignment completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 totalProcessed:
 *                   type: number
 *                 successfulAssignments:
 *                   type: number
 *                 failedAssignments:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       row:
 *                         type: number
 *                       studentId:
 *                         type: string
 *                       studentName:
 *                         type: string
 *                       reason:
 *                         type: string
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post("/uploadCsvGrades", isSupervisor, upload_csv_assign_grades);

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

/**
 * @swagger
 * /supervisor/weeklyReportScore/fetch:
 *   get:
 *     summary: Fetch weekly report scores for students assigned to the supervisor
 *     tags: [Supervisors]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Weekly report scores calculated successfully
 *       404:
 *         description: No weekly reports found
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/weeklyReportScore/fetch",
  isSupervisor,
  fetch_supervisor_weekly_report_scores
);

/**
 * @swagger
 * /supervisor/getWeeklyReports/{studentCode}:
 *   get:
 *     summary: Get weekly reports for a specific student assigned to the supervisor
 *     tags: [Supervisors]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: studentCode
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Weekly reports retrieved successfully
 *       403:
 *         description: Forbidden - student not assigned to this supervisor
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/getWeeklyReports/:studentCode",
  isSupervisor,
  get_supervisor_weekly_reports
);

module.exports = router;
