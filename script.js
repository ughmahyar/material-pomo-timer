const elements = {
    timer: document.getElementById('timer'),
    startBtn: document.getElementById('startBtn'),
    resetBtn: document.getElementById('resetBtn'),
    taskInput: document.getElementById('taskInput'),
    taskList: document.getElementById('taskList'),
    dateDisplay: document.getElementById('dateDisplay'),
    sessionCounter: document.getElementById('sessionCounter'),
    workDuration: document.getElementById('workDuration'),
    breakDuration: document.getElementById('breakDuration')
};

let state = {
    isRunning: false,
    isWork: true,
    workDuration: localStorage.getItem('workDuration') || 25 * 60,
    breakDuration: localStorage.getItem('breakDuration') || 5 * 60,
    timeLeft: localStorage.getItem('workDuration') || 25 * 60,
    timerId: null,
    sessionsCompleted: localStorage.getItem('sessionsCompleted') || 0,
    tasks: JSON.parse(localStorage.getItem('tasks')) || []
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    elements.workDuration.value = state.workDuration / 60;
    elements.breakDuration.value = state.breakDuration / 60;
    updateDateTime();
    loadTasks();
    updateDisplay();
});

// Event Listeners
elements.startBtn.addEventListener('click', toggleTimer);
elements.resetBtn.addEventListener('click', resetTimer);
document.getElementById('addTask').addEventListener('click', addTask);
document.getElementById('addMinute').addEventListener('click', () => modifyTime(60));
document.getElementById('subtractMinute').addEventListener('click', () => modifyTime(-60));
elements.workDuration.addEventListener('change', updateDurations);
elements.breakDuration.addEventListener('change', updateDurations);

// Timer Functions
function toggleTimer() {
    if (!state.isRunning) {
        state.isRunning = true;
        elements.startBtn.innerHTML = '<span class="material-icons">pause</span>';
        state.timerId = setInterval(updateTime, 1000);
    } else {
        pauseTimer();
    }
}

function pauseTimer() {
    state.isRunning = false;
    elements.startBtn.innerHTML = '<span class="material-icons">play_arrow</span>';
    clearInterval(state.timerId);
}

function resetTimer() {
    pauseTimer();
    state.timeLeft = state.isWork ? state.workDuration : state.breakDuration;
    updateDisplay();
    saveState();
}

function updateTime() {
    state.timeLeft--;
    
    if (state.timeLeft <= 0) {
        completeSession();
    }
    
    updateDisplay();
}

function completeSession() {
    pauseTimer();
    state.sessionsCompleted++;
    state.isWork = !state.isWork;
    state.timeLeft = state.isWork ? state.workDuration : state.breakDuration;
    
    elements.sessionCounter.textContent = `Sessions Completed: ${state.sessionsCompleted}`;
    saveState();
    
    if (!state.isWork) {
        showBreakNotification();
    }
    
    updateDisplay();
}

// Time Manipulation
function modifyTime(seconds) {
    if (state.isRunning) return;
    
    const newTime = state.timeLeft + seconds;
    if (newTime >= 60) {
        state.timeLeft = newTime;
        elements.timer.style.color = seconds > 0 ? '#4CAF50' : var(--error);
        setTimeout(() => {
            elements.timer.style.color = var(--primary);
        }, 300);
        updateDisplay();
        saveState();
    }
}

function updateDurations() {
    state.workDuration = elements.workDuration.value * 60;
    state.breakDuration = elements.breakDuration.value * 60;
    
    if (!state.isRunning) {
        state.timeLeft = state.isWork ? state.workDuration : state.breakDuration;
        updateDisplay();
    }
    
    saveState();
}

// Task Management
function addTask() {
    const text = elements.taskInput.value.trim();
    if (text) {
        state.tasks.push({
            text,
            completed: false,
            createdAt: new Date()
        });
        elements.taskInput.value = '';
        saveState();
        renderTasks();
    }
}

function toggleTask(index) {
    state.tasks[index].completed = !state.tasks[index].completed;
    saveState();
    renderTasks();
}

function deleteTask(index) {
    state.tasks.splice(index, 1);
    saveState();
    renderTasks();
}

// Helper Functions
function updateDisplay() {
    const minutes = Math.floor(state.timeLeft / 60);
    const seconds = state.timeLeft % 60;
    elements.timer.textContent = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function updateDateTime() {
    const now = new Date();
    elements.dateDisplay.textContent = 
        now.toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric' 
        });
    setTimeout(updateDateTime, 1000);
}

function renderTasks() {
    elements.taskList.innerHTML = state.tasks
        .map((task, index) => `
            <li class="task-item ${task.completed ? 'completed' : ''}">
                <input type="checkbox" 
                    ${task.completed ? 'checked' : ''}
                    onchange="toggleTask(${index})">
                <span>${task.text}</span>
                <button class="mdc-icon-button" onclick="deleteTask(${index})">
                    <img src="icons/delete.svg" alt="Delete">
                </button>
            </li>
        `).join('');
}

function saveState() {
    localStorage.setItem('workDuration', state.workDuration);
    localStorage.setItem('breakDuration', state.breakDuration);
    localStorage.setItem('sessionsCompleted', state.sessionsCompleted);
    localStorage.setItem('tasks', JSON.stringify(state.tasks));
}

function loadTasks() {
    renderTasks();
}

function showBreakNotification() {
    if (Notification.permission === 'granted') {
        new Notification('Break Time!', {
            body: 'Take a 5-minute break'
        });
    }
}

// Request notification permission
if ('Notification' in window) {
    Notification.requestPermission();
}
