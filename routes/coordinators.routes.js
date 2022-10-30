const router = require('express').Router();
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
  get_a_student
} = require('./../controllers/coordinators.controller');
const { isCoordinator } = require('./../middlewares/auth.middleware');
const { processFileUpload } = require('./../middlewares/media_upload.middleware');


// might need to change all /:id to refrence req.user._id to prevent accidentally creating a super admin and IDOR
router.get('/getAll', isCoordinator, get_all_coordinators);

router.get('/get/:id', isCoordinator, get_a_specific_coordinator);

router.post('/add', isCoordinator, add_a_new_coordinator);

router.delete('/delete/:id', isCoordinator, delete_a_coordinator);

router.patch('/update/:id', isCoordinator, update_coordinator_details);

router.patch('/changePassword', isCoordinator, change_password);

router.post('/createSupervisor', isCoordinator, create_supervisor);

router.post('/uploadInspectionForms', isCoordinator, processFileUpload, upload_inspection_forms);

router.get('/supervisors', isCoordinator, get_all_supervisors);

router.get('/students', isCoordinator, get_all_students);

router.get('/students/:id', isCoordinator, get_a_student);

router.post('/assignInspectionSupervisor', isCoordinator, assign_inspection_supervisor);

router.post('/assignDefenseSupervisor', isCoordinator, assign_defense_supervisor);

router.get('/defenseList', isCoordinator, get_defense_list);

router.get('/inspectionList', isCoordinator, get_inspection_list);

// TODO: complete this
router.post('/setRegistrationDeadline', isCoordinator);

module.exports = router;