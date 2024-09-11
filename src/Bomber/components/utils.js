export function animatePlaceholder(inputId, placeholders, typeSpeed, eraseSpeed, delay) {
    let input = document.getElementById(inputId);
    let index = 0;
    let charIndex = 0;
    let currentText = placeholders[index];

    function type() {
        if (charIndex < currentText.length) {
            input.placeholder += currentText.charAt(charIndex);
            charIndex++;
            setTimeout(type, typeSpeed);
        } else {
            setTimeout(erase, delay); // Delay before erasing
        }
    }

    function erase() {
        if (charIndex > 0) {
            input.placeholder = input.placeholder.substring(0, charIndex - 1);
            charIndex--;
            setTimeout(erase, eraseSpeed);
        } else {
            index = (index + 1) % placeholders.length; // Move to next text
            currentText = placeholders[index];
            setTimeout(type, 200); // Delay before typing next text
        }
    }

    type();
}