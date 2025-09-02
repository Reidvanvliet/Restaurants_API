// models/MenuCategory.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const MenuCategory = sequelize.define('MenuCategory', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    displayOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'display_order'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    }
  }, {
    tableName: 'menu_categories',
    underscored: true,
    timestamps: true
  });

  return MenuCategory;
};