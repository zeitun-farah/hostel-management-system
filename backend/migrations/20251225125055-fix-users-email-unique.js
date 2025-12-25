"use strict";

/** @type {import('sequelize-cli').Migration} */
"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addConstraint("users", {
      fields: ["email"],
      type: "unique",
      name: "unique_users_email",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeConstraint("users", "unique_users_email");
  },
};
