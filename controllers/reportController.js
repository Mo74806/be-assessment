const catchAsync = require("../utils/catchAsync");
const ReportModel = require("./../models/Report");
const factory = require("./handlerFactory");
const CheckModel = require("../models/check");
const AppError = require("./../utils/appError");
const APIFeatures = require("./../utils/apiFeatures");

exports.sendReport = catchAsync(async (req, res, next) => {
  let checks;
  if (req.body.tags) {
    checks = await CheckModel.find({
      createdBy: req.user.id,
      tags: { $in: req.body.tags },
    });
  } else {
    checks = await CheckModel.find({
      createdBy: req.user.id,
      ["_id"]: req.params.checkId,
    });
  }
  if (!checks) {
    return next(new AppError("No Checks found ", 404));
  }
  //collecting the reports
  let reportList = checks.map(async (check) => {
    let report = await ReportModel.findOne({ check: check.id });
    return report;
  });

  Promise.all(reportList).then((values) => {
    res.status(201).json({
      status: "success",
      data: {
        data: values,
      },
    });
  });
});
exports.createReport = factory.createOne(ReportModel);

exports.updateReport = factory.updateOne(ReportModel);
exports.getAllReports = factory.getAll(ReportModel);
exports.getReport = factory.getOne(ReportModel);
exports.deleteReport = factory.deleteOne(ReportModel);
