const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 60 }); // default cache TTL 60s

// Optional Redis adapter placeholder (if REDIS_URL is provided, we could use it instead)

const cacheMiddleware = (req, res, next) => {
  // Only cache GET requests to /api/items
  if (req.method !== 'GET') return next();
  if (!req.path.startsWith('/api/items')) return next();

  const key = `${req.path}:${JSON.stringify(req.query || {})}`;
  const cached = cache.get(key);
  if (cached) {
    return res.json(cached);
  }

  // monkey-patch res.json to cache response body
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    try {
      cache.set(key, body);
    } catch (e) {
      console.warn('Cache set error', e);
    }
    return originalJson(body);
  };
  next();
};

module.exports = cacheMiddleware;