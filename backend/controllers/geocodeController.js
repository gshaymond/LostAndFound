const axios = require('axios');

const geocodeAddress = async (req, res) => {
  try {
    const { address, lat, lng } = req.body;

    if (!address && !(lat && lng)) {
      return res.status(400).json({ error: 'address or lat/lng required' });
    }

    const key = process.env.GOOGLE_MAPS_API_KEY;
    if (!key) return res.status(500).json({ error: 'Geocoding key not configured' });

    let url;
    if (address) {
      url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${key}`;
    } else {
      url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${encodeURIComponent(lat)},${encodeURIComponent(lng)}&key=${key}`;
    }

    const resp = await axios.get(url);
    const { data } = resp;

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      return res.status(404).json({ error: 'No results' });
    }

    const result = data.results[0];
    const loc = result.geometry.location;

    res.json({ address: result.formatted_address, lat: loc.lat, lng: loc.lng, raw: result });
  } catch (error) {
    console.error('Geocode error:', error?.response?.data || error);
    res.status(500).json({ error: 'Geocode error' });
  }
};

module.exports = { geocodeAddress };