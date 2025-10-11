document.addEventListener('DOMContentLoaded', async () => {
    const adminAttendanceTableBody = document.getElementById('admin-attendance-table-body');
    const usersTableBody = document.getElementById('users-table-body');
    const subjectsTableBody = document.getElementById('subjects-table-body');
    const reportsTableBody = document.getElementById('reports-table-body');

    const searchAttendanceInput = document.getElementById('search-attendance-input');
    const searchUsersInput = document.getElementById('search-users-input');
    const searchSubjectsInput = document.getElementById('search-subjects-input');
    
    const clearRecordsBtn = document.getElementById('clear-records-btn');
    const addSubjectBtn = document.getElementById('add-subject-btn');
    
    const attendanceTab = document.getElementById('attendance-tab');
    const usersTab = document.getElementById('users-tab');
    const subjectsTab = document.getElementById('subjects-tab');
    const attendanceContent = document.getElementById('attendance-content');
    const usersContent = document.getElementById('users-content');
    const subjectsContent = document.getElementById('subjects-content');
    const reportsTab = document.getElementById('reports-tab');
    const reportsContent = document.getElementById('reports-content');
    const reportStartDate = document.getElementById('report-start-date');   
    const reportEndDate = document.getElementById('report-end-date');
    const generateReportBtn = document.getElementById('generate-report-btn');
    const exportReportBtn = document.getElementById('export-report-btn');
    const analyticsTab = document.getElementById('analytics-tab');
    const analyticsContent = document.getElementById('analytics-content');
    
    const editUserModal = document.getElementById('edit-user-modal');
    const addSubjectModal = document.getElementById('add-subject-modal');
    const closeEditUser = document.getElementById('close-edit-user');
    const closeAddSubject = document.getElementById('close-add-subject');
    const editUserForm = document.getElementById('edit-user-form');
    const addSubjectForm = document.getElementById('add-subject-form');

    const isLoggedIn = localStorage.getItem('userUsername');
    const isAdmin = localStorage.getItem('isAdmin');

    let allAttendanceRecords = [];
    let allUsers = [];
    let allSubjects = [];
    let currentEditingUserId = null;
    let currentReportData = [];
    let currentFilter = 'all';
    let employeeBarChart = null;
    let statusPieChart = null;

    const messageArea = document.createElement('div');
    messageArea.className = 'message-area';
    document.body.prepend(messageArea);

    const displayMessage = (message, type = 'info') => {
        messageArea.textContent = message;
        messageArea.className = `message-area ${type}`;
        messageArea.style.display = 'block';
        setTimeout(() => {
            messageArea.style.display = 'none';
        }, 5000);
    };

    if (!isLoggedIn || isAdmin !== 'true') {
        displayMessage('You do not have permission to view this page. Redirecting...', 'error');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
        return;
    }

    const navLinks = document.getElementById('nav-links');
    navLinks.innerHTML = `
        <a href="admin.html">Admin</a>
        <a href="About.html">About Us</a>
        <a href="FAQ.html">FAQ</a>
        <a href="profile.html">Profile</a>
    `;

    const switchTab = (activeTab, activeContent) => {
        document.querySelectorAll('.tab-btn').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        activeTab.classList.add('active');
        activeContent.classList.add('active');
    };

    attendanceTab.addEventListener('click', () => switchTab(attendanceTab, attendanceContent));
    usersTab.addEventListener('click', () => {
        switchTab(usersTab, usersContent);
        loadAllUsers();
    });
    subjectsTab.addEventListener('click', () => {
        switchTab(subjectsTab, subjectsContent);
        loadAllSubjects();
    });
    reportsTab.addEventListener('click', () => switchTab(reportsTab, reportsContent));
    analyticsTab.addEventListener('click', () => {
        switchTab(analyticsTab, analyticsContent);
        loadAnalytics();
    });

    const renderAttendanceTable = (records) => {
        adminAttendanceTableBody.innerHTML = '';
        if (records.length === 0) {
            adminAttendanceTableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #a7a7a7;">No attendance records found.</td></tr>`;
            return;
        }

        records.forEach(record => {
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
            adminAttendanceTableBody.appendChild(newRow);
        });
    };

    const renderUsersTable = (users) => {
        usersTableBody.innerHTML = '';
        if (users.length === 0) {
            usersTableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #a7a7a7;">No users found.</td></tr>`;
            return;
        }

        users.forEach(user => {
            const newRow = document.createElement('tr');
            const role = user.is_admin ? 'Administrator' : 'Faculty';
            const status = user.status || 'Unknown';
            
            newRow.innerHTML = `
                <td>${user.full_name}</td>
                <td>${user.username}</td>
                <td>${user.email || 'Not provided'}</td>
                <td>${status}</td>
                <td>${role}</td>
                <td>
                    <button onclick="editUser(${user.id})" class="edit-btn">Edit</button>
                </td>
            `;
            usersTableBody.appendChild(newRow);
        });
    };

    const renderSubjectsTable = (subjects) => {
        subjectsTableBody.innerHTML = '';
        if (subjects.length === 0) {
            subjectsTableBody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: #a7a7a7;">No subjects found.</td></tr>`;
            return;
        }

        subjects.forEach(subject => {
            const newRow = document.createElement('tr');
            newRow.innerHTML = `
                <td>${subject.name}</td>
                <td>${subject.description || 'No description'}</td>
                <td>
                    <button onclick="deleteSubject(${subject.id})" class="delete-btn">Delete</button>
                </td>
            `;
            subjectsTableBody.appendChild(newRow);
        });
    };

    const loadAllAttendanceData = async () => {
        try {
            const attendanceResponse = await fetch('http://127.0.0.1:5000/api/dashboard');
            if (!attendanceResponse.ok) throw new Error('Failed to fetch attendance data');
            const attendanceData = await attendanceResponse.json();
            allAttendanceRecords = attendanceData.attendance;
            renderAttendanceTable(allAttendanceRecords);
            displayMessage('Attendance data loaded successfully!', 'success');
        } catch (error) {
            console.error('Error fetching data:', error);
            displayMessage('Failed to load attendance data. Please try again.', 'error');
        }
    };

    const loadAllUsers = async () => {
        try {
            const response = await fetch('http://127.0.0.1:5000/api/admin/users');
            if (!response.ok) throw new Error('Failed to fetch users');
            const data = await response.json();
            allUsers = data.users;
            renderUsersTable(allUsers);
        } catch (error) {
            console.error('Error fetching users:', error);
            displayMessage('Failed to load users. Please try again.', 'error');
        }
    };

    const loadAllSubjects = async () => {
        try {
            const response = await fetch('http://127.0.0.1:5000/api/subjects');
            if (!response.ok) throw new Error('Failed to fetch subjects');
            const data = await response.json();
            allSubjects = data.subjects;
            renderSubjectsTable(allSubjects);
        } catch (error) {
            console.error('Error fetching subjects:', error);
            displayMessage('Failed to load subjects. Please try again.', 'error');
        }
    };

    // ANALYTICS FUNCTIONS
    const loadAnalytics = async () => {
        try {
            const attendanceResponse = await fetch('http://127.0.0.1:5000/api/dashboard');
            const attendanceData = await attendanceResponse.json();
            
            const schedulesResponse = await fetch('http://127.0.0.1:5000/api/admin/schedules');
            const schedulesData = await schedulesResponse.json();
            
            if (attendanceData.attendance && schedulesData.schedules) {
                processAnalyticsData(attendanceData.attendance, schedulesData.schedules);
            }
        } catch (error) {
            console.error('Error loading analytics:', error);
            displayMessage('Failed to load analytics data', 'error');
        }
    };

    const processAnalyticsData = (records, schedules) => {
        const employeeMap = {};
        let totalOnTime = 0;
        let totalLate = 0;

        records.forEach(record => {
            const recordTime = new Date(record.timestamp);
            const recordDay = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][recordTime.getDay()];
            
            let isLate = false;

            for (const schedule of schedules) {
                const nameMatch = schedule.user_name.trim().toLowerCase() === record.name.trim().toLowerCase();
                const dayMatch = schedule.day_of_week === recordDay;
                
                if (nameMatch && dayMatch) {
                    const [schedHours, schedMinutes] = schedule.start_time.split(':').map(Number);
                    const [schedEndHours, schedEndMinutes] = schedule.end_time.split(':').map(Number);
                    const actualHours = recordTime.getHours();
                    const actualMinutes = recordTime.getMinutes();
                    
                    const scheduledStartMinutes = schedHours * 60 + schedMinutes;
                    const scheduledEndMinutes = schedEndHours * 60 + schedEndMinutes;
                    const actualTimeMinutes = actualHours * 60 + actualMinutes;
                    
                    const isWithinTimeRange = actualTimeMinutes >= (scheduledStartMinutes - 120) && 
                                              actualTimeMinutes <= scheduledEndMinutes;
                    
                    if (isWithinTimeRange) {
                        const minutesDiff = actualTimeMinutes - scheduledStartMinutes;
                        if (minutesDiff > 5) {
                            isLate = true;
                        }
                        break;
                    }
                }
            }

            if (!employeeMap[record.name]) {
                employeeMap[record.name] = {
                    name: record.name,
                    status: record.user_status || 'Unknown',
                    total: 0,
                    onTime: 0,
                    late: 0
                };
            }
            employeeMap[record.name].total++;
            
            if (isLate) {
                employeeMap[record.name].late++;
                totalLate++;
            } else {
                employeeMap[record.name].onTime++;
                totalOnTime++;
            }
        });

        const employees = Object.values(employeeMap);
        const totalEmployees = employees.length;
        const totalAttendance = records.length;
        const avgAttendance = totalEmployees > 0 ? (totalAttendance / totalEmployees).toFixed(1) : 0;
        const onTimeRate = totalAttendance > 0 ? ((totalOnTime / totalAttendance) * 100).toFixed(1) : 0;

        document.getElementById('stat-total-employees').textContent = totalEmployees;
        document.getElementById('stat-total-attendance').textContent = totalAttendance;
        document.getElementById('stat-avg-attendance').textContent = avgAttendance;
        document.getElementById('stat-ontime-rate').textContent = onTimeRate + '%';

        employees.sort((a, b) => b.total - a.total);

        createEmployeeBarChart(employees.slice(0, 10));
        createStatusPieChart(totalOnTime, totalLate);
        createAnalyticsTable(employees);
    };

    const createEmployeeBarChart = (topEmployees) => {
        const ctx = document.getElementById('employeeBarChart');
        if (!ctx) return;

        if (employeeBarChart) employeeBarChart.destroy();

        employeeBarChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: topEmployees.map(e => e.name),
                datasets: [
                    { label: 'On Time', data: topEmployees.map(e => e.onTime), backgroundColor: '#10b981' },
                    { label: 'Late', data: topEmployees.map(e => e.late), backgroundColor: '#f59e0b' }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        stacked: true,
                        ticks: { color: '#a7a7a7', maxRotation: 45, minRotation: 45 },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true,
                        ticks: { color: '#a7a7a7' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    }
                },
                plugins: {
                    legend: { position: 'top', labels: { color: '#ffffff' } }
                }
            }
        });
    };

    const createStatusPieChart = (onTime, late) => {
        const ctx = document.getElementById('statusPieChart');
        if (!ctx) return;

        if (statusPieChart) statusPieChart.destroy();

        statusPieChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['On Time', 'Late'],
                datasets: [{
                    data: [onTime, late],
                    backgroundColor: ['#10b981', '#f59e0b'],
                    borderWidth: 3,
                    borderColor: 'rgba(68, 12, 12, 0.3)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#ffffff', padding: 15, font: { size: 14 } }
                    }
                }
            }
        });
    };

    const createAnalyticsTable = (employees) => {
        const tbody = document.getElementById('analytics-table-body');
        tbody.innerHTML = '';

        if (employees.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #a7a7a7;">No data available</td></tr>';
            return;
        }

        employees.forEach(emp => {
            const onTimeRate = ((emp.onTime / emp.total) * 100).toFixed(1);
            const performanceColor = onTimeRate >= 90 ? '#10b981' : onTimeRate >= 70 ? '#f59e0b' : '#ef4444';
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${emp.name}</td>
                <td>${emp.status}</td>
                <td style="text-align: center; font-weight: 600;">${emp.total}</td>
                <td style="text-align: center; color: #10b981; font-weight: 600;">${emp.onTime}</td>
                <td style="text-align: center; color: #f59e0b; font-weight: 600;">${emp.late}</td>
                <td style="text-align: center;">
                    <span style="color: ${performanceColor}; font-weight: bold; font-size: 14px;">${onTimeRate}%</span>
                </td>
            `;
            tbody.appendChild(row);
        });
    };

    const formatTimeTo12Hour = (time24) => {
        if (!time24) return '';
        const [hours, minutes] = time24.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minutes} ${ampm}`;
    };

    const loadScheduleSubjects = async () => {
        try {
            const response = await fetch('http://127.0.0.1:5000/api/subjects');
            const data = await response.json();

            const select = document.getElementById('schedule-subject');
            select.innerHTML = '<option value="">Select Subject</option>';
            
            data.subjects.forEach(subject => {
                const option = document.createElement('option');
                option.value = subject.id;
                option.textContent = subject.name;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading subjects:', error);
        }
    };

    const loadUserSchedule = async (userId) => {
        try {
            const response = await fetch(`http://127.0.0.1:5000/api/admin/users/${userId}/schedules`);
            const data = await response.json();
        
            const tableBody = document.getElementById('user-schedule-table');
            tableBody.innerHTML = '';
        
            if (data.schedules.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #a7a7a7;">No schedule assigned</td></tr>';
                return;
            }
            
            const dayOrder = { 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6, 'Sunday': 7 };
            
            data.schedules.sort((a, b) => {
                const dayDiff = dayOrder[a.day_of_week] - dayOrder[b.day_of_week];
                if (dayDiff !== 0) return dayDiff;
                return a.start_time.localeCompare(b.start_time);
            });
            
            data.schedules.forEach(schedule => {
                const row = document.createElement('tr');
                const startTime = formatTimeTo12Hour(schedule.start_time);
                const endTime = formatTimeTo12Hour(schedule.end_time);
                
                row.innerHTML = `
                    <td>${schedule.day_of_week}</td>
                    <td>${schedule.subject_name}</td>
                    <td>${startTime} - ${endTime}</td>
                    <td><button onclick="deleteSchedule(${schedule.id})" class="delete-btn">Delete</button></td>
                `;
                tableBody.appendChild(row);
            });
        } catch (error) {
            console.error('Error loading schedule:', error);
            displayMessage('Error loading schedule', 'error');
        }
    };

    window.editUser = async (userId) => {
        const user = allUsers.find(u => u.id === userId);
        if (!user) return;

        currentEditingUserId = userId;
        document.getElementById('edit-user-fullname').value = user.full_name || '';
        document.getElementById('edit-user-email').value = user.email || '';
        document.getElementById('edit-user-contact').value = user.contact_number || '';
        document.getElementById('edit-user-address').value = user.address || '';
        document.getElementById('edit-user-status').value = user.status || 'Full Time';

        await loadScheduleSubjects();
        await loadUserSchedule(userId);
        
        editUserModal.style.display = 'block';
    };

    window.deleteSubject = async (subjectId) => {
        if (!confirm('Are you sure you want to delete this subject?')) return;

        try {
            const response = await fetch(`http://127.0.0.1:5000/api/subjects/${subjectId}`, { method: 'DELETE' });

            if (response.ok) {
                displayMessage('Subject deleted successfully!', 'success');
                await loadAllSubjects();
            } else {
                displayMessage('Failed to delete subject.', 'error');
            }
        } catch (error) {
            console.error('Error deleting subject:', error);
            displayMessage('Error deleting subject. Please try again.', 'error');
        }
    };

    window.deleteSchedule = async (scheduleId) => {
        if (!confirm('Delete this schedule entry?')) return;
        
        try {
            const response = await fetch(`http://127.0.0.1:5000/api/admin/schedules/${scheduleId}`, { method: 'DELETE' });
            
            if (response.ok) {
                displayMessage('Schedule deleted!', 'success');
                await loadUserSchedule(currentEditingUserId);
            }
        } catch (error) {
            console.error('Error deleting schedule:', error);
            displayMessage('Error deleting schedule', 'error');
        }
    };

    // REPORT GENERATION FUNCTIONS
    const renderReportTable = (reportData) => {
        const filteredData = currentFilter === 'all' 
            ? reportData 
            : reportData.filter(record => record.attendanceStatus.toLowerCase() === currentFilter);

        reportsTableBody.innerHTML = '';
        
        if (filteredData.length === 0) {
            reportsTableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #a7a7a7;">No ${currentFilter === 'all' ? '' : currentFilter} records found</td></tr>`;
            return;
        }

        filteredData.forEach(record => {
            const row = document.createElement('tr');
            
            let statusColor = '#10b981';
            let statusBg = 'rgba(16, 185, 129, 0.2)';
            if (record.attendanceStatus === 'Late') {
                statusColor = '#f59e0b';
                statusBg = 'rgba(245, 158, 11, 0.2)';
            } else if (record.attendanceStatus === 'Absent') {
                statusColor = '#ef4444';
                statusBg = 'rgba(239, 68, 68, 0.2)';
            }
            
            row.innerHTML = `
                <td>${record.name}</td>
                <td>${record.userStatus}</td>
                <td>${record.subject}</td>
                <td>${record.date}</td>
                <td>${record.timeMarked || '-'}</td>
                <td>
                    <span style="background: ${statusBg}; color: ${statusColor}; padding: 4px 12px; border-radius: 12px; font-weight: bold; font-size: 12px;">
                        ${record.attendanceStatus}
                        ${record.minutesLate ? ` (+${record.minutesLate} min)` : ''}
                    </span>
                </td>
            `;
            reportsTableBody.appendChild(row);
        });
    };

    // Initialize report dates
    const todayDate = new Date();
    const weekAgoDate = new Date();
    weekAgoDate.setDate(weekAgoDate.getDate() - 7);
    reportEndDate.valueAsDate = todayDate;
    reportStartDate.valueAsDate = weekAgoDate;

    // Filter button handlers
    document.getElementById('filter-all').addEventListener('click', () => {
        currentFilter = 'all';
        renderReportTable(currentReportData);
    });

    document.getElementById('filter-present').addEventListener('click', () => {
        currentFilter = 'present';
        renderReportTable(currentReportData);
    });

    document.getElementById('filter-late').addEventListener('click', () => {
        currentFilter = 'late';
        renderReportTable(currentReportData);
    });

    document.getElementById('filter-absent').addEventListener('click', () => {
        currentFilter = 'absent';
        renderReportTable(currentReportData);
    });

    generateReportBtn.addEventListener('click', async () => {
        const startDate = reportStartDate.value;
        const endDate = reportEndDate.value;
        
        if (!startDate || !endDate) {
            displayMessage('Please select both start and end dates', 'error');
            return;
        }
        
        try {
            displayMessage('Generating comprehensive report...', 'info');
            
            const attendanceResponse = await fetch('http://127.0.0.1:5000/api/dashboard');
            const attendanceData = await attendanceResponse.json();
            
            const schedulesResponse = await fetch('http://127.0.0.1:5000/api/admin/schedules');
            const schedulesData = await schedulesResponse.json();
            
            const start = new Date(startDate + 'T00:00:00');
            const end = new Date(endDate + 'T23:59:59');
            
            const filteredRecords = attendanceData.attendance.filter(record => {
                const recordDate = new Date(record.timestamp);
                return recordDate >= start && recordDate <= end;
            });
            
            const reportRecords = [];
            const attendedSchedules = new Set();
            
            filteredRecords.forEach(record => {
                const recordTime = new Date(record.timestamp);
                const recordDay = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][recordTime.getDay()];
                
                let matchingSchedule = null;
                let attendanceStatus = 'Present';
                let minutesLate = null;

                for (const schedule of schedulesData.schedules) {
                    const nameMatch = schedule.user_name.trim().toLowerCase() === record.name.trim().toLowerCase();
                    const dayMatch = schedule.day_of_week === recordDay;
                    
                    if (nameMatch && dayMatch) {
                        const [schedHours, schedMinutes] = schedule.start_time.split(':').map(Number);
                        const [schedEndHours, schedEndMinutes] = schedule.end_time.split(':').map(Number);
                        const actualHours = recordTime.getHours();
                        const actualMinutes = recordTime.getMinutes();
                        
                        const scheduledStartMinutes = schedHours * 60 + schedMinutes;
                        const scheduledEndMinutes = schedEndHours * 60 + schedEndMinutes;
                        const actualTimeMinutes = actualHours * 60 + actualMinutes;
                        
                        const isWithinTimeRange = actualTimeMinutes >= (scheduledStartMinutes - 120) && 
                                                  actualTimeMinutes <= scheduledEndMinutes;
                        
                        if (isWithinTimeRange) {
                            matchingSchedule = schedule;
                            const minutesDiff = actualTimeMinutes - scheduledStartMinutes;
                            
                            if (minutesDiff > 5) {
                                attendanceStatus = 'Late';
                                minutesLate = minutesDiff;
                            }
                            
                            const scheduleKey = `${schedule.user_name}-${recordTime.toISOString().split('T')[0]}-${schedule.day_of_week}-${schedule.start_time}`;
                            attendedSchedules.add(scheduleKey);
                            break;
                        }
                    }
                }

                if (matchingSchedule) {
                    reportRecords.push({
                        name: record.name,
                        userStatus: record.user_status || 'Unknown',
                        subject: `${matchingSchedule.subject_name} - ${recordDay} (${formatTimeTo12Hour(matchingSchedule.start_time)} - ${formatTimeTo12Hour(matchingSchedule.end_time)})`,
                        date: recordTime.toLocaleDateString(),
                        timeMarked: recordTime.toLocaleTimeString(),
                        attendanceStatus: attendanceStatus,
                        minutesLate: minutesLate
                    });
                }
            });

            // Find absent records
            const currentDate = new Date(start);
            while (currentDate <= end) {
                const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][currentDate.getDay()];
                
                schedulesData.schedules.forEach(schedule => {
                    if (schedule.day_of_week === dayOfWeek) {
                        const scheduleKey = `${schedule.user_name}-${currentDate.toISOString().split('T')[0]}-${schedule.day_of_week}-${schedule.start_time}`;
                        
                        if (!attendedSchedules.has(scheduleKey)) {
                            reportRecords.push({
                                name: schedule.user_name,
                                userStatus: schedule.user_status || 'Unknown',
                                subject: `${schedule.subject_name} - ${dayOfWeek} (${formatTimeTo12Hour(schedule.start_time)} - ${formatTimeTo12Hour(schedule.end_time)})`,
                                date: currentDate.toLocaleDateString(),
                                timeMarked: null,
                                attendanceStatus: 'Absent',
                                minutesLate: null
                            });
                        }
                    }
                });
                
                currentDate.setDate(currentDate.getDate() + 1);
            }

            reportRecords.sort((a, b) => {
                const dateCompare = new Date(a.date) - new Date(b.date);
                if (dateCompare !== 0) return dateCompare;
                return a.name.localeCompare(b.name);
            });

            const presentCount = reportRecords.filter(r => r.attendanceStatus === 'Present').length;
            const lateCount = reportRecords.filter(r => r.attendanceStatus === 'Late').length;
            const absentCount = reportRecords.filter(r => r.attendanceStatus === 'Absent').length;
            const totalExpected = reportRecords.length;

            document.getElementById('report-present-count').textContent = presentCount;
            document.getElementById('report-late-count').textContent = lateCount;
            document.getElementById('report-absent-count').textContent = absentCount;
            document.getElementById('report-total-expected').textContent = totalExpected;

            currentReportData = reportRecords;
            currentFilter = 'all';
            renderReportTable(reportRecords);

            displayMessage(`Report generated: ${presentCount} present, ${lateCount} late, ${absentCount} absent`, 'success');
        } catch (error) {
            console.error('ERROR:', error);
            displayMessage('Failed to generate report', 'error');
        }
    });

    exportReportBtn.addEventListener('click', () => {
        if (currentReportData.length === 0) {
            displayMessage('No report data to export', 'error');
            return;
        }
        
        try {
            if (typeof window.jspdf === 'undefined') {
                displayMessage('PDF library not loaded. Please refresh the page.', 'error');
                return;
            }
            
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            doc.setFontSize(18);
            doc.setTextColor(94, 20, 20);
            doc.text('EduWatch - Comprehensive Attendance Report', 14, 20);
            
            doc.setFontSize(11);
            doc.setTextColor(0, 0, 0);
            const startDate = reportStartDate.value || new Date().toISOString().split('T')[0];
            const endDate = reportEndDate.value || new Date().toISOString().split('T')[0];
            doc.text(`Period: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`, 14, 28);
            
            doc.setFontSize(9);
            doc.setTextColor(100, 100, 100);
            doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 34);
            
            const presentCount = currentReportData.filter(r => r.attendanceStatus === 'Present').length;
            const lateCount = currentReportData.filter(r => r.attendanceStatus === 'Late').length;
            const absentCount = currentReportData.filter(r => r.attendanceStatus === 'Absent').length;
            
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            doc.text(`Summary: Present: ${presentCount} | Late: ${lateCount} | Absent: ${absentCount}`, 14, 40);
            
            const tableData = currentReportData.map(record => [
                record.name,
                record.userStatus,
                record.subject.substring(0, 30),
                record.date,
                record.timeMarked || 'N/A',
                record.attendanceStatus + (record.minutesLate ? ` (+${record.minutesLate}m)` : '')
            ]);
            
            if (typeof doc.autoTable === 'function') {
                doc.autoTable({
                    head: [['Faculty Name', 'Status', 'Subject', 'Date', 'Time', 'Attendance']],
                    body: tableData,
                    startY: 46,
                    theme: 'striped',
                    headStyles: {
                        fillColor: [94, 20, 20],
                        textColor: [255, 255, 255],
                        fontStyle: 'bold'
                    },
                    columnStyles: {
                        5: { 
                            cellWidth: 25,
                            halign: 'center'
                        }
                    }
                });
            }
            
            const fileName = `Attendance_Report_${startDate.replace(/\//g, '-')}_to_${endDate.replace(/\//g, '-')}.pdf`;
            doc.save(fileName);
            
            displayMessage('PDF downloaded successfully!', 'success');
        } catch (error) {
            console.error('PDF Error:', error);
            displayMessage('Error generating PDF: ' + error.message, 'error');
        }
    });

    // Search functionality
    searchAttendanceInput.addEventListener('keyup', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredRecords = allAttendanceRecords.filter(record => {
            const userStatus = record.user_status || 'Unknown';
            const subject = record.subject || record.department || 'Not specified';
            
            return (
                record.name.toLowerCase().includes(searchTerm) ||
                userStatus.toLowerCase().includes(searchTerm) ||
                subject.toLowerCase().includes(searchTerm) ||
                (record.department && record.department.toLowerCase().includes(searchTerm))
            );
        });
        renderAttendanceTable(filteredRecords);
    });

    searchUsersInput.addEventListener('keyup', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredUsers = allUsers.filter(user => {
            return (
                user.full_name.toLowerCase().includes(searchTerm) ||
                user.username.toLowerCase().includes(searchTerm) ||
                (user.status || '').toLowerCase().includes(searchTerm) ||
                (user.email || '').toLowerCase().includes(searchTerm)
            );
        });
        renderUsersTable(filteredUsers);
    });

    searchSubjectsInput.addEventListener('keyup', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredSubjects = allSubjects.filter(subject => {
            return (
                subject.name.toLowerCase().includes(searchTerm) ||
                (subject.description || '').toLowerCase().includes(searchTerm)
            );
        });
        renderSubjectsTable(filteredSubjects);
    });

    // Form submissions
    editUserForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!currentEditingUserId) return;

        const formData = {
            full_name: document.getElementById('edit-user-fullname').value.trim(),
            email: document.getElementById('edit-user-email').value.trim(),
            contact_number: document.getElementById('edit-user-contact').value.trim(),
            address: document.getElementById('edit-user-address').value.trim(),
            status: document.getElementById('edit-user-status').value
        };

        try {
            const userResponse = await fetch(`http://127.0.0.1:5000/api/admin/users/${currentEditingUserId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const userData = await userResponse.json();

            if (userData.success) {
                displayMessage('User updated successfully!', 'success');
                editUserModal.style.display = 'none';
                await loadAllUsers();
            } else {
                displayMessage(userData.message || 'Failed to update user.', 'error');
            }
        } catch (error) {
            console.error('Error updating user:', error);
            displayMessage('Error updating user. Please try again.', 'error');
        }
    });

    addSubjectForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('subject-name').value.trim(),
            description: document.getElementById('subject-description').value.trim()
        };

        if (!formData.name) {
            displayMessage('Subject name is required.', 'error');
            return;
        }

        try {
            const response = await fetch('http://127.0.0.1:5000/api/subjects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                displayMessage('Subject added successfully!', 'success');
                addSubjectModal.style.display = 'none';
                addSubjectForm.reset();
                await loadAllSubjects();
            } else {
                displayMessage(data.message || 'Failed to add subject.', 'error');
            }
        } catch (error) {
            console.error('Error adding subject:', error);
            displayMessage('Error adding subject. Please try again.', 'error');
        }
    });

    const addScheduleForm = document.getElementById('add-schedule-form');
    if (addScheduleForm) {
        addScheduleForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!currentEditingUserId) {
                displayMessage('Error: No user selected', 'error');
                return;
            }
            
            const scheduleData = {
                subject_id: parseInt(document.getElementById('schedule-subject').value),
                day_of_week: document.getElementById('schedule-day').value,
                start_time: document.getElementById('schedule-start').value,
                end_time: document.getElementById('schedule-end').value
            };
            
            if (!scheduleData.subject_id || !scheduleData.day_of_week || !scheduleData.start_time || !scheduleData.end_time) {
                displayMessage('Please fill in all fields', 'error');
                return;
            }
            
            try {
                const response = await fetch(`http://127.0.0.1:5000/api/admin/users/${currentEditingUserId}/schedules`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(scheduleData)
                });
                
                const data = await response.json();
                
                if (data.success) {
                    displayMessage('Schedule added!', 'success');
                    addScheduleForm.reset();
                    await loadUserSchedule(currentEditingUserId);
                } else {
                    displayMessage(data.message, 'error');
                }
            } catch (error) {
                console.error('Error adding schedule:', error);
                displayMessage('Error adding schedule', 'error');
            }
        });
    }

    // Button event listeners
    clearRecordsBtn.addEventListener('click', async () => {
        const confirmed = window.confirm("Are you sure you want to clear ALL attendance records? This cannot be undone.");
        if (confirmed) {
            try {
                const response = await fetch('http://127.0.0.1:5000/api/admin/clear_attendance', { method: 'DELETE' });
                if (!response.ok) throw new Error('Failed to clear records');
                allAttendanceRecords = [];
                renderAttendanceTable([]);
                displayMessage('All records have been cleared!', 'success');
            } catch (error) {
                console.error('Error clearing records:', error);
                displayMessage('Failed to clear records. Please try again.', 'error');
            }
        }
    });

    addSubjectBtn.addEventListener('click', () => {
        addSubjectModal.style.display = 'block';
    });

    // Modal event listeners
    closeEditUser.addEventListener('click', () => {
        editUserModal.style.display = 'none';
    });

    closeAddSubject.addEventListener('click', () => {
        addSubjectModal.style.display = 'none';
    });

    document.querySelectorAll('.cancel-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            editUserModal.style.display = 'none';
            addSubjectModal.style.display = 'none';
        });
    });

    window.addEventListener('click', (e) => {
        if (e.target === editUserModal) {
            editUserModal.style.display = 'none';
        }
        if (e.target === addSubjectModal) {
            addSubjectModal.style.display = 'none';
        }
    });

    // Initial data load
    loadAllAttendanceData();
});