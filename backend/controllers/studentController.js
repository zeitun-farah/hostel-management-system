const { Student, Allocation, Room, Hostel } = require("../models");

/**
 * GET /api/student/dashboard
 */
exports.getStudentDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find student profile
    const student = await Student.findOne({
      where: { userId },
    });

    if (!student) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    // Find active allocation (status uses 'ACTIVE' in Allocation model)
    const allocation = await Allocation.findOne({
      where: {
        studentId: student.id,
        status: "ACTIVE",
      },
      include: [
        {
          model: Room,
          include: [Hostel],
        },
      ],
    });

    // If no allocation yet
    if (!allocation) {
      return res.status(200).json({
        allocationStatus: "NOT_ALLOCATED",
        room: null,
        payment: {
          status: "UNPAID",
        },
      });
    }

    return res.status(200).json({
      allocationStatus: "ALLOCATED",
      room: {
        roomNumber: allocation.Room.roomNumber,
        bedSpace: allocation.bedSpace || "N/A",
        hostel: allocation.Room.Hostel.name,
        gender: allocation.Room.Hostel.gender,
      },
      payment: {
        status: "PAID", // placeholder (real payment integration later on production)
      },
    });
  } catch (error) {
    console.error("Student dashboard error:", error);
    return res.status(500).json({ message: "Failed to load dashboard" });
  }
};

/**
 * GET /api/student/bookings
 */
exports.getStudentBookings = async (req, res) => {
  try {
    const userId = req.user.id;

    const student = await Student.findOne({
      where: { userId },
    });

    if (!student) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    const bookings = await Allocation.findAll({
      where: { studentId: student.id },
      include: [
        {
          model: Room,
          include: [Hostel],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const formatted = bookings.map((b) => ({
      id: b.id,
      hostel: b.Room.Hostel.name,
      room: b.Room.roomNumber,
      status: b.status,
      createdAt: b.createdAt,
    }));

    return res.status(200).json(formatted);
  } catch (error) {
    console.error("Booking history error:", error);
    return res.status(500).json({ message: "Failed to load bookings" });
  }
};
