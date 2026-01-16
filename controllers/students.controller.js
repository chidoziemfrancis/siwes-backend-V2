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
    const errors = [];

    // Validate request body structure
    if (
      typeof workDetails !== "object" ||
      workDetails === null ||
      Array.isArray(workDetails)
    ) {
      res.status(400).json({
        message:
          "Invalid request format. Expected an object with work details.",
      });
      return;
    }

    if (Object.keys(workDetails).length === 0) {
      res.status(400).json({
        message: "Request body is empty. Please provide work details.",
      });
      return;
    }

    // Validate required fields
    if (
      !workDetails.name ||
      typeof workDetails.name !== "string" ||
      workDetails.name.trim().length === 0
    ) {
      errors.push("Company name is required and must be a non-empty string");
    } else if (workDetails.name.trim().length < 3) {
      errors.push("Company name must be at least 3 characters long");
    }

    if (
      !workDetails.address ||
      typeof workDetails.address !== "string" ||
      workDetails.address.trim().length === 0
    ) {
      errors.push("Company address is required and must be a non-empty string");
    } else if (workDetails.address.trim().length < 3) {
      errors.push("Company address must be at least 3 characters long");
    }

    if (
      !workDetails.email ||
      typeof workDetails.email !== "string" ||
      workDetails.email.trim().length === 0
    ) {
      errors.push("Company email is required and must be a non-empty string");
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(workDetails.email.trim())) {
        errors.push("Company email must be a valid email address");
      }
    }

    if (
      !workDetails.phone ||
      typeof workDetails.phone !== "string" ||
      workDetails.phone.trim().length === 0
    ) {
      errors.push(
        "Company phone number is required and must be a non-empty string"
      );
    } else if (workDetails.phone.trim().length < 7) {
      errors.push("Company phone number must be at least 7 characters long");
    }

    if (typeof workDetails.isAbroad !== "boolean") {
      errors.push(
        "isAbroad field is required and must be a boolean value (true or false)"
      );
    }

    // Conditional validation based on isAbroad
    if (workDetails.isAbroad === true) {
      if (
        !workDetails.country ||
        typeof workDetails.country !== "string" ||
        workDetails.country.trim().length === 0
      ) {
        errors.push("Country is required when company is located abroad");
      }
    } else {
      if (
        !workDetails.state ||
        typeof workDetails.state !== "string" ||
        workDetails.state.trim().length === 0
      ) {
        errors.push("State is required when company is located in Nigeria");
      } else if (workDetails.state.trim().length < 3) {
        errors.push("State must be at least 3 characters long");
      }

      if (
        !workDetails.LGA ||
        typeof workDetails.LGA !== "string" ||
        workDetails.LGA.trim().length === 0
      ) {
        errors.push(
          "LGA (Local Government Area) is required when company is located in Nigeria"
        );
      }

      if (
        !workDetails.street ||
        typeof workDetails.street !== "string" ||
        workDetails.street.trim().length === 0
      ) {
        errors.push(
          "Company street address is required when company is located in Nigeria"
        );
      }
    }

    if (
      !workDetails.assignedDepartment ||
      typeof workDetails.assignedDepartment !== "string" ||
      workDetails.assignedDepartment.trim().length === 0
    ) {
      errors.push(
        "Assigned department is required and must be a non-empty string"
      );
    }

    if (
      !workDetails.jobDescription ||
      typeof workDetails.jobDescription !== "string" ||
      workDetails.jobDescription.trim().length === 0
    ) {
      errors.push("Job description is required and must be a non-empty string");
    }

    // Validate date fields
    if (
      workDetails.resumptionDate === undefined ||
      workDetails.resumptionDate === null
    ) {
      errors.push("Resumption date is required");
    } else {
      if (typeof workDetails.resumptionDate !== "number") {
        errors.push("Resumption date must be a valid timestamp (number)");
      } else {
        const resumptionDate = new Date(workDetails.resumptionDate);
        if (isNaN(resumptionDate.getTime())) {
          errors.push("Resumption date must be a valid date");
        } else {
          // Check if resumption date is not too far in the past (more than 1 year)
          const oneYearAgo = new Date();
          oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
          if (resumptionDate < oneYearAgo) {
            errors.push(
              "Resumption date cannot be more than 1 year in the past"
            );
          }
        }
      }
    }

    if (
      workDetails.expectedEndDate === undefined ||
      workDetails.expectedEndDate === null
    ) {
      errors.push("Expected end date is required");
    } else {
      if (typeof workDetails.expectedEndDate !== "number") {
        errors.push("Expected end date must be a valid timestamp (number)");
      } else {
        const expectedEndDate = new Date(workDetails.expectedEndDate);
        if (isNaN(expectedEndDate.getTime())) {
          errors.push("Expected end date must be a valid date");
        } else {
          // Validate date range: expectedEndDate should be after resumptionDate
          if (
            workDetails.resumptionDate &&
            typeof workDetails.resumptionDate === "number"
          ) {
            const resumptionDate = new Date(workDetails.resumptionDate);
            if (
              !isNaN(resumptionDate.getTime()) &&
              expectedEndDate <= resumptionDate
            ) {
              errors.push(
                "Expected end date must be after the resumption date"
              );
            }
          }

          // Check if expected end date is not too far in the future (more than 2 years)
          const twoYearsFromNow = new Date();
          twoYearsFromNow.setFullYear(twoYearsFromNow.getFullYear() + 2);
          if (expectedEndDate > twoYearsFromNow) {
            errors.push(
              "Expected end date cannot be more than 2 years in the future"
            );
          }
        }
      }
    }

    // Return validation errors if any
    if (errors.length > 0) {
      res.status(400).json({
        message: "Validation failed. Please correct the following errors:",
        errors: errors,
      });
      return;
    }

    // Check if student has already uploaded work details
    const hasUploadedBefore = (await COMPANY.exists({ studentCode })) !== null;

    if (hasUploadedBefore) {
      res.status(400).json({
        message:
          "Work details have already been uploaded for this student. You cannot upload multiple work details. Please contact support if you need to update your information.",
      });
      return;
    }

    // Prepare work details for database insertion
    const workDetailsToSave = {
      name: workDetails.name.trim().toLowerCase(),
      address: workDetails.address.trim().toLowerCase(),
      email: workDetails.email.trim().toLowerCase(),
      phone: workDetails.phone.trim().toLowerCase(),
      isAbroad: workDetails.isAbroad,
      assignedDepartment: workDetails.assignedDepartment.trim().toLowerCase(),
      jobDescription: workDetails.jobDescription.trim(),
      resumptionDate: new Date(workDetails.resumptionDate),
      expectedEndDate: new Date(workDetails.expectedEndDate),
      studentCode: studentCode,
    };

    // Add location-specific fields
    if (workDetails.isAbroad) {
      workDetailsToSave.country = workDetails.country.trim();
    } else {
      workDetailsToSave.state = workDetails.state.trim().toLowerCase();
      workDetailsToSave.LGA = workDetails.LGA.trim().toLowerCase();
      workDetailsToSave.street = workDetails.street.trim();
    }

    await COMPANY.create(workDetailsToSave);

    res.status(200).json({ message: "Work details uploaded successfully" });
  } catch (error) {
    // Handle Mongoose validation errors with more detail
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map(
        (err) => err.message
      );
      res.status(400).json({
        message: "Validation failed. Please correct the following errors:",
        errors: validationErrors,
      });
      return;
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      res.status(400).json({
        message:
          "Work details already exist for this student. Please contact support if you need to update your information.",
      });
      return;
    }

    // Handle other errors
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

      const errors = [];

      // Get existing company data to check isAbroad status and validate against existing values
      const existingCompany = await COMPANY.findOne(
        { studentCode: studentDetails.studentCode },
        {},
        { session }
      );

      if (!existingCompany) {
        throw {
          message:
            "Company details not found. Please add work details first before updating.",
          code: 404,
          type: "frontend_error",
        };
      }

      const isAbroad = existingCompany.isAbroad;
      const companyKeys = Object.keys(companyDetails);

      // Validate that only allowed fields are being updated
      const invalidFields = companyKeys.filter(
        (field) => !allowedCompanyFields.includes(field)
      );
      if (invalidFields.length > 0) {
        errors.push(
          `Invalid field(s) specified: ${invalidFields.join(
            ", "
          )}. Only allowed fields can be updated.`
        );
      }

      // Validate each field that's being updated
      if (companyDetails.hasOwnProperty("name")) {
        if (
          !companyDetails.name ||
          typeof companyDetails.name !== "string" ||
          companyDetails.name.trim().length === 0
        ) {
          errors.push(
            "Company name is required and must be a non-empty string"
          );
        } else if (companyDetails.name.trim().length < 3) {
          errors.push("Company name must be at least 3 characters long");
        }
      }

      if (companyDetails.hasOwnProperty("address")) {
        if (
          !companyDetails.address ||
          typeof companyDetails.address !== "string" ||
          companyDetails.address.trim().length === 0
        ) {
          errors.push(
            "Company address is required and must be a non-empty string"
          );
        } else if (companyDetails.address.trim().length < 3) {
          errors.push("Company address must be at least 3 characters long");
        }
      }

      if (companyDetails.hasOwnProperty("email")) {
        if (
          !companyDetails.email ||
          typeof companyDetails.email !== "string" ||
          companyDetails.email.trim().length === 0
        ) {
          errors.push(
            "Company email is required and must be a non-empty string"
          );
        } else {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(companyDetails.email.trim())) {
            errors.push("Company email must be a valid email address");
          }
        }
      }

      if (companyDetails.hasOwnProperty("phone")) {
        if (
          !companyDetails.phone ||
          typeof companyDetails.phone !== "string" ||
          companyDetails.phone.trim().length === 0
        ) {
          errors.push(
            "Company phone number is required and must be a non-empty string"
          );
        } else if (companyDetails.phone.trim().length < 7) {
          errors.push(
            "Company phone number must be at least 7 characters long"
          );
        }
      }

      if (companyDetails.hasOwnProperty("assignedDepartment")) {
        if (
          !companyDetails.assignedDepartment ||
          typeof companyDetails.assignedDepartment !== "string" ||
          companyDetails.assignedDepartment.trim().length === 0
        ) {
          errors.push(
            "Assigned department is required and must be a non-empty string"
          );
        }
      }

      if (companyDetails.hasOwnProperty("jobDescription")) {
        if (
          !companyDetails.jobDescription ||
          typeof companyDetails.jobDescription !== "string" ||
          companyDetails.jobDescription.trim().length === 0
        ) {
          errors.push(
            "Job description is required and must be a non-empty string"
          );
        }
      }

      // Conditional validation based on isAbroad status
      if (isAbroad) {
        // If abroad, country should be provided if updating location fields
        if (companyDetails.hasOwnProperty("country")) {
          if (
            !companyDetails.country ||
            typeof companyDetails.country !== "string" ||
            companyDetails.country.trim().length === 0
          ) {
            errors.push("Country is required when company is located abroad");
          }
        }
        // State, LGA, and street should not be provided for abroad companies
        if (companyDetails.hasOwnProperty("state")) {
          errors.push(
            "State field is not applicable for companies located abroad"
          );
        }
        if (companyDetails.hasOwnProperty("LGA")) {
          errors.push(
            "LGA field is not applicable for companies located abroad"
          );
        }
        if (companyDetails.hasOwnProperty("street")) {
          errors.push(
            "Street field is not applicable for companies located abroad"
          );
        }
      } else {
        // If not abroad, state, LGA, and street are required if being updated
        if (companyDetails.hasOwnProperty("state")) {
          if (
            !companyDetails.state ||
            typeof companyDetails.state !== "string" ||
            companyDetails.state.trim().length === 0
          ) {
            errors.push("State is required when company is located in Nigeria");
          } else if (companyDetails.state.trim().length < 3) {
            errors.push("State must be at least 3 characters long");
          }
        }

        if (companyDetails.hasOwnProperty("LGA")) {
          if (
            !companyDetails.LGA ||
            typeof companyDetails.LGA !== "string" ||
            companyDetails.LGA.trim().length === 0
          ) {
            errors.push(
              "LGA (Local Government Area) is required when company is located in Nigeria"
            );
          }
        }

        if (companyDetails.hasOwnProperty("street")) {
          if (
            !companyDetails.street ||
            typeof companyDetails.street !== "string" ||
            companyDetails.street.trim().length === 0
          ) {
            errors.push(
              "Company street address is required when company is located in Nigeria"
            );
          }
        }

        // Country should not be provided for non-abroad companies
        if (companyDetails.hasOwnProperty("country")) {
          errors.push(
            "Country field is not applicable for companies located in Nigeria"
          );
        }
      }

      // Validate date fields
      if (companyDetails.hasOwnProperty("resumptionDate")) {
        if (
          companyDetails.resumptionDate === undefined ||
          companyDetails.resumptionDate === null
        ) {
          errors.push("Resumption date is required");
        } else {
          // Handle both string (ISO date) and number (timestamp) formats
          let resumptionDate;
          if (typeof companyDetails.resumptionDate === "string") {
            resumptionDate = new Date(companyDetails.resumptionDate);
          } else if (typeof companyDetails.resumptionDate === "number") {
            resumptionDate = new Date(companyDetails.resumptionDate);
          } else {
            errors.push(
              "Resumption date must be a valid date string or timestamp"
            );
          }

          if (resumptionDate && isNaN(resumptionDate.getTime())) {
            errors.push("Resumption date must be a valid date");
          } else if (resumptionDate) {
            // Check if resumption date is not too far in the past (more than 1 year)
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
            if (resumptionDate < oneYearAgo) {
              errors.push(
                "Resumption date cannot be more than 1 year in the past"
              );
            }
          }
        }
      }

      if (companyDetails.hasOwnProperty("expectedEndDate")) {
        if (
          companyDetails.expectedEndDate === undefined ||
          companyDetails.expectedEndDate === null
        ) {
          errors.push("Expected end date is required");
        } else {
          // Handle both string (ISO date) and number (timestamp) formats
          let expectedEndDate;
          if (typeof companyDetails.expectedEndDate === "string") {
            expectedEndDate = new Date(companyDetails.expectedEndDate);
          } else if (typeof companyDetails.expectedEndDate === "number") {
            expectedEndDate = new Date(companyDetails.expectedEndDate);
          } else {
            errors.push(
              "Expected end date must be a valid date string or timestamp"
            );
          }

          if (expectedEndDate && isNaN(expectedEndDate.getTime())) {
            errors.push("Expected end date must be a valid date");
          } else if (expectedEndDate) {
            // Validate date range: expectedEndDate should be after resumptionDate
            const resumptionDateToCheck = companyDetails.resumptionDate
              ? typeof companyDetails.resumptionDate === "string"
                ? new Date(companyDetails.resumptionDate)
                : typeof companyDetails.resumptionDate === "number"
                ? new Date(companyDetails.resumptionDate)
                : null
              : existingCompany.resumptionDate;

            if (
              resumptionDateToCheck &&
              !isNaN(new Date(resumptionDateToCheck).getTime()) &&
              expectedEndDate <= new Date(resumptionDateToCheck)
            ) {
              errors.push(
                "Expected end date must be after the resumption date"
              );
            }

            // Check if expected end date is not too far in the future (more than 2 years)
            const twoYearsFromNow = new Date();
            twoYearsFromNow.setFullYear(twoYearsFromNow.getFullYear() + 2);
            if (expectedEndDate > twoYearsFromNow) {
              errors.push(
                "Expected end date cannot be more than 2 years in the future"
              );
            }
          }
        }
      }

      // Return validation errors if any
      if (errors.length > 0) {
        throw {
          message: "Validation failed. Please correct the following errors:",
          errors: errors,
          code: 400,
          type: "frontend_error",
        };
      }

      // Prepare company details for database update with proper formatting
      const companyDetailsToUpdate = {};
      if (companyDetails.hasOwnProperty("name")) {
        companyDetailsToUpdate.name = companyDetails.name.trim().toLowerCase();
      }
      if (companyDetails.hasOwnProperty("address")) {
        companyDetailsToUpdate.address = companyDetails.address
          .trim()
          .toLowerCase();
      }
      if (companyDetails.hasOwnProperty("email")) {
        companyDetailsToUpdate.email = companyDetails.email
          .trim()
          .toLowerCase();
      }
      if (companyDetails.hasOwnProperty("phone")) {
        companyDetailsToUpdate.phone = companyDetails.phone
          .trim()
          .toLowerCase();
      }
      if (companyDetails.hasOwnProperty("assignedDepartment")) {
        companyDetailsToUpdate.assignedDepartment =
          companyDetails.assignedDepartment.trim().toLowerCase();
      }
      if (companyDetails.hasOwnProperty("jobDescription")) {
        companyDetailsToUpdate.jobDescription =
          companyDetails.jobDescription.trim();
      }
      if (companyDetails.hasOwnProperty("resumptionDate")) {
        companyDetailsToUpdate.resumptionDate =
          typeof companyDetails.resumptionDate === "string"
            ? new Date(companyDetails.resumptionDate)
            : new Date(companyDetails.resumptionDate);
      }
      if (companyDetails.hasOwnProperty("expectedEndDate")) {
        companyDetailsToUpdate.expectedEndDate =
          typeof companyDetails.expectedEndDate === "string"
            ? new Date(companyDetails.expectedEndDate)
            : new Date(companyDetails.expectedEndDate);
      }

      // Add location-specific fields
      if (isAbroad) {
        if (companyDetails.hasOwnProperty("country")) {
          companyDetailsToUpdate.country = companyDetails.country.trim();
        }
      } else {
        if (companyDetails.hasOwnProperty("state")) {
          companyDetailsToUpdate.state = companyDetails.state
            .trim()
            .toLowerCase();
        }
        if (companyDetails.hasOwnProperty("LGA")) {
          companyDetailsToUpdate.LGA = companyDetails.LGA.trim().toLowerCase();
        }
        if (companyDetails.hasOwnProperty("street")) {
          companyDetailsToUpdate.street = companyDetails.street.trim();
        }
      }

      // Update the company document using the student's studentCode as a key
      await COMPANY.updateOne(
        { studentCode: studentDetails.studentCode },
        companyDetailsToUpdate,
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
      // Return structured error response with errors array if available
      if (error.errors && Array.isArray(error.errors)) {
        res.status(error.code).json({
          message: error.message,
          errors: error.errors,
        });
      } else {
        res.status(error.code).json({ message: error.message });
      }
    } else if (error.name === "ValidationError") {
      // Handle Mongoose validation errors
      const validationErrors = Object.values(error.errors).map(
        (err) => err.message
      );
      res.status(400).json({
        message: "Validation failed. Please correct the following errors:",
        errors: validationErrors,
      });
    } else {
      console.error("Error updating details:", error);
      handleError(error, res);
    }
  } finally {
    await session.endSession();
  }
};

