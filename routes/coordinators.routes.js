const router = require("express").Router();
const {
  get_all_coordinators,
  get_a_specific_coordinator,
  delete_a_coordinator,
  add_a_new_coordinator,
  update_coordinator_details,
  change_password,
  upload_inspection_forms,
  create_supervisor,
  get_all_supervisors,
  get_defense_list,
  get_inspection_list,
  assign_defense_supervisor,
  assign_inspection_supervisor,
  bulk_assign_inspection_supervisor,
  bulk_assign_defense_supervisor,
  get_all_students,
  get_a_student,
  set_registration_deadline,
  get_registration_deadline,
  get_weekly_reports,
  assign_grade,
  collate_grades,
  collate_all_grades,
  get_forms,
  delete_form,
  search_for_students,
  download_all_student_data,
  update_student_details,
  assign_score_for_student_weekly_report,
  fetch_weekly_report_scores,
  download_csv_score_for_student_weekly_report,
  download_all_students,
  download_student_inspection_supervisors,
  assign_right_defense_supervisor,
  assign_defense_supervisor_by_course,
} = require("./../controllers/coordinators.controller");
const { isCoordinator } = require("./../middlewares/auth.middleware");
const {
  processFileUpload,
} = require("./../middlewares/media_upload.middleware");

/**
 * @swagger
 * tags:
 *   name: Coordinators
 *   description: Coordinator management and administrative operations
 */

// might need to change all /:id to refrence req.user._id to prevent accidentally creating a super admin and IDOR

/**
 * @swagger
 * /coordinators/getAll:
 *   get:
 *     summary: Get all coordinators
 *     tags: [Coordinators]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of all coordinators
 *       401:
 *         description: Unauthorized
 */
router.get("/getAll", isCoordinator, get_all_coordinators);

/**
 * @swagger
 * /coordinators/get/{id}:
 *   get:
 *     summary: Get a specific coordinator by ID
 *     tags: [Coordinators]
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
router.get("/get/:id", isCoordinator, get_a_specific_coordinator);

/**
 * @swagger
 * /coordinators/defenseList:
 *   get:
 *     summary: Get defense list
 *     tags: [Coordinators]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Defense list retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/defenseList", isCoordinator, get_defense_list);

/**
 * @swagger
 * /coordinators/inspectionList:
 *   get:
 *     summary: Get inspection list
 *     tags: [Coordinators]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Inspection list retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/inspectionList", isCoordinator, get_inspection_list);

/**
 * @swagger
 * /coordinators/supervisors:
 *   get:
 *     summary: Get all supervisors
 *     tags: [Coordinators]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of all supervisors
 *       401:
 *         description: Unauthorized
 */
router.get("/supervisors", isCoordinator, get_all_supervisors);

/**
 * @swagger
 * /coordinators/students:
 *   get:
 *     summary: Get all students
 *     tags: [Coordinators]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of all students
 *       401:
 *         description: Unauthorized
 */
router.get("/students", isCoordinator, get_all_students);

/**
 * @swagger
 * /coordinators/students/inspection/download:
 *   get:
 *     summary: Download inspection data for all students
 *     tags: [Coordinators]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Download file generated successfully
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/students/inspection/download",
  isCoordinator,
  download_all_students
);

/**
 * @swagger
 * /coordinators/students/download:
 *   get:
 *     summary: Download all student data
 *     tags: [Coordinators]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Student data downloaded successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/students/download", isCoordinator, download_all_student_data);

/**
 * @swagger
 * /coordinators/students/inspection-supervisors/download:
 *   get:
 *     summary: Download student inspection supervisors data
 *     tags: [Coordinators]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Download successful
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/students/inspection-supervisors/download",
  isCoordinator,
  download_student_inspection_supervisors
);

/**
 * @swagger
 * /coordinators/students/{id}:
 *   get:
 *     summary: Get a specific student by ID
 *     tags: [Coordinators]
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
router.get("/students/:id", isCoordinator, get_a_student);

/**
 * @swagger
 * /coordinators/search/students:
 *   get:
 *     summary: Search for students
 *     tags: [Coordinators]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Search query
 *     responses:
 *       200:
 *         description: Search results
 *       401:
 *         description: Unauthorized
 */
