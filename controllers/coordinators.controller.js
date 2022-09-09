const COORDINATORS = require('../models/coordinator.model');
const { handleError } = require('../utils/handleError');
const mongoose = require('mongoose');

// add a new coordinator
const add_a_new_coordinator = async function(req, res) {
  try {
    const coordinator = await COORDINATORS.create(req.body);

    return res.status(201).json({ 'message': 'Coordinator added successfully', 'coordinator': coordinator._id });
  } catch (error) {
    handleError(error, res);
  }
};

// get all coordinators
const get_all_coordinators = async function(req, res) {
  try {
    const coordinators = await COORDINATORS.find({}, { password: 0 });

    if (coordinators.length === 0) {
      return res.status(404).json({ 'message': 'No coordinators found' });
    }

    return res.status(200).json(coordinators);
  } catch (error) {
    handleError(error, res);
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

    const coordinator = await COORDINATORS.findOne({ _id: id }, { password: 0 });

    if (!coordinator) {
      return res.status(404).json({ 'message': 'Coordinator not found' });
    }

    return res.status(200).json(coordinator);
  } catch (error) {
    handleError(error, res);
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

    const deleteInfo = await COORDINATORS.deleteOne({ _id: id });

    if (deleteInfo.deletedCount === 0) {
      return res.status(400).json({ 'message': 'No coordinator with that id exists' });
    }

    return res.status(200).json({ 'message': 'Coordinator deleted successfully' });
  } catch (error) {
    handleError(error, res);
  }
};

// update coordinator details
const update_coordinator_details = async function(req, res) {
  try {
    const id = req.params.id;
    const update = req.body;

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ 'message': 'Invalid update request' })
    }

    // you can't directly update the password field
    let hasInvalidField = false;
    let allowedFields = ['firstName', 'lastName', 'phone1', 'phone2', 'office'];
    Object.keys(update).forEach(key => {
      if (allowedFields.includes(key) === false) {
        hasInvalidField = true;
      }
    })

    if (hasInvalidField) {
      return res.status(400).json({ 'message': 'Your update failed as it contains certain invalid fields' });
    }

    // check if the id is valid mongodb document id
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 'message': 'Invalid id' });
    }

    const coordinator = await COORDINATORS.updateOne({ _id: id }, update);

    if (coordinator.acknowledged === false) {
      return res.status(404).json({ 'message': 'Coordinator not found' });
    }

    return res.status(200).json({ 'message': 'Coordinator updated successfully' });
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