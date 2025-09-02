// models/ComboType.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ComboType = sequelize.define('ComboType', {
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
      allowNull: false, // Every combo type must belong to a restaurant
      field: 'restaurant_id',
      references: {
        model: 'restaurants',
        key: 'id'
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    basePrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'base_price'
    },
    baseItems: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'base_items'
    },
    additionalItemPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: 'additional_item_price'
    },
    springRollsIncluded: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'spring_rolls_included'
    }
  }, {
    tableName: 'combo_types',
    underscored: true,
    timestamps: true
  });

  return ComboType;
};