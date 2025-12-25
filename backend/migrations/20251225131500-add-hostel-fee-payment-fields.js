"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Try to read table names from models to be robust
    let hostelTable = "hostels";
    let paymentTable = "Payments";
    try {
      // require models to get actual table names
      // eslint-disable-next-line global-require, import/no-dynamic-require
      const models = require("../models");
      if (models.Hostel && typeof models.Hostel.getTableName === "function") {
        hostelTable = models.Hostel.getTableName();
      }
      if (models.Payment && typeof models.Payment.getTableName === "function") {
        paymentTable = models.Payment.getTableName();
      }
    } catch (e) {
      // fallback to defaults
    }

    // Add feeAmount to hostels
    await queryInterface.addColumn(hostelTable, "feeAmount", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0,
    });

    // Add option enum to payments
    await queryInterface.addColumn(paymentTable, "option", {
      type: Sequelize.ENUM("SEMESTER", "FULL_YEAR"),
      allowNull: false,
      defaultValue: "SEMESTER",
    });

    // Add hostelId FK to payments
    await queryInterface.addColumn(paymentTable, "hostelId", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: hostelTable,
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });
  },

  async down(queryInterface, Sequelize) {
    let hostelTable = "hostels";
    let paymentTable = "Payments";
    try {
      const models = require("../models");
      if (models.Hostel && typeof models.Hostel.getTableName === "function") {
        hostelTable = models.Hostel.getTableName();
      }
      if (models.Payment && typeof models.Payment.getTableName === "function") {
        paymentTable = models.Payment.getTableName();
      }
    } catch (e) {
      // fallback
    }

    // Remove hostelId
    await queryInterface.removeColumn(paymentTable, "hostelId");

    // Remove option enum
    await queryInterface.removeColumn(paymentTable, "option");

    // If using Postgres, drop enum type if it exists
    try {
      const dialect = queryInterface.sequelize.getDialect();
      if (dialect === "postgres") {
        // common enum type name in postgres created by Sequelize
        const enumName = `enum_${paymentTable}_option`;
        await queryInterface.sequelize.query(
          `DROP TYPE IF EXISTS "${enumName}";`
        );
        // also try lowercase
        const enumName2 = `enum_${paymentTable.toLowerCase()}_option`;
        if (enumName2 !== enumName) {
          await queryInterface.sequelize.query(
            `DROP TYPE IF EXISTS "${enumName2}";`
          );
        }
      }
    } catch (e) {
      // ignore
    }

    // Remove feeAmount
    await queryInterface.removeColumn(hostelTable, "feeAmount");
  },
};
