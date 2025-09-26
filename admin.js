document.addEventListener('DOMContentLoaded', async () => {
    const adminAttendanceTableBody = document.getElementById('admin-attendance-table-body');
    const usersTableBody = document.getElementById('users-table-body');
    const subjectsTableBody = document.getElementById('subjects-table-body');
    
    // Search inputs
    const searchAttendanceInput = document.getElementById('search-attendance-input');
    const searchUsersInput = document.getElementById('search-users-input');
    const searchSubjectsInput = document.getElementById('search-subjects-input');
    
    // Buttons
    const clearRecordsBtn = document.getElementById('clear-records-btn');
    const addSubjectBtn = document.getElementById('add-subject-btn');
    
    // Tab elements
    const attendanceTab = document.getElementById('attendance-tab');
    const usersTab = document.getElementById('users-tab');
    const subjectsTab = document.getElementById('subjects-tab');
    const attendanceContent = document.getElementById('attendance-content');
    const usersContent = document.getElementById('users-content');
    const subjectsContent = document.getElementById('subjects-content');
    
    // Modal elements
    const editUserModal = document.getElementById('edit-user-modal');
    const addSubjectModal = document.getElementById('add-subject-modal');
    const closeEditUser = document.getElementById('close-edit-user');
    const closeAddSubject = document.getElementById('close-add-subject');
    const editUserForm = document.getElementById('edit-user-form');
    const addSubjectForm = document.getElementById('add-subject-form');

    const isLoggedIn = localStorage.getItem('userUsername');
    const isAdmin = localStorage.getItem('isAdmin');

    // Data arrays
    let allAttendanceRecords = [];
    let allUsers = [];
    let allSubjects = [];
    let currentEditingUserId = null;

    // Create a message area for better user feedback
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

    // Redirect if not logged in or not an admin
    if (!isLoggedIn || isAdmin !== 'true') {
        displayMessage('You do not have permission to view this page. Redirecting...', 'error');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
        return;
    }

    // Tab switching functionality
    const switchTab = (activeTab, activeContent) => {
        // Remove active class from all tabs and content
        document.querySelectorAll('.tab-btn').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        // Add active class to selected tab and content
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

    // Render functions
    const renderAttendanceTable = (records) => {
        adminAttendanceTableBody.innerHTML = '';
        if (records.length === 0) {
            const noRecordsRow = document.createElement('tr');
            noRecordsRow.innerHTML = `<td colspan="4" style="text-align: center; color: #a7a7a7;">No attendance records found.</td>`;
            adminAttendanceTableBody.appendChild(noRecordsRow);
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
            const noUsersRow = document.createElement('tr');
            noUsersRow.innerHTML = `<td colspan="6" style="text-align: center; color: #a7a7a7;">No users found.</td>`;
            usersTableBody.appendChild(noUsersRow);
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
            const noSubjectsRow = document.createElement('tr');
            noSubjectsRow.innerHTML = `<td colspan="3" style="text-align: center; color: #a7a7a7;">No subjects found.</td>`;
            subjectsTableBody.appendChild(noSubjectsRow);
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

    // Load data functions
    const loadAllAttendanceData = async () => {
        try {
            const attendanceResponse = await fetch('http://127.0.0.1:5000/api/dashboard');
            if (!attendanceResponse.ok) {
                throw new Error('Failed to fetch attendance data');
            }
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
            if (!response.ok) {
                throw new Error('Failed to fetch users');
            }
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
            if (!response.ok) {
                throw new Error('Failed to fetch subjects');
            }
            const data = await response.json();
            allSubjects = data.subjects;
            renderSubjectsTable(allSubjects);
        } catch (error) {
            console.error('Error fetching subjects:', error);
            displayMessage('Failed to load subjects. Please try again.', 'error');
        }
    };

    // Global function to edit user
    window.editUser = async (userId) => {
        const user = allUsers.find(u => u.id === userId);
        if (!user) return;

        currentEditingUserId = userId;
        document.getElementById('edit-user-fullname').value = user.full_name || '';
        document.getElementById('edit-user-email').value = user.email || '';
        document.getElementById('edit-user-contact').value = user.contact_number || '';
        document.getElementById('edit-user-address').value = user.address || '';
        document.getElementById('edit-user-status').value = user.status || 'Full Time';

        // Load and populate subjects
        await loadUserSubjects(userId);
        
        editUserModal.style.display = 'block';
    };

    // Load user's assigned subjects and populate the subject selection
    const loadUserSubjects = async (userId) => {
        try {
            // Get all subjects
            const allSubjectsResponse = await fetch('http://127.0.0.1:5000/api/subjects');
            const allSubjectsData = await allSubjectsResponse.json();
            
            // Get user's assigned subjects
            const userSubjectsResponse = await fetch(`http://127.0.0.1:5000/api/admin/users/${userId}/subjects`);
            const userSubjectsData = await userSubjectsResponse.json();
            
            const assignedSubjectIds = userSubjectsData.subjects.map(s => s.id);
            
            // Populate the subjects container
            const container = document.getElementById('user-subjects-container');
            container.innerHTML = '';
            
            allSubjectsData.subjects.forEach(subject => {
                const checkboxDiv = document.createElement('div');
                checkboxDiv.className = 'subject-checkbox';
                
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = `subject-${subject.id}`;
                checkbox.value = subject.id;
                checkbox.checked = assignedSubjectIds.includes(subject.id);
                
                const label = document.createElement('label');
                label.htmlFor = `subject-${subject.id}`;
                label.textContent = subject.name;
                
                checkboxDiv.appendChild(checkbox);
                checkboxDiv.appendChild(label);
                container.appendChild(checkboxDiv);
            });
            
        } catch (error) {
            console.error('Error loading user subjects:', error);
            displayMessage('Error loading user subjects', 'error');
        }
    };

    window.deleteSubject = async (subjectId) => {
        if (!window.confirm('Are you sure you want to delete this subject?')) {
            return;
        }

        try {
            const response = await fetch(`http://127.0.0.1:5000/api/subjects/${subjectId}`, {
                method: 'DELETE'
            });

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
                record.department.toLowerCase().includes(searchTerm)
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

        // Get selected subjects
        const selectedSubjects = [];
        document.querySelectorAll('#user-subjects-container input[type="checkbox"]:checked').forEach(checkbox => {
            selectedSubjects.push(parseInt(checkbox.value));
        });

        try {
            // Update user information
            const userResponse = await fetch(`http://127.0.0.1:5000/api/admin/users/${currentEditingUserId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const userData = await userResponse.json();

            if (userData.success) {
                // Update user subjects
                const subjectsResponse = await fetch(`http://127.0.0.1:5000/api/admin/users/${currentEditingUserId}/subjects`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ subject_ids: selectedSubjects })
                });

                const subjectsData = await subjectsResponse.json();

                if (subjectsData.success) {
                    displayMessage('User and subjects updated successfully!', 'success');
                    editUserModal.style.display = 'none';
                    await loadAllUsers();
                } else {
                    displayMessage('User updated but failed to update subjects: ' + subjectsData.message, 'error');
                }
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

    // Button event listeners
    clearRecordsBtn.addEventListener('click', async () => {
        const confirmed = window.confirm("Are you sure you want to clear ALL attendance records? This cannot be undone.");
        if (confirmed) {
            try {
                const response = await fetch('http://127.0.0.1:5000/api/admin/clear_attendance', {
                    method: 'DELETE'
                });
                if (!response.ok) {
                    throw new Error('Failed to clear records');
                }
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