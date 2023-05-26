const express = require("express");
const router = express.Router();

const {
  getUserProfile,
  updatePassword,
  updateUserData,
  deleteCurrentUser,
  getAllAppliedJobs,
  getAllJobsPublished,
  getAllUser,
  deleteUserbyAdmin,
} = require("../controllers/userController");
const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/auth");

router.route("/me").get(isAuthenticatedUser, getUserProfile);
router.route("/jobs/applied").get(isAuthenticatedUser, authorizeRoles("user"), getAllAppliedJobs);
router.route("/jobs/published").get(isAuthenticatedUser, authorizeRoles("employer", "admin"), getAllJobsPublished);
router.route("/me/update").put(isAuthenticatedUser, updateUserData);
router.route("/me/delete").delete(isAuthenticatedUser, deleteCurrentUser);
router.route("/password/update").put(isAuthenticatedUser, updatePassword);

//admin routes
router.route("/users").get(isAuthenticatedUser, authorizeRoles("admin"), getAllUser);
router.route("/users/:id").delete(isAuthenticatedUser, authorizeRoles("admin"), deleteUserbyAdmin);

module.exports = router;
