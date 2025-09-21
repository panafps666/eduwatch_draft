const facultyMembers = [
    { id: 1, name: 'Dr. John Doe', department: 'IT Department' },
    { id: 2, name: 'Prof. Jane Smith', department: 'IT Department' },
    { id: 3, name: 'Dr. Michael Johnson', department: 'IT Department' },
];

const attendanceTodaySpan = document.getElementById('attendance-today');
const attendanceTableBody = document.getElementById('attendance-table-body');
const attendanceForm = document.getElementById('attendance-form');
const currentDateEl = document.getElementById('current-date');
const welcomeMessage = document.getElementById('welcome-message');
const statusSelect = document.getElementById('status-select');

let attendanceRecords = [];

// Display current date
const today = new Date();
const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
currentDateEl.textContent = today.toLocaleDateString('en-US', options);

// Load user info from local storage
const userFullName = localStorage.getItem('userFullName') || 'Faculty';
const userUsername = localStorage.getItem('userUsername') || '';
const userDepartment = 'IT Department'; // Set department as IT Department

// Function to find the user's ID
const getUserIdByUsername = (username) => {
    // This is a simple placeholder. In a real app, you would get this from a database.
    const user = facultyMembers.find(f => f.name.toLowerCase().includes(username.toLowerCase()));
    return user ? user.id : Math.floor(Math.random() * 1000) + 10;
};

const userId = getUserIdByUsername(userUsername);

// Handle form submission
attendanceForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const selectedStatus = statusSelect.value;
    if (!selectedStatus) {
        alert('Please select your status (Full-Time or Part-Time).');
        return;
    }

    // Check if user has already been marked present today
    const isPresent = attendanceRecords.some(record => record.name === userFullName);
    if (isPresent) {
        alert(`${userFullName} has already been marked present today.`);
        return;
    }

    const newRecord = {
        id: userId,
        name: userFullName,
        department: userDepartment,
        status: 'Present',
        employmentStatus: selectedStatus,
        timestamp: new Date().toLocaleString(),
    };

    attendanceRecords.push(newRecord);

    // Update attendance count
    attendanceTodaySpan.textContent = attendanceRecords.length;

    // Add new row to the table
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td>${newRecord.name}</td>
        <td>${newRecord.department}</td>
        <td>${newRecord.employmentStatus}</td>
        <td>${newRecord.timestamp}</td>
    `;
    attendanceTableBody.appendChild(newRow);

    alert('Attendance submitted successfully!');
});

// Function to load and display the user's full name
const loadUserName = () => {
    welcomeMessage.textContent = `Welcome, ${userFullName}!`;
};

// Load the user's name when the page is loaded
loadUserName();