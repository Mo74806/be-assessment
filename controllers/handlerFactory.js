const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const APIFeatures = require("./../utils/apiFeatures");
const { query } = require("express");

exports.deleteOne = (Model, filters) =>
  catchAsync(async (req, res, next) => {
    let query;
    if (filters)
      query = await Model.find({ id: req.params.id, [filters]: req.user.id });
    else query = await Model.findById(req.params.id);
    if (query.length === 0)
      return next(new AppError("No document found with that ID", 404));

    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError("No document found with that ID", 404));
    }

    res.status(204).json({
      status: "success",
      message: "Deleted Successfully",
      data: null,
    });
  });

exports.updateOne = (Model, filters) =>
  catchAsync(async (req, res, next) => {
    let query;
    if (filters)
      query = await Model.findOne({
        _id: req.params.id,
        [filters]: req.user.id,
      });
    else query = await Model.findById(req.params.id);
    if (!query)
      return next(new AppError("No document found with that ID", 404));
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      status: "success",
      data: {
        data: doc,
      },
    });
  });

exports.createOne = (Model, sendResponse = true) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);
    console.log(req.body);
    if (sendResponse)
      res.status(201).json({
        status: "success",
        data: {
          data: doc,
        },
      });
    else return doc;
  });
exports.getOne = (Model, popOptions, filters) =>
  catchAsync(async (req, res, next) => {
    let query;
    if (filters)
      query = Model.findOne({ _id: req.params.id, [filters]: req.user.id });
    else query = Model.findById(req.params.id);
    console.log(query);
    if (popOptions) query = query.populate(popOptions);
    const doc = await query;

    if (!doc) {
      return next(new AppError("No document found with that ID", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        data: doc,
      },
    });
  });

exports.getAll = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    // To allow for nested GET reviews on tour (hack)
    let filter = {};
    filter = { createdBy: req.user.id };

    const features = new APIFeatures(
      Model.find(filter).populate(popOptions),
      req.query
    )
      .filter()
      .sort()
      .limitFields()
      .paginate();
    // const doc = await features.query.explain();
    const doc = await features.query;

    // SEND RESPONSE
    res.status(200).json({
      status: "success",
      results: doc.length,
      data: {
        data: doc,
      },
    });
  });