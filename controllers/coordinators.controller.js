const COORDINATORS = require('../models/coordinator.model');
const SUPERVISORS = require('./../models/supervisor.model');
const FORMS = require('./../models/form.model');
const { handleError } = require('../utils/handleError');
const mongoose = require('mongoose');
const { request, response } = require('express')
const bcrypt = require('bcrypt');

/**
 * adds a new coordinator
 * @param {request} req
 * @param {response} res
 */
const add_a_new_coordinator = async function(req, res) {
  try {
    const coordinator = await COORDINATORS.create(req.body);

    return res.status(201).json({ 'message': 'Coordinator added successfully', 'coordinator': coordinator._id });
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * gets all coordinators
 * @param {request} req
 * @param {response} res
 */
const get_all_coordinators = async function(req, res) {
  try {
    const coordinators = await COORDINATORS.find({}, { password: 0, validation_secret: 0, createdAt: 0, UpdatedAt: 0 });

    if (coordinators.length === 0) {
      return res.status(404).json({ 'message': 'No coordinators found' });
    }

    return res.status(200).json(coordinators);
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * gets a specific coordinator
 * @param {request} req
 * @param {response} res
 */
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

/**
 * delete a coordinator
 * @param {request} req
 * @param {response} res
 */
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

/**
 * update coordinator details
 * @param {request} req
 * @param {response} res
 */
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

/**
 * Changes coordinators password
 * @param {request} req
 * @param {response} res
 */
const change_password = async function(req, res) {
  let { oldPassword, newPassword } = req.body;
  const { _id } = req.user;

  if (typeof oldPassword === 'string') {
    oldPassword = oldPassword.trim();
  }

  if (typeof newPassword === 'string') {
    newPassword = newPassword.trim();
  }

  if (!(oldPassword && newPassword)) {
    res.status(400).json({ message: "Incomplete request, please specify all required parameters" });
    return;
  }

  try {
    const coordinator = await COORDINATORS.findOne({ _id });

    if (coordinator === null) {
      res.status(401).json({ message: "Something unusual happened to your authentication status while trying to chaneg your password, so we couldn't process your request" })
      return;
    }

    const passwordIsValid = await bcrypt.compare(oldPassword, coordinator.password);

    if (!passwordIsValid) {
      res.status(400).json({ message: "Incorrect password" });
      return;
    }

    // Hash password before saving
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    const { modifiedCount } = await COORDINATORS.updateOne({ _id }, { password: hashedPassword });

    if (!modifiedCount) {
      res.status(500).json({ message: "Something went wrong, please try again" });
      return;
    }

    res.status(200).json({ message: "Password was changed successfully" });
    
  } catch (error) {
    console.log(error);
    handleError(error, res);
  }
}

/**
 * Allows the upload of an inspection form after passing through the upload middleware
 * @param {request} req
 * @param {response} res
 */
const upload_inspection_forms = async function(req, res) {
  const formInfo = req.body;
  const { _id } = req.user;

  try {
    if (typeof formInfo !== 'object' || Object.keys(formInfo).length === 0) {
      res.status(400).json({ message: "Please fill all the fields" });
      return;
    }

    await FORMS.create({ ...formInfo, uploadedBy: _id });

    return res.status(200).json({ message: "Form was added successfully" })
  } catch (error) {
    handleError(error, res);  
  }
}

/**
 * Allows a coordinator to create a supervisor
 * @param {request} req
 * @param {response} res
 */
const create_supervisor = async function(req, res) {
  try {
    const supervisor = await SUPERVISORS.create(req.body);

    return res.status(201).json({ 'message': 'Supervisor added successfully', 'supervisor': supervisor._id });
  } catch (error) {
    handleError(error, res);
  }
}

/**
 * Returns a list of all the supervisors
 * @param {request} req
 * @param {response} res 
 */
const get_all_supervisors = async function(req, res) {
  try {
    const supervisors = await SUPERVISORS.find({}, { password: 0, validation_secret: 0, createdAt: 0, UpdatedAt: 0 })

    if (supervisors.length === 0) {
      return res.status(404).json({ message: "No supervisors found" });
    }

    return res.status(200).json(supervisors)
  } catch (error) {
    handleError(error, res);
  }
}

/**
 * Returns a list containing all students and thier assigned supervisors for defense
 * @param {request} req
 * @param {response} res 
 */
const get_defense_list = async function(req, res) {

}

/**
 * Returns a list of all students and thier assigned supervisors for inspection
 * @param {request} req
 * @param {response} res 
 */
const get_inspection_list = async function(req, res) {

}

/**
 * Assigns a student to a supervisor for defense, can also be used to overwrite previous assignment
 * @param {request} req
 * @param {response} res 
 */
const assigned_defense_supervisor = async function(req, res) {

}

/**
 *  Assigns a student to a supervisor for inspection, can also be used to overwrite previous assignment
 * @param {request} req
 * @param {response} res 
 */
const assigned_inspection_supervisor = async function(req, res) {
  
}

module.exports = {
  add_a_new_coordinator,
  get_all_coordinators,
  delete_a_coordinator,
  update_coordinator_details,
  get_a_specific_coordinator,
  change_password,
  upload_inspection_forms,
  create_supervisor,
  get_all_supervisors,
  get_defense_list,
  get_inspection_list,
  assigned_defense_supervisor,
  assigned_inspection_supervisor
}