// script.js
// tiny typewriter + reveal effect (respects prefers-reduced-motion)

document.addEventListener('DOMContentLoaded', () => {
  const card = document.getElementById('card');
  // reveal card
  requestAnimationFrame(() => card.classList.add('is-loaded'));

  // set updated time
  const updatedEl = document.getElementById('updated');
  if (updatedEl) updatedEl.textContent = new Date().toLocaleDateString();

  // typed words - change to whatever fits you
  const phrases = [
    'vr dev',
    'pc dev',
    'sleeper',
    'music addict',
    'ramen noodle addict :fire:'
  ];

  const typedEl = document.getElementById('typed');
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!typedEl) return;
  if (prefersReduced) {
    // if user prefers reduced motion, don't animate — show first phrase
    typedEl.textContent = phrases[0];
    return;
  }

  // typewriter implementation
  let idx = 0;
  const TYPING_SPEED = 60;   // ms per char
  const DELETING_SPEED = 30; // ms per char
  const PAUSE = 1400;        // pause after full phrase

  function typePhrase(phrase) {
    return new Promise(resolve => {
      let i = 0;
      const step = () => {
        if (i <= phrase.length) {
          typedEl.textContent = phrase.slice(0, i);
          i++;
          setTimeout(step, TYPING_SPEED);
        } else {
          setTimeout(resolve, PAUSE);
        }
      };
      step();
    });
  }

  function deletePhrase(phrase) {
    return new Promise(resolve => {
      let i = phrase.length;
      const step = () => {
        if (i >= 0) {
          typedEl.textContent = phrase.slice(0, i);
          i--;
          setTimeout(step, DELETING_SPEED);
        } else {
          setTimeout(resolve, 120);
        }
      };
      step();
    });
  }

  async function loop() {
    while (true) {
      const phrase = phrases[idx % phrases.length];
      await typePhrase(phrase);
      await deletePhrase(phrase);
      idx++;
    }
  }

  // start loop (non-blocking)
  loop();
});
