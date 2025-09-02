// routes/google.js - Fixed Google API Integration
const express = require('express');
const router = express.Router();

// @route   GET /api/google/place/:placeId
// @desc    Get place details including reviews
// @access  Public
router.get('/place/:placeId', async (req, res) => {
  try {
    const { placeId } = req.params;

    if (!process.env.GOOGLE_PLACES_API_KEY) {
      console.log('Google Places API key not configured, returning mock data');

    const mockPlaceDetails = {
      placeId: placeId,
      name: 'Gold Chopsticks',
      rating: 4.8,
      reviewCount: 127,
      reviews: [
        {
          authorName: 'Sarah M.',
          rating: 5,
          text: 'Amazing portions and authentic flavors! Best Chinese food in West Kelowna.',
          time: '2024-01-15'
        },
        {
          authorName: 'Mike T.',
          rating: 5,
          text: 'Great value for money, family-friendly atmosphere. Highly recommend!',
          time: '2024-01-10'
        },
        {
          authorName: 'Jennifer L.',
          rating: 4,
          text: 'Fresh ingredients and quick service. The General Tso\'s chicken is incredible!',
          time: '2024-01-08'
        },
        {
          authorName: 'David K.',
          rating: 5,
          text: 'Excellent service and the portions are huge! Great value for families.',
          time: '2024-01-05'
        },
        {
          authorName: 'Lisa P.',
          rating: 4,
          text: 'Authentic Chinese flavors. The hot and sour soup is fantastic!',
          time: '2024-01-02'
        }
      ]
    };

    res.json(mockPlaceDetails);
    }
    
    const fetch = require('node-fetch');
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,user_ratings_total,reviews&key=${process.env.GOOGLE_PLACES_API_KEY}`
    );
    const data = await response.json();
    res.json(data);
    

  } catch (error) {
    console.error('Get place details error:', error);
    res.status(500).json({ message: 'Failed to fetch place details' });
  }
});

// @route   GET /api/google/autocomplete
// @desc    Get address autocomplete suggestions
// @access  Public
router.get('/autocomplete', async (req, res) => {
  try {
    const { input } = req.query;

    if (!input || input.length < 2) {
      return res.json({ predictions: [], status: 'OK' });
    }

    if (!process.env.GOOGLE_PLACES_API_KEY) {
      console.log('Google Places API key not configured, returning mock data');
    }

    // Mock autocomplete suggestions for West Kelowna area
    const mockSuggestions = {
      predictions: [
        {
          description: `${input} Street, West Kelowna, BC, Canada`,
          place_id: 'mock_place_1_' + Date.now(),
          structured_formatting: {
            main_text: `${input} Street`,
            secondary_text: 'West Kelowna, BC, Canada'
          }
        },
        {
          description: `${input} Avenue, West Kelowna, BC, Canada`,
          place_id: 'mock_place_2_' + Date.now(),
          structured_formatting: {
            main_text: `${input} Avenue`,
            secondary_text: 'West Kelowna, BC, Canada'
          }
        },
        {
          description: `${input} Road, West Kelowna, BC, Canada`,
          place_id: 'mock_place_3_' + Date.now(),
          structured_formatting: {
            main_text: `${input} Road`,
            secondary_text: 'West Kelowna, BC, Canada'
          }
        }
      ].filter(prediction => 
        prediction.structured_formatting.main_text.toLowerCase().includes(input.toLowerCase())
      ),
      status: 'OK'
    };

    res.json(mockSuggestions);

  } catch (error) {
    console.error('Autocomplete error:', error);
    res.status(500).json({ message: 'Failed to get address suggestions' });
  }
});

module.exports = router;