const express = require("express");
const router = express.Router();

const { getUserProfile, updatePassword, updateUserData, deleteCurrentUser } = require("../controllers/userController");
const { isAuthenticatedUser } = require("../middlewares/auth");

router.route("/me").get(isAuthenticatedUser, getUserProfile);

router.route("/me/update").put(isAuthenticatedUser, updateUserData);
router.route("/me/delete").delete(isAuthenticatedUser, deleteCurrentUser);
router.route("/password/update").put(isAuthenticatedUser, updatePassword);

module.exports = router;
