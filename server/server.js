import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Configurations
import connectDB from './config/db.js';
import initializeGemini from './config/gemini.js';
import setupSocket from './config/socket.js';

// Middlewares
import errorHandler from './middleware/errorHandler.js';
import rateLimiter from './middleware/rateLimiter.js';

// Routes
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import noteRoutes from './routes/noteRoutes.js';
import postRoutes from './routes/postRoutes.js';
import clubRoutes from './routes/clubRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import wellnessRoutes from './routes/wellnessRoutes.js';
import placementRoutes from './routes/placementRoutes.js';
import scheduleRoutes from './routes/scheduleRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';

// Load Env
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express App
const app = express();
const server = http.createServer(app);

// Connect Database
connectDB();

// Initialize AI
initializeGemini();

// Initialize Real-time communication
setupSocket(server);

// Security and Logging Middleware
app.use(helmet({
  crossOriginResourcePolicy: false, // Essential for serving uploads locally
}));
// CORS configuration: allow configured client URL(s) and Vercel subdomains
const rawClientUrls = process.env.CLIENT_URL || 'http://localhost:5173';
const allowedOrigins = rawClientUrls.split(',').map((s) => s.trim()).filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests like curl/postman (no origin)
    if (!origin) return callback(null, true);
    // Allow if explicitly configured
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // Allow Vercel preview and production domains
    if (origin.endsWith('.vercel.app')) return callback(null, true);
    return callback(new Error('CORS policy: This origin is not allowed'), false);
  },
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Uploads static files
const uploadDirs = [
  path.join(__dirname, 'uploads'),
  path.join(__dirname, 'uploads/avatars'),
  path.join(__dirname, 'uploads/notes'),
  path.join(__dirname, 'uploads/posts'),
  path.join(__dirname, 'uploads/resumes'),
];

uploadDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Apply rate limiter to general API routes (can exclude health check)
app.use('/api', rateLimiter);

// API Endpoints
const apiVersion = process.env.API_VERSION || 'v1';
app.use(`/api/${apiVersion}/auth`, authRoutes);
app.use(`/api/${apiVersion}/users`, userRoutes);
app.use(`/api/${apiVersion}/courses`, courseRoutes);
app.use(`/api/${apiVersion}/notes`, noteRoutes);
app.use(`/api/${apiVersion}/posts`, postRoutes);
app.use(`/api/${apiVersion}/clubs`, clubRoutes);
app.use(`/api/${apiVersion}/events`, eventRoutes);
app.use(`/api/${apiVersion}/wellness`, wellnessRoutes);
app.use(`/api/${apiVersion}/placements`, placementRoutes);
app.use(`/api/${apiVersion}/schedule`, scheduleRoutes);
app.use(`/api/${apiVersion}/attendance`, attendanceRoutes);
app.use(`/api/${apiVersion}/ai`, aiRoutes);
app.use(`/api/${apiVersion}/dashboard`, dashboardRoutes);

// Global Error Handler (must be last)
app.use(errorHandler);

// Set Port and Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 CampusSphere Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled rejections/exceptions gracefully
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection Error: ${err.message}`);
  // Do not kill the server in development, but log it
});

process.on('uncaughtException', (err) => {
  console.error(`Uncaught Exception Error: ${err.message}`);
});
