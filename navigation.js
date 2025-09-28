document.addEventListener('DOMContentLoaded', () => {
    const isLoggedIn = localStorage.getItem('userUsername');
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    const logoLink = document.querySelector('.logo a');
    
    if (logoLink && isLoggedIn) {
        if (isAdmin) {
            logoLink.href = 'admin.html';
        } else {
            logoLink.href = 'dashboard.html';
        }
    } else if (logoLink) {
        logoLink.href = 'index.html';
    }
    
    // CRITICAL: Update navigation links based on user role
    const navLinks = document.querySelector('.nav-links');
    if (navLinks && isLoggedIn) {
        if (isAdmin) {
            // Admin navigation - ONLY Admin and Profile
            navLinks.innerHTML = `
                <a href="admin.html">Admin</a>
                <a href="profile.html">Profile</a>
            `;
        } else {
            // Regular user navigation
            navLinks.innerHTML = `
                <a href="dashboard.html">Dashboard</a>
                <a href="About.html">About Us</a>
                <a href="FAQ.html">FAQ</a>
                <a href="profile.html">Profile</a>
            `;
        }
    }
});