const router = require('express').Router();
const { isSupervisor } = require('./../middlewares/auth.middleware');
const {
  get_a_supervisor,
  get_assigned_students_for_defense,
  get_assigned_students_for_inspection,
  get_forms,
  change_password,
  update_supervisor_details
} = require('./../controllers/supervisors.controller');

router.get('/get/:id', isSupervisor, get_a_supervisor);

router.get('/assignedStudentsForDefense', isSupervisor, get_assigned_students_for_defense);

router.get('/assignedStudentsForInspection', isSupervisor, get_assigned_students_for_inspection);

router.get('/forms', isSupervisor, get_forms);

router.patch('/changePassword', isSupervisor, change_password);

router.patch('/update', isSupervisor, update_supervisor_details);

module.exports = router;