const update_profile_image = async function (req, res) {
  const { _id } = req.user;
  let uploadedProfileImagePublicId = null;

  try {
    // Check for express-fileupload file size limit errors
    if (req.files && req.files.errors) {
      const fileErrors = req.files.errors;
      if (fileErrors.length > 0) {
        res.status(400).json({
          message: fileErrors[0] || "File upload error. Please ensure the file size does not exceed 5MB.",
        });
        return;
      }
    }

    if (!req.files || !req.files.profileImage) {
      res.status(400).json({ message: "Please upload a profile image" });
      return;
    }

    const profileImage = Array.isArray(req.files.profileImage)
      ? req.files.profileImage[0]
      : req.files.profileImage;

    // Validate that profileImage exists and has required properties
    if (!profileImage) {
      res.status(400).json({ message: "Profile image file is missing or invalid." });
      return;
    }

    // Validate mimetype
    if (!profileImage.mimetype || !ALLOWED_IMAGE_MIME_TYPES.includes(profileImage.mimetype)) {
      res.status(400).json({
        message: "Invalid image format. Please upload a JPG, PNG, or WEBP image.",
      });
      return;
    }

    // Validate file size
    if (!profileImage.size || profileImage.size === 0) {
      res.status(400).json({
        message: "The uploaded image file is empty. Please upload a valid image.",
      });
      return;
    }

    if (profileImage.size > 5 * 1024 * 1024) {
      const fileSizeMB = (profileImage.size / (1024 * 1024)).toFixed(2);
      res.status(400).json({
        message: `Image size (${fileSizeMB}MB) exceeds the maximum allowed size of 5MB. Please upload a smaller image.`,
      });
      return;
    }

    // Validate that profileImage.data exists and is a Buffer
    if (!profileImage.data || !Buffer.isBuffer(profileImage.data)) {
      res.status(400).json({
        message: "Invalid image data. The file may be corrupted. Please try uploading again.",
      });
      return;
    }

    // Validate buffer is not empty
    if (profileImage.data.length === 0) {
      res.status(400).json({
        message: "The image file appears to be empty. Please upload a valid image.",
      });
      return;
    }

    const student = await STUDENTS.findById(_id);

    if (!student) {
      res.status(404).json({ message: "Student not found" });
      return;
    }

    // Upload to Cloudinary with error handling
    try {
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

      if (!uploadResult || !uploadResult.secure_url) {
        res.status(500).json({
          message: "Failed to upload image. Please try again later.",
        });
        return;
      }

      uploadedProfileImagePublicId = uploadResult.public_id;
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

      // Delete previous image if it exists and is different
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
    } catch (uploadError) {
      console.error("Cloudinary upload error:", uploadError);
      
      // Handle specific Cloudinary errors
      if (uploadError.message && uploadError.message.includes("Unsupported image format")) {
        res.status(400).json({
          message: "The image format is not supported. Please upload a JPG, PNG, or WEBP image.",
        });
        return;
      }

      if (uploadError.message && uploadError.message.includes("Invalid file buffer")) {
        res.status(400).json({
          message: "The image file appears to be corrupted. Please try uploading a different image.",
        });
        return;
      }

      // Generic Cloudinary error
      res.status(500).json({
        message: "Failed to upload image to storage. Please try again later or contact support if the problem persists.",
      });
      return;
    }
  } catch (error) {
    // Clean up uploaded image if registration fails
    if (uploadedProfileImagePublicId) {
      await deleteAsset(uploadedProfileImagePublicId);
    }
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
