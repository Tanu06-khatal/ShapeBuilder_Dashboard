/**
 * Shape Builder - Smart Student Performance Tracking
 * Faculty Dashboard & 20-Node Circular Simulation Engine
 */

// --- Global Data Structure ---
let simInterval = null;
let isRunning = false;
let currentStudentId = null;

let students = {};

function createStudentProfile(name) {
    return {
        id: Date.now().toString(),
        name: name,
        total: 0,
        correct: 0,
        wrong: 0,
        streak: 0,
        history: [],
        accuracyHistory: [],
        shapeCounts: { 'Right Triangle': 0, 'Equilateral Triangle': 0, 'Scalene Triangle': 0, 'Square': 0, 'Rectangle': 0, 'Pentagon': 0 }
    };
}

// --- Shape Definitions (Nodes 1-20 circularly) ---
const SHAPES = {
    'Right Triangle': [1, 6, 11],
    'Equilateral Triangle': [1, 8, 14],
    'Scalene Triangle': [1, 4, 12],
    'Square': [1, 6, 11, 16],
    'Rectangle': [1, 5, 11, 15],
    'Pentagon': [1, 5, 9, 13, 17]
};

// --- DOM Elements ---
const elClock = document.getElementById('clock');
const elGrid = document.getElementById('node-grid');
const canvas = document.getElementById('connection-canvas');
const ctx = canvas.getContext('2d');
const mainDashboard = document.getElementById('main-dashboard');

const TOTAL_NODES = 20;

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    initClock();
    initGrid();
    initCharts();
    setupEventListeners();
    updateFacultyOverview();
});

// --- Setup ---
function initClock() {
    setInterval(() => {
        if (elClock) {
            elClock.innerText = new Date().toLocaleTimeString('en-US', {hour12: false});
        }
    }, 1000);
}

