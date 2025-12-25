const { Hostel, Room, Allocation, Student } = require("../models");
const { Payment } = require("../models");
const logAction = require("../utils/auditLogger");
const { sequelize } = require("../config/database");

/**
 * Admin dashboard summary
 */
exports.getAdminDashboard = async (req, res) => {
  try {
    const totalHostels = await Hostel.count();
    const totalRooms = await Room.count();
    // Allocation model uses status values: 'ACTIVE' | 'VACATED'
    const totalAllocations = await Allocation.count({
      where: { status: "ACTIVE" },
    });

    // Room model uses status enum 'AVAILABLE' | 'FULL' and an 'occupied' count.
    // Count rooms marked AVAILABLE to represent available rooms.
    const availableRooms = await Room.count({ where: { status: "AVAILABLE" } });

    res.status(200).json({
      totalHostels,
      totalRooms,
      totalAllocations,
      availableRooms,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to load admin dashboard" });
  }
};

/**
 * All hostels
 */
exports.getAllHostels = async (req, res) => {
  const hostels = await Hostel.findAll();
  res.json(hostels);
};

/**
 * All rooms
 */
exports.getAllRooms = async (req, res) => {
  const rooms = await Room.findAll({
    include: [Hostel],
  });
  res.json(rooms);
};

/**
 * All allocations
 */
exports.getAllAllocations = async (req, res) => {
  const allocations = await Allocation.findAll({
    include: [{ model: Student }, { model: Room, include: [Hostel] }],
  });
  res.json(allocations);
};

/**
 * Create hostel
 */
exports.createHostel = async (req, res) => {
  try {
    const { name, gender, totalRooms, feeAmount } = req.body;

    const hostel = await Hostel.create({
      name,
      gender,
      totalRooms: totalRooms || 0,
      feeAmount: feeAmount || 0.0,
    });
    res.status(201).json(hostel);
  } catch (error) {
    console.error("createHostel error:", error);
    res.status(500).json({ message: "Failed to create hostel" });
  }
};

/**
 * Update hostel
 */
exports.updateHostel = async (req, res) => {
  try {
    const hostel = await Hostel.findByPk(req.params.id);
    if (!hostel) return res.status(404).json({ message: "Hostel not found" });

    await hostel.update(req.body);
    res.json(hostel);
  } catch (error) {
    res.status(500).json({ message: "Failed to update hostel" });
  }
};

/**
 * Delete hostel
 */
exports.deleteHostel = async (req, res) => {
  try {
    await Hostel.destroy({ where: { id: req.params.id } });
    res.json({ message: "Hostel deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete hostel" });
  }
};

/**
 * Create room
 */
exports.createRoom = async (req, res) => {
  try {
    const { roomNumber, capacity, hostelId } = req.body;

    const room = await Room.create({
      roomNumber,
      capacity,
      hostelId,
      occupied: 0,
      status: "AVAILABLE",
    });

    res.status(201).json(room);
  } catch (error) {
    res.status(500).json({ message: "Failed to create room" });
  }
};

/**
 * Update room
 */
exports.updateRoom = async (req, res) => {
  try {
    const room = await Room.findByPk(req.params.id);
    if (!room) return res.status(404).json({ message: "Room not found" });

    await room.update(req.body);
    res.json(room);
  } catch (error) {
    res.status(500).json({ message: "Failed to update room" });
  }
};

/**
 * Delete room
 */
exports.deleteRoom = async (req, res) => {
  try {
    await Room.destroy({ where: { id: req.params.id } });
    res.json({ message: "Room deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete room" });
  }
};

/**
 * ADMIN: Allocate room to a student (admin-driven)
 * Body: { studentId, roomId }
 * Only students with PAID payment can be allocated (per request)
 */
exports.allocateRoomAdmin = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { studentId, roomId } = req.body;
    if (!studentId || !roomId) {
      await t.rollback();
      return res
        .status(400)
        .json({ message: "studentId and roomId are required" });
    }

    const student = await Student.findByPk(studentId, { transaction: t });
    if (!student) {
      await t.rollback();
      return res.status(404).json({ message: "Student not found" });
    }

    const existingAllocation = await Allocation.findOne({
      where: { studentId, status: "ACTIVE" },
      transaction: t,
    });
    if (existingAllocation) {
      await t.rollback();
      return res
        .status(400)
        .json({ message: "Student already has an active allocation" });
    }

    // Lock room and check capacity
    const room = await Room.findByPk(roomId, {
      include: [{ model: Hostel }],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!room) {
      await t.rollback();
      return res.status(404).json({ message: "Room not found" });
    }

    // Ensure student has a PAID payment for this hostel
    const hostelId = room.hostelId || (room.Hostel && room.Hostel.id);
    const paid = await Payment.findOne({
      where: { studentId, status: "PAID", hostelId },
      transaction: t,
    });
    if (!paid) {
      await t.rollback();
      return res.status(403).json({
        message: "Student has not paid for this hostel. Allocation denied.",
      });
    }

    if ((room.occupied || 0) >= (room.capacity || 0)) {
      await t.rollback();
      return res.status(400).json({ message: "Room is full" });
    }

    // Enforce hostel gender
    if (
      room.Hostel &&
      student.gender !== room.Hostel.gender &&
      student.gender !== "Other"
    ) {
      await t.rollback();
      return res
        .status(400)
        .json({ message: `Hostel is for ${room.Hostel.gender} students only` });
    }

    const allocation = await Allocation.create(
      { studentId, roomId, status: "ACTIVE", allocatedAt: new Date() },
      { transaction: t }
    );
    await room.increment("occupied", { by: 1, transaction: t });

    await t.commit();

    await logAction({
      userId: req.user.id,
      action: "ADMIN_ALLOCATE",
      entity: "Allocation",
      entityId: allocation.id,
      description: `Admin allocated room ${room.id} to student ${student.id}`,
    });

    return res.status(201).json({ message: "Allocation created", allocation });
  } catch (error) {
    try {
      await t.rollback();
    } catch (e) {}
    console.error("Admin allocate error:", error);
    return res.status(500).json({ message: "Failed to allocate room" });
  }
};

/**
 * ADMIN: Vacate allocation (by allocationId or studentId)
 */
exports.vacateRoomAdmin = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { allocationId, studentId } = req.body;
    if (!allocationId && !studentId) {
      await t.rollback();
      return res
        .status(400)
        .json({ message: "allocationId or studentId is required" });
    }

    const allocation = allocationId
      ? await Allocation.findOne({
          where: { id: allocationId, status: "ACTIVE" },
          transaction: t,
          lock: t.LOCK.UPDATE,
        })
      : await Allocation.findOne({
          where: { studentId, status: "ACTIVE" },
          transaction: t,
          lock: t.LOCK.UPDATE,
        });

    if (!allocation) {
      await t.rollback();
      return res.status(404).json({ message: "Active allocation not found" });
    }

    const room = await Room.findByPk(allocation.roomId, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!room) {
      await t.rollback();
      return res.status(404).json({ message: "Associated room not found" });
    }

    allocation.status = "VACATED";
    allocation.vacatedAt = new Date();
    await allocation.save({ transaction: t });

    room.occupied = Math.max(0, (room.occupied || 0) - 1);
    room.status = room.occupied >= room.capacity ? "FULL" : "AVAILABLE";
    await room.save({ transaction: t });

    await t.commit();

    await logAction({
      userId: req.user.id,
      action: "ADMIN_VACATE",
      entity: "Allocation",
      entityId: allocation.id,
      description: `Admin vacated allocation ${allocation.id}`,
    });

    return res.status(200).json({ message: "Allocation vacated", allocation });
  } catch (error) {
    try {
      await t.rollback();
    } catch (e) {}
    console.error("Admin vacate error:", error);
    return res.status(500).json({ message: "Failed to vacate allocation" });
  }
};

/**
 * ADMIN: Get students with payment summary and allocation status
 */
exports.getAllStudentsSummary = async (req, res) => {
  try {
    const students = await Student.findAll();

    const data = await Promise.all(
      students.map(async (s) => {
        const payments = await Payment.findAll({
          where: { studentId: s.id },
          order: [["createdAt", "DESC"]],
        });
        const totalPaid = payments
          .filter((p) => p.status === "PAID")
          .reduce((sum, p) => sum + (p.amount || 0), 0);
        const totalPending = payments
          .filter((p) => p.status !== "PAID")
          .reduce((sum, p) => sum + (p.amount || 0), 0);
        const latestPayment = payments[0] || null;
        const allocation = await Allocation.findOne({
          where: { studentId: s.id, status: "ACTIVE" },
          include: [{ model: Room, include: [Hostel] }],
        });

        return {
          student: s,
          totalPaid,
          totalPending,
          latestPayment,
          allocation,
        };
      })
    );

    return res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching students summary:", error);
    return res
      .status(500)
      .json({ message: "Failed to fetch students summary" });
  }
};
