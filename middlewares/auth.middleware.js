const { response, request } = require("express");
const jwt = require("jsonwebtoken");
const COORDINATORS = require("./../models/coordinator.model");
const STUDENTS = require("./../models/student.model");
const SUPERVISORS = require("./../models/supervisor.model");
const bcrypt = require("bcrypt");

/**
 * Verifies if a token has been invalidated or not
 * @param {*} token
 * @param {String} type
 *
 */
const verify_token_status = function (token, type) {
  return new Promise(async (resolve, reject) => {
    try {
      let userInfo = null;
      switch (type) {
        case "student":
          userInfo = await STUDENTS.findOne({ _id: token.id });
          break;

        case "coordinator":
          userInfo = await COORDINATORS.findOne({ _id: token.id });
          break;

        case "supervisor":
          userInfo = await SUPERVISORS.findOne({ _id: token.id });
          break;

        default:
          break;
      }

      if (typeof userInfo === "undefined" || userInfo === null) {
        throw Error("access denied");
      }

      if (userInfo.validation_secret !== token.secret) {
        throw Error("access denied");
      } else {
        resolve();
        return;
      }
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Rotates jwt tokens and supports header-based token storage
 * @param {userInfo} user
 * @param {response} res
 * @param {String} type
 *
 * @returns {Promise<*>} id
 */
const assign_new_tokens = function (user, res, type) {
  return new Promise(async (resolve, reject) => {
    try {
      const salt = await bcrypt.genSalt(10);
      const clientPayload = {
        id: user._id,
        secret: await bcrypt.hash(new Date().getTime().toString(), salt),
      };
      const clientId = {
        id: user._id,
        role: type,
      };

      const accessToken = jwt.sign(
        clientPayload,
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "15m" }
      );
      const refreshToken = jwt.sign(
        clientPayload,
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "7d" }
      );
      const clientToken = jwt.sign(clientId, process.env.CLIENT_TOKEN_SECRET, {
        expiresIn: "15m",
      });

      let updateInfo = null;
      switch (type) {
        case "student":
          updateInfo = await STUDENTS.updateOne(
            { _id: user._id },
            { validation_secret: clientPayload.secret }
          );
          break;

        case "coordinator":
          updateInfo = await COORDINATORS.updateOne(
            { _id: user._id },
            { validation_secret: clientPayload.secret }
          );
          break;

        case "supervisor":
          updateInfo = await SUPERVISORS.updateOne(
            { _id: user._id },
            { validation_secret: clientPayload.secret }
          );
          break;

        default:
          break;
      }

      if (!updateInfo || updateInfo.modifiedCount === 0) {
        throw Error(
          "Something went wrong while logging you in, please try again"
        );
      }

      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV !== "development",
        sameSite: "none",
        maxAge: 604800000, // 7 days
      };

      res.cookie("umis_siwesA", accessToken, cookieOptions);
      res.cookie("umis_siwesR", refreshToken, cookieOptions);
      res.cookie("umis_siwesC", clientToken, {
        sameSite: "none",
        maxAge: 604800000,
      });


      resolve({ id: user._id });
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Decodes jwt token from cookies or headers
 * @param {request} req
 * @param {response} res
 * @param {String} type
 *
 * @returns {Promise<*>} jwt
 */
const decode_jwt = function (req, res, type) {
  return new Promise(async (resolve, reject) => {
    const token = req.headers.authorization?.split(' ')[1];
    try {
      const accessToken =
        req.headers.authorization?.split(" ")[1] || req.cookies?.umis_siwesA;
console.log(accessToken)
console.log(token)
      if (!accessToken) {
        throw Error("Access denied: No token provided");
      }

      const decodedToken = jwt.verify(
        accessToken,
        process.env.ACCESS_TOKEN_SECRET
      );

      await verify_token_status(decodedToken, type);

      resolve({ id: decodedToken.id });
    } catch (error) {
      try {
        const refreshToken =
          req.headers["x-refresh-token"] || req.cookies?.umis_siwesR;

        if (!refreshToken) {
          throw Error("Access denied: No refresh token provided");
        }

        const decodedRefreshToken = jwt.verify(
          refreshToken,
          process.env.REFRESH_TOKEN_SECRET
        );

        await verify_token_status(decodedRefreshToken, type);

        // Refresh token is valid, issue new tokens
        const data = await assign_new_tokens(
          { _id: decodedRefreshToken.id },
          res,
          type
        );

        resolve({ id: data.id });
      } catch (error) {
        reject(error);
      }
    }
  });
};


/**
 * Determines if a user is a studentr
 * @param {request} req
 * @param {response} res
 * @param {*} next
 */
const isStudent = async function (req, res, next) {
  try {
    const data = await decode_jwt(req, res, "student");

    const user = await STUDENTS.findOne({ _id: data.id });

    if (user === null) {
      console.error("Access denied: User not found");
      throw new Error("access denied");
    }

    req.user = user;

    next();
  } catch (error) {
    console.error("Error in isStudent middleware:", error.message);
    res.status(401).json({ message: error.message });
  }
};


/**
 * Determines if a user is a supervisor
 * @param {request} req
 * @param {response} res
 * @param {*} next
 */
const isSupervisor = async function (req, res, next) {
  try {
    const data = await decode_jwt(req, res, "supervisor");

    const user = await SUPERVISORS.findOne({ _id: data.id });

    if (user === null) {
      throw Error("access denied");
    }

    req.user = user;

    next();
  } catch (error) {
    res.status(401).json({ message: error.message });
    return;
  }
};

/**
 * Determines if a user is a coordinator
 * @param {request} req
 * @param {response} res
 * @param {*} next
 */
const isCoordinator = async function (req, res, next) {
  try {
    const data = await decode_jwt(req, res, "coordinator");

    const user = await COORDINATORS.findOne({ _id: data.id });

    if (user === null) {
      throw Error("access denied");
    }

    req.user = user;

    next();
  } catch (error) {
    res.status(401).json({ message: error.message });
    return;
  }
};

/**
 * @typedef userInfo
 * @property {ObjectId} _id
 */

module.exports = {
  isSupervisor,
  isCoordinator,
  isStudent,
};
