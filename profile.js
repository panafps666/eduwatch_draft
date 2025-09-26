document.addEventListener('DOMContentLoaded', () => {
    // Get all profile display elements
    const profileDisplayName = document.getElementById('profile-display-name');
    const profileDisplayUsername = document.getElementById('profile-display-username');
    const profileLastLogin = document.getElementById('profile-last-login');
    const profileEmail = document.getElementById('profile-email');
    const profileContact = document.getElementById('profile-contact');
    const profileAddress = document.getElementById('profile-address');
    const avatarInitials = document.getElementById('avatar-initials');
    const editProfileBtn = document.getElementById('edit-profile-btn');
    const logoutBtn = document.getElementById('logout-btn');
    
    // Modal elements
    const editModal = document.getElementById('edit-modal');
    const closeModal = document.querySelector('.close');
    const cancelBtn = document.querySelector('.cancel-btn');
    const editProfileForm = document.getElementById('edit-profile-form');
    const editFullName = document.getElementById('edit-fullname');
    const editUsername = document.getElementById('edit-username');
    const editEmail = document.getElementById('edit-email');
    const editContact = document.getElementById('edit-contact');
    const editAddress = document.getElementById('edit-address');

    // Create a message area for user feedback
    const messageArea = document.createElement('div');
    messageArea.className = 'message-area';
    document.body.appendChild(messageArea);

    const displayMessage = (message, type = 'info') => {
        messageArea.textContent = message;
        messageArea.className = `message-area ${type}`;
        messageArea.style.display = 'block';
        setTimeout(() => {
            messageArea.style.display = 'none';
        }, 5000);
    };

    // Get user data from localStorage
    const userUsername = localStorage.getItem('userUsername');
    const userFullName = localStorage.getItem('userFullName');
    const isAdmin = localStorage.getItem('isAdmin') === 'true';

    console.log('User data from localStorage:', { userUsername, userFullName, isAdmin });

    // Redirect if not logged in
    if (!userUsername) {
        displayMessage('Please log in to view your profile.', 'error');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        return;
    }

    // Load user profile data
    const loadProfileData = async () => {
        try {
            // Always try to fetch fresh data from API
            const response = await fetch(`http://127.0.0.1:5000/api/profile/${userUsername}`);
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    const user = data.user;
                    console.log('Loaded user data from API:', user);
                    
                    // Update localStorage with fresh data
                    localStorage.setItem('userFullName', user.full_name);
                    localStorage.setItem('isAdmin', user.is_admin);
                    
                    // Update profile display
                    profileDisplayName.textContent = user.full_name || 'Unknown User';
                    profileDisplayUsername.textContent = user.username || 'Unknown';
                    
                    // Update all form fields
                    profileEmail.value = user.email || '';
                    profileContact.value = user.contact_number || '';
                    profileAddress.value = user.address || '';
                    
                    // Set last login (you could enhance this with actual login tracking)
                    const lastLogin = new Date().toLocaleDateString();
                    profileLastLogin.textContent = `N/A`;
                    
                    // Generate initials for avatar
                    const initials = user.full_name 
                        ? user.full_name.split(' ').map(name => name.charAt(0)).join('').toUpperCase().slice(0, 2)
                        : user.username.substring(0, 2).toUpperCase();
                    avatarInitials.textContent = initials;
                    
                    displayMessage('Profile loaded successfully!', 'success');
                } else {
                    throw new Error(data.message || 'Failed to load profile');
                }
            } else {
                throw new Error('Failed to fetch profile data');
            }
        } catch (error) {
            console.error('Error loading profile data:', error);
            
            // Fallback to localStorage data if API fails
            if (userFullName && userUsername) {
                profileDisplayName.textContent = userFullName;
                profileDisplayUsername.textContent = userUsername;
                profileEmail.value = '';
                profileContact.value = '';
                profileAddress.value = '';
                profileLastLogin.textContent = 'N/A';
                
                const initials = userFullName 
                    ? userFullName.split(' ').map(name => name.charAt(0)).join('').toUpperCase().slice(0, 2)
                    : userUsername.substring(0, 2).toUpperCase();
                avatarInitials.textContent = initials;
                
                displayMessage('Using cached profile data (limited information)', 'info');
            } else {
                displayMessage('Error loading profile data', 'error');
            }
        }
    };

    // Open edit modal
    const openEditModal = () => {
        editFullName.value = profileDisplayName.textContent !== 'Unknown User' ? profileDisplayName.textContent : '';
        editUsername.value = profileDisplayUsername.textContent !== 'Unknown' ? profileDisplayUsername.textContent : '';
        editEmail.value = profileEmail.value || '';
        editContact.value = profileContact.value || '';
        editAddress.value = profileAddress.value || '';
        editModal.style.display = 'block';
    };

    // Close edit modal
    const closeEditModal = () => {
        editModal.style.display = 'none';
        editProfileForm.reset();
    };

    // Handle profile update
    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        
        const newFullName = editFullName.value.trim();
        const newUsername = editUsername.value.trim();
        const newEmail = editEmail.value.trim();
        const newContact = editContact.value.trim();
        const newAddress = editAddress.value.trim();

        if (!newFullName || !newUsername) {
            displayMessage('Please fill in required fields (Full Name and Username).', 'error');
            return;
        }

        try {
            const response = await fetch('http://127.0.0.1:5000/api/profile/update', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentUsername: userUsername,
                    newUsername: newUsername,
                    fullName: newFullName,
                    email: newEmail,
                    contact: newContact,
                    address: newAddress
                })
            });

            const data = await response.json();

            if (data.success) {
                // Update localStorage with new data
                localStorage.setItem('userUsername', newUsername);
                localStorage.setItem('userFullName', newFullName);
                
                // Reload profile data
                await loadProfileData();
                closeEditModal();
                displayMessage('Profile updated successfully!', 'success');
            } else {
                displayMessage(data.message || 'Failed to update profile.', 'error');
            }
        } catch (error) {
            console.error('Profile update error:', error);
            displayMessage('An error occurred while updating profile.', 'error');
        }
    };

    // Handle logout
    const handleLogout = () => {
        const confirmLogout = window.confirm('Are you sure you want to logout?');
        if (confirmLogout) {
            // Clear all user data from localStorage
            localStorage.removeItem('userUsername');
            localStorage.removeItem('userFullName');
            localStorage.removeItem('isAdmin');
            
            displayMessage('Logged out successfully. Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        }
    };

    // Toggle password visibility function
    window.togglePasswordView = function() {
        const passwordField = document.getElementById('profile-password');
        const eyeIcon = document.getElementById('password-eye');
        
        if (passwordField.type === 'password') {
            passwordField.type = 'text';
            passwordField.value = 'Your actual password here'; // You'd get this from API
            eyeIcon.classList.remove('fa-eye');
            eyeIcon.classList.add('fa-eye-slash');
        } else {
            passwordField.type = 'password';
            passwordField.value = '••••••••';
            eyeIcon.classList.remove('fa-eye-slash');
            eyeIcon.classList.add('fa-eye');
        }
    };

    // Event listeners
    editProfileBtn.addEventListener('click', openEditModal);
    logoutBtn.addEventListener('click', handleLogout);
    closeModal.addEventListener('click', closeEditModal);
    cancelBtn.addEventListener('click', closeEditModal);
    editProfileForm.addEventListener('submit', handleProfileUpdate);

    // Close modal when clicking outside of it
    window.addEventListener('click', (e) => {
        if (e.target === editModal) {
            closeEditModal();
        }
    });

    // Load initial profile data
    loadProfileData();
});