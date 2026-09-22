const express = require('express');
const cors = require('cors');
const jsonfile = require('jsonfile');
const fs = require('fs');
const path = require('path');

const app = express();

// 💡 1. ОНЛАЙН СЕРВЕРИЙН ПОРТ ТОХИРУУЛГА
// Render гэх мэт сервер дээр process.env.PORT-ийг ашиглана, локал дээр 3000 портыг ашиглана.
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'database.json');

// Middleware тохиргоонууд
app.use(cors());
app.use(express.json());

// 💡 2. public ХАВТАСНЫ СТАТИК ФАЙЛУУДЫГ (HTML, CSS, JS) УНШИХ
app.use(express.static(path.join(__dirname, 'public')));

// 3. Өгөгдлийн бааз (database.json) шалгаж үүсгэх
if (!fs.existsSync(DB_FILE)) {
  const initialData = {
    users: [
      { id: "admin1", username: "admin", password: "123", role: "ADMIN" }
    ],
    classes: [],
    questions: [],
    results: []
  };
  jsonfile.writeFileSync(DB_FILE, initialData, { spaces: 2 });
}

// ================= API ROUTES =================

// --- 1. Нэвтрэх API ---
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const db = await jsonfile.readFile(DB_FILE);
    const user = db.users.find(u => u.username === username && u.password === password);
    
    if (!user) {
      return res.status(401).json({ success: false, message: "Нэвтрэх нэр эсвэл нууц үг буруу!" });
    }
    res.json({ success: true, role: user.role, username: user.username, id: user.id });
  } catch (error) {
    res.status(500).json({ success: false, message: "Серверийн алдаа гарлаа." });
  }
});

// --- 2. Админ: Багш үүсгэх болон жагсаалт авах ---
app.get('/api/admin/teachers', async (req, res) => {
  try {
    const db = await jsonfile.readFile(DB_FILE);
    const teachers = db.users.filter(u => u.role === 'TEACHER');
    res.json(teachers);
  } catch (error) {
    res.status(500).json({ success: false, message: "Өгөгдөл уншихад алдаа гарлаа." });
  }
});

