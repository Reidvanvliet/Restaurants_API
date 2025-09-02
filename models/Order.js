const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Order = sequelize.define('Order', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    restaurantId: {
      type: DataTypes.INTEGER,
      allowNull: false, // Every order must belong to a restaurant
      field: 'restaurant_id',
      references: {
        model: 'restaurants',
        key: 'id'
      }
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    orderNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: 'order_number'
    },
    customerEmail: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'customer_email'
    },
    customerFirstName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'customer_first_name'
    },
    customerLastName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'customer_last_name'
    },
    customerPhone: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'customer_phone'
    },
    customerAddress: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'customer_address'
    },
    orderType: {
      type: DataTypes.ENUM('pickup', 'delivery'),
      allowNull: false,
      field: 'order_type'
    },
    paymentMethod: {
      type: DataTypes.ENUM('card', 'card_on_arrival', 'cash_on_arrival'),
      allowNull: false,
      field: 'payment_method'
    },
    paymentStatus: {
      type: DataTypes.ENUM('pending', 'paid', 'failed'),
      defaultValue: 'pending',
      field: 'payment_status'
    },
    stripePaymentIntentId: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'stripe_payment_intent_id'
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    tax: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    deliveryFee: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00,
      field: 'delivery_fee'
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'),
      defaultValue: 'pending'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'orders',
    underscored: true,
    timestamps: true,
    hooks: {
      beforeValidate: async (order) => {
        // Generate unique order number
        const timestamp = Date.now().toString();
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        order.orderNumber = `GC${timestamp.slice(-6)}${random}`;
      }
    }
  });

  return Order;
};
