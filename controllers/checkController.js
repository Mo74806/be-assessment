const catchAsync = require("../utils/catchAsync");
const CheckModel = require("./../models/check");
const factory = require("./handlerFactory");
const Report = require("./../models/Report");
const checkingService = require("./runningChecksController");

exports.assignCheckData = (req, res, next) => {
  if (!req.body.createdBy) req.body.createdBy = req.user.id;
  next();
};

exports.getAllChecks = factory.getAll(CheckModel, { path: "createdBy" });
exports.getCheck = factory.getOne(
  CheckModel,
  { path: "createdBy" },
  "createdBy"
);
exports.createCheck = catchAsync(async (req, res, next) => {
  const check = await CheckModel.create(req.body);

  // Create the report
  const report = new Report({
    check: check._id,
    status: 200,
    availability: 0,
  });

  await report.save();

  checkingService.addToCheckList(check);
  // cronService.start();
  res.status(201).json({
    status: "success",
    message: "the check is created",
    data: {
      data: check,
    },
  });
});
exports.updateCheck = factory.updateOne(CheckModel, "createdBy");
/******************************************************************/
// when delete check also the continous check stop for this check *
//                   and its report deleted                       *
/******************************************************************/
exports.deleteCheck = factory.deleteOne(CheckModel, "createdBy");
