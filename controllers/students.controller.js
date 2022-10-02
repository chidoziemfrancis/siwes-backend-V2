const { request, response } = require('express');
const { handleError } = require('../utils/handleError');
const mongoose = require('mongoose');
const STUDENTS = require('./../models/student.model');
const COMPANY = require('./../models/company.model');
const bcrypt = require('bcrypt');

/**
 * Gets the details of a specific student
 * @param {request} req
 * @param {response} res
 */
const get_details = async function(req, res) {
  const { _id:id  } = req.user;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: 'Invalid student id' });
      return;
    }

    const data = await STUDENTS.aggregate([
      {
        $match: {
          '_id': mongoose.Types.ObjectId(id)
        }
      },
      {
        $addFields: {
          name: {
            $concat: ['$firstName', ' ', '$middleName', ' ', '$lastName']
          }
        }
      },
      {
        $project: {
          firstName: 0,
          lastName: 0,
          middleName: 0,
          updatedAt: 0,
          createdAt: 0,
          _v: 0,
          validation_secret: 0,
          password: 0
        }
      },
      {
        $lookup: {
          from: 'companies',
          localField: 'studentCode',
          foreignField: 'studentCode',
          as: 'company'
        }
      },
      {
        $lookup: {
          from: 'supervision_lists',
          localField: 'studentCode',
          foreignField: 'studentCode',
          as: 'supervisor'
        }
      },
      {
        $addFields: {
          company: {
            $arrayElemAt: [ '$company', 0 ]
          },
          supervisor: {
            $arrayElemAt: [ '$supervisor', 0 ]
          }
        }
      },
      {
        $lookup: {
          from: 'supervisor',
          localField: 'supervisor._id',
          foreignField: '_id',
          as: 'supervisor'
        }
      },
      {
        $addFields: {
          supervisor: {
            $arrayElemAt: [ '$supervisor', 0 ]
          }
        }
      }
    ])

    res.status(200).json({ data: data[0] });
  } catch (error) {
    handleError(error, res)
  }
}

/**
 * Registers work information for a student
 * @param {request} req
 * @param {response} res
 */
const add_work_details = async function(req, res) {
  const { studentCode } = req.user;
  
  try {
    const workDetails = req.body;

    if (typeof workDetails !== 'object' || Object.keys(workDetails).length === 0) {
      res.status(400).json({ message: 'Please make sure you have filled all the required fields' });
      return;
    }

    // you can only upload work details once
    const hasUploadedBefore = (await COMPANY.exists({ studentCode })) !== null;

    if (hasUploadedBefore) {
      res.status(400).json({ message: 'You can not upload multiple work details, contact support if you have an issue' })
      return;
    }
    
    workDetails.studentCode = studentCode;

    await COMPANY.create(workDetails);

    res.status(200).json({ message: 'Work details was uploaded successfully' });
  } catch (error) {
    handleError(error, res);
  }
}

/**
 * Adds weekly report for each student
 * @param {request} req
 * @param {response} res
 */
const add_weekly_reports = async function(req, res) {

}

/**
 * Changes student password
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
    const student = await STUDENTS.findOne({ _id });

    if (student === null) {
      res.status(401).json({ message: "Something unusual happened to your authentication status while trying to chaneg your password, so we couldn't process your request" })
      return;
    }

    const passwordIsValid = await bcrypt.compare(oldPassword, student.password);

    if (!passwordIsValid) {
      res.status(400).json({ message: "Incorrect password" });
      return;
    }

    // Hash password before saving
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    const { modifiedCount } = await STUDENTS.updateOne({ _id }, { password: hashedPassword });

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

module.exports = {
  get_details,
  add_work_details,
  add_weekly_reports,
  change_password
}