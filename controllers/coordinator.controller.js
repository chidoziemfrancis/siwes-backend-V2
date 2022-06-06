const Coordinators = require('../models/coordinator.model');
const { handleError } = require('../utils/handleDBError');
const mongoose = require('mongoose');

// add a new coordinator
const add_a_new_coordinator = async function(req, res) {
  try {
    const coordinator = await Coordinators.create(req.body);

    return res.status(201).json({ 'message': 'Coordinator added successfully', 'coordinator': coordinator });
  } catch (error) {
    handleError(error, res);
  }
};

// get all coordinators
const get_all_coordinators = async function(req, res) {
  try {
    const coordinators = await Coordinators.find();

    if (coordinators.length === 0) {
      return res.status(404).json({ 'message': 'No coordinators found' });
    }

    // remove password field
    coordinators.forEach(coordinator => {
      coordinator.password = undefined;
    })

    return res.status(200).json(coordinators);
  } catch (error) {
    return res.status(500).json({ 'message': 'Internal Server Error' });
  }
};

// get a specific coordinator
const get_a_specific_coordinator = async function(req, res) {
  try {
    const id = req.params.id;

    // check if the id is valid mongodb document id
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 'message': 'Invalid id' });
    }

    const coordinator = await Coordinators.findById(id);

    if (!coordinator) {
      return res.status(404).json({ 'message': 'Coordinator not found' });
    }

    // remove the password field
    coordinator.password = undefined;

    return res.status(200).json(coordinator);
  } catch (error) {
    return res.status(500).json({ 'message': 'Internal Server Error' });
  }
};  

// delete a coordinator
const delete_a_coordinator = async function(req, res) {
  try {
    const id = req.params.id;

    // check if the id is valid mongodb document id
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 'message': 'Invalid id' });
    }

    await Coordinators.findByIdAndDelete(id);

    return res.status(200).json({ 'message': 'Coordinator deleted successfully' });
  } catch (error) {
    return res.status(500).json({ 'message': 'Internal Server Error' });
  }
};

// update coordinator details
const update_coordinator_details = async function(req, res) {
  try {
    const id = req.params.id;
    const update = req.body;

    // you can't directly update the password field
    if (update.hasOwnProperty('password')) {
      update.password = undefined;
    }

    // check if the id is valid mongodb document id
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 'message': 'Invalid id' });
    }

    // new: true returns the updated document
    const coordinator = await Coordinators.findByIdAndUpdate(id, update, { new: true });

    if (!coordinator) {
      return res.status(404).json({ 'message': 'Coordinator not found' });
    }

    // remove the password field
    coordinator.password = undefined;

    return res.status(200).json(coordinator);
  } catch (error) {
    handleError(error, res);
  }
};

module.exports = {
  add_a_new_coordinator,
  get_all_coordinators,
  delete_a_coordinator,
  update_coordinator_details,
  get_a_specific_coordinator
}