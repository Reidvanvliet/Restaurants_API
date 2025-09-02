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
    restaurantId: {
      type: DataTypes.INTEGER,
      allowNull: false, // Every menu category must belong to a restaurant
      field: 'restaurant_id',
      references: {
        model: 'restaurants',
        key: 'id'
      }
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