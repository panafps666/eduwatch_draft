// Original FAQ functionality
document.querySelectorAll('.faq-question').forEach(button => {
    button.addEventListener('click', () => {
        const answer = button.nextElementSibling;
        const plusIcon = button.querySelector('.plus-icon');

        // Toggle the 'active' class on the button
        button.classList.toggle('active');

        // Toggle the display of the answer
        if (answer.style.maxHeight) {
            answer.style.maxHeight = null;
            plusIcon.textContent = '+';
        } else {
            answer.style.maxHeight = answer.scrollHeight + "px";
            plusIcon.textContent = '-';
        }
    });
});

// Ticket System Functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check user role and show/hide ticket section
    // You'll need to replace this with your actual user role checking logic
    const userRole = getUserRole(); // Implement this function based on your auth system
    
    if (userRole === 'user' || userRole === 'faculty') {
        document.getElementById('ticketSection').style.display = 'block';
    }

    // Modal elements
    const modal = document.getElementById('ticketModal');
    const reportBtn = document.getElementById('reportIssueBtn');
    const closeBtn = document.getElementById('closeModalBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const submitBtn = document.getElementById('submitTicketBtn');
    const successMessage = document.getElementById('successMessage');

    // Form elements
    const categorySelect = document.getElementById('ticketCategory');
    const titleInput = document.getElementById('ticketTitle');
    const prioritySelect = document.getElementById('ticketPriority');
    const descriptionTextarea = document.getElementById('ticketDescription');

    // Open modal
    if (reportBtn) {
        reportBtn.addEventListener('click', function() {
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        });
    }

    // Close modal functions
    function closeModal() {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto'; // Restore scrolling
        clearForm();
    }

    // Close modal events
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);

    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Close modal with ESC key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.style.display === 'block') {
            closeModal();
        }
    });

    // Form validation
    function validateForm() {
        const category = categorySelect.value.trim();
        const title = titleInput.value.trim();
        const description = descriptionTextarea.value.trim();

        if (!category) {
            alert('Please select a category');
            categorySelect.focus();
            return false;
        }

        if (!title) {
            alert('Please enter an issue title');
            titleInput.focus();
            return false;
        }

        if (title.length < 10) {
            alert('Issue title must be at least 10 characters long');
            titleInput.focus();
            return false;
        }

        if (!description) {
            alert('Please provide a detailed description');
            descriptionTextarea.focus();
            return false;
        }

        if (description.length < 20) {
            alert('Description must be at least 20 characters long');
            descriptionTextarea.focus();
            return false;
        }

        return true;
    }

    // Clear form
    function clearForm() {
        categorySelect.value = '';
        titleInput.value = '';
        prioritySelect.value = 'medium';
        descriptionTextarea.value = '';
    }

    // Show success message
    function showSuccessMessage() {
        successMessage.style.display = 'block';
        setTimeout(() => {
            successMessage.style.display = 'none';
        }, 5000);
    }

    // Submit ticket
    submitBtn.addEventListener('click', async function() {
        if (!validateForm()) {
            return;
        }

        // Show loading state
        const submitText = submitBtn.querySelector('.submit-text');
        const loadingSpinner = submitBtn.querySelector('.loading-spinner');
        
        submitBtn.disabled = true;
        submitText.style.display = 'none';
        loadingSpinner.style.display = 'inline';

        // Prepare ticket data
        const ticketData = {
            category: categorySelect.value,
            title: titleInput.value.trim(),
            priority: prioritySelect.value,
            description: descriptionTextarea.value.trim(),
            userInfo: getCurrentUserInfo(), // Implement this function
            timestamp: new Date().toISOString()
        };

        try {
            // Submit ticket to your backend
            await submitTicket(ticketData);
            
            // Close modal and show success
            closeModal();
            showSuccessMessage();
            
        } catch (error) {
            console.error('Error submitting ticket:', error);
            alert('Failed to submit ticket. Please try again or contact support directly.');
        } finally {
            // Reset button state
            submitBtn.disabled = false;
            submitText.style.display = 'inline';
            loadingSpinner.style.display = 'none';
        }
    });
});

// User role checking function - Replace with your actual implementation
function getUserRole() {
    // This is a placeholder - implement based on your authentication system
    // You might check localStorage, sessionStorage, or make an API call
    
    // Example implementations:
    // return localStorage.getItem('userRole');
    // return sessionStorage.getItem('role');
    // return document.body.dataset.userRole;
    
    // For testing purposes, you can hardcode:
    return 'user'; // Change to 'admin' to hide the button
}

// Get current user info - Replace with your actual implementation
function getCurrentUserInfo() {
    // This is a placeholder - implement based on your user management system
    return {
        id: getCurrentUserId(),
        name: getCurrentUserName(),
        email: getCurrentUserEmail(),
        role: getUserRole()
    };
}

// These functions should be implemented based on your authentication system
function getCurrentUserId() {
    // Example: return localStorage.getItem('userId');
    return '1'; // Placeholder
}

function getCurrentUserName() {
    // Example: return localStorage.getItem('userName');
    return 'Current User'; // Placeholder
}

function getCurrentUserEmail() {
    // Example: return localStorage.getItem('userEmail');
    return 'user@example.com'; // Placeholder
}

// Submit ticket function - Replace with your actual API call
async function submitTicket(ticketData) {
    // This is a placeholder - implement your actual API call
    
    // Example implementation:
    /*
    const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getAuthToken()}` // If you use tokens
        },
        body: JSON.stringify(ticketData)
    });

    if (!response.ok) {
        throw new Error('Failed to submit ticket');
    }

    return await response.json();
    */

    // For testing - simulate API call
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log('Ticket submitted:', ticketData);
            resolve({ success: true, ticketId: Date.now() });
        }, 2000);
    });
}