const User = require("../models/users");
const Job = require("../models/jobs");
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const ErrorHandler = require("../utils/errorHandler");
const sendToken = require("../utils/jwtToken");
const fs = require("fs");

// get current user profile => api/v1/me
exports.getUserProfile = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id).populate({
    path: "jobPublished",
    select: "title postingDate",
  });

  res.status(200).json({
    success: true,
    data: user,
  });
});

// update password => api/v1/password/update
exports.updatePassword = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("+password");

  const isMatched = await user.comparePassword(req.body.currentPassword);

  if (!isMatched) {
    return next(new ErrorHandler("Password is incorrect", 401));
  }

  user.password = req.body.newPassword;

  await user.save();
  sendToken(user, 200, res);
});

// update user data => api/v1/me/update
exports.updateUserData = catchAsyncErrors(async (req, res, next) => {
  const newData = {
    name: req.body.name,
    email: req.body.email,
  };

  const user = await User.findByIdAndUpdate(req.user.id, newData, { new: true, runValidators: true });
  res.status(200).json({
    success: true,
    data: user,
  });
});

// delete user => api/v1/me/delete
exports.deleteCurrentUser = catchAsyncErrors(async (req, res, next) => {
  deleteUserData(req.user.id, req.user.role);

  const user = await User.findByIdAndDelete(req.user.id);
  res.cookie("token", "none", {
    expires: new Date(Date.now()),
    httpOnly: true,
  });
  res.status(200).json({
    success: true,
    message: "Your account has been deleted",
  });
});

// delete user files and employer jobs
async function deleteUserData(user, role) {
  if (role === "employer") {
    await Job.deleteMany({ user: user });
  }
  if (role === "user") {
    const appliedJobs = await Job.find({ "applicantsApplied.id": user }).select("+applicantsApplied");

    for (let i = 0; i < appliedJobs.length; i++) {
      let obj = appliedJobs[i].applicantsApplied.find((o) => o.id === user);
      let filepath = `${__dirname}/public/uploads/${obj.resume}`.replace("\\controllers", "");
      fs.unlink(filepath, (err) => {
        if (err) return console.log(err);
      });

      appliedJobs[i].applicantsApplied.splice(appliedJobs[i].applicantsApplied.indexOf(obj.id));

      await appliedJobs[i].save();
    }
  }
}
