const Job = require("../models/jobs");
const geoCoder = require("../utils/geocoder");

// get all jobs /api/v1/jobs

exports.getJobs = async (req, res, next) => {
  const jobs = await Job.find();

  res.status(200).json({
    success: true,
    result: jobs.length,
    data: jobs,
  });
};

// Create a new Job => /api/v1/jobs/new
exports.newJob = async (req, res, next) => {
  const job = await Job.create(req.body);

  res.status(200).json({
    success: true,
    message: "Job Created",
    data: job,
  });
};

// Search jobs with radisu => /api/v1/jobs/:zipcode/:distance
exports.searchJobWithRadius = async (req, res, next) => {
  const { zipcode, distance } = req.params;

  const loc = await geoCoder.geocode(zipcode);
  const lat = loc[0].latitude;
  const lon = loc[0].longitude;

  const radius = distance / 3963;

  const jobs = await Job.find({
    location: { $geoWithin: { $centerSphere: [[lon, lat], radius] } },
  });

  res.status(200).json({
    success: true,
    results: jobs.length,
    data: jobs,
  });
};

// update job => /api/v1/jobs/:id
exports.updateJob = async (req, res, next) => {
  let job = await Job.findById(req.params.id);

  if (!job) {
    return res.status(404).json({
      success: false,
      message: "Job not found",
    });
  }

  job = await Job.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    message: "Job is updated",
    data: job,
  });
};

// delete job => /api/v1/jobs/:id

exports.deleteJob = async (req, res, next) => {
  let job = await Job.findById(req.params.id);

  if (!job) {
    return res.status(404).json({
      success: false,
      message: "Job not found",
    });
  }

  job = await Job.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: "Job deleted successfully",
  });
};

// find job by id and slug => /api/v1/jobs/:id/:slug

exports.getSingleJobByIdAndSlug = async (req, res, next) => {
  let job = await Job.find({ $and: [{ _id: req.params.id }, { slug: req.params.slug }] });

  if (!job || job.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Job not found",
    });
  }
  res.status(200).json({
    success: true,
    data: job,
  });
};

// get stats about a topic(job) => /api/v1/stats/:topic
exports.jobStats = async (req, res, next) => {
  // $match: { $text: { $search: "\""+ req.params.topic + "\"" } }
  const stats = await Job.aggregate([
    {
      $match: { $text: { $search: '"' + req.params.topic + '"' } },
    },
    {
      $group: {
        _id: { $toUpper: "$experience" },
        totalJobs: { $sum: 1 },
        avgPosition: { $avg: "$positions" },
        avgSalary: { $avg: "$salary" },
        minSalary: { $min: "$salary" },
        maxSalary: { $max: "$salary" },
      },
    },
  ]);

  if (stats.length === 0) {
    return res.status(200).json({
      success: false,
      message: `No stats found for - ${req.params.topic}`,
    });
  }
  res.status(200).json({
    success: true,
    data: stats,
  });
};
