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