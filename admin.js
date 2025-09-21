document.addEventListener('DOMContentLoaded', () => {
    const adminAttendanceTableBody = document.getElementById('admin-attendance-table-body');
    const isLoggedIn = localStorage.getItem('userUsername');
    const isAdmin = localStorage.getItem('isAdmin');

    // Redirect if not logged in or not an admin
    if (!isLoggedIn || isAdmin !== 'true') {
        alert('You do not have permission to view this page.');
        window.location.href = 'login.html';
        return;
    }

    // Dummy data for demonstration purposes
    const allAttendanceRecords = [
        { name: 'Dr. John Doe', department: 'IT Department', status: 'Full-Time', timestamp: '10/26/2023, 8:00:00 AM' },
        { name: 'Prof. Jane Smith', department: 'IT Department', status: 'Part-Time', timestamp: '10/26/2023, 8:15:00 AM' },
        { name: 'Dr. Michael Johnson', department: 'IT Department', status: 'Full-Time', timestamp: '10/26/2023, 8:30:00 AM' }
    ];

    // Load and display attendance data
    const loadAttendanceData = () => {
        // Clear existing table rows
        adminAttendanceTableBody.innerHTML = '';

        // In a real application, this would fetch data from a server
        // For this example, we use the dummy data above
        allAttendanceRecords.forEach(record => {
            const newRow = document.createElement('tr');
            newRow.innerHTML = `
                <td>${record.name}</td>
                <td>${record.department}</td>
                <td>${record.status}</td>
                <td>${record.timestamp}</td>
            `;
            adminAttendanceTableBody.appendChild(newRow);
        });
    };

    // Load data when the page loads
    loadAttendanceData();
});