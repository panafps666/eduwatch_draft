document.addEventListener('DOMContentLoaded', async () => {
    const welcomeMessage = document.getElementById('welcome-message');
    const attendanceTodayMetric = document.getElementById('attendance-today');
    const attendanceTableBody = document.getElementById('attendance-table-body');
    const attendanceForm = document.getElementById('attendance-form');
    const subjectSelect = document.getElementById('subject-select');
    const currentDateElement = document.getElementById('current-date');

    // Get current user details from localStorage
    const userUsername = localStorage.getItem('userUsername');
    const userFullName = localStorage.getItem('userFullName');
    const isAdmin = localStorage.getItem('isAdmin') === 'true';

    // Redirect if not logged in
    if (!userUsername) {
        window.location.href = 'login.html';
        return;
    }

    // Update welcome message
    welcomeMessage.textContent = `Welcome, ${userFullName || 'Faculty'}!`;

    // Display the current date
    const today = new Date();
    currentDateElement.textContent = today.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Load subjects from API
    const loadSubjects = async () => {
        try {
            // Get current user ID from localStorage or API
            const userUsername = localStorage.getItem('userUsername');
            let userId = null;
            
            // Get user ID first
            const userResponse = await fetch(`http://127.0.0.1:5000/api/profile/${userUsername}`);
            if (userResponse.ok) {
                const userData = await userResponse.json();
                userId = userData.user.id;
            }
            
            let response;
            if (userId) {
                // Try to get user's assigned subjects first
                response = await fetch(`http://127.0.0.1:5000/api/users/${userId}/subjects`);
            } else {
                // Fallback to all subjects
                response = await fetch('http://127.0.0.1:5000/api/subjects');
            }
            
            if (response.ok) {
                const data = await response.json();
                
                // Clear existing options except the empty one
                subjectSelect.innerHTML = '<option value=""></option>';
                
                // Add subjects from database
                data.subjects.forEach(subject => {
                    const option = document.createElement('option');
                    option.value = subject.name;
                    option.textContent = subject.name;
                    subjectSelect.appendChild(option);
                });
            } else {
                throw new Error('Failed to load subjects');
            }
        } catch (error) {
            console.error('Error loading subjects:', error);
            // Fallback to default subjects
            const defaultSubjects = [
                'Mathematics', 'English', 'Science', 'History', 'Computer Science',
                'Physics', 'Chemistry', 'Biology', 'Geography', 'Literature',
                'Art', 'Music', 'Physical Education', 'Economics', 'Psychology'
            ];
            
            subjectSelect.innerHTML = '<option value=""></option>';
            defaultSubjects.forEach(subject => {
                const option = document.createElement('option');
                option.value = subject;
                option.textContent = subject;
                subjectSelect.appendChild(option);
            });
        }
    };

    const loadAttendanceData = async () => {
        try {
            const response = await fetch('http://127.0.0.1:5000/api/dashboard');
            const data = await response.json();
            const attendanceRecords = data.attendance;

            // Filter for today's attendance
            const todayDate = new Date().toLocaleDateString();
            const todayAttendance = attendanceRecords.filter(record => {
                const recordDate = new Date(record.timestamp).toLocaleDateString();
                return recordDate === todayDate;
            });

            // Update the attendance count
            attendanceTodayMetric.textContent = todayAttendance.length;

            // Clear existing table rows
            attendanceTableBody.innerHTML = '';

            if (todayAttendance.length === 0) {
                const noRecordsRow = document.createElement('tr');
                noRecordsRow.innerHTML = `<td colspan="4" style="text-align: center; color: #a7a7a7;">No attendance records for today.</td>`;
                attendanceTableBody.appendChild(noRecordsRow);
                return;
            }

            // Populate the table with new column order: Faculty Name, Status, Subject, Time In
            todayAttendance.forEach(record => {
                const newRow = document.createElement('tr');
                const timeIn = new Date(record.timestamp).toLocaleString('en-US');
                
                // Get user status from database (Full Time/Part Time)
                const userStatus = record.user_status || 'Unknown';
                // Get subject from the attendance record
                const subject = record.subject || record.department || 'Not specified';
                
                newRow.innerHTML = `
                    <td>${record.name}</td>
                    <td>${userStatus}</td>
                    <td>${subject}</td>
                    <td>${timeIn}</td>
                `;
                attendanceTableBody.appendChild(newRow);
            });
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            // Show error in table
            attendanceTableBody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; color: #ff6b6b;">
                        Error loading attendance data. Please refresh the page.
                    </td>
                </tr>
            `;
        }
    };

    // Handle form submission with API call
    attendanceForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const selectedSubject = subjectSelect.value;

        if (!selectedSubject) {
            alert('Please select a subject before marking attendance.');
            return;
        }

        try {
            const response = await fetch('http://127.0.0.1:5000/api/attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    full_name: userFullName,
                    department: selectedSubject, // Using subject instead of department
                    subject: selectedSubject,    // Adding explicit subject field
                    status: 'Present',           // Default status for attendance
                    timestamp: new Date().toISOString()
                })
            });

            const data = await response.json();
            if (data.success) {
                console.log('Attendance marked successfully!');
                // Reset form
                subjectSelect.value = '';
                // Refresh the table
                await loadAttendanceData();
                // Show success message
                alert('Attendance marked successfully for ' + selectedSubject);
            } else {
                console.error('Failed to mark attendance:', data.message);
                alert('Failed to mark attendance: ' + data.message);
            }
        } catch (error) {
            console.error('Error marking attendance:', error);
            alert('Error marking attendance. Please try again.');
        }
    });

    // Initial data load
    await loadSubjects();
    await loadAttendanceData();
});