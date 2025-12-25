const { Payment, Student } = require("../models");
const logAction = require("../utils/auditLogger");

/* STUDENT: INITIATE PAYMENT */
exports.initiatePayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount: providedAmount, reference, option, hostelId } = req.body;

    const student = await Student.findOne({ where: { userId } });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // determine hostel fee
    let fee = null;
    if (hostelId) {
      const { Hostel } = require("../models");
      const hostel = await Hostel.findByPk(hostelId);
      if (!hostel) return res.status(404).json({ message: "Hostel not found" });
      fee = Number(hostel.feeAmount || 0);
    } else {
      // try to use student's allocation hostel if available
      const { Allocation, Room, Hostel } = require("../models");
      const allocation = await Allocation.findOne({
        where: { studentId: student.id, status: "ACTIVE" },
        include: [{ model: Room, include: [Hostel] }],
      });
      if (allocation && allocation.Room && allocation.Room.Hostel) {
        fee = Number(allocation.Room.Hostel.feeAmount || 0);
      }
    }

    if (!fee) {
      return res
        .status(400)
        .json({ message: "Hostel fee not found. Choose a hostel to pay for." });
    }

    // validate option and compute expected amount
    const payOption = option === "FULL_YEAR" ? "FULL_YEAR" : "SEMESTER";
    const expectedAmount =
      payOption === "FULL_YEAR"
        ? Number((fee * 2).toFixed(2))
        : Number(fee.toFixed(2));

    // ignore providedAmount and set to expectedAmount for integrity
    const amount = expectedAmount;

    const payment = await Payment.create({
      studentId: student.id,
      amount,
      option: payOption,
      hostelId: hostelId || null,
      reference,
      status: "PENDING",
    });

    return res.status(201).json({
      message: "Payment initiated, awaiting confirmation",
      payment,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to initiate payment",
      error: error.message,
    });
  }
};

/* ADMIN: CONFIRM PAYMENT */
exports.confirmPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findByPk(paymentId);
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    payment.status = "PAID";
    await payment.save();
    await logAction({
      userId: req.user.id,
      action: "PAYMENT_CONFIRMED",
      entity: "Payment",
      entityId: payment.id,
      description: "Admin confirmed student payment",
    });

    return res.status(200).json({
      message: "Payment confirmed successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to confirm payment",
      error: error.message,
    });
  }
};

// Admin get all payments/statement
exports.getAllAllPayments = async (req, res) => {
  try {
    const payments = await Payment.findAll({
      include: [
        {
          model: Student,
          attributes: ["id", "regNumber"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json(payments);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch payments",
      error: error.message,
    });
  }
};

/* ADMIN: DELETE PAYMENT */
exports.deletePayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const payment = await Payment.findByPk(paymentId);
    if (!payment) return res.status(404).json({ message: "Payment not found" });

    await payment.destroy();

    // Audit log
    await logAction({
      userId: req.user.id,
      action: "PAYMENT_DELETED",
      entity: "Payment",
      entityId: paymentId,
      description: "Admin deleted a payment record",
    });

    return res.status(200).json({ message: "Payment deleted" });
  } catch (error) {
    console.error("Failed to delete payment:", error);
    return res.status(500).json({ message: "Failed to delete payment" });
  }
};
