const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const OrderItem = sequelize.define('OrderItem', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'order_id',
      references: {
        model: 'orders',
        key: 'id'
      }
    },
    menuItemId: {
      type: DataTypes.INTEGER,
      allowNull: true, // Can be null if menu item is deleted
      field: 'menu_item_id',
      references: {
        model: 'menu_items',
        key: 'id'
      }
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false // Price at time of order
    },
    itemName: {
      type: DataTypes.TEXT, // Changed to TEXT to support JSON combo data
      allowNull: false,
      field: 'item_name' // Store name in case menu item is deleted, or JSON for combos
    }
  }, {
    tableName: 'order_items',
    underscored: true,
    timestamps: true
  });

  return OrderItem;
};