app.post('/api/admin/teachers', async (req, res) => {
  try {
    const { username, password } = req.body;
    const db = await jsonfile.readFile(DB_FILE);

    if (db.users.some(u => u.username === username)) {
      return res.status(400).json({ success: false, message: "Багшийн нэр давхцаж байна!" });
    }

    const newTeacher = { id: 't_' + Date.now(), username, password, role: 'TEACHER' };
    db.users.push(newTeacher);
    await jsonfile.writeFile(DB_FILE, db, { spaces: 2 });
    res.json({ success: true, message: "Багш амжилттай бүртгэгдлээ." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Серверийн алдаа гарлаа." });
  }
});

// --- 3. Багш: Анги болон сурагчид удирдах ---
app.get('/api/teacher/classes/:teacherId', async (req, res) => {
  try {
    const db = await jsonfile.readFile(DB_FILE);
    const list = db.classes.filter(c => c.teacherId === req.params.teacherId);
    res.json(list);
  } catch (error) {
    res.status(500).json({ success: false, message: "Өгөгдөл уншихад алдаа гарлаа." });
  }
});

app.post('/api/teacher/classes', async (req, res) => {
  try {
    const { teacherId, className, students } = req.body;
    const db = await jsonfile.readFile(DB_FILE);
    
    const newClass = { id: 'c_' + Date.now(), teacherId, className, students };
    db.classes.push(newClass);
    await jsonfile.writeFile(DB_FILE, db, { spaces: 2 });
    res.json({ success: true, message: "Анги амжилттай хадгалагдлаа." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Серверийн алдаа гарлаа." });
  }
});

app.put('/api/teacher/classes/:classId', async (req, res) => {
  try {
    const { classId } = req.params;
    const { className, students } = req.body;
    
    const db = await jsonfile.readFile(DB_FILE);
    const index = db.classes.findIndex(c => c.id === classId);

    if (index !== -1) {
      db.classes[index].className = className;
      db.classes[index].students = students;
      await jsonfile.writeFile(DB_FILE, db, { spaces: 2 });
      res.json({ success: true, message: 'Ангийн мэдээлэл амжилттай шинэчлэгдлээ.' });
    } else {
      res.status(404).json({ success: false, message: 'Анги олдсонгүй.' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Серверийн алдаа гарлаа.' });
  }
});

app.delete('/api/teacher/classes/:classId', async (req, res) => {
  try {
    const { classId } = req.params;
    const db = await jsonfile.readFile(DB_FILE);
    
    db.classes = db.classes.filter(c => c.id !== classId);
    await jsonfile.writeFile(DB_FILE, db, { spaces: 2 });

    res.json({ success: true, message: 'Анги амжилттай устгагдлаа.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Серверийн алдаа гарлаа.' });
  }
});

// --- 4. Багш: Асуултууд удирдах ---
app.get('/api/teacher/questions/:teacherId', async (req, res) => {
  try {
    const db = await jsonfile.readFile(DB_FILE);
    const list = db.questions.filter(q => q.teacherId === req.params.teacherId);
    res.json(list);
  } catch (error) {
    res.status(500).json({ success: false, message: "Өгөгдөл уншихад алдаа гарлаа." });
  }
});

app.post('/api/teacher/questions', async (req, res) => {
  try {
    const { teacherId, title, items } = req.body;
    const db = await jsonfile.readFile(DB_FILE);

    const newSet = { id: 'q_' + Date.now(), teacherId, title, items };
    db.questions.push(newSet);
    await jsonfile.writeFile(DB_FILE, db, { spaces: 2 });
    res.json({ success: true, message: "Асуултын багц хадгалагдлаа." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Серверийн алдаа гарлаа." });
  }
});

app.put('/api/teacher/questions/:quizId', async (req, res) => {
  try {
    const { quizId } = req.params;
    const { title, items } = req.body;

    const db = await jsonfile.readFile(DB_FILE);
    const index = db.questions.findIndex(q => q.id === quizId);

    if (index !== -1) {
      db.questions[index].title = title;
      db.questions[index].items = items;
      await jsonfile.writeFile(DB_FILE, db, { spaces: 2 });
      res.json({ success: true, message: 'Асуултын багц амжилттай шинэчлэгдлээ.' });
    } else {
      res.status(404).json({ success: false, message: 'Асуултын багц олдсонгүй.' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Серверийн алдаа гарлаа.' });
  }
});

app.delete('/api/teacher/questions/:quizId', async (req, res) => {
  try {
    const { quizId } = req.params;
    const db = await jsonfile.readFile(DB_FILE);

    db.questions = db.questions.filter(q => q.id !== quizId);
    await jsonfile.writeFile(DB_FILE, db, { spaces: 2 });

    res.json({ success: true, message: 'Асуултын багц амжилттай устгагдлаа.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Серверийн алдаа гарлаа.' });
  }
});

// --- 5. Багш: Дүн ба анализ хадгалах, харах ---
app.get('/api/teacher/results/:teacherId', async (req, res) => {
  try {
    const db = await jsonfile.readFile(DB_FILE);
    const list = db.results.filter(r => r.teacherId === req.params.teacherId);
    res.json(list);
  } catch (error) {
    res.status(500).json({ success: false, message: "Өгөгдөл уншихад алдаа гарлаа." });
  }
});

app.post('/api/teacher/results', async (req, res) => {
  try {
    const { teacherId, classId, className, quizTitle, records } = req.body;
    const db = await jsonfile.readFile(DB_FILE);

    const newResult = {
      id: 'r_' + Date.now(),
      teacherId,
      classId,
      className,
      quizTitle,
      date: new Date().toLocaleDateString('mn-MN'),
      records
    };
    db.results.push(newResult);
    await jsonfile.writeFile(DB_FILE, db, { spaces: 2 });
    res.json({ success: true, message: "Дүн хадгалагдлаа." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Серверийн алдаа гарлаа." });
  }
});

// 💡 6. СЕРВЕР АЖИЛЛУУЛАХ
app.listen(PORT, () => {
  console.log(`🚀 Сервер амжилттай асаалаа: http://localhost:${PORT}`);
});
