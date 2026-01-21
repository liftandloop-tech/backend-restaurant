const express = require("express");
const reservationController = require("../controllers/reservationController.js");
const { authMiddleware } = require("../middlewares/auth.js");
const { requireRoles } = require("../middlewares/roles.js");
const { validate, schemas } = require("../middlewares/validation.js");

const router = express.Router();

router.use(authMiddleware);

router.get("/get/reservation", reservationController.getReservations);
router.get("/get/reservation/by/:id", reservationController.getReservationById);
router.post("/create/reservation", requireRoles('Owner', 'Admin', 'Manager', 'Waiter', 'Cashier'), validate(schemas.reservation), reservationController.createReservation);
router.put("/update/reservation/by/:id", requireRoles('Owner', 'Admin', 'Manager', 'Waiter', 'Cashier'), reservationController.updateReservation);
router.patch("/update/reservation/by/:id/status", requireRoles('Owner', 'Admin', 'Manager', 'Waiter', 'Cashier'), reservationController.updateReservationStatus);
router.delete("/delete/reservation/by/:id", requireRoles('Owner', 'Admin', 'Manager', 'Cashier'), reservationController.deleteReservation);
module.exports = router;

