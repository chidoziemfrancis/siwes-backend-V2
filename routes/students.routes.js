const router = require('express').Router();
const { get_details, add_work_details, add_weekly_reports } = require('./../controllers/students.controller');
const { isStudent } = require('./../middlewares/auth.middleware');

router.get('/getDetails', isStudent, get_details);

router.post('/workDetails', isStudent, add_work_details);

router.post('/weeklyReports', isStudent, add_weekly_reports);

//TODO: finish up
router.patch('/changePassword');

module.exports = router;