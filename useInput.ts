// Module-level input state — no React state, no re-renders
const input = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  jump: false,
  sprint: false,
  reload: false,
  fire: false,
  aim: false,
  whip: false,
  weapon1: false,
  weapon2: false,
};

let registered = false;

function map(code: string, pressed: boolean) {
  switch (code) {
    case 'KeyW': case 'ArrowUp': input.forward = pressed; break;
    case 'KeyS': case 'ArrowDown': input.backward = pressed; break;
    case 'KeyA': case 'ArrowLeft': input.left = pressed; break;
    case 'KeyD': case 'ArrowRight': input.right = pressed; break;
    case 'Space': input.jump = pressed; break;
    case 'ShiftLeft': case 'ShiftRight': input.sprint = pressed; break;
    case 'KeyR': input.reload = pressed; break;
    case 'KeyQ': input.whip = pressed; break;
    case 'Digit1': input.weapon1 = pressed; break;
    case 'Digit2': input.weapon2 = pressed; break;
  }
}

function register() {
  if (registered) return;
  registered = true;
  window.addEventListener('keydown', (e) => map(e.code, true));
  window.addEventListener('keyup', (e) => map(e.code, false));
  window.addEventListener('mousedown', (e) => {
    if (e.button === 0) input.fire = true;
    if (e.button === 2) input.aim = true;
  });
  window.addEventListener('mouseup', (e) => {
    if (e.button === 0) input.fire = false;
    if (e.button === 2) input.aim = false;
  });
  window.addEventListener('contextmenu', (e) => e.preventDefault());
}

export function useInput() {
  register();
  return input;
}
