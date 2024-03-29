const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const Job = require("../models/jobs");
const ErrorHandler = require("../utils/errorHandler");
const geoCoder = require("../utils/geocoder");
const APIFilters = require("../utils/apiFilters");
const path = require("path");
const fs = require("fs");

// get all jobs /api/v1/jobs

exports.getJobs = catchAsyncErrors(async (req, res, next) => {
  const apiApiFilters = new APIFilters(Job.find(), req.query).filters().sort().limitFields().searchByQuery().pagination();

  const jobs = await apiApiFilters.query;

  res.status(200).json({
    success: true,
    result: jobs.length,
    data: jobs,
  });
});

// Create a new Job => /api/v1/jobs/new
exports.newJob = catchAsyncErrors(async (req, res, next) => {
  //Adding user to body
  req.body.user = req.user.id;

  const job = await Job.create(req.body);

  res.status(200).json({
    success: true,
    message: "Job Created",
    data: job,
  });
});

// Search jobs with radisu => /api/v1/jobs/:zipcode/:distance
exports.searchJobWithRadius = catchAsyncErrors(async (req, res, next) => {
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
});

// update job => /api/v1/jobs/:id
exports.updateJob = catchAsyncErrors(async (req, res, next) => {
  let job = await Job.findById(req.params.id);

  if (!job) {
    return next(new ErrorHandler("Job not found", 404));
  }

  if (job.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(new ErrorHandler(`User ${req.user.id} is not allowed to update the job`, 400));
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
});

// delete job => /api/v1/jobs/:id

exports.deleteJob = catchAsyncErrors(async (req, res, next) => {
  let job = await Job.findById(req.params.id).select("+applicantsApplied");

  if (!job) {
    return next(new ErrorHandler("Job not found", 404));
  }

  if (job.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(new ErrorHandler(`User ${req.user.id} is not allowed to delete the job`, 400));
  }

  for (let i = 0; i < job.applicantsApplied.length; i++) {
    let filepath = `${__dirname}/public/uploads/${job.applicantsApplied[i].resume}`.replace("\\controllers", "");
    fs.unlink(filepath, (err) => {
      if (err) return console.log(err);
    });
  }

  job = await Job.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: "Job deleted successfully",
  });
});

// find job by id and slug => /api/v1/jobs/:id/:slug

exports.getSingleJobByIdAndSlug = catchAsyncErrors(async (req, res, next) => {
  let job = await Job.find({ $and: [{ _id: req.params.id }, { slug: req.params.slug }] }).populate({
    path: "user",
    select: "name",
  });

  if (!job || job.length === 0) {
    return next(new ErrorHandler("Job not found", 404));
  }
  res.status(200).json({
    success: true,
    data: job,
  });
});

// get stats about a topic(job) => /api/v1/stats/:topic
exports.jobStats = catchAsyncErrors(async (req, res, next) => {
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
});

// apply to job
exports.applyToJob = catchAsyncErrors(async (req, res, next) => {
  const job = await Job.findById(req.params.id).select("+applicantsApplied");

  if (!job) {
    return next(new ErrorHandler("Job not found", 404));
  }

  if (job.lastDate < new Date(Date.now())) {
    return next(new ErrorHandler("You can not apply to this job as date is over.", 400));
  }

  //check if user has applied before
  for (let i = 0; i < job.applicantsApplied.length; i++) {
    if (job.applicantsApplied[i].id === req.user.id) {
      return next(new ErrorHandler("You have already applied for this job.", 400));
    }
  }

  // check the files
  if (!req.files) {
    return next(new ErrorHandler("Please upload file.", 400));
  }

  const file = req.files.file;

  //check file type
  const supportedFiles = /.docs|.pdf/;
  if (!supportedFiles.test(path.extname(file.name))) {
    return next(new ErrorHandler("Please upload document file.", 400));
  }
  // check file size
  if (file.size > process.env.MAX_FILE_SIZE) {
    return next(new ErrorHandler("Please upload file less than 2MB", 400));
  }

  // renaming resume
  file.name = `${req.user.name.replace(" ", "_")}_${job._id}${path.parse(file.name).ext}`;

  file.mv(`${process.env.UPLOAD_PATH}/${file.name}`, async (err) => {
    if (err) {
      console.log(err);
      return next(new ErrorHandler("Resume upload failed", 500));
    }
    await Job.findByIdAndUpdate(req.params.id, {
      $push: {
        applicantsApplied: {
          id: req.user.id,
          resume: file.name,
        },
      },
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: "Applied to Job has been successful.",
      data: file.name,
    });
  });
});
