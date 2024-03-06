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
  get_all_students,
  get_a_student,
  set_registration_deadline,
  get_weekly_reports,
  assign_grade,
  collate_grades,
  collate_all_grades,
  get_forms,
  delete_form,
  search_for_students,
  download_all_student_data,
  update_student_details,
} = require("./../controllers/coordinators.controller");
const { isCoordinator } = require("./../middlewares/auth.middleware");
const {
  processFileUpload,
} = require("./../middlewares/media_upload.middleware");

// might need to change all /:id to refrence req.user._id to prevent accidentally creating a super admin and IDOR
router.get("/getAll", isCoordinator, get_all_coordinators);

router.get("/get/:id", isCoordinator, get_a_specific_coordinator);

router.get("/defenseList", isCoordinator, get_defense_list);

router.get("/inspectionList", isCoordinator, get_inspection_list);

router.get("/supervisors", isCoordinator, get_all_supervisors);

router.get("/students", isCoordinator, get_all_students);

router.get("/students/download", isCoordinator, download_all_student_data);

router.get("/students/:id", isCoordinator, get_a_student);

router.get("/search/students", isCoordinator, search_for_students);

router.get("/getWeeklyReports/:studentCode", isCoordinator, get_weekly_reports);

router.get("/forms", isCoordinator, get_forms);

router.post("/add", isCoordinator, add_a_new_coordinator);

router.post("/createSupervisor", isCoordinator, create_supervisor);

router.post(
  "/uploadInspectionForms",
  isCoordinator,
  processFileUpload,
  upload_inspection_forms
);

router.post(
  "/assignInspectionSupervisor",
  isCoordinator,
  assign_inspection_supervisor
);

router.post(
  "/assignDefenseSupervisor",
  isCoordinator,
  assign_defense_supervisor
);

router.post(
  "/setRegistrationDeadline",
  isCoordinator,
  set_registration_deadline
);

router.post("/assignGrade", isCoordinator, assign_grade);

router.delete("/delete/:id", isCoordinator, delete_a_coordinator);

router.delete("/deleteForm", isCoordinator, delete_form);

router.patch("/collateGrades/:studentId", isCoordinator, collate_grades);

router.patch("/collateAllGrades", isCoordinator, collate_all_grades);

router.patch("/update/:id", isCoordinator, update_coordinator_details);

router.patch("/changePassword", isCoordinator, change_password);

router.patch("/students/:id", isCoordinator, update_student_details);

module.exports = router;
