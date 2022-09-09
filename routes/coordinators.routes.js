const router = require('express').Router();
const {
  get_all_coordinators,
  get_a_specific_coordinator,
  delete_a_coordinator,
  add_a_new_coordinator,
  update_coordinator_details
} = require('./../controllers/coordinators.controller');

router.get('/coordinators', get_all_coordinators);

router.get('/coordinators/:id', get_a_specific_coordinator);

router.post('/coordinators', add_a_new_coordinator);

router.delete('/coordinators/:id', delete_a_coordinator);

router.patch('/coordinators/:id', update_coordinator_details);

module.exports = router;