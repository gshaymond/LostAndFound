const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const morgan = require('morgan');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
// Capture raw JSON body in development to help debug malformed payloads
app.use(express.json({ verify: (req, res, buf) => { if (process.env.NODE_ENV !== 'production') req.rawBody = buf && buf.toString && buf.toString(); } }));
app.use(express.urlencoded({ extended: true }));

// Security middleware
app.use(helmet());
// Sanitize request bodies and params (avoid touching req.query to prevent getter issues in certain express versions)
app.use((req, res, next) => {
  const sanitizeObj = (obj) => {
    if (!obj || typeof obj !== 'object') return;
    Object.keys(obj).forEach((key) => {
      if (key.startsWith('$') || key.includes('.')) {
        delete obj[key];
      } else {
        sanitizeObj(obj[key]);
      }
    });
  };
  try {
    sanitizeObj(req.body);
    sanitizeObj(req.params);
  } catch (e) {
    console.warn('Sanitize error', e);
  }
  next();
});
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api', apiLimiter);

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Dev-only: log raw body for auth register route
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/auth/register', (req, res, next) => {
    console.log('RAW REQUEST:', {
      method: req.method,
      url: req.originalUrl,
      headers: req.headers,
      rawBody: req.rawBody
    });
    next();
  });
}

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lost_found_hub')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_match', (matchId) => {
    socket.join(matchId);
    console.log(`User ${socket.id} joined match ${matchId}`);
  });

  socket.on('send_message', (data) => {
    io.to(data.matchId).emit('receive_message', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/items', require('./routes/items'));
app.use('/api/matches', require('./routes/matches'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/geocode', require('./routes/geocode'));
app.use('/api/uploads', require('./routes/uploads'));
app.use('/api/saved-searches', require('./routes/savedSearches'));

// Make io available to routes
app.set('io', io);

// Sentry (optional)
if (process.env.SENTRY_DSN) {
  try {
    const Sentry = require('@sentry/node');
    Sentry.init({ dsn: process.env.SENTRY_DSN });
    app.use(Sentry.Handlers.requestHandler());
  } catch (e) {
    console.warn('Sentry not available', e.message);
  }
}

// Caching middleware (items)
const cacheMiddleware = require('./middleware/cache');
app.use(cacheMiddleware);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  const dev = process.env.NODE_ENV !== 'production';
  res.status(500).json({ error: 'Something went wrong!', ...(dev ? { message: err.message, stack: err.stack } : {}) });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = { app, server, io };