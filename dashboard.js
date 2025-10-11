document.addEventListener('DOMContentLoaded', async () => {
    // IMMEDIATE SECURITY CHECK
    const userUsername = localStorage.getItem('userUsername');
    const isAdmin = localStorage.getItem('isAdmin') === 'true';

    if (!userUsername) {
        window.location.href = 'login.html';
        return;
    }

    if (isAdmin) {
        window.location.href = 'admin.html';
        return;
    }

    const welcomeMessage = document.getElementById('welcome-message');
    const attendanceTodayMetric = document.getElementById('attendance-today');
    const attendanceTableBody = document.getElementById('attendance-table-body');
    const attendanceForm = document.getElementById('attendance-form');
    const subjectSelect = document.getElementById('subject-select');
    const currentDateElement = document.getElementById('current-date');
    const userFullName = localStorage.getItem('userFullName');

    let currentUserId = null;

    welcomeMessage.textContent = `Welcome, ${userFullName || 'Faculty'}!`;

    const today = new Date();
    currentDateElement.textContent = today.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Format time from 24-hour to 12-hour
    function formatTimeTo12Hour(time24) {
        if (!time24) return '';
        const [hours, minutes] = time24.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minutes} ${ampm}`;
    }

    // Get current user ID
    const getUserId = async () => {
        try {
            const userResponse = await fetch(`http://127.0.0.1:5000/api/profile/${userUsername}`);
            if (userResponse.ok) {
                const userData = await userResponse.json();
                currentUserId = userData.user.id;
                return currentUserId;
            }
        } catch (error) {
            console.error('Error getting user ID:', error);
        }
        return null;
    };

    // Load schedules for the current user
    const loadUserSchedules = async () => {
        try {
            const userId = await getUserId();
            if (!userId) {
                throw new Error('User ID not found');
            }

            const response = await fetch(`http://127.0.0.1:5000/api/admin/users/${userId}/schedules`);
            if (!response.ok) {
                throw new Error('Failed to load schedules');
            }

            const data = await response.json();
            
            subjectSelect.innerHTML = '<option value="">-- Select a Class --</option>';

            if (data.schedules.length === 0) {
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'No schedules assigned - Contact admin';
                option.disabled = true;
                subjectSelect.appendChild(option);
                return;
            }

            // Get current day
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const currentDay = days[today.getDay()];

            // Filter schedules for today
            const todaySchedules = data.schedules.filter(s => s.day_of_week === currentDay);

            if (todaySchedules.length === 0) {
                const option = document.createElement('option');
                option.value = '';
                option.textContent = `No classes scheduled for ${currentDay}`;
                option.disabled = true;
                subjectSelect.appendChild(option);
                
                // Show a message with upcoming classes
                const upcomingMessage = document.createElement('option');
                upcomingMessage.value = '';
                upcomingMessage.textContent = '───── Your Other Classes ─────';
                upcomingMessage.disabled = true;
                subjectSelect.appendChild(upcomingMessage);
                
                // Show all other schedules as reference
                data.schedules.slice(0, 5).forEach(schedule => {
                    const option = document.createElement('option');
                    const startTime = formatTimeTo12Hour(schedule.start_time);
                    const endTime = formatTimeTo12Hour(schedule.end_time);
                    option.value = '';
                    option.textContent = `${schedule.subject_name} - ${schedule.day_of_week} (${startTime} - ${endTime})`;
                    option.disabled = true;
                    subjectSelect.appendChild(option);
                });
                return;
            }

            // Add today's schedules as active options
            todaySchedules.forEach(schedule => {
                const option = document.createElement('option');
                const startTime = formatTimeTo12Hour(schedule.start_time);
                const endTime = formatTimeTo12Hour(schedule.end_time);
                
                // Store schedule data as JSON string in value
                option.value = JSON.stringify({
                    subject_id: schedule.subject_id,
                    subject_name: schedule.subject_name,
                    day: schedule.day_of_week,
                    start_time: schedule.start_time,
                    end_time: schedule.end_time,
                    schedule_id: schedule.id
                });
                
                // Display format: "Subject Name - Day (7:30 AM - 12:30 PM)"
                option.textContent = `${schedule.subject_name} - ${schedule.day_of_week} (${startTime} - ${endTime})`;
                subjectSelect.appendChild(option);
            });

        } catch (error) {
            console.error('Error loading schedules:', error);
            subjectSelect.innerHTML = '<option value="">Error loading schedules - Please refresh</option>';
        }
    };

    const loadAttendanceData = async () => {
        try {
            const response = await fetch('http://127.0.0.1:5000/api/dashboard');
            const data = await response.json();
            const attendanceRecords = data.attendance;

            const todayDate = new Date().toLocaleDateString();
            const todayAttendance = attendanceRecords.filter(record => {
                const recordDate = new Date(record.timestamp).toLocaleDateString();
                return recordDate === todayDate;
            });

            attendanceTodayMetric.textContent = todayAttendance.length;
            attendanceTableBody.innerHTML = '';

            if (todayAttendance.length === 0) {
                const noRecordsRow = document.createElement('tr');
                noRecordsRow.innerHTML = `<td colspan="4" style="text-align: center; color: #a7a7a7;">No attendance records for today.</td>`;
                attendanceTableBody.appendChild(noRecordsRow);
                return;
            }

            todayAttendance.forEach(record => {
                const newRow = document.createElement('tr');
                const timeIn = new Date(record.timestamp).toLocaleString('en-US');
                const userStatus = record.user_status || 'Unknown';
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
            attendanceTableBody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; color: #ff6b6b;">
                        Error loading attendance data. Please refresh the page.
                    </td>
                </tr>
            `;
        }
    };

    // Handle form submission
    attendanceForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const selectedValue = subjectSelect.value;

        if (!selectedValue) {
            alert('Please select a class before marking attendance.');
            return;
        }

        try {
            const scheduleData = JSON.parse(selectedValue);
            
            const startTime = formatTimeTo12Hour(scheduleData.start_time);
            const endTime = formatTimeTo12Hour(scheduleData.end_time);
            const displayText = `${scheduleData.subject_name} - ${scheduleData.day} (${startTime} - ${endTime})`;

            const response = await fetch('http://127.0.0.1:5000/api/attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    full_name: userFullName,
                    subject: displayText,
                    department: scheduleData.subject_name,
                    status: 'Present',
                    timestamp: new Date().toISOString()
                })
            });

            const data = await response.json();
            if (data.success) {
                subjectSelect.value = '';
                await loadAttendanceData();
                alert(`✅ Attendance marked successfully!\n\n${displayText}`);
            } else {
                alert('❌ Failed to mark attendance: ' + data.message);
            }
        } catch (error) {
            console.error('Error marking attendance:', error);
            alert('❌ Error marking attendance. Please try again.');
        }
    });

    // Initial data load
    await loadUserSchedules();
    await loadAttendanceData();
});