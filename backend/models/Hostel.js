const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Hostel = sequelize.define(
  "Hostel",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },

    gender: {
      type: DataTypes.ENUM("Male", "Female"),
      allowNull: false,
    },

    totalRooms: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    feeAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
  },
  {
    tableName: "hostels",
    timestamps: true,
  }
);

module.exports = Hostel;
