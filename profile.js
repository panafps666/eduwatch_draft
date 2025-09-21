document.addEventListener('DOMContentLoaded', () => {
    const profileCard = document.getElementById('profile-card');
    const editButton = document.getElementById('edit-button');
    const saveButton = document.getElementById('save-button');
    const logoutButton = document.getElementById('logout-button');
    const statusMessage = document.getElementById('message-status');
    const passwordInput = document.getElementById('password');
    const togglePassword = document.getElementById('toggle-password');

    // Function to load and display data from local storage
    const loadProfileData = () => {
        const fullName = localStorage.getItem('userFullName') || 'Faculty Name';
        const username = localStorage.getItem('userUsername') || '';
        const email = localStorage.getItem('userEmail') || '';
        const password = localStorage.getItem('userPassword') || '';
        document.getElementById('password').value = password;
        const contact = localStorage.getItem('userContact') || '';
        const address = localStorage.getItem('userAddress') || '';
        const lastLoginTime = localStorage.getItem('lastLoginTime') || '';


        document.getElementById('full-name').textContent = fullName;
        document.getElementById('username').textContent = username;
        document.getElementById('email').value = email;
        document.getElementById('contact').value = contact;
        document.getElementById('address').value = address;

        // Format the login time for display
        if (lastLoginTime) {
            const loginDate = new Date(parseInt(lastLoginTime));
            document.getElementById('last-login-info').textContent = loginDate.toLocaleString();
        } else {
            document.getElementById('last-login-info').textContent = 'N/A';
        }
    };

    // Function to toggle between view and edit mode
    const toggleEditMode = () => {
        const inputs = profileCard.querySelectorAll('.editable-input');

        if (profileCard.classList.contains('edit-mode')) {
            // Switch to view mode (read-only)
            inputs.forEach(input => input.setAttribute('readonly', true));
            profileCard.classList.remove('edit-mode');
            editButton.style.display = 'inline-block';
            saveButton.style.display = 'none';
            // Hide password field
            passwordInput.type = 'password';
            togglePassword.querySelector('i').classList.remove('fa-eye-slash');
            togglePassword.querySelector('i').classList.add('fa-eye');
        } else {
            // Switch to edit mode
            inputs.forEach(input => input.removeAttribute('readonly'));
            profileCard.classList.add('edit-mode');
            editButton.style.display = 'none';
            saveButton.style.display = 'inline-block';
        }
    };

    // Function to save updated data to local storage
    const saveProfileData = () => {
        // Save the updated values from the form
        localStorage.setItem('userEmail', document.getElementById('email').value);
        localStorage.setItem('userPassword', document.getElementById('password').value);
        localStorage.setItem('userContact', document.getElementById('contact').value);
        localStorage.setItem('userAddress', document.getElementById('address').value);

        statusMessage.textContent = 'Changes saved successfully!';
        setTimeout(() => {
            statusMessage.textContent = '';
        }, 3000); // Clear message after 3 seconds

        // Switch back to view mode after saving
        toggleEditMode();
    };

    // Function to handle password visibility toggle
    togglePassword.addEventListener('click', function () {
        // Check if the input is in readonly mode before toggling
        if (!passwordInput.hasAttribute('readonly')) {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);

            // Toggle the eye icon
            this.querySelector('i').classList.toggle('fa-eye');
            this.querySelector('i').classList.toggle('fa-eye-slash');
        }
    });

    // Function to handle logout
    const logout = () => {
        // Clear all user data from local storage
        localStorage.clear();
        // Redirect to the login page
        window.location.href = 'login.html';
    };

    // Load data when the page first loads
    loadProfileData();

    // Event listeners for buttons
    editButton.addEventListener('click', toggleEditMode);
    saveButton.addEventListener('click', saveProfileData);
    logoutButton.addEventListener('click', logout);
});