const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const multer = require('multer');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: 'http://localhost:3000', methods: ['GET', 'POST'] }
});

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'Uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'Uploads')));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Connection Error:', err));

// Schemas
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'student'], required: true },
  name: { type: String },
  rollNumber: { type: String, unique: true, sparse: true },
  phone: { type: String },
  isApproved: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true }
});

const attendanceSchema = new mongoose.Schema({
  rollNumber: { type: String, required: true },
  name: { type: String, required: true },
  date: { type: Date, default: Date.now }
});

const ondutySchema = new mongoose.Schema({
  rollNumber: { type: String, required: true },
  reason: { type: String, required: true },
  dates: [{ type: Date }],
  attachment: { type: String },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  date: { type: Date, required: true },
  type: { type: String, enum: ['exam', 'holiday', 'seminar'], required: true }
});

const User = mongoose.model('User', userSchema);
const Attendance = mongoose.model('Attendance', attendanceSchema);
const Onduty = mongoose.model('Onduty', ondutySchema);
const Event = mongoose.model('Event', eventSchema);

// JWT Middleware
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access Denied' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid Token' });
    req.user = user;
    next();
  });
};

// Role Middleware
const restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Access Forbidden' });
  }
  next();
};

// Routes
app.post('/api/register', async (req, res) => {
  const { name, rollNumber, email, phone, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      email,
      password: hashedPassword,
      role: 'student',
      name,
      rollNumber,
      phone
    });
    await user.save();
    res.status(201).json({ message: 'Registration successful, awaiting approval' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !user.isApproved || !user.isActive) {
      return res.status(401).json({ message: 'Invalid credentials or account not approved' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role, rollNumber: user.rollNumber },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.json({ token, role: user.role });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin Routes
app.get('/api/admin/students', authenticateToken, restrictTo('admin'), async (req, res) => {
  const students = await User.find({ role: 'student' });
  res.json(students);
});

app.post('/api/admin/approve', authenticateToken, restrictTo('admin'), async (req, res) => {
  const { userId } = req.body;
  await User.findByIdAndUpdate(userId, { isApproved: true });
  io.emit('notification', { message: 'Your account has been approved' });
  res.json({ message: 'Student approved' });
});

app.post('/api/admin/deactivate', authenticateToken, restrictTo('admin'), async (req, res) => {
  const { userId } = req.body;
  await User.findByIdAndUpdate(userId, { isActive: false });
  res.json({ message: 'Student deactivated' });
});

app.get('/api/admin/attendance', authenticateToken, restrictTo('admin'), async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const attendance = await Attendance.find({
    date: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
  });
  res.json(attendance);
});

// Onduty Routes
app.post('/api/onduty', authenticateToken, restrictTo('student'), upload.single('attachment'), async (req, res) => {
  const { reason, dates } = req.body;
  const attachment = req.file ? req.file.path : null;
  const onduty = new Onduty({
    rollNumber: req.user.rollNumber,
    reason,
    dates: JSON.parse(dates),
    attachment,
  });
  await onduty.save();
  io.emit('notification', { message: 'New onduty request submitted' });
  res.status(201).json({ message: 'Onduty request submitted' });
});

app.get('/api/onduty', authenticateToken, restrictTo('admin'), async (req, res) => {
  const onduty = await Onduty.find();
  res.json(onduty);
});

app.get('/api/student/onduty', authenticateToken, restrictTo('student'), async (req, res) => {
  const onduty = await Onduty.find({ rollNumber: req.user.rollNumber });
  res.json(onduty);
});

app.post('/api/onduty/action', authenticateToken, restrictTo('admin'), async (req, res) => {
  const { ondutyId, status } = req.body;
  const updated = await Onduty.findByIdAndUpdate(ondutyId, { status }, { new: true });
  if (updated) {
    // Find the student's socket and emit a targeted event
    io.emit('ondutyStatus', {
      rollNumber: updated.rollNumber,
      status: updated.status,
      reason: updated.reason,
      dates: updated.dates,
      _id: updated._id
    });
  }
  io.emit('notification', { message: `Onduty request ${status}` });
  res.json({ message: `Onduty ${status}` });
});

// Event Routes
app.post('/api/events', authenticateToken, restrictTo('admin'), async (req, res) => {
  const { title, description, date, type } = req.body;
  const event = new Event({ title, description, date, type });
  await event.save();
  io.emit('notification', { message: 'New event added' });
  res.status(201).json({ message: 'Event created' });
});

app.get('/api/events', authenticateToken, async (req, res) => {
  const events = await Event.find();
  res.json(events);
});

// Face Recognition Integration
io.on('connection', (socket) => {
  console.log('Client connected');
  socket.on('attendance', async (data) => {
    const { rollNumber, name } = data;
    const attendance = new Attendance({ rollNumber, name });
    await attendance.save();
    io.emit('attendanceUpdate', { rollNumber, name });
  });
  socket.on('unknownFace', (data) => {
    io.emit('notification', { message: 'Unknown face detected' });
  });
});

// Initialize Admin Account
const initAdmin = async () => {
  const adminExists = await User.findOne({ email: 'admin@gmail.com' });
  if (!adminExists) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = new User({
      email: 'admin@gmail.com',
      password: hashedPassword,
      role: 'admin',
      isApproved: true
    });
    await admin.save();
    console.log('Admin account created');
  }
};
initAdmin();

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));