const express = require("express");
const router = express.Router();

const { getJobs, newJob, searchJobWithRadius, updateJob, deleteJob, getSingleJobByIdAndSlug, jobStats } = require("../controllers/jobsController");

router.route("/jobs").get(getJobs);
router.route("/jobs/:id/:slug").get(getSingleJobByIdAndSlug);
router.route("/jobs/new").post(newJob);
router.route("/jobs/:zipcode/:distance").get(searchJobWithRadius);
router.route("/jobs/:id").put(updateJob).delete(deleteJob);
router.route("/stats/:topic").get(jobStats)

module.exports = router;
