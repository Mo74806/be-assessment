const express = require("express");
const checkController = require("./../controllers/checkController");
const authController = require("../controllers/authController");
const router = express.Router();

router
  .route("/")
  .get(authController.protect, checkController.getAllChecks)
  .post(
    authController.protect,
    checkController.assignCheckData,
    checkController.createCheck
  );
/***************************************************
/*   admin account can access those routes         * 
/* its handled in the 'handlerController.js' logic *
/* logged in users only can retrive and manipulate * 
/*               their data only                   *
/***************************************************/
router
  .route("/:id")
  .get(authController.protect, checkController.getCheck)
  .patch(authController.protect, checkController.updateCheck)
  .delete(authController.protect, checkController.deleteCheck);

module.exports = router;
