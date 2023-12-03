const router = require("express").Router();
const {
  register,
  login,
  logout,
  send_OTP,
  verify_OTP,
  reset_password,
} = require("./../controllers/auth/auth.controller");

router.post("/register", register);

router.post("/login", login);

router.post("/logout", logout);

router.post("/sendOTP", send_OTP);

router.post("/verifyOTP", verify_OTP);

router.patch("/forgotPassword/changePassword", reset_password);

module.exports = router;