function initGrid() {
    elGrid.innerHTML = '';
    
    // We want to arrange 20 nodes in a circle
    // Container is 350x350. Radius is 150px.
    const radius = 150;
    
    for(let i=1; i<=TOTAL_NODES; i++) {
        const node = document.createElement('div');
        node.className = 'node';
        node.id = `node-${i}`;
        node.innerText = i;
        
        // Calculate angle. -Math.PI/2 starts node 1 at the top.
        const angle = ((i - 1) / TOTAL_NODES) * 2 * Math.PI - Math.PI/2;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        
        // Positioning relative to center (50%)
        node.style.left = `calc(50% + ${x}px)`;
        node.style.top = `calc(50% + ${y}px)`;
        
        elGrid.appendChild(node);
    }
    
    const resizeCanvas = () => {
        canvas.width = elGrid.offsetWidth;
        canvas.height = elGrid.offsetHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
}

function setupEventListeners() {
    document.getElementById('btn-theme').addEventListener('click', () => {
        document.body.classList.toggle('light-theme');
    });

    document.getElementById('btn-logout').addEventListener('click', () => {
        window.location.href = 'login.html';
    });

    document.getElementById('btn-add-student').addEventListener('click', () => {
        const input = document.getElementById('new-student-name');
        const name = input.value.trim();
        if(name) {
            const student = createStudentProfile(name);
            students[student.id] = student;
            
            const select = document.getElementById('student-selector');
            const option = document.createElement('option');
            option.value = student.id;
            option.innerText = name;
            select.appendChild(option);
            
            select.value = student.id;
            selectStudent(student.id);
            
            input.value = '';
            showToast(`Student ${name} added`, 'correct');
            updateFacultyOverview();
        }
    });

    document.getElementById('student-selector').addEventListener('change', (e) => {
        selectStudent(e.target.value);
    });

    const btnStart = document.getElementById('btn-start');
    btnStart.addEventListener('click', () => {
        if(!currentStudentId) return;
        if(isRunning) stopSimulation();
        else startSimulation();
    });

    document.getElementById('btn-reset-student').addEventListener('click', () => {
        if(!currentStudentId) return;
        if(isRunning) stopSimulation();
        const name = students[currentStudentId].name;
        students[currentStudentId] = createStudentProfile(name); 
        students[currentStudentId].id = currentStudentId; 
        updateUI();
        updateCharts();
        updateInsights();
        updateFacultyOverview();
        showToast(`Reset data for ${name}`, 'info');
    });

    document.getElementById('btn-export-report').addEventListener('click', exportCSV);
}

// --- Student Management ---
function selectStudent(id) {
    if(isRunning) stopSimulation();
    
    currentStudentId = id;
    
    if(!id) {
        mainDashboard.style.opacity = '0.5';
        mainDashboard.style.pointerEvents = 'none';
        document.getElementById('btn-start').disabled = true;
        document.getElementById('current-student-label').innerText = '';
        return;
    }

    mainDashboard.style.opacity = '1';
    mainDashboard.style.pointerEvents = 'auto';
    document.getElementById('btn-start').disabled = false;
    
    const student = students[currentStudentId];
    document.getElementById('current-student-label').innerText = `(${student.name})`;
    
    updateUI();
    updateCharts();
    updateInsights();
}

// --- Faculty Analytics ---
function updateFacultyOverview() {
    const studentIds = Object.keys(students);
    document.getElementById('fac-total-students').innerText = studentIds.length;
    
    let totalAttempts = 0;
    let bestStudent = 'N/A';
    let highestAccuracy = -1;
    let sumAccuracy = 0;
    let studentsWithAttempts = 0;

    studentIds.forEach(id => {
        const s = students[id];
        totalAttempts += s.total;
        
        if(s.total > 0) {
            studentsWithAttempts++;
            const acc = s.correct / s.total;
            sumAccuracy += acc;
            
            if(acc > highestAccuracy && s.total > 2) { 
                highestAccuracy = acc;
                bestStudent = s.name;
            }
        }
    });

    document.getElementById('fac-total-attempts').innerText = totalAttempts;
    document.getElementById('fac-best-student').innerText = highestAccuracy >= 0 ? bestStudent : 'N/A';
    
    const avgAcc = studentsWithAttempts > 0 ? Math.round((sumAccuracy / studentsWithAttempts) * 100) : 0;
    document.getElementById('fac-avg-accuracy').innerText = `${avgAcc}%`;
}

// --- Simulation Engine ---
function startSimulation() {
    isRunning = true;
    const btnStart = document.getElementById('btn-start');
    btnStart.innerHTML = '<i class="fa-solid fa-stop"></i> Stop Session';
    btnStart.classList.add('running');
    
    document.getElementById('sim-status').classList.add('active');
    document.querySelector('#sim-status .status-text').innerText = 'Session Active...';
    
    showToast(`Session started for ${students[currentStudentId].name}`, 'info');

    generateAttempt();
    simInterval = setInterval(generateAttempt, 3500); // 3.5s to let animations play
}

function stopSimulation() {
    isRunning = false;
    clearInterval(simInterval);
    
    const btnStart = document.getElementById('btn-start');
    btnStart.innerHTML = '<i class="fa-solid fa-play"></i> Start Session';
    btnStart.classList.remove('running');
    
    document.getElementById('sim-status').classList.remove('active');
    document.querySelector('#sim-status .status-text').innerText = 'Ready';
}

function generateAttempt() {
    if(!currentStudentId) return;
    const shapeNames = Object.keys(SHAPES);
    const shapeName = shapeNames[Math.floor(Math.random() * shapeNames.length)];
    const isRight = Math.random() > 0.3; // 70% correct
    
    // Push the simulated data up to Firebase
    pushDataToFirebase(students[currentStudentId].name, shapeName, isRight);
    
    handleAttempt(students[currentStudentId].name, shapeName, isRight);
}

function pushDataToFirebase(studentName, shapeName, isRight) {
    if (window.firebaseAddDoc && window.firebaseCollection && window.firebaseDb) {
        const shapesRef = window.firebaseCollection(window.firebaseDb, "shapes");
        window.firebaseAddDoc(shapesRef, {
            studentName: studentName,
            shapeName: shapeName,
            result: isRight ? "RIGHT" : "WRONG",
            timestamp: new Date().toISOString()
        }).then(() => console.log("Added to Firebase!")).catch(err => console.error("Firebase Sync Error:", err));
    }
}

function handleAttempt(studentName, shapeName, isRight) {
    if(!currentStudentId) return;
    const s = students[currentStudentId];

    const shapeNodes = SHAPES[shapeName] || [];

    s.total++;
    if(s.shapeCounts[shapeName] !== undefined) {
        s.shapeCounts[shapeName]++;
    }
    
    if(isRight) {
        s.correct++;
        s.streak++;
        showToast(`Correct Shape: ${shapeName}`, 'correct');
    } else {
        s.wrong++;
        s.streak = 0;
        showToast(`Wrong Pattern Detected`, 'wrong');
    }

    if(s.streak >= 5) {
        document.getElementById('badge-accuracy').classList.add('earned');
    } else {
        document.getElementById('badge-accuracy').classList.remove('earned');
    }

    const attempt = {
        id: s.total,
        shape: shapeName,
        result: isRight ? 'RIGHT' : 'WRONG',
        time: new Date().toLocaleTimeString('en-US', {hour12: false})
    };
    s.history.unshift(attempt); 
    if(s.history.length > 20) s.history.pop(); 

    const currentAcc = (s.correct / s.total) * 100;
    s.accuracyHistory.push(currentAcc);
    if(s.accuracyHistory.length > 20) s.accuracyHistory.shift();

    updateUI(attempt);
    visualizeShape(shapeNodes, isRight);
    updateCharts();
    updateInsights();
    updateFacultyOverview(); 
}

// --- Visualization ---
function visualizeShape(nodes, isRight) {
    document.querySelectorAll('.node').forEach(n => { n.className = 'node'; });
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if(!nodes || nodes.length === 0) return;

    const nodeCoords = [];
    nodes.forEach(id => {
        const el = document.getElementById(`node-${id}`);
        if(el) {
            el.classList.add('active');
            el.classList.add(isRight ? 'correct' : 'wrong');
            // Offset for visual center of the absolute positioned elements
            nodeCoords.push({
                x: el.offsetLeft, // Absolute position left property already targets center
                y: el.offsetTop
            });
        }
    });

    if(nodeCoords.length > 1) {
        ctx.beginPath();
        ctx.moveTo(nodeCoords[0].x, nodeCoords[0].y);
        for(let i=1; i<nodeCoords.length; i++) {
            ctx.lineTo(nodeCoords[i].x, nodeCoords[i].y);
        }
        
        // All supported shapes are closed polygons, so we always close the path
        ctx.lineTo(nodeCoords[0].x, nodeCoords[0].y);
        
        ctx.strokeStyle = isRight ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)';
        ctx.lineWidth = 4;
        
        // Optional: add a dashed effect for 'wrong' patterns to differentiate visually
        if(!isRight) {
            ctx.setLineDash([10, 10]);
        } else {
            ctx.setLineDash([]);
        }
        
        ctx.stroke();
    }
}

