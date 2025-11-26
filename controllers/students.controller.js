const { request, response } = require("express");
const { handleError } = require("../utils/handleError");
const mongoose = require("mongoose");
const STUDENTS = require("./../models/student.model");
const COMPANY = require("./../models/company.model");
const WEEKLY_REPORTS = require("./../models/weekly_report.model");
const bcrypt = require("bcrypt");
const {
  uploadImageFromBuffer,
  deleteAsset,
  ALLOWED_IMAGE_MIME_TYPES,
} = require("../utils/cloudinary");
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
        $addFields: {
          inspectionDate: "$inspection_supervisor.assignedDate",
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
            $cond: {
              if: { $gt: [{ $size: "$inspection_supervisor" }, 0] },
              then: {
                $mergeObjects: [
                  { $arrayElemAt: ["$inspection_supervisor", 0] },
                  { date: "$inspectionDate" },
                ],
              },
              else: null,
            },
          },
          defense_supervisor: {
            $arrayElemAt: ["$defense_supervisor", 0],
          },
        },
      },
      {
        $project: {
          inspectionDate: 0,
        },
      },
    ]);

    res.status(200).json({ data: data[0] });
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * Get Weekly Reports for a student
 * @param {request} req
 * @param {response} res
 */
const get_weekly_reports = async function (req, res) {
  const { studentCode } = req.user;

  try {
    const weeklyReport = await WEEKLY_REPORTS.find({ studentCode });

    if (weeklyReport === null) {
      res.status(404).json({
        message: "Unable to find your weekly report",
      });
      return;
    }

    res.status(200).json(weeklyReport);
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
      res.status(400).json({
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
// Assuming STUDENTS and COMPANIES are your Mongoose models

const update_details = async function (req, res) {
  // Start a session and transaction
  const session = await mongoose.startSession();
  session.startTransaction();
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
      "street",
      "company", // expects a nested object for company updates
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
      "street",
    ];

    const update = req.body;

    // Ensure update payload is provided
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

    // Transform top-level company fields into a nested company object if not already provided.
    if (!update.hasOwnProperty("company")) {
      const companyFields = {};
      if (update.companyName) {
        companyFields.name = update.companyName;
        delete update.companyName;
      }
      if (update.companyEmail) {
        companyFields.email = update.companyEmail;
        delete update.companyEmail;
      }
      if (update.companyLga) {
        companyFields.LGA = update.companyLga;
        delete update.companyLga;
      }
      if (update.companyState) {
        companyFields.state = update.companyState;
        delete update.companyState;
      }
      if (update.companyPhone) {
        companyFields.phone = update.companyPhone;
        delete update.companyPhone;
      }
      if (update.companyAddress) {
        companyFields.address = update.companyAddress;
        delete update.companyAddress;
      }
      if (update.assignedDept) {
        companyFields.assignedDepartment = update.assignedDept;
        delete update.assignedDept;
      }
      if (update.assignedDesc) {
        companyFields.jobDescription = update.assignedDesc;
        delete update.assignedDesc;
      }
      if (update.resumptionDate) {
        companyFields.resumptionDate = update.resumptionDate;
        delete update.resumptionDate;
      }
      if (update.expectedEndDate) {
        companyFields.expectedEndDate = update.expectedEndDate;
        delete update.expectedEndDate;
      }
      if (update.street) {
        companyFields.street = update.street;
        delete update.street;
      }
      // If any company fields were provided, set them under update.company
      if (Object.keys(companyFields).length > 0) {
        update.company = companyFields;
      }
    }

    // Convert bank fields to nested paths for the student document
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

    // Extract studentId from req.user (ensure your authentication middleware sets req.user)
    const { id: studentId } = req.user;
    const studentDetails = await STUDENTS.findOne(
      { _id: studentId },
      {},
      { session }
    );
    if (!studentDetails) {
      throw {
        message: "Student not found",
        code: 404,
        type: "frontend_error",
      };
    }

    // Handle company update if provided
    if (update.hasOwnProperty("company")) {
      // Clone the company object so we can work on it separately
      const companyDetails = JSON.parse(JSON.stringify(update.company));
      delete update.company;

      const companyKeys = Object.keys(companyDetails);
      const isCompanyValid = companyKeys.every((field) => {
        return allowedCompanyFields.includes(field) && companyDetails[field];
      });
      if (!isCompanyValid) {
        throw {
          message: "Invalid or incomplete company field(s) specified",
          code: 400,
          type: "frontend_error",
        };
      }

      // Update the company document using the student's studentCode as a key
      await COMPANY.updateOne(
        { studentCode: studentDetails.studentCode },
        companyDetails,
        { session }
      );
    }

    // Update the student document with the remaining fields
    await STUDENTS.updateOne({ _id: studentId }, update, { session });

    // Commit the transaction on success
    await session.commitTransaction();
    res.status(200).json({ message: "Update successful" });
  } catch (error) {
    // Abort the transaction on error
    await session.abortTransaction();
    if (error.type === "frontend_error") {
      res.status(error.code).json({ message: error.message });
    } else {
      console.error("Error updating details:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  } finally {
    await session.endSession();
  }
};

const update_profile_image = async function (req, res) {
  const { _id } = req.user;

  try {
    if (!req.files || !req.files.profileImage) {
      res.status(400).json({ message: "Please upload a profile image" });
      return;
    }

    const profileImage = Array.isArray(req.files.profileImage)
      ? req.files.profileImage[0]
      : req.files.profileImage;

    if (!profileImage) {
      res.status(400).json({ message: "Please upload a valid profile image" });
      return;
    }

    if (!ALLOWED_IMAGE_MIME_TYPES.includes(profileImage.mimetype)) {
      res.status(400).json({
        message: "Invalid image format. Upload a JPG, PNG, or WEBP image.",
      });
      return;
    }

    if (profileImage.size > 5 * 1024 * 1024) {
      res.status(400).json({ message: "Image size must not exceed 5MB" });
      return;
    }

    const student = await STUDENTS.findById(_id);

    if (!student) {
      res.status(404).json({ message: "Student not found" });
      return;
    }

    const uploadResult = await uploadImageFromBuffer(
      profileImage.data,
      profileImage.mimetype,
      {
        eager: [
          {
            width: 320,
            height: 320,
            crop: "fill",
            gravity: "face",
            quality: "auto",
          },
        ],
      }
    );

    const previousPublicId = student.profileImagePublicId;
    const profileImageThumbnailUrl =
      uploadResult.eager?.[0]?.secure_url || uploadResult.secure_url;

    // Use findByIdAndUpdate to only update profile image fields
    // This avoids triggering validation on password and other fields
    const updatedStudent = await STUDENTS.findByIdAndUpdate(
      _id,
      {
        profileImageUrl: uploadResult.secure_url,
        profileImagePublicId: uploadResult.public_id,
        profileImageThumbnailUrl: profileImageThumbnailUrl,
      },
      { new: true, runValidators: false }
    );

    if (previousPublicId && previousPublicId !== uploadResult.public_id) {
      await deleteAsset(previousPublicId);
    }

    res.status(200).json({
      message: "Profile image updated successfully",
      data: {
        profileImageUrl: updatedStudent.profileImageUrl,
        profileImageThumbnailUrl:
          updatedStudent.profileImageThumbnailUrl ||
          updatedStudent.profileImageUrl,
      },
    });
  } catch (error) {
    handleError(error, res);
  }
};

module.exports = {
  get_details,
  get_weekly_reports,
  add_work_details,
  add_weekly_reports,
  change_password,
  update_details,
  update_profile_image,
};
