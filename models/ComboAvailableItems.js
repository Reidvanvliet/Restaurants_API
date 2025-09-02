// models/ComboAvailableItems.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ComboAvailableItems = sequelize.define('ComboAvailableItems', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    comboTypeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'combo_type_id',
      references: {
        model: 'combo_types',
        key: 'id'
      }
    },
    menuItemId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'menu_item_id',
      references: {
        model: 'menu_items',
        key: 'id'
      }
    },
    isEntree: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_entree'
    },
    displayOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'display_order'
    }
  }, {
    tableName: 'combo_available_items',
    underscored: true,
    timestamps: false
  });

  return ComboAvailableItems;
};