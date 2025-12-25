const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Payment = sequelize.define("Payment", {
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  option: {
    type: DataTypes.ENUM("SEMESTER", "FULL_YEAR"),
    allowNull: false,
    defaultValue: "SEMESTER",
  },
  hostelId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM("PENDING", "PAID"),
    defaultValue: "PENDING",
  },
  reference: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

module.exports = Payment;
