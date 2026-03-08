import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createServer } from 'http';
import { Server } from 'socket.io';
import Database from 'better-sqlite3';

const PORT = 3000;

// Initialize SQLite database
const db = new Database('cinema.db');

// Setup tables
db.exec(`
  CREATE TABLE IF NOT EXISTS locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS staff (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    location_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    FOREIGN KEY (location_id) REFERENCES locations (id)
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    staff_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    status TEXT NOT NULL,
    responsibilities TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (staff_id) REFERENCES staff (id)
  );
`);

// Add new columns safely if they don't exist
try { db.exec("ALTER TABLE tasks ADD COLUMN title TEXT DEFAULT ''"); } catch (e) {}
try { db.exec("ALTER TABLE tasks ADD COLUMN start_date TEXT DEFAULT ''"); } catch (e) {}
try { db.exec("ALTER TABLE tasks ADD COLUMN end_date TEXT DEFAULT ''"); } catch (e) {}
try { db.exec("ALTER TABLE tasks ADD COLUMN content TEXT DEFAULT ''"); } catch (e) {}

// Seed initial data if empty
const locationCount = db.prepare('SELECT COUNT(*) as count FROM locations').get() as { count: number };
if (locationCount.count === 0) {
  const insertLocation = db.prepare('INSERT INTO locations (name) VALUES (?)');
  const loc1 = insertLocation.run('김해부원').lastInsertRowid;
  const loc2 = insertLocation.run('김해아울렛').lastInsertRowid;

  const insertStaff = db.prepare('INSERT INTO staff (location_id, name, role) VALUES (?, ?, ?)');
  const staff1 = insertStaff.run(loc1, '김민준', '매니저').lastInsertRowid;
  const staff2 = insertStaff.run(loc1, '이서연', '스태프').lastInsertRowid;
  const staff3 = insertStaff.run(loc2, '박지훈', '매니저').lastInsertRowid;
  const staff4 = insertStaff.run(loc2, '최유진', '스태프').lastInsertRowid;

  const insertTask = db.prepare('INSERT INTO tasks (staff_id, name, status, responsibilities) VALUES (?, ?, ?, ?)');
  insertTask.run(staff1, '오픈 준비 및 정산', 'Pending', '매표소 및 매점 포스기 오픈');
  insertTask.run(staff2, '상영관 청소', 'In Progress', '1~3관 상영 종료 후 청소');
  insertTask.run(staff3, '재고 파악', 'Completed', '팝콘 및 음료 재고 확인');
  insertTask.run(staff4, '고객 응대', 'Pending', '로비 안내 및 티켓 확인');
}

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  app.use(express.json());

  // API Routes
  app.get('/api/locations', (req, res) => {
    const locations = db.prepare('SELECT * FROM locations').all();
    res.json(locations);
  });

  app.get('/api/staff', (req, res) => {
    const staff = db.prepare('SELECT * FROM staff').all();
    res.json(staff);
  });

  app.get('/api/tasks', (req, res) => {
    const tasks = db.prepare('SELECT * FROM tasks').all();
    res.json(tasks);
  });

  // Socket.io for real-time updates
  io.on('connection', (socket) => {
    console.log('Client connected');

    socket.on('addTask', (data) => {
      const { staff_id, name, title, start_date, end_date, content, status } = data;
      const stmt = db.prepare('INSERT INTO tasks (staff_id, name, title, start_date, end_date, content, status) VALUES (?, ?, ?, ?, ?, ?, ?)');
      const info = stmt.run(staff_id, name, title || '', start_date || '', end_date || '', content || '', status);
      const newTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(info.lastInsertRowid);
      io.emit('taskAdded', newTask);
    });

    socket.on('updateTask', (data) => {
      const { id, status, title, start_date, end_date, content } = data;
      const stmt = db.prepare('UPDATE tasks SET status = ?, title = ?, start_date = ?, end_date = ?, content = ? WHERE id = ?');
      stmt.run(status, title || '', start_date || '', end_date || '', content || '', id);
      const updatedTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
      io.emit('taskUpdated', updatedTask);
    });

    socket.on('deleteTask', (id) => {
      const stmt = db.prepare('DELETE FROM tasks WHERE id = ?');
      stmt.run(id);
      io.emit('taskDeleted', id);
    });

    // Staff Management
    socket.on('addStaff', (data) => {
      const { location_id, name, role } = data;
      const stmt = db.prepare('INSERT INTO staff (location_id, name, role) VALUES (?, ?, ?)');
      const info = stmt.run(location_id, name, role);
      const newStaff = db.prepare('SELECT * FROM staff WHERE id = ?').get(info.lastInsertRowid);
      io.emit('staffAdded', newStaff);
    });

    socket.on('updateStaff', (data) => {
      const { id, location_id, name, role } = data;
      const stmt = db.prepare('UPDATE staff SET location_id = ?, name = ?, role = ? WHERE id = ?');
      stmt.run(location_id, name, role, id);
      const updatedStaff = db.prepare('SELECT * FROM staff WHERE id = ?').get(id);
      io.emit('staffUpdated', updatedStaff);
    });

    socket.on('deleteStaff', (id) => {
      db.prepare('DELETE FROM tasks WHERE staff_id = ?').run(id);
      db.prepare('DELETE FROM staff WHERE id = ?').run(id);
      io.emit('staffDeleted', id);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
