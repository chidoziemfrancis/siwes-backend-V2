const COORDINATORS = require('./../../models/coordinator.model');
const STUDENTS = require('./../../models/student.model');
const SUPERVISORS = require('./../../models/supervisor.model');
const { request, response } = require('express');
const { handleError } = require('./../../utils/handleError');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { ObjectId } = require('mongoose').Types;

/**
 * Creates and appends the access and refresh tokens to the cookies of the client
 * @param {userInfo} user
 * @param {response} res
 * @param {String} type
 * 
 * @returns {Promise<null | Error>}
 */
const create_tokens = function(user, res, type) {
  return new Promise(async (resolve, reject) => {
    try {
      const salt = await bcrypt.genSalt(10);
      const clientPayload = {
        id: user._id,
        secret: await bcrypt.hash(new Date().getTime().toString(), salt)
      }
      const clientId = {
        id: user._id,
        role: type
      }
  
      const accessToken = jwt.sign(clientPayload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
      const refreshToken = jwt.sign(clientPayload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
      const clientToken = jwt.sign(clientId, process.env.CLIENT_TOKEN_SECRET, { expiresIn: '15m' });
  
      // update the user record to include the most recent token secret
      let updateInfo = null;
      switch (type) {
        case 'student':
            updateInfo = await STUDENTS.updateOne({ _id: user._id }, { validation_secret: clientPayload.secret });
          break;

        case 'coordinator':
            updateInfo = await COORDINATORS.updateOne({ _id: user._id }, { validation_secret: clientPayload.secret });
          break;

        case 'supervisor':
            updateInfo = await SUPERVISORS.updateOne({ _id: user._id }, { validation_secret: clientPayload.secret });
          break;
      
        default:
          break;
      }
  
      if (updateInfo === null || updateInfo.modifiedCount === 0) {
        throw Error('Something went wrong while logging you in, please try again'); // TODO: will need an error code
      }

      const cookieOptions = {
        httpOnly: true,
        // secure: true,
        sameSite: 'Strict',
        maxAge: 604800000 // 7 days
      }
    
      res.cookie('umis_siwesA', accessToken, cookieOptions);
      res.cookie('umis_siwesR', refreshToken, cookieOptions);
      res.cookie('umis_siwesC', clientToken, { sameSite: 'Strict', maxAge: 604800000 })

      resolve();
    } catch (error) {
      reject(error);
    }
  })
}

/**
 * Register's a new student
 * @param {request} req
 * @param {response} res
 */
const register = async function(req, res) {
  const studentInfo = req.body;

  try {
    if (typeof studentInfo !== 'object' || Object.keys(studentInfo).length === 0) {
      res.status(400).json({ message: 'Please fill all the required fields' });
      return;
    }

    const student = await STUDENTS.create(studentInfo);

    await create_tokens(student, res, 'student');

    res.status(200).json({ message: "Registration successfull", data: student._id });
  } catch (error) {
    handleError(error, res);
  }
}

/**
 * Login with email and password
 * @param {request} req
 * @param {response} res
 */
const login = async function(req, res) {
  const { email, password, type } = req.body;

  try {
    if (['student', 'coordinator', 'supervisor'].includes(type) === false) {
      res.status(400).json({ message: "Invalid request" });
      return;
    }

    if (email.trim().length === 0 || password.length === 0) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    let user = null;

    switch (type) {
      case 'student':
          user = await STUDENTS.findOne({ email });
        break;

      case 'coordinator':
          user = await COORDINATORS.findOne({ email });
        break;

      case 'supervisor':
          user = await SUPERVISORS.findOne({ email });
        break;
    
      default:
        break;
    }

    if (user === null) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const passwordIsValid = await bcrypt.compare(password, user.password);

    if (!passwordIsValid) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    await create_tokens(user, res, type);

    res.status(200).json({ message: 'Login successful', data: user._id });
  } catch (error) {
    console.log(error);
    handleError(error, res);
  }
}

/**
 * Logout
 * @param {request} req
 * @param {response} res
 */
const logout = async function(req, res) {
  res.clearCookie('umis_siwesA');
  res.clearCookie('umis_siwesR');
  res.clearCookie('umis_siwesC');

  res.status(200).json({ message: 'Success' })
}


/**
 * @typedef userInfo
 * @property {ObjectId} _id
 */

module.exports = {
  login,
  logout,
  register
}