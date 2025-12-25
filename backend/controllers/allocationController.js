const { Allocation, Room, Hostel, Student, Payment } = require("../models");
const logAction = require("../utils/auditLogger");
const { sequelize } = require("../config/database");

/* BOOK ROOM (STUDENT) */
exports.bookRoom = async (req, res) => {
  try {
    const userId = req.user.id;
    const { roomId } = req.body;

    const student = await Student.findOne({ where: { userId } });
    if (!student) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    const existingAllocation = await Allocation.findOne({
      where: { studentId: student.id, status: "ACTIVE" },
    });

    if (existingAllocation) {
      return res.status(400).json({
        message: "Student already has an active room allocation",
      });
    }

    const room = await Room.findByPk(roomId, {
      include: [{ model: Hostel }],
    });

    /* GENDER ENFORCEMENT */
    if (room.Hostel.gender !== student.gender) {
      return res.status(400).json({
        message: "Student gender does not match hostel gender",
      });
    }

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (room.occupied >= room.capacity) {
      return res.status(400).json({ message: "Room is full" });
    }

    // Ensure student has a PAID payment for this hostel
    const hostelId = room.hostelId || (room.Hostel && room.Hostel.id);
    const paidPayment = await Payment.findOne({
      where: {
        studentId: student.id,
        status: "PAID",
        hostelId: hostelId,
      },
    });

    if (!paidPayment) {
      return res.status(403).json({
        message: "Room booking blocked: payment for this hostel not confirmed",
      });
    }

    // Use a transaction to make allocation + occupancy update atomic
    const transaction = await sequelize.transaction();
    try {
      const allocation = await Allocation.create(
        {
          studentId: student.id,
          roomId: room.id,
          status: "ACTIVE",
        },
        { transaction }
      );

      // increment occupancy atomically within the transaction
      await room.increment("occupied", { by: 1, transaction });

      await transaction.commit();

      // log after successful commit
      await logAction({
        userId,
        action: "ROOM_BOOKED",
        entity: "Allocation",
        entityId: allocation.id,
        description: `Student booked room ${room.id}`,
      });

      return res.status(201).json({
        message: "Room booked successfully",
        allocation,
      });
    } catch (err) {
      try {
        await transaction.rollback();
      } catch (rollbackErr) {
        console.error("Transaction rollback failed:", rollbackErr);
      }
      throw err;
    }
  } catch (error) {
    return res.status(500).json({
      message: "Room booking failed",
      error: error.message,
    });
  }
};

/* VACATE ROOM (STUDENT) */
exports.vacateRoom = async (req, res) => {
  try {
    const userId = req.user.id;

    const student = await Student.findOne({ where: { userId } });
    if (!student) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    const allocation = await Allocation.findOne({
      where: { studentId: student.id, status: "ACTIVE" },
    });

    if (!allocation) {
      return res.status(400).json({
        message: "No active room allocation found",
      });
    }

    allocation.status = "VACATED";
    allocation.vacatedAt = new Date();
    await allocation.save();

    const room = await Room.findByPk(allocation.roomId);
    await room.decrement("occupied", { by: 1 });

    await logAction({
      userId,
      action: "ROOM_VACATED",
      entity: "Allocation",
      entityId: allocation.id,
      description: "Student vacated room",
    });

    return res.status(200).json({
      message: "Room vacated successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to vacate room",
      error: error.message,
    });
  }
};

/* ADMIN: VIEW ALL ALLOCATIONS */
exports.getAllAllocations = async (req, res) => {
  try {
    const allocations = await Allocation.findAll({
      include: [
        {
          model: Student,
          attributes: ["id", "regNumber"],
        },
        {
          model: Room,
          include: [{ model: Hostel }],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json(allocations);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch allocations",
      error: error.message,
    });
  }
};

/* ADMIN: FILTER ALLOCATIONS */
exports.filterAllocations = async (req, res) => {
  try {
    const { hostelId, roomId, status } = req.query;

    const where = {};
    if (status) where.status = status;
    if (roomId) where.roomId = roomId;

    const allocations = await Allocation.findAll({
      where,
      include: [
        {
          model: Room,
          where: hostelId ? { hostelId } : undefined,
          include: [{ model: Hostel }],
        },
        {
          model: Student,
          attributes: ["id", "regNumber"],
        },
      ],
    });

    return res.status(200).json(allocations);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to filter allocations",
      error: error.message,
    });
  }
};

/* STUDENT: Get allocation status and latest payment for authenticated student */
exports.getStudentAllocationStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const student = await Student.findOne({ where: { userId } });
    if (!student)
      return res.status(404).json({ message: "Student profile not found" });

    const allocation = await Allocation.findOne({
      where: { studentId: student.id, status: "ACTIVE" },
      include: [{ model: Room, include: [{ model: Hostel }] }],
    });

    const payment = await Payment.findOne({
      where: { studentId: student.id },
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({ allocation, payment });
  } catch (error) {
    console.error("Error fetching student allocation status:", error.message);
    return res
      .status(500)
      .json({ message: "Failed to fetch allocation status" });
  }
};

/* ADMIN: Get allocation + payment for a given studentId */
exports.getAllocationStatusByPayment = async (req, res) => {
  try {
    const { studentId } = req.query;
    if (!studentId)
      return res.status(400).json({ message: "studentId is required" });

    const allocation = await Allocation.findOne({
      where: { studentId, status: "ACTIVE" },
      include: [
        { model: Room, include: [{ model: Hostel }] },
        { model: Student },
      ],
    });

    const payment = await Payment.findOne({
      where: { studentId },
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({ allocation, payment });
  } catch (error) {
    console.error("Error fetching allocation by payment:", error.message);
    return res
      .status(500)
      .json({ message: "Failed to fetch allocation by payment" });
  }
};

/* ADMIN: Get all allocations with latest payment attached */
exports.getAllAllocationStatuses = async (req, res) => {
  try {
    const allocations = await Allocation.findAll({
      include: [
        {
          model: Student,
          attributes: ["id", "regNumber", "firstName", "lastName"],
        },
        { model: Room, include: [{ model: Hostel }] },
      ],
      order: [["createdAt", "DESC"]],
    });

    // Attach latest payment for each allocation's student
    const enriched = await Promise.all(
      allocations.map(async (alloc) => {
        const latestPayment = await Payment.findOne({
          where: { studentId: alloc.studentId },
          order: [["createdAt", "DESC"]],
        });
        return { allocation: alloc, latestPayment };
      })
    );

    return res.status(200).json(enriched);
  } catch (error) {
    console.error("Error fetching all allocation statuses:", error.message);
    return res
      .status(500)
      .json({ message: "Failed to fetch allocation statuses" });
  }
};
