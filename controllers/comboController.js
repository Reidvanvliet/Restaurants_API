const { sequelize, ComboType, ComboAvailableItems, MenuItem } = require('../config/database');

const getComboWithItems = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Getting combo with items for ID: ${id}`);
    
    // Get the combo type
    const combo = await ComboType.findByPk(id);
    if (!combo) {
      return res.status(404).json({ error: 'Combo not found' });
    }
    
    console.log('Found combo:', combo.toJSON());
    
    // Determine which combo_available_items to use based on your rules
    let availableItemsComboId = id;
    
    if ([3, 4, 5, 6, 7].includes(parseInt(id))) {
      // combo_types 3, 4, 5, 6, 7 use combo_available_items from combo_type_id 3
      availableItemsComboId = 3;
    }
    // combo_type 1 uses its own combo_available_items (combo_type_id 1)
    // combo_type 2 uses its own combo_available_items (combo_type_id 2)
    
    console.log(`Using combo_available_items for combo_type_id: ${availableItemsComboId}`);
    
    // First check if we have any combo available items at all
    const totalComboItems = await ComboAvailableItems.count();
    console.log(`Total combo available items in database: ${totalComboItems}`);
    
    if (totalComboItems === 0) {
      console.log('No combo available items found, creating sample data first...');
      await createSampleComboAvailableItems();
    }
    
    // Get available items through the relationship
    let comboAvailableItems = [];
    
    try {
      comboAvailableItems = await ComboAvailableItems.findAll({
        where: {
          comboTypeId: availableItemsComboId
        },
        include: [{
          model: MenuItem,
          as: 'menuItem',
          where: { isAvailable: true },
          required: true
        }],
        order: [['displayOrder', 'ASC'], [{ model: MenuItem, as: 'menuItem' }, 'name', 'ASC']]
      });
      
      console.log(`Found ${comboAvailableItems.length} combo available items for combo_type_id ${availableItemsComboId}`);
      
    } catch (associationError) {
      console.error('Association query failed, trying manual approach:', associationError);
      
      // Manual approach: get combo items and menu items separately
      const comboItems = await ComboAvailableItems.findAll({
        where: { comboTypeId: availableItemsComboId },
        order: [['displayOrder', 'ASC']]
      });
      
      console.log(`Found ${comboItems.length} combo items for manual join`);
      
      if (comboItems.length > 0) {
        const menuItemIds = comboItems.map(item => item.menuItemId);
        const menuItems = await MenuItem.findAll({
          where: {
            id: menuItemIds,
            isAvailable: true
          }
        });
        
        console.log(`Found ${menuItems.length} corresponding menu items`);
        
        // Manually combine the data
        comboAvailableItems = comboItems.map(comboItem => {
          const menuItem = menuItems.find(mi => mi.id === comboItem.menuItemId);
          if (menuItem) {
            return {
              ...comboItem.toJSON(),
              menuItem: menuItem.toJSON()
            };
          }
          return null;
        }).filter(Boolean);
        
        console.log(`Successfully combined ${comboAvailableItems.length} items`);
      }
    }
    
    // If no specific combo items found, create sample data or use fallback
    if (comboAvailableItems.length === 0) {
      console.log(`No combo available items found for combo_type_id ${availableItemsComboId}, trying fallback approach...`);
      
      // Try creating sample data
      await createSampleComboAvailableItems();
      
      // Try again with associations
      let newComboAvailableItems = [];
      try {
        newComboAvailableItems = await ComboAvailableItems.findAll({
          where: {
            comboTypeId: availableItemsComboId
          },
          include: [{
            model: MenuItem,
            as: 'menuItem',
            where: { isAvailable: true },
            required: true
          }],
          order: [['displayOrder', 'ASC'], [{ model: MenuItem, as: 'menuItem' }, 'name', 'ASC']]
        });
      } catch (associationError) {
        console.error('Associations still failing, using manual join approach:', associationError);
        
        // Fallback: Manual join approach
        const comboItems = await ComboAvailableItems.findAll({
          where: { comboTypeId: availableItemsComboId }
        });
        
        const menuItemIds = comboItems.map(item => item.menuItemId);
        const menuItems = await MenuItem.findAll({
          where: {
            id: menuItemIds,
            isAvailable: true
          }
        });
        
        // Transform to expected format manually
        const fallbackItems = comboItems.map(comboItem => {
          const menuItem = menuItems.find(mi => mi.id === comboItem.menuItemId);
          if (!menuItem) return null;
          
          return {
            menu_item_id: menuItem.id,
            item_name: menuItem.name,
            description: menuItem.description,
            price: menuItem.price,
            is_entree: comboItem.isEntree,
            display_order: comboItem.displayOrder,
            combo_type_id: id
          };
        }).filter(Boolean);
        
        return res.json({
          combo: {
            id: combo.id,
            name: combo.name,
            description: combo.description,
            base_price: combo.basePrice,
            base_items: combo.baseItems,
            additional_item_price: combo.additionalItemPrice,
            spring_rolls_included: combo.springRollsIncluded
          },
          availableItems: fallbackItems
        });
      }
      
      // Transform to match the expected format
      const formattedItems = newComboAvailableItems.map(item => ({
        menu_item_id: item.menuItem.id,
        item_name: item.menuItem.name,
        description: item.menuItem.description,
        price: item.menuItem.price,
        is_entree: item.isEntree,
        display_order: item.displayOrder,
        combo_type_id: id
      }));

      return res.json({
        combo: {
          id: combo.id,
          name: combo.name,
          description: combo.description,
          base_price: combo.basePrice,
          base_items: combo.baseItems,
          additional_item_price: combo.additionalItemPrice,
          spring_rolls_included: combo.springRollsIncluded
        },
        availableItems: formattedItems
      });
    }
    
    // Transform to match the expected format
    const formattedItems = comboAvailableItems.map(item => ({
      menu_item_id: item.menuItem.id,
      item_name: item.menuItem.name,
      description: item.menuItem.description,
      price: item.menuItem.price,
      is_entree: item.isEntree,
      display_order: item.displayOrder,
      combo_type_id: id
    }));

    res.json({
      combo: {
        id: combo.id,
        name: combo.name,
        description: combo.description,
        base_price: combo.basePrice,
        base_items: combo.baseItems,
        additional_item_price: combo.additionalItemPrice,
        spring_rolls_included: combo.springRollsIncluded
      },
      availableItems: formattedItems
    });
  } catch (error) {
    console.error('Error getting combo with items:', error);
    
    // Try to provide a basic response with fallback items
    try {
      const combo = await ComboType.findByPk(req.params.id);
      if (combo) {
        // Get some basic menu items as fallback
        const fallbackItems = await MenuItem.findAll({
          where: {
            categoryId: [7, 8, 9], // chicken, beef, pork
            isAvailable: true
          },
          limit: 5,
          order: [['name', 'ASC']]
        });
        
        const formattedFallbackItems = fallbackItems.map((item, index) => ({
          menu_item_id: item.id,
          item_name: item.name,
          description: item.description,
          price: item.price,
          is_entree: true,
          display_order: index + 1,
          combo_type_id: req.params.id
        }));
        
        console.log('Using fallback items:', formattedFallbackItems.length);
        
        return res.json({
          combo: {
            id: combo.id,
            name: combo.name,
            description: combo.description,
            base_price: combo.basePrice,
            base_items: combo.baseItems,
            additional_item_price: combo.additionalItemPrice,
            spring_rolls_included: combo.springRollsIncluded
          },
          availableItems: formattedFallbackItems
        });
      }
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
    }
    
    res.status(500).json({ error: error.message });
  }
};

const createComboOrder = async (req, res) => {
  const { combo_type_id, selected_items, additional_items, base_choice, order_id } = req.body;

  try {
    // Start transaction
    await sequelize.query('BEGIN');

    // Calculate pricing
    const combo = await sequelize.query('SELECT * FROM combo_types WHERE id = $1', [combo_type_id]);
    const basePrice = parseFloat(combo.rows[0].base_price);
    const additionalPrice = additional_items.length * parseFloat(combo.rows[0].additional_item_price || 0);
    const totalPrice = basePrice + additionalPrice;

    // Insert order item
    const orderItem = await sequelize.query(`
      INSERT INTO order_items (order_id, combo_type_id, quantity, unit_price, total_price)
      VALUES ($1, $2, 1, $3, $4) RETURNING id
    `, [order_id, combo_type_id, totalPrice, totalPrice]);

    // Insert base choice if applicable (for combo 2)
    if (base_choice) {
      await sequelize.query(`
        INSERT INTO combo_order_selections (order_item_id, menu_item_id, is_additional, is_base_choice)
        VALUES ($1, $2, false, true)
      `, [orderItem.rows[0].id, base_choice]);
    }

    // Insert combo selections
    for (const itemId of selected_items) {
      await sequelize.query(`
        INSERT INTO combo_order_selections (order_item_id, menu_item_id, is_additional, is_base_choice)
        VALUES ($1, $2, false, false)
      `, [orderItem.rows[0].id, itemId]);
    }

    for (const itemId of additional_items) {
      await sequelize.query(`
        INSERT INTO combo_order_selections (order_item_id, menu_item_id, is_additional, is_base_choice)
        VALUES ($1, $2, true, false)
      `, [orderItem.rows[0].id, itemId]);
    }

    await sequelize.query('COMMIT');
    res.json({ success: true, orderItemId: orderItem.rows[0].id });
  } catch (error) {
    await sequelize.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  }
};

const getAllCombos = async (req, res) => {
  try {
    console.log('Getting all combos...');
    
    // Check if combo table exists and has data
    const combos = await ComboType.findAll({
      order: [['id', 'ASC']]
    });
    
    console.log(`Found ${combos.length} combos`);
    
    // If no combos exist, create some sample data
    if (combos.length === 0) {
      console.log('No combos found, creating sample combo data...');
      await createSampleComboData();
      
      // Fetch again after creating sample data
      const newCombos = await ComboType.findAll({
        order: [['id', 'ASC']]
      });
      
      console.log(`Created ${newCombos.length} sample combos`);
      
      // Format the combos to match the expected format
      const formattedCombos = newCombos.map(combo => ({
        id: combo.id,
        name: combo.name,
        description: combo.description,
        base_price: combo.basePrice,
        base_items: combo.baseItems,
        additional_item_price: combo.additionalItemPrice,
        spring_rolls_included: combo.springRollsIncluded
      }));
      
      return res.json(formattedCombos);
    }
    
    // Format the combos to match the expected format
    const formattedCombos = combos.map(combo => ({
      id: combo.id,
      name: combo.name,
      description: combo.description,
      base_price: combo.basePrice,
      base_items: combo.baseItems,
      additional_item_price: combo.additionalItemPrice,
      spring_rolls_included: combo.springRollsIncluded
    }));
    
    res.json(formattedCombos);
  } catch (error) {
    console.error('Error getting combos:', error);
    res.status(500).json({ error: error.message });
  }
};

// Helper function to create sample combo data
const createSampleComboData = async () => {
  try {
    const sampleCombos = [
      {
        name: 'Family Combo A',
        description: 'Perfect for 2-3 people. Choose your favorite dishes!',
        basePrice: 32.95,
        baseItems: 3,
        additionalItemPrice: 4.50,
        springRollsIncluded: 2
      },
      {
        name: 'Combination Dinner for Two',
        description: 'First choose chicken chow mein OR chicken fried rice, then choose 2 of your favorite dishes from our selection.',
        basePrice: 24.95,
        baseItems: 3, // 1 base choice + 2 entree selections  
        additionalItemPrice: 3.95,
        springRollsIncluded: 2
      },
      {
        name: 'Solo Special',
        description: 'Individual combo meal with one entree and spring roll.',
        basePrice: 15.95,
        baseItems: 1,
        additionalItemPrice: 3.50,
        springRollsIncluded: 1
      },
      {
        name: 'Lunch Combo',
        description: 'Quick lunch combo with your choice of entree.',
        basePrice: 12.95,
        baseItems: 1,
        additionalItemPrice: 2.95,
        springRollsIncluded: 0
      },
      {
        name: 'Deluxe Family Combo',
        description: 'Large family combo for 4-5 people.',
        basePrice: 45.95,
        baseItems: 4,
        additionalItemPrice: 5.50,
        springRollsIncluded: 4
      },
      {
        name: 'Vegetarian Combo',
        description: 'Healthy vegetarian options combo.',
        basePrice: 18.95,
        baseItems: 2,
        additionalItemPrice: 3.25,
        springRollsIncluded: 1
      },
      {
        name: 'Chef\'s Special Combo',
        description: 'Premium combo with chef\'s recommended dishes.',
        basePrice: 38.95,
        baseItems: 3,
        additionalItemPrice: 6.50,
        springRollsIncluded: 3
      }
    ];

    await ComboType.bulkCreate(sampleCombos);
    console.log('Sample combo data created successfully');
    
  } catch (error) {
    console.error('Error creating sample combo data:', error);
    throw error;
  }
};

// Helper function to create dinner for two menu items
const createDinnerForTwoMenuItems = async () => {
  try {
    console.log('Creating dinner for two menu items...');
    
    // Define all the menu items needed for the dinner for two combo
    const dinnerForTwoItems = [
      // Base choice options (Chow Mein & Fried Rice)
      { name: 'Chicken Chow Mein', categoryId: 3, price: 16.95, description: 'Stir-fried noodles with chicken and vegetables' },
      { name: 'Chicken Fried Rice', categoryId: 4, price: 15.95, description: 'Wok-fried rice with chicken, egg and vegetables' },
      
      // Main entree options (Chicken)
      { name: 'Lemon Chicken', categoryId: 7, price: 18.95, description: 'Crispy chicken with tangy lemon sauce' },
      { name: 'Chicken Balls', categoryId: 7, price: 17.95, description: 'Deep-fried chicken balls with sweet and sour sauce' },
      { name: 'Almond Chicken', categoryId: 7, price: 19.95, description: 'Tender chicken with crispy almonds' },
      { name: 'Kung Pao Chicken', categoryId: 7, price: 18.95, description: 'Spicy Sichuan-style chicken with peanuts', isSpicy: true },
      { name: 'Sesame Chicken', categoryId: 7, price: 19.95, description: 'Crispy chicken glazed with sesame sauce' },
      
      // Beef dishes
      { name: 'Beef with Black Bean Sauce', categoryId: 8, price: 19.95, description: 'Tender beef stir-fried with black bean sauce' },
      { name: 'Ginger Fried Beef', categoryId: 8, price: 20.95, description: 'Beef stir-fried with fresh ginger and scallions' },
      { name: 'Beef Chow Mein', categoryId: 3, price: 17.95, description: 'Stir-fried noodles with beef and vegetables' },
      { name: 'Beef and Broccoli', categoryId: 8, price: 18.95, description: 'Classic beef and broccoli in brown sauce' },
      
      // Pork dishes
      { name: 'Honey Garlic Pork', categoryId: 9, price: 18.95, description: 'Sweet and savory pork with honey garlic glaze' },
      { name: 'Sweet & Sour Pork', categoryId: 9, price: 18.95, description: 'Crispy pork with pineapple in sweet and sour sauce' },
      { name: 'Dry Garlic Pork', categoryId: 9, price: 19.95, description: 'Crispy pork with aromatic dry garlic seasoning' },
      
      // Seafood dishes
      { name: 'Deep-Fried Prawns', categoryId: 10, price: 22.95, description: 'Crispy battered prawns served with sweet and sour sauce' },
      { name: 'Shrimp with Black Bean Sauce', categoryId: 10, price: 21.95, description: 'Fresh shrimp stir-fried with black bean sauce' },
      { name: 'Kung Pao Prawns', categoryId: 10, price: 22.95, description: 'Spicy prawns with peanuts in Kung Pao sauce', isSpicy: true },
      
      // Chop Suey dishes
      { name: 'Chicken Chop Suey', categoryId: 5, price: 16.95, description: 'Mixed vegetables with chicken in light sauce' },
      { name: 'Beef Chop Suey', categoryId: 5, price: 17.95, description: 'Mixed vegetables with beef in light sauce' }
    ];
    
    // Check which items already exist to avoid duplicates
    const existingItems = await MenuItem.findAll({
      where: {
        name: dinnerForTwoItems.map(item => item.name)
      }
    });
    
    const existingNames = existingItems.map(item => item.name);
    const newItems = dinnerForTwoItems.filter(item => !existingNames.includes(item.name));
    
    if (newItems.length > 0) {
      await MenuItem.bulkCreate(newItems);
      console.log(`Created ${newItems.length} new menu items for dinner for two combo`);
    } else {
      console.log('All dinner for two menu items already exist');
    }
    
    return newItems.length;
  } catch (error) {
    console.error('Error creating dinner for two menu items:', error);
    throw error;
  }
};

// Helper function to create sample combo available items
const createSampleComboAvailableItems = async () => {
  try {
    console.log('Creating sample combo available items...');
    
    // First ensure dinner for two menu items exist
    await createDinnerForTwoMenuItems();
    
    // Check if we already have combo available items
    const existingItems = await ComboAvailableItems.count();
    if (existingItems > 0) {
      console.log('Combo available items already exist, skipping creation');
      return;
    }
    
    // Get all available menu items
    const allMenuItems = await MenuItem.findAll({
      where: { isAvailable: true },
      order: [['categoryId', 'ASC'], ['name', 'ASC']]
    });
    
    console.log(`Found ${allMenuItems.length} available menu items`);
    
    if (allMenuItems.length === 0) {
      console.log('No menu items found, cannot create combo available items');
      return;
    }
    
    // Get items by category for better selection
    const chowMeinItems = allMenuItems.filter(item => item.categoryId === 3); // Chow Mein
    const chopSueyItems = allMenuItems.filter(item => item.categoryId === 5); // Chop Suey  
    const chickenItems = allMenuItems.filter(item => item.categoryId === 7); // Chicken
    const beefItems = allMenuItems.filter(item => item.categoryId === 8); // Beef
    const porkItems = allMenuItems.filter(item => item.categoryId === 9); // Pork
    const entreeItems = [...chickenItems, ...beefItems, ...porkItems, ...chowMeinItems, ...chopSueyItems];
    
    console.log(`Entree items available: ${entreeItems.length}`);
    
    // Create combo available items for combo_type_id 1 (uses various entrees)
    const combo1Items = [];
    const combo1Selection = entreeItems.slice(0, Math.min(8, entreeItems.length));
    combo1Selection.forEach((item, index) => {
      combo1Items.push({
        comboTypeId: 1,
        menuItemId: item.id,
        isEntree: true,
        displayOrder: index + 1
      });
    });
    
    // Create combo available items for combo_type_id 2 (Dinner for Two - special logic)
    const combo2Items = [];
    
    // Get the dinner for two items
    const dinnerForTwoItems = await MenuItem.findAll({
      where: {
        name: [
          'Chicken Chow Mein', 'Chicken Fried Rice', 'Lemon Chicken', 'Chicken Balls',
          'Beef with Black Bean Sauce', 'Ginger Fried Beef', 'Honey Garlic Pork',
          'Sweet & Sour Pork', 'Deep-Fried Prawns', 'Beef Chow Mein', 'Almond Chicken',
          'Shrimp with Black Bean Sauce', 'Kung Pao Chicken', 'Dry Garlic Pork',
          'Sesame Chicken', 'Chicken Chop Suey', 'Beef Chop Suey', 'Kung Pao Prawns',
          'Beef and Broccoli'
        ],
        isAvailable: true
      }
    });
    
    // Add base choice options (marked as base choices)
    const baseChoices = dinnerForTwoItems.filter(item => 
      item.name === 'Chicken Chow Mein' || item.name === 'Chicken Fried Rice'
    );
    
    baseChoices.forEach((item, index) => {
      combo2Items.push({
        comboTypeId: 2,
        menuItemId: item.id,
        isEntree: false, // Mark as base choice, not regular entree
        displayOrder: index + 1
      });
    });
    
    // Add all selectable entree options
    const entreeChoices = dinnerForTwoItems.filter(item => 
      item.name !== 'Chicken Chow Mein' && item.name !== 'Chicken Fried Rice'
    );
    
    entreeChoices.forEach((item, index) => {
      combo2Items.push({
        comboTypeId: 2,
        menuItemId: item.id,
        isEntree: true,
        displayOrder: baseChoices.length + index + 1
      });
    });
    
    // Create combo available items for combo_type_id 3-7 (same as combo 2)
    const combo3Items = [];
    const combo4Items = [];
    const combo5Items = [];
    const combo6Items = [];
    const combo7Items = [];
    
    // For combos 3-7, use the same items structure as combo 2
    [3, 4, 5, 6, 7].forEach(comboId => {
      let comboItems;
      switch(comboId) {
        case 3: comboItems = combo3Items; break;
        case 4: comboItems = combo4Items; break;
        case 5: comboItems = combo5Items; break;
        case 6: comboItems = combo6Items; break;
        case 7: comboItems = combo7Items; break;
      }
      
      // Add base choice options (marked as base choices)
      const baseChoices = dinnerForTwoItems.filter(item => 
        item.name === 'Chicken Chow Mein' || item.name === 'Chicken Fried Rice'
      );
      
      baseChoices.forEach((item, index) => {
        comboItems.push({
          comboTypeId: comboId,
          menuItemId: item.id,
          isEntree: false, // Mark as base choice, not regular entree
          displayOrder: index + 1
        });
      });
      
      // Add all selectable entree options
      const entreeChoices = dinnerForTwoItems.filter(item => 
        item.name !== 'Chicken Chow Mein' && item.name !== 'Chicken Fried Rice'
      );
      
      entreeChoices.forEach((item, index) => {
        comboItems.push({
          comboTypeId: comboId,
          menuItemId: item.id,
          isEntree: true,
          displayOrder: baseChoices.length + index + 1
        });
      });
    });
    
    // Combine all combo items
    const allComboItems = [...combo1Items, ...combo2Items, ...combo3Items, ...combo4Items, ...combo5Items, ...combo6Items, ...combo7Items];
    
    if (allComboItems.length > 0) {
      await ComboAvailableItems.bulkCreate(allComboItems);
      console.log(`Created ${allComboItems.length} combo available items`);
      console.log(`- Combo type 1: ${combo1Items.length} items`);
      console.log(`- Combo type 2: ${combo2Items.length} items`);
      console.log(`- Combo type 3: ${combo3Items.length} items`);
      console.log(`- Combo type 4: ${combo4Items.length} items`);
      console.log(`- Combo type 5: ${combo5Items.length} items`);
      console.log(`- Combo type 6: ${combo6Items.length} items`);
      console.log(`- Combo type 7: ${combo7Items.length} items`);
      
      // Log the actual items for debugging
      console.log('Combo type 1 items:', combo1Items.map(item => 
        `ID:${item.menuItemId} (${allMenuItems.find(mi => mi.id === item.menuItemId)?.name})`
      ));
      console.log('Combo type 2 items:', combo2Items.map(item => 
        `ID:${item.menuItemId} (${allMenuItems.find(mi => mi.id === item.menuItemId)?.name})`
      ));
      console.log('Combo type 3 items:', combo3Items.map(item => 
        `ID:${item.menuItemId} (${allMenuItems.find(mi => mi.id === item.menuItemId)?.name})`
      ));
      console.log('Combo types 4-7 have same items as combo 2');
    } else {
      console.log('No combo items to create');
    }
    
  } catch (error) {
    console.error('Error creating sample combo available items:', error);
    throw error;
  }
};

// Helper function to update combo 2-7 data
const updateComboData = async () => {
  try {
    // Update combo 2 (Dinner for Two)
    await ComboType.update({
      name: 'Combination Dinner for Two',
      description: 'First choose chicken chow mein OR chicken fried rice, then choose 2 of your favorite dishes from our selection.',
      basePrice: 24.95,
      baseItems: 3, // 1 base choice + 2 entree selections
      additionalItemPrice: null,
      springRollsIncluded: 2
    }, {
      where: { id: 2 }
    });

    // Update combo 3 (Dinner for Three)
    await ComboType.update({
      name: 'Combination Dinner for Three',
      description: 'First choose chicken chow mein OR chicken fried rice, then choose 3 of your favorite dishes from our selection.',
      basePrice: 69.95,
      baseItems: 4, // 1 base choice + 3 entree selections
      additionalItemPrice: null,
      springRollsIncluded: 3
    }, {
      where: { id: 3 }
    });

    // Update combo 4 (Dinner for Four)
    await ComboType.update({
      name: 'Combination Dinner for Four',
      description: 'First choose chicken chow mein OR chicken fried rice, then choose 4 of your favorite dishes from our selection.',
      basePrice: 88.95,
      baseItems: 5, // 1 base choice + 4 entree selections
      additionalItemPrice: null,
      springRollsIncluded: 4
    }, {
      where: { id: 4 }
    });

    // Update combo 5 (Dinner for Six)
    await ComboType.update({
      name: 'Combination Dinner for Six',
      description: 'First choose chicken chow mein OR chicken fried rice, then choose 5 of your favorite dishes from our selection.',
      basePrice: 108.95,
      baseItems: 6, // 1 base choice + 5 entree selections
      additionalItemPrice: null,
      springRollsIncluded: 6
    }, {
      where: { id: 5 }
    });

    // Update combo 6 (Dinner for Eight)
    await ComboType.update({
      name: 'Combination Dinner for Eight',
      description: 'First choose chicken chow mein OR chicken fried rice, then choose 7 of your favorite dishes from our selection.',
      basePrice: 148.95,
      baseItems: 8, // 1 base choice + 7 entree selections
      additionalItemPrice: null,
      springRollsIncluded: 8
    }, {
      where: { id: 6 }
    });

    // Update combo 7 (Dinner for Ten)
    await ComboType.update({
      name: 'Combination Dinner for Ten',
      description: 'First choose chicken chow mein OR chicken fried rice, then choose 9 of your favorite dishes from our selection.',
      basePrice: 172.95,
      baseItems: 10, // 1 base choice + 9 entree selections
      additionalItemPrice: null,
      springRollsIncluded: 10
    }, {
      where: { id: 7 }
    });

    console.log('Updated combo 2-7 data successfully');
  } catch (error) {
    console.error('Error updating combo data:', error);
    throw error;
  }
};

// Helper function to reset combo available items (for debugging)
const resetComboAvailableItems = async (req, res) => {
  try {
    console.log('Resetting combo available items...');
    
    // Update combo 2-7 data first
    await updateComboData();
    
    // Delete all existing combo available items
    await ComboAvailableItems.destroy({ where: {} });
    console.log('Cleared existing combo available items');
    
    // Recreate them
    await createSampleComboAvailableItems();
    
    res.json({ message: 'Combo available items reset successfully' });
  } catch (error) {
    console.error('Error resetting combo available items:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getComboWithItems,
  createComboOrder,
  getAllCombos,
  resetComboAvailableItems
};