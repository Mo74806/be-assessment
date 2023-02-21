const UserModel = require("./../models/user");
const factory = require("./handlerFactory");

exports.getAllUsers = factory.getAll(UserModel);
exports.getUser = factory.getOne(UserModel);
exports.createUser = factory.createOne(UserModel);
exports.updateUser = factory.updateOne(UserModel);
exports.deleteUser = factory.deleteOne(UserModel);
