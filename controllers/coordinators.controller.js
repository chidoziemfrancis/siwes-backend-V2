const COORDINATORS = require("../models/coordinator.model");
const SUPERVISORS = require("./../models/supervisor.model");
const STUDENTS = require("./../models/student.model");
const DEFENSE_LIST = require("./../models/defense_list.model");
const INSPECTION_LIST = require("./../models/inspection_list.model");
const DEADLINE = require("./../models/deadline.model");
const FORMS = require("./../models/form.model");
const GRADES = require("../models/grade.model");
const WEEKLYREPORTS = require("./../models/weekly_report.model");
const COMPANIES = require("./../models/company.model");
const { handleError } = require("../utils/handleError");
const mongoose = require("mongoose");
const { request, response } = require("express");
const bcrypt = require("bcrypt");
const { existsSync, unlinkSync } = require("fs");
const jsonToCsvString = require("../utils/jsonToCsvString");
const { ObjectId } = require("mongoose").Types;
const { sendMailToSupervisorEmail } = require("./mail.controller");
const cloudinary = require('cloudinary').v2;

/**
 * adds a new coordinator
 * @param {request} req
 * @param {response} res
 */
const add_a_new_coordinator = async function (req, res) {
  try {
    const coordinator = await COORDINATORS.create(req.body);

    res.status(201).json({
      message: "Coordinator added successfully",
      coordinator: coordinator._id,
    });
    return;
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * gets all coordinators
 * @param {request} req
 * @param {response} res
 */
const get_all_coordinators = async function (req, res) {
  try {
    const coordinators = await COORDINATORS.find(
      {},
      { password: 0, validation_secret: 0, createdAt: 0, updatedAt: 0 }
    );

    if (coordinators.length === 0) {
      res.status(404).json({ message: "No coordinators found" });
      return;
    }

    res.status(200).json(coordinators);
    return;
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * gets a specific coordinator
 * @param {request} req
 * @param {response} res
 */
const get_a_specific_coordinator = async function (req, res) {
  try {
    const id = req.params.id;

    // check if the id is valid mongodb document id
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: "Invalid id" });
      return;
    }

    const coordinator = await COORDINATORS.findOne(
      { _id: id },
      { password: 0, validation_secret: 0, createdAt: 0, updatedAt: 0 }
    );

    if (coordinator === null) {
      res.status(404).json({ message: "Coordinator not found" });
      return;
    }

    res.status(200).json(coordinator);
    return;
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * delete a coordinator
 * @param {request} req
 * @param {response} res
 */
const delete_a_coordinator = async function (req, res) {
  try {
    const id = req.params.id;

    // check if the id is valid mongodb document id
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: "Invalid id" });
      return;
    }

    const deleteInfo = await COORDINATORS.deleteOne({ _id: id });

    if (deleteInfo.deletedCount === 0) {
      res.status(400).json({ message: "No coordinator with that id exists" });
      return;
    }

    res.status(200).json({ message: "Coordinator deleted successfully" });
    return;
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * update coordinator details
 * @param {request} req
 * @param {response} res
 */
const update_coordinator_details = async function (req, res) {
  try {
    const id = req.params.id;
    const update = req.body;

    if (Object.keys(update).length === 0) {
      res.status(400).json({ message: "Invalid update request" });
      return;
    }

    // you can't directly update the password field
    let allowedFields = ["firstName", "lastName", "phone1", "phone2", "office"];
    let hasInvalidField = Object.keys(update).some(
      (field) => !allowedFields.includes(field)
    );

    if (hasInvalidField) {
      res.status(400).json({
        message: "Your update failed as it contains certain invalid fields",
      });
      return;
    }

    // check if the id is valid mongodb document id
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: "Invalid id" });
      return;
    }

    const coordinator = await COORDINATORS.updateOne({ _id: id }, update);

    if (coordinator.acknowledged === false) {
      res.status(404).json({ message: "Coordinator not found" });
      return;
    }

    res.status(200).json({ message: "Coordinator updated successfully" });
    return;
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * Changes coordinators password
 * @param {request} req
 * @param {response} res
 */
const change_password = async function (req, res) {
  let { oldPassword, newPassword } = req.body;
  const { _id } = req.user;

  if (typeof oldPassword === "string") {
    oldPassword = oldPassword.trim();
  }

  if (typeof newPassword === "string") {
    newPassword = newPassword.trim();
  }

  if (!(oldPassword && newPassword)) {
    res.status(400).json({
      message: "Incomplete request, please specify all required parameters",
    });
    return;
  }

  try {
    const coordinator = await COORDINATORS.findOne({ _id });

    if (coordinator === null) {
      res.status(401).json({
        message:
          "Something unusual happened to your authentication status while trying to change your password, so we couldn't process your request",
      });
      return;
    }

    const passwordIsValid = await bcrypt.compare(
      oldPassword,
      coordinator.password
    );

    if (!passwordIsValid) {
      res.status(400).json({ message: "Incorrect password" });
      return;
    }

    // Hash password before saving
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    const { modifiedCount } = await COORDINATORS.updateOne(
      { _id },
      { password: hashedPassword }
    );

    if (!modifiedCount) {
      res
        .status(500)
        .json({ message: "Something went wrong, please try again" });
      return;
    }

    res.status(200).json({ message: "Password was changed successfully" });
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * Allows the upload of an inspection form after passing through the upload middleware
 * @param {request} req
 * @param {response} res
 */
const upload_inspection_forms = async function (req, res) {
  const formInfo = req.body;
  const { _id } = req.user;

  try {
    if (typeof formInfo !== "object" || Object.keys(formInfo).length === 0) {
      res.status(400).json({ message: "Please fill all the fields" });
      return;
    }

    await FORMS.create({ ...formInfo, uploadedBy: _id });

    res.status(200).json({ message: "Form was added successfully" });
    return;
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * Allows a coordinator to create a supervisor
 * @param {request} req
 * @param {response} res
 */
const create_supervisor = async function (req, res) {
  try {
    const supervisor = await SUPERVISORS.create(req.body);

    await sendMailToSupervisorEmail(req.body);

    res.status(201).json({
      message: "Supervisor added successfully",
      supervisor: supervisor._id,
    });
    return;
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * Returns a list of all the supervisors
 * @param {request} req
 * @param {response} res
 */
const get_all_supervisors = async function (req, res) {
  try {
    const pipeline = [
      {
        $project: {
          password: 0,
          validation_secret: 0,
          createdAt: 0,
          updatedAt: 0,
        },
      },
      {
        $lookup: {
          from: "inspection_lists",
          foreignField: "supervisorId",
          localField: "_id",
          as: "assignedStudents",
        },
      },
      {
        $addFields: {
          noOfAssignedStudents: {
            $size: "$assignedStudents",
          },
        },
      },
      {
        $project: {
          assignedStudents: 0,
        },
      },
    ];

    const supervisors = await SUPERVISORS.aggregate(pipeline);

    if (supervisors.length === 0) {
      res.status(404).json({ message: "No supervisors found" });
      return;
    }

    res.status(200).json(supervisors);
    return;
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * Assigns a student to a supervisor for defense, can also be used to overwrite previous assignment
 * @param {request} req
 * @param {response} res
 */
const assign_defense_supervisor = async function (req, res) {
  const { studentCode, supervisorId } = req.body;

  try {
    if (!mongoose.Types.ObjectId.isValid(supervisorId)) {
      res.status(400).json({ message: "Invalid supervisor id" });
      return;
    }

    if (/\w+\-\d+\-\d+/.test(studentCode) === false) {
      res.status(400).json({ message: "Invalid student code" });
      return;
    }

    const supervisorExists = await SUPERVISORS.findOne({ _id: supervisorId });

    if (supervisorExists === null) {
      res.status(400).json({ message: "No supervisor was found with that id" });
      return;
    }

    const studentExists = await STUDENTS.findOne({ studentCode });

    if (studentExists === null) {
      res
        .status(400)
        .json({ message: "No student was found with that student code" });
      return;
    }

    const studentSupervisionList = await INSPECTION_LIST.findOne({
      studentCode,
    });

    if (
      studentSupervisionList &&
      studentSupervisionList.supervisorId.equals(supervisorId)
    ) {
      res.status(400).json({
        message:
          "The same supervisor can not inspect and be in charge of defense for the same student",
      });
      return;
    }

    await DEFENSE_LIST.updateOne(
      { studentCode },
      { supervisorId },
      { upsert: true }
    );

    res
      .status(200)
      .json({ message: "Defense supervisor was successfully assigned" });
    return;
  } catch (error) {
    handleError(error, res);
  }
};

/**
 *  Assigns a student to a supervisor for inspection, can also be used to overwrite previous assignment
 * @param {request} req
 * @param {response} res
 */
const assign_inspection_supervisor = async function (req, res) {
  const { studentCode, supervisorId } = req.body;

  try {
    if (!mongoose.Types.ObjectId.isValid(supervisorId)) {
      res.status(400).json({ message: "Invalid supervisor id" });
      return;
    }

    if (/\w+\-\d+\-\d+/.test(studentCode) === false) {
      res.status(400).json({ message: "Invalid student code" });
      return;
    }

    const supervisorExists = await SUPERVISORS.findOne({ _id: supervisorId });

    if (supervisorExists === null) {
      res.status(400).json({ message: "No supervisor was found with that id" });
      return;
    }

    const studentExists = await STUDENTS.findOne({ studentCode });

    if (studentExists === null) {
      res
        .status(400)
        .json({ message: "No studet was found with that student code" });
      return;
    }

    const studentSupervisionList = await DEFENSE_LIST.findOne({ studentCode });

    if (
      studentSupervisionList &&
      studentSupervisionList.supervisorId.equals(supervisorId)
    ) {
      res.status(400).json({
        message:
          "The same supervisor can not inspect and be in charge of defense for the same student",
      });
      return;
    }

    await INSPECTION_LIST.updateOne(
      { studentCode },
      { supervisorId },
      { upsert: true }
    );

    res
      .status(200)
      .json({ message: "Inspection supervisor was successfully assigned" });
    return;
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * Returns a list containing all students
 * @param {request} req
 * @param {response} res
 */
const get_all_students = async function (req, res) {
  const { faculty } = req.user;

  try {
    // get pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { sortOrder, sortBy } = req.query;

    if (page < 1) return res.status(400).json({ message: "Invalid page number" });
    if (limit < 1) return res.status(400).json({ message: "Invalid limit" });
    if (limit > 50) return res.status(400).json({ message: "Limit too large, maximum allowed limit is 50" });

    let sortQuery = [
      { $sort: { "company.LGA": -1 } }, // Always keep LGA sorted in descending order
    ];

    const validSortOrder = ["asc", "desc"];
    const validSortBy = ["course"];

    if (
      sortOrder &&
      validSortOrder.includes(sortOrder.toLowerCase()) &&
      sortBy &&
      validSortBy.includes(sortBy)
    ) {
      sortQuery.unshift({ // Apply course sorting before LGA sorting
        $sort: {
          [sortBy]: sortOrder.toLowerCase() === "asc" ? 1 : -1,
        },
      });
    }

    const pipeline = [
      {
        $match: { faculty: faculty },
      },
      {
        $project: {
          password: 0,
          validation_secret: 0,
          createdAt: 0,
          updatedAt: 0,
        },
      },
      {
        $lookup: {
          from: "companies",
          localField: "studentCode",
          foreignField: "studentCode",
          as: "company",
          pipeline: [
            {
              $project: {
                name: 1,
                address: 1,
                state: 1,
                LGA: 1,
              },
            },
          ],
        },
      },
      {
        $addFields: {
          company: { $arrayElemAt: ["$company", 0] },
        },
      },
      ...sortQuery, // Apply sorting here
      {
        $skip: (page - 1) * limit,
      },
      {
        $limit: limit,
      },
      {
        $lookup: {
          from: "grades",
          localField: "_id",
          foreignField: "studentId",
          as: "grade",
          pipeline: [
            {
              $project: { studentId: 0, __v: 0, createdAt: 0, updatedAt: 0 },
            },
          ],
        },
      },
      {
        $addFields: {
          grade: { $arrayElemAt: ["$grade", 0] },
        },
      },
      {
        $lookup: {
          from: "inspection_lists",
          localField: "studentCode",
          foreignField: "studentCode",
          as: "inspectionInfo",
        },
      },
      {
        $addFields: {
          inspectionInfo: { $arrayElemAt: ["$inspectionInfo", 0] },
        },
      },
      {
        $lookup: {
          from: "supervisors",
          localField: "inspectionInfo.supervisorId",
          foreignField: "_id",
          as: "assignedSupervisorInfo",
          pipeline: [
            {
              $project: { firstName: 1, lastName: 1, phone: 1, email: 1 },
            },
          ],
        },
      },
      {
        $addFields: {
          assignedSupervisorInfo: { $arrayElemAt: ["$assignedSupervisorInfo", 0] },
        },
      },
    ];

    const students = await STUDENTS.aggregate(pipeline);

    if (students.length === 0) {
      return res.status(404).json({ message: "No students found" });
    }

    const totalStudents = await STUDENTS.countDocuments({ faculty });

    res.status(200).json({
      students,
      totalStudents,
      currentPage: page,
      currentLimit: limit,
    });
  } catch (error) {
    console.error("Error fetching students:", error);
    handleError(error, res);
  }
};


/**
 * Returns the details of a particular student
 * @param {request} req
 * @param {response} res
 */
const get_a_student = async function (req, res) {
  const { id } = req.params;

  try {
    // check if the id is valid mongodb document id
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: "Invalid id" });
      return;
    }

    // when a specific student is queried the coordinator needs to see all his info
    const student = await STUDENTS.aggregate([
      {
        $match: {
          _id: mongoose.Types.ObjectId(id),
        },
      },
      {
        $addFields: {
          name: {
            $concat: [
              "$firstName",
              " ",
              {
                $ifNull: [
                  {
                    $concat: ["$middleName", " "],
                  },
                  "",
                ],
              },
              "$lastName",
            ],
          },
        },
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
          password: 0,
        },
      },
      {
        $lookup: {
          from: "companies",
          localField: "studentCode",
          foreignField: "studentCode",
          as: "company",
        },
      },
      {
        $lookup: {
          from: "supervision_lists",
          localField: "studentCode",
          foreignField: "studentCode",
          as: "supervisor",
        },
      },
      {
        $addFields: {
          company: {
            $arrayElemAt: ["$company", 0],
          },
          supervisor: {
            $arrayElemAt: ["$supervisor", 0],
          },
        },
      },
      {
        $lookup: {
          from: "supervisor",
          localField: "supervisor._id",
          foreignField: "_id",
          as: "supervisor",
        },
      },
      {
        $addFields: {
          supervisor: {
            $arrayElemAt: ["$supervisor", 0],
          },
        },
      },
      {
        $lookup: {
          from: "grades",
          localField: "_id",
          foreignField: "studentId",
          as: "grades",
          pipeline: [
            {
              $project: {
                studentId: 0,
                __v: 0,
                createdAt: 0,
                updatedAt: 0,
              },
            },
          ],
        },
      },
      {
        $addFields: {
          grades: {
            $arrayElemAt: ["$grades", 0],
          },
        },
      },
      {
        $lookup: {
          from: "coordinators",
          localField: "grades.lastUpdatedBy",
          foreignField: "_id",
          as: "coordinatorLookup",
        },
      },
      {
        $unwind: {
          path: "$coordinatorLookup",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "supervisors",
          localField: "grades.lastUpdatedBy",
          foreignField: "_id",
          as: "supervisorLookup",
        },
      },
      {
        $unwind: {
          path: "$supervisorLookup",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          lastUpdatedBy: {
            $ifNull: ["$coordinatorLookup", "$supervisorLookup"],
          },
        },
      },
      {
        $set: {
          "grades.lastUpdatedBy": {
            $concat: [
              "$lastUpdatedBy.firstName",
              " ",
              "$lastUpdatedBy.lastName",
            ],
          },
        },
      },
      {
        $unset: ["coordinatorLookup", "supervisorLookup", "lastUpdatedBy"],
      },
    ]);

    if (student === null) {
      res.status(404).json({ message: "Student not found" });
      return;
    }

    res.status(200).json(student);
    return;
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * Returns a list containing all students and thier assigned supervisors for defense
 * @param {request} req
 * @param {response} res
 */
const get_defense_list = async function (req, res) {
  try {
    const pipeline = [
      {
        $lookup: {
          from: "students",
          localField: "studentCode",
          foreignField: "studentCode",
          as: "studentDetails",
          pipeline: [
            {
              $project: {
                name: {
                  $concat: [
                    "$firstName",
                    " ",
                    { $ifNull: [{ $concat: ["$middleName", " "] }, ""] },
                    "$lastName",
                  ],
                },
                matricNo: 1,
                studentCode: 1,
                course: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: "$studentDetails",
        },
      },
      {
        $lookup: {
          from: "companies",
          localField: "studentCode",
          foreignField: "studentCode",
          as: "companyDetails",
          pipeline: [
            {
              $project: {
                name: 1,
              },
            },
          ],
        },
      },
      {
        $project: {
          studentCode: 0,
          updatedAt: 0,
          createdAt: 0,
        },
      },
      {
        $unwind: {
          path: "$companyDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "supervisors",
          localField: "supervisorId",
          foreignField: "_id",
          as: "supervisorDetails",
          pipeline: [
            {
              $project: {
                name: {
                  $concat: ["$firstName", " ", "$lastName"],
                },
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: "$supervisorDetails",
        },
      },
      {
        $project: {
          supervisorId: 0,
        },
      },
    ];

    const defenseList = await DEFENSE_LIST.aggregate(pipeline);

    if (defenseList.length === 0) {
      res.status(404).json({ message: "Defense list is empty" });
      return;
    }

    res.status(200).json(defenseList);
    return;
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * Returns a list of all students and thier assigned supervisors for inspection
 * @param {request} req
 * @param {response} res
 */
const get_inspection_list = async function (req, res) {
  try {
    const pipeline = [
      {
        $lookup: {
          from: "students",
          localField: "studentCode",
          foreignField: "studentCode",
          as: "studentDetails",
          pipeline: [
            {
              $project: {
                name: {
                  $concat: [
                    "$firstName",
                    " ",
                    { $ifNull: [{ $concat: ["$middleName", " "] }, ""] },
                    "$lastName",
                  ],
                },
                matricNo: 1,
                studentCode: 1,
                course: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: "$studentDetails",
        },
      },
      {
        $lookup: {
          from: "companies",
          localField: "studentCode",
          foreignField: "studentCode",
          as: "companyDetails",
          pipeline: [
            {
              $project: {
                name: 1,
              },
            },
          ],
        },
      },
      {
        $project: {
          studentCode: 0,
          updatedAt: 0,
          createdAt: 0,
        },
      },
      {
        $unwind: {
          path: "$companyDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "supervisors",
          localField: "supervisorId",
          foreignField: "_id",
          as: "supervisorDetails",
          pipeline: [
            {
              $project: {
                name: {
                  $concat: ["$firstName", " ", "$lastName"],
                },
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: "$supervisorDetails",
        },
      },
      {
        $project: {
          supervisorId: 0,
        },
      },
    ];

    const inspectionList = await INSPECTION_LIST.aggregate(pipeline);

    if (inspectionList.length === 0) {
      res.status(404).json({ message: "Inspection list is empty" });
      return;
    }

    res.status(200).json(inspectionList);
    return;
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * Accepts the deadline date and updates the deadline document
 * @param {request} req
 * @param {response} res
 */
const set_registration_deadline = async function (req, res) {
  const { time } = req.body;
  const { _id: updatedBy } = req.user;

  try {
    let currentTime = Date.now();

    if (time < currentTime) {
      res
        .status(400)
        .json({ message: "You cannot set a deadline into the past" });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(updatedBy)) {
      res.status(401).json({
        message:
          "Something went wrong while authenticating your request, re-authenticate and try again",
      });
      return;
    }

    // clears the entire collection
    await DEADLINE.deleteMany({});

    await DEADLINE.create({ time, updatedBy });

    res
      .status(200)
      .json({ message: "Registration deadline has been assigned" });
    return;
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * Returns a list of all the weekly reports for the specified student
 * @param {request} req
 * @param {response} res
 */
const get_weekly_reports = async function (req, res) {
  const { studentCode } = req.params;

  try {
    // match the pattern of the student code - deptname-year-last 4 digits matric no
    if (/[A-Za-z]+\-\d{4}\-\d{4}/.test(studentCode) == false) {
      res.status(400).json({ message: "Invalid student code" });
      return;
    }

    const reports = await WEEKLYREPORTS.find({ studentCode });

    if (reports.length == 0) {
      res.status(404).json({
        message: "No weekly reports submission found for the specified student",
      });
      return;
    }

    res.status(200).json({ reports });
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * Updates the student grade collections with the grades for inspection, reports and defense
 * @param {request} req
 * @param {response} res
 */
const assign_grade = async function (req, res) {
  const { type, score, studentId } = req.body;
  const { _id: lastUpdatedBy } = req.user;

  try {
    if (mongoose.Types.ObjectId.isValid(lastUpdatedBy) == false) {
      res.status(401).json({ message: "Please re authenticate to proceed" });
      return;
    }

    if (mongoose.Types.ObjectId.isValid(studentId) == false) {
      res.status(400).json({ message: "Invalid student id" });
      return;
    }

    const validTypes = {
      inspection: "inspectionScore",
      defense: "defenseScore",
      reports: "weeklyReportsScore",
    };
    if (Object.keys(validTypes).includes(type) == false) {
      res.status(400).json({
        message: "Invalid type specified, specify a valid type and try again",
      });
      return;
    }

    if (score == null || typeof score == "undefined") {
      res.status(400).json({ message: "Please specify a score" });
      return;
    }

    if (
      (type == "inspection" || type == "reports") &&
      (score > 20 || score < 0)
    ) {
      res
        .status(400)
        .json({ message: `${type} score must be between 0 and 20` });
      return;
    }

    if (type == "defense" && (score > 60 || score < 0)) {
      res
        .status(400)
        .json({ message: `${type} score must be between 0 and 60` });
      return;
    }

    const studentGrade = await GRADES.findOne({ studentId });

    // grades have been collated previously
    if (studentGrade !== null && studentGrade.total !== null) {
      res.status(400).json({
        message: "Grades cannot be updated as they have been collated already",
      });
      return;
    }

    const response = await GRADES.updateOne(
      { studentId },
      { [validTypes[type]]: score, lastUpdatedBy },
      { upsert: true }
    );

    if (response.acknowledged == false) {
      res.status(500).json({
        message: "Action failed, please try again or contact support",
      });
      return;
    }

    res.status(200).json({ message: "Grades updated successfully" });
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * Collates the grades and *locks the document
 * @param {request} req
 * @param {response} res
 */
const collate_grades = async function (req, res) {
  const { studentId } = req.params;
  const { _id: lastUpdatedBy } = req.user;

  try {
    if (mongoose.Types.ObjectId.isValid(studentId) == false) {
      res.status(400).json({ message: "Invalid student id" });
      return;
    }

    const response = await GRADES.updateOne({ studentId }, [
      {
        $set: {
          total: {
            $sum: ["$inspectionScore", "$weeklyReportsScore", "$defenseScore"],
          },
          lastUpdatedBy: lastUpdatedBy,
        },
      },
    ]);

    if (response.acknowledged == false) {
      res.status(500).json({
        message: "Action failed, please try again or contact support",
      });
      return;
    }

    res.status(200).json({ message: "Grades have been collated successfully" });
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * Collates the grades of all students and *locks the document
 * @param {request} req
 * @param {response} res
 */
const collate_all_grades = async function (req, res) {
  const { _id: lastUpdatedBy } = req.user;

  try {
    const response = await GRADES.updateMany({}, [
      {
        $set: {
          total: {
            $sum: ["$inspectionScore", "$weeklyReportsScore", "$defenseScore"],
          },
          lastUpdatedBy: lastUpdatedBy,
        },
      },
    ]);

    if (response.acknowledged == false) {
      res.status(500).json({
        message: "Action failed, please try again or contact support",
      });
      return;
    }

    res.status(200).json({
      message: "Grades have been collated successfully for all students",
    });
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * Get the information about forms and the download urls
 * @param {request} req
 * @param {response} res
 */
const get_forms = async function (req, res) {
  try {
    const forms = await FORMS.find({});

    if (forms.length === 0) {
      res
        .status(404)
        .json({ message: "There are currently no forms available" });
      return;
    }

    res.status(200).json(forms);
    return;
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * Deletes a specific form
 * @param {request} req
 * @param {response} res
 */
const delete_form = async function (req, res) {
  const { formId, publicId } = req.query;

  try {
    if (mongoose.Types.ObjectId.isValid(formId) == false) {
      res.status(400).json({ message: "Invalid form id" });
      return;
    }

    // I need some part of the form below
    const form = await FORMS.findById(formId);

    if (form == null) {
      res.status(404).json({ message: "Form not found" });
      return;
    }

    await FORMS.deleteOne({ _id: ObjectId(formId) });
    
    await cloudinary.uploader.destroy(publicId);

    res.status(201).json({ message: "Form has been deleted" });
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * Searches for students
 * @param {request} req
 * @param {response} res
 */
const search_for_students = async function (req, res) {
  try {
    const { q: searchQuery } = req.query;

    if (!searchQuery) {
      res.status(400).json({ message: "Please specify a search query" });
      return;
    }

    if (searchQuery.length < 3) {
      res
        .status(400)
        .json({ message: "Search query must be at least 3 characters long" });
      return;
    }

    // this holds the fields that I want to be able to search
    const indexedFields = [
      "course",
      "department",
      "email",
      "faculty",
      "firstName",
      "lastName",
      "matricNo",
      "middleName",
      "phone",
      "studentCode",
    ];

    const pipeline = [
      {
        $search: {
          index: "text-autocomplete", // name of the index
          compound: {
            should: [
              ...indexedFields.map((path) => ({
                autocomplete: {
                  path: `${path}`,
                  query: `${searchQuery}`,
                  fuzzy: {
                    maxEdits: 2, // can change up to 2 characters
                    prefixLength: 2, // the first 2 characters must match
                    maxExpansions: 100, // considers a max result space of 100
                  },
                },
              })),
            ],
            minimumShouldMatch: 1,
          },
        },
      },
      {
        $project: {
          password: 0,
          validation_secret: 0,
          createdAt: 0,
          updatedAt: 0,
          score: {
            $meta: "searchScore",
          },
        },
      },
      {
        $sort: {
          score: -1,
        },
      },
      {
        $lookup: {
          from: "grades",
          localField: "_id",
          foreignField: "studentId",
          as: "grade",
          pipeline: [
            {
              $project: {
                studentId: 0,
                __v: 0,
                createdAt: 0,
                updatedAt: 0,
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "companies",
          localField: "studentCode",
          foreignField: "studentCode",
          as: "company",
          pipeline: [
            {
              $project: {
                name: 1,
                address: 1,
              },
            },
          ],
        },
      },
      {
        $addFields: {
          grade: {
            $arrayElemAt: ["$grade", 0],
          },
          company: {
            $arrayElemAt: ["$company", 0],
          },
        },
      },
    ];

    const students = await STUDENTS.aggregate(pipeline);

    if (students.length === 0) {
      res.status(404).json({ message: "No students found" });
      return;
    }

    res.status(200).json(students);
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * This retrieves the data for all students and returns it as a csv file ready for download
 * @param {request} req
 * @param {response} res
 */
const download_all_student_data = async function (req, res) {
  try {
    const students = await STUDENTS.aggregate([
      {
        $project: {
          password: 0,
          validation_secret: 0,
          createdAt: 0,
          updatedAt: 0,
          __v: 0,
        },
      },
      {
        $lookup: {
          from: "grades",
          localField: "_id",
          foreignField: "studentId",
          as: "grade",
          pipeline: [
            {
              $project: {
                studentId: 0,
                __v: 0,
                createdAt: 0,
                updatedAt: 0,
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "companies",
          localField: "studentCode",
          foreignField: "studentCode",
          as: "company",
          pipeline: [
            {
              $project: {
                name: 1,
                address: 1,
              },
            },
          ],
        },
      },
      {
        $addFields: {
          grade: {
            $arrayElemAt: ["$grade", 0],
          },
          company: {
            $arrayElemAt: ["$company", 0],
          },
        },
      },
      {
        $addFields: {
          accountNo: "$bankDetails.accountNumber",
          bankname: "$bankDetails.name",
          sortCode: "$bankDetails.sortCode",
          companyName: "$company.name",
          companyAddress: "$company.address",
          inspectionScore: "$grade.inspectionScore",
          weeklyReportsScore: "$grade.weeklyReportsScore",
          defenseScore: "$grade.defenseScore",
          totalScore: "$grade.total",
          lastUpdatedBy: "$grade.lastUpdatedBy",
        },
      },
      {
        $project: {
          bankDetails: 0,
          company: 0,
          grade: 0,
          _id: 0,
        },
      },
    ]);

    if (students.length === 0) {
      res.status(404).json({ message: "No students found" });
      return;
    }

    const csvString = jsonToCsvString(students);

    res
      .status(200)
      .header("Content-Type", "text/csv")
      .header("Content-Disposition", "attachment; filename=students.csv")
      .send(csvString);
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * This allows coordinators update the information for a particular student
 * @param {request} req
 * @param {response} res
 */
const update_student_details = async function (req, res) {
  try {
    const session = await mongoose.startSession({
      defaultTransactionOptions: {
        readPreference: "primary",
        readConcern: { level: "local" },
        writeConcern: { w: "majority" },
      },
    });

    let sentResponse = false;

    await session.withTransaction(async () => {
      try {
        const allowedFields = [
          "firstName",
          "middleName",
          "lastName",
          "course",
          "sex",
          "level",
          "faculty",
          "phone",
          "accountNumber",
          "bankName",
          "sortCode",
          "company",
        ];
        const allowedCompanyFields = [
          "name",
          "address",
          "state",
          "LGA",
          "email",
          "phone",
          "assignedDepartment",
          "jobDescription",
          "resumptionDate",
          "expectedEndDate",
        ];

        const update = req.body;

        if (
          !update ||
          typeof update !== "object" ||
          Object.keys(update).length === 0
        ) {
          throw {
            message: "Please specify all the fields to update",
            code: 400,
            type: "frontend_error",
          };
        }

        // check if all fields are valid
        const fields = Object.keys(update);
        // this checks to ensure that all fields specified are allowed and that they have values
        const isValid = fields.every((field) => {
          // middle name is optional so it doesn't need to have a value for it
          if (field === "middleName") {
            return allowedFields.includes(field);
          }

          return update[field] && allowedFields.includes(field);
        });

        if (!isValid) {
          throw {
            message: "Invalid or incomplete field(s) specified",
            code: 400,
            type: "frontend_error",
          };
        }

        // convert the fields to their appropriate paths
        if (update.hasOwnProperty("accountNumber")) {
          update["bankDetails.accountNumber"] = update.accountNumber;
          delete update.accountNumber;
        }

        if (update.hasOwnProperty("bankName")) {
          update["bankDetails.name"] = update.bankName;
          delete update.bankName;
        }

        if (update.hasOwnProperty("sortCode")) {
          update["bankDetails.sortCode"] = update.sortCode;
          delete update.sortCode;
        }

        const { id: studentId } = req.params;
        const studentDetails = await STUDENTS.findOne(
          { _id: studentId },
          {},
          { session }
        );

        // handle company update
        if (update.hasOwnProperty("company")) {
          const companyDetails = JSON.parse(JSON.stringify(update.company)); // make a no-refrence copy
          delete update.company;

          // verify company values are correct
          const companyFields = Object.keys(companyDetails);
          const isValid = companyFields.every((field) => {
            return (
              allowedCompanyFields.includes(field) && companyDetails[field]
            );
          });

          if (!isValid) {
            throw {
              message: "Invalid or incomplete company field(s) specified",
              code: 400,
              type: "frontend_error",
            };
          }

          // update company
          await COMPANIES.updateOne(
            { studentCode: studentDetails.studentCode },
            companyDetails,
            { session }
          );
        }

        await STUDENTS.updateOne({ _id: studentId }, update, { session });

        await session.commitTransaction();
      } catch (error) {
        await session.abortTransaction();

        if (error.type === "frontend_error") {
          res.status(error.code).json({ message: error.message });
          sentResponse = true;
          return;
        }

        throw error;
      } finally {
        await session.endSession();
      }
    });

    if (!sentResponse) {
      res.status(200).json({
        message: "Student profile updated successfully",
      });
    }
  } catch (error) {
    handleError(error, res);
  }
};

const assign_score_for_student_weekly_report = async function (req, res) {
  try {
    const final_result = await WEEKLYREPORTS.aggregate([
      {
        $lookup: {
          from: "students",
          localField: "studentCode",
          foreignField: "studentCode",
          as: "studentInfo"
        }
      },
      {
        $unwind: "$studentInfo"
      },
      {
        $group: {
          _id: "$studentCode",
          reportCount: { $sum: 1 },
          firstName: { $first: "$studentInfo.firstName" },
          lastName: { $first: "$studentInfo.lastName" },
          course: { $first: "$studentInfo.course" },
          matricNumber: { $first: "$studentInfo.matricNo" }
        }
      },
      {
        $project: {
          _id: 0,
          studentCode: "$_id",
          firstName: 1,
          lastName: 1,
          matricNumber: 1,
          course: 1, // Added course to the projection
          reportCount: 1,
          marks: {
            $switch: {
              branches: [
                {
                  case: { $gte: ["$reportCount", 10] },
                  then: 20
                },
                {
                  case: { $and: [{ $gte: ["$reportCount", 8] }, { $lt: ["$reportCount", 10] }] },
                  then: 17
                },
                {
                  case: { $and: [{ $gte: ["$reportCount", 6] }, { $lt: ["$reportCount", 8] }] },
                  then: 14
                },
                {
                  case: { $and: [{ $gte: ["$reportCount", 5] }, { $lt: ["$reportCount", 6] }] },
                  then: 10
                }
              ],
              default: 0
            }
          }
        }
      }
    ]);

    // Send the final result and the log data as the response
    res.status(200).json({ 
      message: "Student score calculated successfully", 
      data: final_result
    });

  } catch (error) {
    console.error("Error in aggregation pipeline: ", error);
    handleError(error, res);
  }
};




const download_csv_score_for_student_weekly_report = async function (req, res) {
  try {
    // Perform the aggregation
    const student_score = await WEEKLYREPORTS.aggregate([
      {
        $lookup: {
          from: "students",
          localField: "studentCode",
          foreignField: "studentCode",
          as: "studentInfo"
        }
      },
      {
        $unwind: "$studentInfo"
      },
      {
        $group: {
          _id: "$studentCode",
          firstName: { $first: "$studentInfo.firstName" },  
          lastName: { $first: "$studentInfo.lastName" },
          matricNumber: { $first: "$studentInfo.matricNo" },
          course: { $first: "$studentInfo.course" },
          reportCount: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          studentCode: "$_id",
          firstName: 1,
          lastName: 1,
          course: 1,
          matricNumber: 1,
          reportCount: 1,
          marks: {
            $switch: {
              branches: [
                {
                  case: { $gte: ["$reportCount", 10] },
                  then: 20
                },
                {
                  case: { $and: [{ $gte: ["$reportCount", 8] }, { $lt: ["$reportCount", 10] }] },
                  then: 17
                },
                {
                  case: { $and: [{ $gte: ["$reportCount", 6] }, { $lt: ["$reportCount", 8] }] },
                  then: 14
                },
                {
                  case: { $and: [{ $gte: ["$reportCount", 5] }, { $lt: ["$reportCount", 6] }] },
                  then: 10
                }
              ],
              default: 0
            }
          }
        }
      }
    ]);

    // Check if there are students
    if (student_score.length === 0) {
      return res.status(404).json({ message: "No student scores found" });
    }

    // Convert the result to a CSV string
    const csvString = jsonToCsvString(student_score);

    // Set headers and send CSV response
    res
      .status(200)
      .header("Content-Type", "text/csv")
      .header("Content-Disposition", "attachment; filename=student_scores.csv")
      .send(csvString);

  } catch (error) {
    console.error("Error in aggregation pipeline: ", error);
    res.status(500).json({ message: "An error occurred while processing the data" });
  }
};



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
  assign_defense_supervisor,
  assign_inspection_supervisor,
  get_all_students,
  get_a_student,
  set_registration_deadline,
  get_weekly_reports,
  assign_grade,
  collate_grades,
  collate_all_grades,
  get_forms,
  delete_form,
  search_for_students,
  download_all_student_data,
  update_student_details,
  assign_score_for_student_weekly_report,
  download_csv_score_for_student_weekly_report
};
