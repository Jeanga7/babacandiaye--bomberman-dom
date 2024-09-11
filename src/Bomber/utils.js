export function createCountdown(seconds, displayElement, message, onComplete) {
  let remainingSeconds = seconds;

  const updateDisplay = () => {
    displayElement.textContent = `00:${remainingSeconds} ${message}`;
  };

  const countdown = setInterval(() => {
    if (remainingSeconds > 0) {
      remainingSeconds--;
      updateDisplay();
    } else {
      clearInterval(countdown);
      if (onComplete) onComplete();
    }
  }, 1000);

  updateDisplay();
}

export function requestFullScreen() {
  const elem = document.documentElement;
  if (elem.requestFullscreen) {
    elem.requestFullscreen();
  } else if (elem.mozRequestFullScreen) {
    elem.mozRequestFullScreen();
  } else if (elem.webkitRequestFullscreen) {
    elem.webkitRequestFullscreen();
  } else if (elem.msRequestFullscreen) {
    elem.msRequestFullscreen();
  }
}

export function MountComponent(target, ...components) {
  const container = document.querySelector(target);
  if (!container) {
    console.error(`Target container '${target}' not found.`);
    return;
  }

  container.innerHTML = '';

  components.forEach(component => {
    let element;

    if (typeof component === 'function') {
      element = component().render();
    } else if (typeof component === 'string') {
      element = document.getElementById(component);
    } else if (component instanceof HTMLElement) {
      element = component;
    } else if (component && typeof component.render === 'function') {
      element = component.render();
    } else {
      console.error('Invalid component, ID, or element:', component);
      return;
    }

    if (element) {
      container.appendChild(element);
    }
  });
}