router.get("/search/students", isCoordinator, search_for_students);

/**
 * @swagger
 * /coordinators/getWeeklyReports/{studentCode}:
 *   get:
 *     summary: Get weekly reports for a student
 *     tags: [Coordinators]
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
 *         description: Weekly reports retrieved
 *       404:
 *         description: Student not found
 *       401:
 *         description: Unauthorized
 */
router.get("/getWeeklyReports/:studentCode", isCoordinator, get_weekly_reports);

/**
 * @swagger
 * /coordinators/weeklyReportScore:
 *   get:
 *     summary: Assign score for student weekly report
 *     tags: [Coordinators]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Score assigned successfully
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/weeklyReportScore",
  isCoordinator,
  assign_score_for_student_weekly_report
);

/**
 * @swagger
 * /coordinators/weeklyReportScore/fetch:
 *   get:
 *     summary: Fetch weekly report scores
 *     tags: [Coordinators]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Scores retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/weeklyReportScore/fetch",
  isCoordinator,
  fetch_weekly_report_scores
);

/**
 * @swagger
 * /coordinators/weeklyReportScore/csv:
 *   get:
 *     summary: Download CSV of weekly report scores
 *     tags: [Coordinators]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: CSV file downloaded successfully
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/weeklyReportScore/csv",
  isCoordinator,
  download_csv_score_for_student_weekly_report
);

/**
 * @swagger
 * /coordinators/forms:
 *   get:
 *     summary: Get all forms
 *     tags: [Coordinators]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Forms retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/forms", isCoordinator, get_forms);

/**
 * @swagger
 * /coordinators/registrationDeadline:
 *   get:
 *     summary: Get registration deadline
 *     tags: [Coordinators]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Deadline retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/registrationDeadline", isCoordinator, get_registration_deadline);

/**
 * @swagger
 * /coordinators/add:
 *   post:
 *     summary: Add a new coordinator
 *     tags: [Coordinators]
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
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Coordinator added successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post("/add", isCoordinator, add_a_new_coordinator);

/**
 * @swagger
 * /coordinators/createSupervisor:
 *   post:
 *     summary: Create a new supervisor
 *     tags: [Coordinators]
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
 *               type:
 *                 type: string
 *     responses:
 *       201:
 *         description: Supervisor created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post("/createSupervisor", isCoordinator, create_supervisor);

/**
 * @swagger
 * /coordinators/uploadInspectionForms:
 *   post:
 *     summary: Upload inspection forms
 *     tags: [Coordinators]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Forms uploaded successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/uploadInspectionForms",
  isCoordinator,
  processFileUpload,
  upload_inspection_forms
);

/**
 * @swagger
 * /coordinators/assignInspectionSupervisor:
 *   post:
 *     summary: Assign inspection supervisor to student
 *     tags: [Coordinators]
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
 *               supervisorId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Supervisor assigned successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/assignInspectionSupervisor",
  isCoordinator,
  assign_inspection_supervisor
);

router.post(
  "/bulkAssignInspectionSupervisor",
  isCoordinator,
  bulk_assign_inspection_supervisor
);

/**
 * @swagger
 * /coordinators/assignDefenseSupervisor:
 *   post:
 *     summary: Assign defense supervisor to student
 *     tags: [Coordinators]
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
 *               supervisorId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Defense supervisor assigned successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/assignDefenseSupervisor",
  isCoordinator,
  assign_defense_supervisor
);

router.post(
  "/bulkAssignDefenseSupervisor",
  isCoordinator,
  bulk_assign_defense_supervisor
);

/**
 * @swagger
 * /coordinators/assignSiwesInspectors:
 *   post:
 *     summary: Assign SIWES inspectors
 *     tags: [Coordinators]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Inspectors assigned successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/assignSiwesInspectors",
  isCoordinator,
  assign_right_defense_supervisor
);

/**
 * @swagger
 * /coordinators/assignDefenseSupervisorsByCourse:
 *   post:
 *     summary: Assign defense supervisors by course
 *     tags: [Coordinators]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               course:
 *                 type: string
 *               supervisorId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Supervisors assigned successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/assignDefenseSupervisorsByCourse",
  isCoordinator,
  assign_defense_supervisor_by_course
);

/**
 * @swagger
 * /coordinators/setRegistrationDeadline:
 *   post:
 *     summary: Set registration deadline
 *     tags: [Coordinators]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               deadline:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Deadline set successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/setRegistrationDeadline",
  isCoordinator,
  set_registration_deadline
);

/**
 * @swagger
 * /coordinators/assignGrade:
 *   post:
 *     summary: Assign grade to student
 *     tags: [Coordinators]
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
 *     responses:
 *       200:
 *         description: Grade assigned successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post("/assignGrade", isCoordinator, assign_grade);

/**
 * @swagger
 * /coordinators/delete/{id}:
 *   delete:
 *     summary: Delete a coordinator
 *     tags: [Coordinators]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Coordinator ID to delete
 *     responses:
 *       200:
 *         description: Coordinator deleted successfully
 *       404:
 *         description: Coordinator not found
 *       401:
 *         description: Unauthorized
 */
