const express = require("express");
const router = express.Router();

const {
  getJobs,
  newJob,
  searchJobWithRadius,
  updateJob,
  deleteJob,
  getSingleJobByIdAndSlug,
  jobStats,
  applyToJob,
} = require("../controllers/jobsController");
const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/auth");

router.route("/jobs").get(getJobs);
router.route("/job/:id/:slug").get(getSingleJobByIdAndSlug);
router.route("/jobs/new").post(isAuthenticatedUser, authorizeRoles("employer", "admin"), newJob);
router.route("/jobs/:zipcode/:distance").get(searchJobWithRadius);
router
  .route("/jobs/:id")
  .put(isAuthenticatedUser, authorizeRoles("employer", "admin"), updateJob)
  .delete(isAuthenticatedUser, authorizeRoles("employer", "admin"), deleteJob);
router.route("/stats/:topic").get(jobStats);
router.route("/job/:id/apply").put(isAuthenticatedUser, authorizeRoles("user"), applyToJob);

module.exports = router;
