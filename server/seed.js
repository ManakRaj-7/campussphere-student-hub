import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load Models
import User from './models/User.js';
import Course from './models/Course.js';
import Note from './models/Note.js';
import Post from './models/Post.js';
import Comment from './models/Comment.js';
import Club from './models/Club.js';
import Event from './models/Event.js';
import Job from './models/Job.js';
import Application from './models/Application.js';
import Schedule from './models/Schedule.js';
import Attendance from './models/Attendance.js';
import WellnessLog from './models/WellnessLog.js';
import ChatHistory from './models/ChatHistory.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const seedData = async () => {
  try {
    console.log('🔄 Connecting to database for seeding...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB.');

    // Clear existing data
    console.log('🧹 Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Course.deleteMany({}),
      Note.deleteMany({}),
      Post.deleteMany({}),
      Comment.deleteMany({}),
      Club.deleteMany({}),
      Event.deleteMany({}),
      Job.deleteMany({}),
      Application.deleteMany({}),
      Schedule.deleteMany({}),
      Attendance.deleteMany({}),
      WellnessLog.deleteMany({}),
      ChatHistory.deleteMany({}),
    ]);
    console.log('🧹 Collections cleared.');

    // 1. Create Users
    console.log('👤 Creating seed users...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    const users = await User.create([
      {
        name: 'Alex River',
        email: 'alex@campussphere.edu',
        password: hashedPassword,
        role: 'student',
        department: 'Computer Science',
        year: 3,
        bio: 'Tech enthusiast, full stack dev, and campus leader.',
        streak: 5,
        avatar: '',
      },
      {
        name: 'Prof. Sarah Sterling',
        email: 'sterling@campussphere.edu',
        password: hashedPassword,
        role: 'faculty',
        department: 'Computer Science',
        year: 1,
        bio: 'Professor of Computer Science, specializing in Algorithms and AI.',
        streak: 0,
        avatar: '',
      },
      {
        name: 'Administrator',
        email: 'admin@campussphere.edu',
        password: hashedPassword,
        role: 'admin',
        department: 'Administration',
        year: 1,
        bio: 'Campus administrator.',
        streak: 0,
        avatar: '',
      },
    ]);

    const student = users[0];
    const faculty = users[1];
    const admin = users[2];

    console.log(`✅ Users created. Try logging in with "alex@campussphere.edu" / "password123"`);

    // 2. Create Courses
    console.log('📚 Creating courses...');
    const courses = await Course.create([
      {
        title: 'Advanced Algorithms',
        code: 'CS301',
        department: 'Computer Science',
        professor: 'Prof. Sterling',
        room: 'Room 402',
        icon: 'auto_awesome',
        color: '#6366f1', // Indigo
        students: [student._id],
        noteCount: 2,
      },
      {
        title: 'Systems Architecture',
        code: 'CS304',
        department: 'Computer Science',
        professor: 'Prof. Sterling',
        room: 'Lab 2B',
        icon: 'dns',
        color: '#3b82f6', // Blue
        students: [student._id],
        noteCount: 1,
      },
      {
        title: 'Intro to Artificial Intelligence',
        code: 'CS310',
        department: 'Computer Science',
        professor: 'Prof. Davis',
        room: 'Auditorium C',
        icon: 'brain',
        color: '#ec4899', // Pink
        students: [student._id],
        noteCount: 1,
      },
    ]);

    const algoCourse = courses[0];
    const archCourse = courses[1];
    const aiCourse = courses[2];

    // 3. Create Notes
    console.log('📝 Creating notes...');
    const notes = await Note.create([
      {
        title: 'Lecture: Intro to Big O & Time Complexity',
        content: `Big O notation is used to describe the performance or complexity of an algorithm.
Specifically, it describes the worst-case scenario, and can be used to describe the execution time required or the space used (e.g. in memory or on disk) by an algorithm.

Common Complexities:
- O(1): Constant Time
- O(log n): Logarithmic Time
- O(n): Linear Time
- O(n log n): Linearithmic Time
- O(n^2): Quadratic Time`,
        aiSummary: 'This lecture covers Big O notation and standard time complexities. Big O defines the worst-case execution performance or memory footprint of algorithms, aiding efficiency analysis. Common complexities range from constant O(1) to quadratic O(n^2).',
        keyInsights: [
          { title: 'Worst-case Focus', description: 'Big O measures the upper bound of execution time/space.' },
          { title: 'Scalability', description: 'O(log n) represents algorithms that cut processing tasks in half at each step (e.g. Binary Search).' },
        ],
        transcriptionQuality: 92,
        course: algoCourse._id,
        author: student._id,
        tags: ['#algorithms', '#basics', '#exam_prep'],
        isPublic: true,
      },
      {
        title: 'Lecture: Dynamic Programming & Memoization',
        content: `Dynamic Programming is an algorithmic technique for solving an optimization problem by breaking it down into simpler subproblems and utilizing the fact that the optimal solution to the overall problem depends upon the optimal solutions to its subproblems.

Memoization is a specific top-down approach where we cache the results of function calls and return the cached result when the same inputs occur again.`,
        aiSummary: 'An exploration of Dynamic Programming (DP) and its top-down strategy, Memoization. DP optimizes solutions by solving smaller subproblems and storing their results. Memoization specifically caches computed answers to skip redundant computations.',
        keyInsights: [
          { title: 'Optimal Substructure', description: 'The main problem is resolvable via its cached sub-problem solutions.' },
          { title: 'Time vs Space Tradeoff', description: 'Caching consumes memory (RAM) to dramatically decrease execution time.' },
        ],
        transcriptionQuality: 88,
        course: algoCourse._id,
        author: student._id,
        tags: ['#dp', '#interview_prep'],
        isPublic: false,
      },
      {
        title: 'Systems: CPU Pipelining & Cache Mapping',
        content: `Instruction pipelining is a technique used in the design of modern microprocessors to increase their instruction throughput (the number of instructions that can be executed in a unit of time).

Cache memory speeds up processing by holding frequently used instructions and data. Different mappings:
1. Direct Mapping
2. Associative Mapping
3. Set-Associative Mapping`,
        aiSummary: 'Covers instruction pipelining and cache mapping techniques in modern processors. Pipelining increases CPU throughput. Caches utilize direct, associative, or set-associative mappings to keep frequently requested memory close to the arithmetic logic unit.',
        keyInsights: [
          { title: 'Throughput Boost', description: 'Pipelining allows overlapping execution of multiple instructions.' },
          { title: 'Cache Mapping', description: 'Set-associative combines direct and associative models for balanced performance.' },
        ],
        transcriptionQuality: 90,
        course: archCourse._id,
        author: student._id,
        tags: ['#hardware', '#architecture'],
        isPublic: true,
      },
    ]);

    // 4. Create Clubs
    console.log('👥 Creating clubs...');
    const clubs = await Club.create([
      {
        name: 'The Coding Club',
        description: 'Where algorithms meet creativity. Weekly hackathons, tech talks, and open source collaboration.',
        icon: 'terminal',
        color: '#10b981', // Emerald
        members: [student._id],
        memberCount: 1,
        admin: student._id,
      },
      {
        name: 'Eco-Warriors',
        description: 'Promoting sustainability, zero waste, and environment awareness across the campus ecosystem.',
        icon: 'eco',
        color: '#22c55e', // Green
        members: [student._id],
        memberCount: 1,
        admin: student._id,
      },
    ]);

    const codingClub = clubs[0];

    // 5. Create Posts & Comments
    console.log('📣 Creating discussion posts...');
    const posts = await Post.create([
      {
        author: student._id,
        authorModel: 'User',
        content: 'Hey everyone! Is anyone down for a group study session for the upcoming CS301 midterm? Planning to review dynamic programming this Friday in Lab 2B!',
        images: [],
        likes: [student._id],
        commentCount: 1,
        isSponsored: false,
      },
      {
        author: codingClub._id,
        authorModel: 'Club',
        content: '🚀 Announcing our Annual Campus Hackathon! 24 hours of coding, free pizza, and $1000 in prizes. Registrations open this Monday! #HackCampus2026',
        images: [],
        likes: [],
        commentCount: 0,
        isSponsored: true,
      },
    ]);

    await Comment.create({
      post: posts[0]._id,
      author: faculty._id,
      content: 'I highly recommend reviewing the memoized Fibonacci and edit-distance problems, Alex. Good luck organizing the session!',
      likes: [student._id],
    });

    // 6. Create Upcoming Events
    console.log('📅 Creating campus events...');
    await Event.create([
      {
        title: 'Coding Club Hackathon',
        description: 'Join the annual 24-hour sprint. Build cool projects, meet recruiters, and win prizes!',
        date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        location: 'CS Department Auditorium',
        coordinates: { lat: 37.7749, lng: -122.4194 },
        organizer: student._id,
        club: codingClub._id,
        attendees: [student._id],
        category: 'hackathon',
        image: '',
      },
      {
        title: 'Distinguished Speaker: AI & Ethics',
        description: 'A critical panel discussion with industry experts on alignment, safety, and regulation of artificial intelligence.',
        date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
        location: 'Main University Library Hall',
        coordinates: { lat: 37.7752, lng: -122.4185 },
        organizer: admin._id,
        attendees: [],
        category: 'workshop',
        image: '',
      },
    ]);

    // 7. Create Job Listings (Placements)
    console.log('💼 Creating job postings...');
    const jobs = await Job.create([
      {
        company: 'Google Inc.',
        title: 'Associate Software Engineer',
        description: 'Join Google\'s Search and Systems team. You will work on massive-scale web infrastructures and algorithms.',
        requirements: [
          'Strong understanding of algorithms, data structures, and system design.',
          'Experience in Java, C++, Go, or Python.',
          'Familiarity with cloud infrastructures is a plus.',
        ],
        salary: '$120,000 - $140,000 / year',
        location: 'Mountain View, CA',
        type: 'full-time',
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        postedBy: admin._id,
        isActive: true,
      },
      {
        company: 'Stripe',
        title: 'Backend Engineer Intern',
        description: 'Build robust payment APIs. Learn distributed transactions and security paradigms under mentorship.',
        requirements: [
          'Pursuing a BS or MS in Computer Science or related fields.',
          'Proficiency with Ruby, Java, Go, or Node.js.',
          'Passionate about API design and clean code.',
        ],
        salary: '$45 / hour',
        location: 'San Francisco, CA (Hybrid)',
        type: 'internship',
        deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        postedBy: admin._id,
        isActive: true,
      },
    ]);

    // Apply to first job
    await Application.create({
      user: student._id,
      job: jobs[0]._id,
      status: 'applied',
      resume: '/uploads/resumes/dummy_resume.pdf',
      coverLetter: 'I am incredibly excited about the prospect of working at Google. As a CS major, scalability and systems performance are my key focus areas.',
    });
    jobs[0].applicants.push(student._id);
    await jobs[0].save();

    // 8. Create Schedule Entries
    console.log('⏰ Creating weekly schedules...');
    await Schedule.create([
      {
        user: student._id,
        course: algoCourse._id,
        dayOfWeek: 1, // Monday
        startTime: '10:00',
        endTime: '11:30',
        room: 'Room 402',
        priority: 'high',
      },
      {
        user: student._id,
        course: archCourse._id,
        dayOfWeek: 1, // Monday
        startTime: '13:00',
        endTime: '14:30',
        room: 'Lab 2B',
        priority: 'medium',
      },
      {
        user: student._id,
        course: algoCourse._id,
        dayOfWeek: 3, // Wednesday
        startTime: '10:00',
        endTime: '11:30',
        room: 'Room 402',
        priority: 'high',
      },
      {
        user: student._id,
        course: aiCourse._id,
        dayOfWeek: 4, // Thursday
        startTime: '15:00',
        endTime: '16:30',
        room: 'Auditorium C',
        priority: 'high',
      },
    ]);

    // 9. Create Attendance Logs
    console.log('📌 Creating attendance logs...');
    await Attendance.create([
      {
        user: student._id,
        course: algoCourse._id,
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        status: 'present',
        markedBy: 'faculty',
      },
      {
        user: student._id,
        course: algoCourse._id,
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        status: 'present',
        markedBy: 'self',
      },
      {
        user: student._id,
        course: archCourse._id,
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        status: 'late',
        markedBy: 'self',
      },
    ]);

    // 10. Create Wellness Logs
    console.log('🌿 Creating wellness logs...');
    await WellnessLog.create([
      {
        user: student._id,
        mood: 'good',
        focusLevel: 'medium',
        note: 'Feeling good today. Study session went well. Keeping up the momentum!',
        aiRecommendation: 'Awesome job! Balance is key. Keep maintaining a consistent study schedule, and remember to schedule 10-15 minute screen-free breaks.',
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        user: student._id,
        mood: 'great',
        focusLevel: 'high',
        note: 'Super productive morning. Nailed the algorithms review and got my hackathon team assembled!',
        aiRecommendation: 'Excellent energy levels! Ride this wave of motivation but don\'t forget to stay hydrated. Sleep hygiene remains critical for dynamic recall.',
        date: new Date(),
      },
    ]);

    console.log('🎉 Seeding successfully completed!');
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error(`❌ Seeding failed: ${error.message}`);
    process.exit(1);
  }
};

seedData();