router.delete("/delete/:id", isCoordinator, delete_a_coordinator);

/**
 * @swagger
 * /coordinators/deleteForm:
 *   delete:
 *     summary: Delete a form
 *     tags: [Coordinators]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: formId
 *         schema:
 *           type: string
 *         description: Form ID to delete
 *     responses:
 *       200:
 *         description: Form deleted successfully
 *       404:
 *         description: Form not found
 *       401:
 *         description: Unauthorized
 */
router.delete("/deleteForm", isCoordinator, delete_form);

/**
 * @swagger
 * /coordinators/collateGrades/{studentId}:
 *   patch:
 *     summary: Collate grades for a specific student
 *     tags: [Coordinators]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Student ID
 *     responses:
 *       200:
 *         description: Grades collated successfully
 *       404:
 *         description: Student not found
 *       401:
 *         description: Unauthorized
 */
router.patch("/collateGrades/:studentId", isCoordinator, collate_grades);

/**
 * @swagger
 * /coordinators/collateAllGrades:
 *   patch:
 *     summary: Collate grades for all students
 *     tags: [Coordinators]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: All grades collated successfully
 *       401:
 *         description: Unauthorized
 */
router.patch("/collateAllGrades", isCoordinator, collate_all_grades);

/**
 * @swagger
 * /coordinators/update/{id}:
 *   patch:
 *     summary: Update coordinator details
 *     tags: [Coordinators]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Coordinator ID
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
 *         description: Coordinator updated successfully
 *       404:
 *         description: Coordinator not found
 *       401:
 *         description: Unauthorized
 */
router.patch("/update/:id", isCoordinator, update_coordinator_details);

/**
 * @swagger
 * /coordinators/changePassword:
 *   patch:
 *     summary: Change coordinator password
 *     tags: [Coordinators]
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
router.patch("/changePassword", isCoordinator, change_password);

/**
 * @swagger
 * /coordinators/students/{id}:
 *   patch:
 *     summary: Update student details
 *     tags: [Coordinators]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Student ID
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
 *               matricNumber:
 *                 type: string
 *     responses:
 *       200:
 *         description: Student details updated successfully
 *       404:
 *         description: Student not found
 *       401:
 *         description: Unauthorized
 */
router.patch("/students/:id", isCoordinator, update_student_details);

module.exports = router;
