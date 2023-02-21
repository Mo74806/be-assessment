const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const User = require("./../models/user");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const dotenv = require("dotenv");
const sendEmail = require("./../utils/email");
dotenv.config({ path: "./config.env" });
const crypto = require("crypto");

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  //save the token in cookie
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;

  res.cookie("jwt", token, cookieOptions);

  // Remove password from output
  user.password = undefined;
  user.token = token;
  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    userName: req.body.userName,
    email: req.body.email,
    phone: req.body.phone,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    role: req.body.role,
  });

  //2)generate random token
  const resetToken = newUser.createVerficationOrResetToken(true);
  await newUser.save({ validateBeforeSave: false });

  //3)send email
  await sendEmail({
    email: newUser.email,
    subject: "confirmation code",
    message: `your reset code is:${resetToken}
      This code is valid for 10 Minutes from the time you recive this mail`,
  });
  createSendToken(newUser, 201, res);
});

exports.verfiyAccount = catchAsync(async (req, res, next) => {
  //1)get user based on token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({ verificationCode: hashedToken });

  console.log("***************");
  console.log(user.verificationCode);
  //if no user is found
  if (!user) {
    return next(new AppError("token is invaild", 400));
  }
  //set the password
  if (user.VerficationCodeExpiry < Date.now())
    return next(new AppError("token is expired", 400));

  user.verificationCode = undefined;
  user.VerficationCodeExpiry = undefined;
  user.verficationStatus = true;
  //   await user.save();
  // create new token for the user
  await user.save({ validateBeforeSave: false });

  createSendToken(user, 200, res);
});

exports.resendToken = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email || req.user.email });
  if (!user) {
    return next(new AppError("Please provide an correct email ", 404));
  }

  const resetToken = user.createVerficationOrResetToken(true);
  await user.save({ validateBeforeSave: false });

  //3)send email
  await sendEmail({
    email: newUser.email,
    subject: "confirmation code",
    message: `your reset code is:${resetToken}
      This code is valid for 10 Minutes from the time you recive this mail`,
  });

  res.status(200).json({
    status: "success",
    message: "the verfication code sent to your mail",
  });
});
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  console.log("loging in ........");
  console.log(email, password);
  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError("Please provide email and password!", 400));
  }
  // 2) Check if user exists && password is correct
  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrect email or password", 401));
  }

  // 3) If everything ok, send token to client
  createSendToken(user, 200, res);
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("you don't have permission to do this action", 403)
      );
    }
    next();
  };
};
exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check of it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer") &&
    req.headers.authorization !== "Bearer {{jwt}}"
  )
    token = req.headers.authorization.split(" ")[1];

  if (!token) {
    return next(
      new AppError("You are not logged in! Please log in to get access.", 401)
    );
  }
  // 2) Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        "The user belonging to this token does no longer exist.",
        401
      )
    );
  }

  // 4) Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError("User recently changed password! Please log in again.", 401)
    );
  }
  //5)check if user account isn't verfied
  if (!currentUser.verficationStatus) {
    return next(
      new AppError(
        "this account is not vefied ,please verify your account and come back",
        401
      )
    );
  }
  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  next();
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1) get user based on mail
  const user = await User.findOne({ email: req.body.email });
  if (!user) return next(new AppError("please provide your email", 404));

  //2)generate random token
  const resetToken = user.createVerficationOrResetToken(false);
  await user.save({ validateBeforeSave: false });
  //3)send email
  await sendEmail({
    email: user.email,
    subject: "confirmation code",
    message: `your reset code is:${resetToken} 
    This code is valid for 10 Minutes from the time you recive this mail`,
  });
  res.send({ user, resetToken });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //1)get user based on token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    PasswordResetExpires: { $gte: Date.now() },
  });
  //if no user is found
  if (!user) {
    return next(new AppError("token is invaild", 400));
  }
  //set the password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.PasswordResetExpires = undefined;
  await user.save();
  // create new token for the user
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //update password when user is logged in
  //get the user by user id
  const user = await User.findById(req.user.id).select("+password");
  if (!user) return next(new AppError("user not found", 404));
  //check if the old password is the same as the hashed
  if (!(await user.correctPassword(req.body.currentPassword, user.password)))
    return next(new AppError("Incorrect  password", 401));
  //if the password are the same set the new password
  user.password = req.body.newPassword;
  user.passwordConfirm = req.body.passwordConfirm;

  await user.save();
  // create new token for the user
  createSendToken(user, 200, res);
});

exports.logout = catchAsync(async (req, res, next) => {
  res.user = null;
  res.status(200).json({
    status: "success",
    message: "You're logged out",
  });
});
