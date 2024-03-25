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

router.get("/getDetails", isStudent, get_details);

router.get("/getWeeklyReports", isStudent, get_weekly_reports);

router.post("/workDetails", isStudent, add_work_details);

router.post("/weeklyReports", isStudent, add_weekly_reports);

router.patch("/changePassword", isStudent, change_password);

router.patch("/details", isStudent, update_details);

module.exports = router;
