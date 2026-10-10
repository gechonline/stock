// LOAD DATA FROM LOCAL STORAGE
function getData() {
  return JSON.parse(localStorage.getItem("students")) || {};
}

function saveData(data) {
  localStorage.setItem("students", JSON.stringify(data));
}

// LOGIN
function login() {
  if (username.value === "admin" && password.value === "1234") {
    show("admin");
    loadRecords(); // LOAD WHEN LOGIN
  } else if (username.value === "user" && password.value === "4321") {
    show("student");
  } else {
    alert("Wrong login");
  }
}

function logout() {
  show("login");
}

// SCREEN SWITCH
function show(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

// ADD GRADE + SAVE TO LOCAL STORAGE
function addGrade() {
  let id = studentId.value.trim();
  let sub = subject.value.trim();
  let sc = parseInt(score.value);

  if (!id || !sub || isNaN(sc)) {
    alert("Fill all fields");
    return;
  }

  let data = getData();

  if (!data[id]) data[id] = [];

  data[id].push({
    subject: sub,
    score: sc,
    grade: getGrade(sc)
  });

  saveData(data);

  // CLEAR INPUT
  subject.value = "";
  score.value = "";

  loadRecords(); // UPDATE DASHBOARD
}

// SHOW DATA ON DASHBOARD
function loadRecords() {
  let data = getData();
  records.innerHTML = "";

  for (let id in data) {
    let div = document.createElement("div");
    div.className = "record-box";

    let html = `<strong>ID: ${id}</strong><br>`;

    data[id].forEach((g, i) => {
      html += `
        ${g.subject}: ${g.score}
        <span class="grade">(${g.grade})</span>
        <button onclick="editGrade('${id}', ${i})">Edit</button>
        <br>
      `;
    });

    html += `<strong>GPA: ${calculateGPA(data[id])}</strong><br><hr>`;

    div.innerHTML = html;
    records.appendChild(div);
  }
}

// EDIT + AUTO SAVE
function editGrade(id, index) {
  let data = getData();

  let newScore = prompt("Enter new score:");
  if (!newScore) return;

  newScore = parseInt(newScore);

  if (isNaN(newScore)) {
    alert("Invalid number");
    return;
  }

  data[id][index].score = newScore;
  data[id][index].grade = getGrade(newScore);

  saveData(data);

  loadRecords();
}

// STUDENT VIEW
function viewGrades() {
  let id = searchId.value.trim();
  let data = getData();

  if (!data[id]) {
    result.innerHTML = "No record found";
    return;
  }

  let html = `<h3>ID: ${id}</h3>`;

  data[id].forEach(g => {
    html += `${g.subject}: ${g.score} (${g.grade})<br>`;
  });

  html += `<br><strong>GPA: ${calculateGPA(data[id])}</strong>`;

  result.innerHTML = html;
}

// GRADE SYSTEM
function getGrade(score) {
  if (score >= 85) return "A";
  if (score >= 75) return "B";
  if (score >= 65) return "C";
  if (score >= 50) return "D";
  return "F";
}

// GPA
function getGPA(score) {
  if (score >= 85) return 4;
  if (score >= 75) return 3;
  if (score >= 65) return 2;
  if (score >= 50) return 1;
  return 0;
}

function calculateGPA(list) {
  let sum = list.reduce((a, b) => a + getGPA(b.score), 0);
  return (sum / list.length).toFixed(2);
}