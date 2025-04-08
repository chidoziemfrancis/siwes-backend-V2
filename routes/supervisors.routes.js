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
  download_assigned_defense_students,
} = require("./../controllers/supervisors.controller");

router.get("/get/:id", isSupervisor, get_a_supervisor);

router.get(
  "/assignedStudentsForDefense",
  isSupervisor,
  get_assigned_students_for_defense
);

router.get(
  "/assignedStudentsForInspection",
  isSupervisor,
  get_assigned_students_for_inspection
);

router.get("/forms", isSupervisor, get_forms);

router.get("/downloadForm", isSupervisor, download_form);

router.patch("/changePassword", isSupervisor, change_password);

router.patch("/update", isSupervisor, update_supervisor_details);

router.patch("/updateInspectionTime", isSupervisor, update_inspection_time);

router.patch("/updateDefenseTime", isSupervisor, update_defense_time);

router.post("/assignGrade", isSupervisor, assign_grade);

router.get("/defense/download-assigned",isSupervisor, download_assigned_defense_students);

module.exports = router;
