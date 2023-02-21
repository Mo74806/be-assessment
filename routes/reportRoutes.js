const express = require("express");
const reportController = require("./../controllers/reportController");
const authController = require("./../controllers/authController");
// TODO:
//restric the update,delete,getAll,getone  Report to the admin(done)
const router = express.Router();
router.route("/tags").get(authController.protect, reportController.sendReport);
router
  .route("/check/:checkId")
  .get(authController.protect, reportController.sendReport);

/*****************************************************/
/* this routes are restricated to the admin only      *
/* the use only can get his report by :               *
/*                                     (1)check id    *
/*                                     (2)tags name   *
/******************************************************/
router
  .route("/")
  .get(
    authController.protect,
    authController.restrictTo("admin"),
    reportController.getAllReports
  )
  .post(
    authController.protect,
    authController.restrictTo("admin"),
    reportController.createReport
  );

router
  .route("/:id")
  .get(
    authController.protect,
    authController.restrictTo("admin"),
    reportController.getReport
  )
  .patch(
    authController.protect,
    authController.restrictTo("admin"),
    reportController.updateReport
  )
  .delete(
    authController.protect,
    authController.restrictTo("admin"),
    reportController.deleteReport
  );

module.exports = router;
