const loginToggle = document.getElementById('login-toggle');
const createToggle = document.getElementById('create-toggle');
const loginForm = document.getElementById('login-form');
const createForm = document.getElementById('create-form');
const loginPasswordInput = document.getElementById('login-password');
const createPasswordInput = document.getElementById('create-password');
const confirmPasswordInput = document.getElementById('confirm-password');
const toggleLoginPassword = document.getElementById('toggle-login-password');
const toggleCreatePassword = document.getElementById('toggle-create-password');
const toggleConfirmPassword = document.getElementById('toggle-confirm-password');

// Placeholder for displaying messages to the user
const messageDiv = document.createElement('div');
messageDiv.className = 'message-area';
loginForm.parentNode.insertBefore(messageDiv, loginForm);

const displayMessage = (message, type = 'info') => {
    messageDiv.textContent = message;
    messageDiv.className = `message-area ${type}`;
    messageDiv.style.display = 'block';
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000); // Hide after 5 seconds
};

// Function to toggle password visibility
const setupPasswordToggle = (inputElement, toggleElement) => {
    toggleElement.addEventListener('click', () => {
        const type = inputElement.getAttribute('type') === 'password' ? 'text' : 'password';
        inputElement.setAttribute('type', type);
        // Toggle the icon
        toggleElement.querySelector('i').classList.toggle('fa-eye');
        toggleElement.querySelector('i').classList.toggle('fa-eye-slash');
    });
};

setupPasswordToggle(loginPasswordInput, toggleLoginPassword);
setupPasswordToggle(createPasswordInput, toggleCreatePassword);
setupPasswordToggle(confirmPasswordInput, toggleConfirmPassword);

// Handle form toggle buttons
loginToggle.addEventListener('click', () => {
    loginToggle.classList.add('active');
    createToggle.classList.remove('active');
    loginForm.classList.add('active');
    createForm.classList.remove('active');
    messageDiv.style.display = 'none';
});

createToggle.addEventListener('click', () => {
    createToggle.classList.add('active');
    loginToggle.classList.remove('active');
    createForm.classList.add('active');
    loginForm.classList.remove('active');
    messageDiv.style.display = 'none';
});

// Handle Login Form Submission
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;

    // Basic validation
    if (!username || !password) {
        displayMessage('Please fill in all fields.', 'error');
        return;
    }

    try {
        const response = await fetch('http://127.0.0.1:5000/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();

        if (data.success) {
            // Save user data to localStorage
            localStorage.setItem('userUsername', data.user.username);
            localStorage.setItem('userFullName', data.user.full_name);
            localStorage.setItem('isAdmin', data.user.is_admin);

            displayMessage('Login successful! Redirecting...', 'success');

            // Redirect based on user type
            setTimeout(() => {
                if (data.user.is_admin) {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'dashboard.html';
                }
            }, 1000); // Wait for a moment to show the message
        } else {
            displayMessage(data.message, 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        displayMessage('Network error. Please check your connection and try again.', 'error');
    }
});

// Handle Create Account Form Submission
createForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Get ALL form field values in the correct order
    const fullName = document.getElementById('create-fullname').value.trim();
    const contactNumber = document.getElementById('create-contact').value.trim();
    const email = document.getElementById('create-email').value.trim();
    const address = document.getElementById('create-address').value.trim();
    const status = document.getElementById('create-status').value; // This is the dropdown
    const username = document.getElementById('create-username').value.trim();
    const password = document.getElementById('create-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    // Comprehensive validation
    if (!fullName) {
        displayMessage('Full Name is required.', 'error');
        return;
    }

    if (!contactNumber) {
        displayMessage('Contact Number is required.', 'error');
        return;
    }

    if (!email) {
        displayMessage('Email is required.', 'error');
        return;
    }

    if (!address) {
        displayMessage('Address is required.', 'error');
        return;
    }

    if (!status) {
        displayMessage('Status is required. Please select Full Time or Part Time.', 'error');
        return;
    }

    if (!username) {
        displayMessage('Username is required.', 'error');
        return;
    }

    if (!password) {
        displayMessage('Password is required.', 'error');
        return;
    }

    if (!confirmPassword) {
        displayMessage('Please confirm your password.', 'error');
        return;
    }

    if (password !== confirmPassword) {
        displayMessage('Passwords do not match. Please try again.', 'error');
        return;
    }

    if (password.length < 6) {
        displayMessage('Password must be at least 6 characters long.', 'error');
        return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        displayMessage('Please enter a valid email address.', 'error');
        return;
    }

    // Contact number validation (basic)
    const contactRegex = /^[0-9+\-\s()]+$/;
    if (!contactRegex.test(contactNumber)) {
        displayMessage('Please enter a valid contact number.', 'error');
        return;
    }

    // Username validation
    if (username.length < 3) {
        displayMessage('Username must be at least 3 characters long.', 'error');
        return;
    }

    try {
        const response = await fetch('http://127.0.0.1:5000/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: username,
                password: password,
                fullName: fullName,
                email: email,
                contact: contactNumber,
                address: address,
                status: status, // Include the status field
                isAdmin: username === 'admin' // Simple admin check for demo
            })
        });

        const data = await response.json();

        if (data.success) {
            displayMessage('Account created successfully! Please log in.', 'success');
            // Clear the form
            createForm.reset();
            // Switch to login form
            loginToggle.click();
        } else {
            displayMessage(data.message || 'Registration failed. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        displayMessage('Network error. Please check your connection and try again.', 'error');
    }
});