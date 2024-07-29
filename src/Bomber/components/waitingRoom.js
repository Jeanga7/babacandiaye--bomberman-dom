import { startGame } from '../app.js';

export function createCountdown(initialSeconds, playerCount) {
    let remainingTime = initialSeconds;
    let countdownStarted20 = false;
    let countdownStarted10 = false;
    let globalPlayerCount = playerCount;

    const countdownElement = document.createElement('div');
    countdownElement.id = 'countdown-container';
    countdownElement.className = 'waiting';
    document.body.appendChild(countdownElement); 

    function countDown10() {
        if (remainingTime <= 0) {
            return 'Game starting!';
        } else {
            return `Game starts in ${remainingTime} seconds...`;
        }
    }

    function countDown20() {
        return `${remainingTime} seconds remaining, waiting for players... ${globalPlayerCount}/4`;
    }

    function updateCountdown() {
        if (countdownStarted10) {
            countdownElement.className = 'game-starting';
            countdownElement.innerHTML = countDown10();
        } else {
            countdownElement.innerHTML = countDown20();
        }
    }

    const intervalId = setInterval(() => {
        if (globalPlayerCount >= 2 && !countdownStarted20 && !countdownStarted10) {
            console.log("Starting 20-second countdown");
            countdownStarted20 = true;
            remainingTime = 2;
            updateCountdown(); 
            return;
        }

        if (countdownStarted20 && (globalPlayerCount === 4 || remainingTime <= 0)) {
            console.log("Starting 10-second countdown");
            countdownStarted10 = true;
            countdownStarted20 = false;
            remainingTime = 1;
            updateCountdown(); 
            return;
        }

        if (countdownStarted10 || countdownStarted20) {
            if (remainingTime > 0 ) {
                remainingTime--;
            } else if (countdownStarted10) {
                clearInterval(intervalId); 
                startGame(); 
                return;
            }
            updateCountdown();
        }
    }, 1000);

    updateCountdown();

    return countdownElement;
}
