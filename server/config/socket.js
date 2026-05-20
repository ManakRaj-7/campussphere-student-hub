import { Server } from 'socket.io';

let io = null;

const setupSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Join user to their personal room
    socket.on('join', (userId) => {
      if (userId) {
        socket.join(`user:${userId}`);
        console.log(`👤 User ${userId} joined personal room`);
      }
    });

    // Join a course room
    socket.on('join:course', (courseId) => {
      if (courseId) {
        socket.join(`course:${courseId}`);
      }
    });

    // Join a club room
    socket.on('join:club', (clubId) => {
      if (clubId) {
        socket.join(`club:${clubId}`);
      }
    });

    socket.on('disconnect', (reason) => {
      console.log(`🔌 Socket disconnected: ${socket.id} - ${reason}`);
    });

    socket.on('error', (error) => {
      console.error(`Socket error: ${error.message}`);
    });
  });

  console.log('✅ Socket.io initialized');
  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

export default setupSocket;
