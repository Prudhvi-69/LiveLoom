# 📚 Example Projects to Try

Copy and paste these examples into LiveLoom to get started!

---

## 🎨 Example 1: Animated Card

### HTML
```html
<div class="card">
  <h2>Welcome!</h2>
  <p>This is an animated card with hover effects.</p>
  <button>Click Me</button>
</div>
```

### CSS
```css
body {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: Arial, sans-serif;
}

.card {
  background: white;
  padding: 40px;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  text-align: center;
  transition: transform 0.3s ease;
}

.card:hover {
  transform: translateY(-10px);
}

h2 {
  color: #667eea;
  margin-bottom: 15px;
}

button {
  background: #667eea;
  color: white;
  border: none;
  padding: 12px 30px;
  border-radius: 25px;
  cursor: pointer;
  font-size: 16px;
  margin-top: 20px;
  transition: background 0.3s;
}

button:hover {
  background: #764ba2;
}
```

### JavaScript
```javascript
document.querySelector('button').addEventListener('click', function() {
  alert('Hello from LiveLoom!');
});
```

---

## 🌈 Example 2: Color Palette Generator

### HTML
```html
<div class="container">
  <h1>🎨 Color Palette Generator</h1>
  <button id="generate">Generate New Palette</button>
  <div id="palette"></div>
</div>
```

### CSS
```css
body {
  margin: 0;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: #1a1a2e;
  color: white;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  text-align: center;
}

h1 {
  margin-bottom: 30px;
}

#generate {
  background: #16213e;
  color: white;
  border: 2px solid #0f3460;
  padding: 15px 40px;
  font-size: 18px;
  border-radius: 10px;
  cursor: pointer;
  margin-bottom: 30px;
  transition: all 0.3s;
}

#generate:hover {
  background: #0f3460;
  transform: scale(1.05);
}

#palette {
  display: flex;
  gap: 20px;
  justify-content: center;
  flex-wrap: wrap;
}

.color-box {
  width: 150px;
  height: 150px;
  border-radius: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.3s;
  box-shadow: 0 5px 15px rgba(0,0,0,0.3);
}

.color-box:hover {
  transform: scale(1.1);
}
```

### JavaScript
```javascript
function generateRandomColor() {
  return '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
}

function generatePalette() {
  const palette = document.getElementById('palette');
  palette.innerHTML = '';
  
  for (let i = 0; i < 5; i++) {
    const color = generateRandomColor();
    const box = document.createElement('div');
    box.className = 'color-box';
    box.style.background = color;
    box.textContent = color;
    box.onclick = () => {
      navigator.clipboard.writeText(color);
      alert('Copied: ' + color);
    };
    palette.appendChild(box);
  }
}

document.getElementById('generate').addEventListener('click', generatePalette);
generatePalette();
```

---

## ⏱️ Example 3: Simple Timer

### HTML
```html
<div class="timer-container">
  <h1>⏱️ Timer</h1>
  <div class="display" id="display">00:00</div>
  <div class="controls">
    <button id="start">Start</button>
    <button id="pause">Pause</button>
    <button id="reset">Reset</button>
  </div>
</div>
```

### CSS
```css
body {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(to right, #0f2027, #203a43, #2c5364);
  font-family: 'Arial', sans-serif;
  margin: 0;
}

.timer-container {
  background: rgba(255, 255, 255, 0.1);
  padding: 50px;
  border-radius: 30px;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0,0,0,0.3);
  text-align: center;
}

h1 {
  color: white;
  margin-bottom: 30px;
  font-size: 36px;
}

.display {
  font-size: 72px;
  color: #00ff88;
  font-weight: bold;
  margin-bottom: 40px;
  text-shadow: 0 0 20px rgba(0,255,136,0.5);
}

.controls {
  display: flex;
  gap: 15px;
}

button {
  padding: 15px 30px;
  font-size: 18px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s;
}

#start {
  background: #00ff88;
  color: #0f2027;
}

#pause {
  background: #ffd700;
  color: #0f2027;
}

#reset {
  background: #ff4757;
  color: white;
}

button:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0,0,0,0.3);
}
```

### JavaScript
```javascript
let seconds = 0;
let interval = null;

const display = document.getElementById('display');
const startBtn = document.getElementById('start');
const pauseBtn = document.getElementById('pause');
const resetBtn = document.getElementById('reset');

function updateDisplay() {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  display.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

startBtn.addEventListener('click', () => {
  if (!interval) {
    interval = setInterval(() => {
      seconds++;
      updateDisplay();
    }, 1000);
  }
});

pauseBtn.addEventListener('click', () => {
  clearInterval(interval);
  interval = null;
});

resetBtn.addEventListener('click', () => {
  clearInterval(interval);
  interval = null;
  seconds = 0;
  updateDisplay();
});
```

---

## 🎯 Example 4: Todo List

### HTML
```html
<div class="todo-app">
  <h1>📝 My Todo List</h1>
  <div class="input-container">
    <input type="text" id="todoInput" placeholder="Add a new task...">
    <button id="addBtn">Add</button>
  </div>
  <ul id="todoList"></ul>
</div>
```

### CSS
```css
body {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  margin: 0;
}

.todo-app {
  background: white;
  padding: 30px;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  width: 400px;
}

h1 {
  text-align: center;
  color: #667eea;
  margin-bottom: 25px;
}

.input-container {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

#todoInput {
  flex: 1;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 16px;
  outline: none;
}

#todoInput:focus {
  border-color: #667eea;
}

#addBtn {
  background: #667eea;
  color: white;
  border: none;
  padding: 12px 25px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
}

#addBtn:hover {
  background: #764ba2;
}

#todoList {
  list-style: none;
  padding: 0;
  margin: 0;
}

.todo-item {
  background: #f5f5f5;
  padding: 15px;
  margin-bottom: 10px;
  border-radius: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s;
}

.todo-item:hover {
  background: #e0e0e0;
}

.todo-item.completed {
  text-decoration: line-through;
  opacity: 0.6;
}

.delete-btn {
  background: #ff4757;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
}

.delete-btn:hover {
  background: #ff3838;
}
```

### JavaScript
```javascript
const todoInput = document.getElementById('todoInput');
const addBtn = document.getElementById('addBtn');
const todoList = document.getElementById('todoList');

function addTodo() {
  const text = todoInput.value.trim();
  if (!text) return;
  
  const li = document.createElement('li');
  li.className = 'todo-item';
  li.innerHTML = `
    <span>${text}</span>
    <button class="delete-btn">Delete</button>
  `;
  
  li.querySelector('span').addEventListener('click', function() {
    li.classList.toggle('completed');
  });
  
  li.querySelector('.delete-btn').addEventListener('click', function() {
    li.remove();
  });
  
  todoList.appendChild(li);
  todoInput.value = '';
}

addBtn.addEventListener('click', addTodo);
todoInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') addTodo();
});
```

---

## 🎮 Try These!

1. Copy each example section by section (HTML, CSS, JS)
2. Paste into your LiveLoom editors
3. See the live preview instantly!
4. Save as a project with a descriptive name
5. Modify and experiment with the code!

**Happy Coding! 🚀**
