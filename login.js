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
});

createToggle.addEventListener('click', () => {
    createToggle.classList.add('active');
    loginToggle.classList.remove('active');
    createForm.classList.add('active');
    loginForm.classList.remove('active');
});

// Handle Login Form Submission
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    // Check for a specific hardcoded admin user
    if (username === 'admin' && password === 'admin123') {
        localStorage.setItem('userFullName', 'Administrator');
        localStorage.setItem('userUsername', 'admin');
        localStorage.setItem('isAdmin', 'true');
        localStorage.setItem('lastLoginTime', new Date().getTime());
        window.location.href = 'admin.html';
        return;
    }

    // Check for a regular user
    const storedUsername = localStorage.getItem('userUsername');
    const storedPassword = localStorage.getItem('userPassword');

    if (username === storedUsername && password === storedPassword) {
        localStorage.setItem('isAdmin', 'false');
        localStorage.setItem('lastLoginTime', new Date().getTime());
        window.location.href = 'dashboard.html';
    } else {
        alert('Invalid username or password.');
    }
});

// Handle Create Account Form Submission
createForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Get user input from the form
    const fullName = document.getElementById('create-fullname').value;
    const contact = document.getElementById('create-contact').value;
    const address = document.getElementById('create-address').value;
    const email = document.getElementById('create-email').value;
    const username = document.getElementById('create-username').value;
    const password = document.getElementById('create-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (password !== confirmPassword) {
        alert("Passwords do not match. Please try again.");
        return;
    }

    // Store the data in local storage
    localStorage.setItem('userFullName', fullName);
    localStorage.setItem('userContact', contact);
    localStorage.setItem('userAddress', address);
    localStorage.setItem('userEmail', email);
    localStorage.setItem('userUsername', username);
    localStorage.setItem('userPassword', password);
    localStorage.setItem('isAdmin', 'false'); // New users are not admins
    localStorage.setItem('lastLoginTime', new Date().getTime());

    // Redirect to the login page after successful creation
    alert('Account created successfully! Please log in with your new account.');
    loginToggle.click(); // Programmatically click the login toggle button
});