// --- UI Updates ---
function updateUI(latestAttempt = null) {
    if(!currentStudentId) return;
    const s = students[currentStudentId];

    document.getElementById('val-total').innerText = s.total;
    document.getElementById('val-correct').innerText = s.correct;
    document.getElementById('val-wrong').innerText = s.wrong;
    document.getElementById('val-streak').innerText = s.streak;
    
    const rate = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0;
    document.getElementById('val-rate').innerText = `${rate}%`;

    const cardRes = document.getElementById('card-result');
    cardRes.className = 'stat-card';
    
    if(latestAttempt) {
        document.getElementById('val-shape').innerText = latestAttempt.shape;
        document.getElementById('val-result').innerText = latestAttempt.result;
        
        if(latestAttempt.result === 'RIGHT') {
            document.getElementById('val-result').className = 'stat-value correct-text';
            cardRes.classList.add('correct-glow');
        } else {
            document.getElementById('val-result').className = 'stat-value wrong-text';
            cardRes.classList.add('wrong-glow');
        }
    } else {
        document.getElementById('val-shape').innerText = 'None';
        document.getElementById('val-result').innerText = '--';
        document.getElementById('val-result').className = 'stat-value';
        visualizeShape([], false);
    }

    const tbody = document.querySelector('#history-table tbody');
    tbody.innerHTML = '';
    s.history.forEach(h => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${h.id}</td>
            <td>${h.shape}</td>
            <td class="res-${h.result.toLowerCase()}">${h.result}</td>
            <td>${h.time}</td>
        `;
        tbody.appendChild(row);
    });
}

function updateInsights() {
    if(!currentStudentId) return;
    const s = students[currentStudentId];
    const list = document.getElementById('insights-list');
    list.innerHTML = '';

    if(s.total === 0) {
        list.innerHTML = '<li><i class="fa-solid fa-circle-info"></i> Waiting for first attempt...</li>';
        return;
    }

    const rate = Math.round((s.correct / s.total) * 100);
    
    if(rate >= 80) list.innerHTML += `<li><i class="fa-solid fa-arrow-trend-up correct-text"></i> ${s.name} has excellent accuracy!</li>`;
    else if(rate <= 40) list.innerHTML += `<li><i class="fa-solid fa-arrow-trend-down wrong-text"></i> ${s.name} needs more guidance.</li>`;
    else list.innerHTML += `<li><i class="fa-solid fa-minus" style="color:var(--text-secondary)"></i> Keeping a steady learning pace.</li>`;

    if(s.streak >= 3) {
        list.innerHTML += `<li><i class="fa-solid fa-fire" style="color:#f59e0b"></i> ${s.name} is on a ${s.streak} correct streak!</li>`;
    }

    let maxShape = ''; let maxCount = 0;
    for(const [shape, count] of Object.entries(s.shapeCounts)) {
        if(count > maxCount) { maxCount = count; maxShape = shape; }
    }
    if(maxCount > 0) {
        list.innerHTML += `<li><i class="fa-solid fa-shapes" style="color:var(--color-accent)"></i> Most attempted shape is <b>${maxShape}</b>.</li>`;
    }
}

// --- Chart.js ---
let pieChart, barChart, lineChart;

function initCharts() {
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = "'Poppins', sans-serif";

    const ctxPie = document.getElementById('pieChart').getContext('2d');
    pieChart = new Chart(ctxPie, {
        type: 'doughnut',
        data: {
            labels: ['Correct', 'Wrong'],
            datasets: [{ data: [0, 0], backgroundColor: ['#10b981', '#ef4444'], borderWidth: 0, cutout: '70%' }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
    });

    const ctxBar = document.getElementById('barChart').getContext('2d');
    barChart = new Chart(ctxBar, {
        type: 'bar',
        data: {
            labels: Object.keys(SHAPES),
            datasets: [{ label: 'Attempts', data: [0,0,0,0,0,0], backgroundColor: 'rgba(59, 130, 246, 0.6)', borderColor: '#3b82f6', borderWidth: 1, borderRadius: 4 }]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: {stepSize: 1} } }, plugins: { legend: { display: false } } }
    });

    const ctxLine = document.getElementById('lineChart').getContext('2d');
    lineChart = new Chart(ctxLine, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{ label: 'Accuracy %', data: [], borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)', fill: true, tension: 0.3 }]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, max: 100 }, x: { display: false } }, plugins: { legend: { display: false } }, animation: { duration: 0 } }
    });
}

function updateCharts() {
    if(!currentStudentId || !pieChart) return;
    const s = students[currentStudentId];

    pieChart.data.datasets[0].data = [s.correct, s.wrong];
    pieChart.update();

    barChart.data.datasets[0].data = Object.values(s.shapeCounts);
    barChart.update();
    
    lineChart.data.labels = Array(s.accuracyHistory.length).fill('');
    lineChart.data.datasets[0].data = s.accuracyHistory;
    lineChart.update();
}

// --- CSV Export ---
function exportCSV() {
    if(!currentStudentId) return;
    const s = students[currentStudentId];
    if(s.history.length === 0) {
        showToast('No data to export', 'info');
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Student Name," + s.name + "\r\n";
    csvContent += "Total Attempts," + s.total + "\r\n";
    csvContent += "Accuracy," + Math.round((s.correct/s.total)*100) + "%\r\n\r\n";
    csvContent += "Attempt Number,Shape,Result,Time\r\n";

    s.history.forEach(row => {
        csvContent += `${row.id},${row.shape},${row.result},${row.time}\r\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${s.name.replace(/\s+/g, '_')}_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Report downloaded for ${s.name}`, 'correct');
}

// --- Toasts ---
function showToast(msg, type) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast`;
    
    let icon = '<i class="fa-solid fa-info-circle"></i>';
    if(type === 'correct') icon = '<i class="fa-solid fa-check-circle"></i>';
    if(type === 'wrong') icon = '<i class="fa-solid fa-circle-xmark"></i>';
    
    toast.innerHTML = `${icon} <span>${msg}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}
