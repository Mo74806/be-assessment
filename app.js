const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const userRouter = require("./routes/userRoutes");
const checkRouter = require("./routes/checkRoutes");
const reportRouter = require("./routes/reportRoutes");
const cros = require("cors");
const checkingService = require("./controllers/runningChecksController");
const {
  intiateContinuousCheck,
} = require("./controllers/runningChecksController");
const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");

const app = express();
/************************************************/
/*1)starting checking the saved check in the DB.*/
/************************************************/
checkingService.startContinousChecks();

/************************************************/
/*               2)middlewares                  */
/*setting up some middlewares that will help us */
/************************************************/
app.use(
  cros({
    origin: "*",
  })
);
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());
app.use(express.json());
/**************/
/*  3)Routes  */
/**************/
app.use("/api/v1/users", userRouter);
app.use("/api/v1/checks", checkRouter);
app.use("/api/v1/reports", reportRouter);

/*******************************************************/
/*4)catching errors and passing it to our error handler*/
/*******************************************************/
app.all("*", (req, res, next) => {
  next(new AppError(`coldn\'t make request to this url ${req.url} `, 404));
});
app.use(globalErrorHandler);

module.exports = app;
