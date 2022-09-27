const router = require('express').Router();
const {
  get_all_coordinators,
  get_a_specific_coordinator,
  delete_a_coordinator,
  add_a_new_coordinator,
  update_coordinator_details
} = require('./../controllers/coordinators.controller');

router.get('/getAll', get_all_coordinators);

router.get('/get/:id', get_a_specific_coordinator);

router.post('/add', add_a_new_coordinator);

router.delete('/delete/:id', delete_a_coordinator);

router.patch('/update/:id', update_coordinator_details);

//TODO: finish up
router.patch('/changePassword');

router.post('/uploadInspectionForms');

router.post('/createSupervisor');

module.exports = router;