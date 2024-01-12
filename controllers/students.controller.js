const { request, response } = require("express");
const { handleError } = require("../utils/handleError");
const mongoose = require("mongoose");
const STUDENTS = require("./../models/student.model");
const COMPANY = require("./../models/company.model");
const WEEKLY_REPORTS = require("./../models/weekly_report.model");
const bcrypt = require("bcrypt");
const {
  getCurrentWeek,
  getDateOfFirstDayOfTheWeek,
  isDate1GreaterThanDate2,
} = require("../utils/timeManipulation");

/**
 * Gets the details of a specific student
 * @param {request} req
 * @param {response} res
 */
const get_details = async function (req, res) {
  const { _id: id } = req.user;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: "Invalid student id" });
      return;
    }

    const data = await STUDENTS.aggregate([
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
              { $ifNull: [{ $concat: ["$middleName", " "] }, ""] },
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
          pipeline: [
            {
              $project: {
                createdAt: 0,
                updatedAt: 0,
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "inspection_lists",
          localField: "studentCode",
          foreignField: "studentCode",
          as: "inspection_supervisor",
        },
      },
      {
        $lookup: {
          from: "defense_lists",
          localField: "studentCode",
          foreignField: "studentCode",
          as: "defense_supervisor",
        },
      },
      {
        $addFields: {
          company: {
            $arrayElemAt: ["$company", 0],
          },
          inspection_supervisor: {
            $arrayElemAt: ["$inspection_supervisor", 0],
          },
          defense_supervisor: {
            $arrayElemAt: ["$defense_supervisor", 0],
          },
        },
      },
      {
        $lookup: {
          from: "supervisors",
          localField: "inspection_supervisor.supervisorId",
          foreignField: "_id",
          as: "inspection_supervisor",
          pipeline: [
            {
              $project: {
                createdAt: 0,
                updatedAt: 0,
                validation_secret: 0,
                password: 0,
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "supervisors",
          localField: "defense_supervisor.supervisorId",
          foreignField: "_id",
          as: "defense_supervisor",
          pipeline: [
            {
              $project: {
                createdAt: 0,
                updatedAt: 0,
                validation_secret: 0,
                password: 0,
              },
            },
          ],
        },
      },
      {
        $addFields: {
          inspection_supervisor: {
            $arrayElemAt: ["$inspection_supervisor", 0],
          },
          defense_supervisor: {
            $arrayElemAt: ["$defense_supervisor", 0],
          },
        },
      },
    ]);

    res.status(200).json({ data: data[0] });
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * Registers work information for a student
 * @param {request} req
 * @param {response} res
 */
const add_work_details = async function (req, res) {
  const { studentCode } = req.user;

  try {
    const workDetails = req.body;

    if (
      typeof workDetails !== "object" ||
      Object.keys(workDetails).length === 0
    ) {
      res.status(400).json({
        message: "Please make sure you have filled all the required fields",
      });
      return;
    }

    // you can only upload work details once
    const hasUploadedBefore = (await COMPANY.exists({ studentCode })) !== null;

    if (hasUploadedBefore) {
      res.status(400).json({
        message:
          "You can not upload multiple work details, contact support if you have an issue",
      });
      return;
    }

    workDetails.studentCode = studentCode;

    await COMPANY.create(workDetails);

    res.status(200).json({ message: "Work details was uploaded successfully" });
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * Adds weekly report for each student
 * @param {request} req
 * @param {response} res
 */
const add_weekly_reports = async function (req, res) {
  const { studentCode } = req.user;
  const report = req.body;

  try {
    if (typeof report !== "object" || Object.keys(report).length === 0) {
      res
        .status(400)
        .json({ message: "Please specify all the neccesary fields" });
      return;
    }

    const companyInfo = await COMPANY.findOne({ studentCode });

    if (companyInfo === null) {
      res.status(400).json({
        message:
          "Unable to find a matching company attachment please add a company first",
      });
      return;
    }

    const daysOfTheWeek = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    const companyId = companyInfo._id;
    const currentDay = new Date(Date.now()).getDay();

    if (currentDay === 6) {
      res.status(400).json({
        message:
          "We appreciate your hardwork across the week, but submissions are now closed for this week",
      });
      return;
    }

    if (currentDay === 0) {
      res.status(400).json({
        message: "Submissions are not yet open for this week",
      });
      return;
    }

    const jobDescription = {};

    for (let i = 1; i <= currentDay; i++) {
      if (report[daysOfTheWeek[i]]) {
        jobDescription[daysOfTheWeek[i]] = report[daysOfTheWeek[i]];
      }
    }

    const currentWeek = getCurrentWeek();
    const currentYear = new Date(Date.now()).getFullYear();

    const processedReport = {
      studentCode,
      companyId,
      weekId: currentWeek,
      weekStart: getDateOfFirstDayOfTheWeek(currentWeek, currentYear),
      ...jobDescription,
    };

    // checks that termination date has not passed
    const currentDate = new Date(Date.now());
    if (isDate1GreaterThanDate2(currentDate, companyInfo.expectedEndDate)) {
      res
        .status(400)
        .json({
          message:
            "You cannot add new reports as the expected date of termination you specified has already passed",
        });
      return;
    }

    await WEEKLY_REPORTS.updateOne(
      { studentCode, companyId, weekId: currentWeek },
      processedReport,
      { upsert: true }
    );

    res.status(200).json({ message: "Upload successful" });
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * Changes student password
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
    const student = await STUDENTS.findOne({ _id });

    if (student === null) {
      res.status(401).json({
        message:
          "Something unusual happened to your authentication status while trying to chaneg your password, so we couldn't process your request",
      });
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

    const { modifiedCount } = await STUDENTS.updateOne(
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
 * This allows students update the information they previously provided, but not all
 * @param {request} req
 * @param {response} res
 */
const update_details = async function (req, res) {
  try {
    const allowedFields = ["accountNumber", "bankName", "sortCode", "phone"];

    const update = req.body;

    if (
      !update ||
      typeof update !== "object" ||
      Object.keys(update).length === 0
    ) {
      res.status(400).json({
        message: "Please specify all the fields to update",
      });
      return;
    }

    // check if all fields are valid
    const fields = Object.keys(update);
    // this checks to ensure that all fields specified are allowed and that they have values
    const isValid = fields.every(
      (field) => update[field] && allowedFields.includes(field)
    );

    if (!isValid) {
      res.status(400).json({
        message: "Invalid or incomplete field(s) specified",
      });
      return;
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

    const { _id } = req.user;

    const { modifiedCount } = await STUDENTS.updateOne({ _id }, update);

    if (modifiedCount === 0) {
      res.status(500).json({
        message: "Something went wrong, please try again",
      });
      return;
    }

    res.status(200).json({
      message: "Profile updated successfully",
    });
  } catch (error) {
    handleError(error, res);
  }
};

module.exports = {
  get_details,
  add_work_details,
  add_weekly_reports,
  change_password,
  update_details,
};
