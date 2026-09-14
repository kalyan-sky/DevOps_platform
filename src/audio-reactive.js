// Opt-in sound reactivity for the ambient background. Off by default —
// nothing here runs until the visitor explicitly clicks the mic toggle and
// confirms the popup. Audio never leaves the browser: it's read locally via
// Web Audio's AnalyserNode and immediately discarded frame by frame.

let stream = null;
let audioCtx = null;
let analyser = null;
let dataArray = null;
let rafId = null;

function dispatchLevel(bass, mid, treble) {
  window.dispatchEvent(new CustomEvent('audiolevel', { detail: { bass, mid, treble } }));
}

function analyse() {
  analyser.getByteFrequencyData(dataArray);
  const n = dataArray.length;
  const bassEnd = Math.floor(n * 0.12);
  const midEnd = Math.floor(n * 0.5);

  let bass = 0, mid = 0, treble = 0;
  for (let i = 0; i < bassEnd; i++) bass += dataArray[i];
  for (let i = bassEnd; i < midEnd; i++) mid += dataArray[i];
  for (let i = midEnd; i < n; i++) treble += dataArray[i];

  bass = bass / bassEnd / 255;
  mid = mid / (midEnd - bassEnd) / 255;
  treble = treble / (n - midEnd) / 255;

  dispatchLevel(bass, mid, treble);
  rafId = requestAnimationFrame(analyse);
}

async function requestMic() {
  stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const source = audioCtx.createMediaStreamSource(stream);
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 256;
  analyser.smoothingTimeConstant = 0.8;
  source.connect(analyser);
  dataArray = new Uint8Array(analyser.frequencyBinCount);
  analyse();
}

function stopMic() {
  if (rafId) cancelAnimationFrame(rafId);
  rafId = null;
  if (stream) stream.getTracks().forEach((t) => t.stop());
  stream = null;
  if (audioCtx) audioCtx.close();
  audioCtx = null;
  analyser = null;
  dataArray = null;
  dispatchLevel(0, 0, 0);
}

// Creates the mic toggle button (for the caller to place wherever it fits —
// e.g. inside the nav) and appends the confirmation modal to <body>. Returns
// the button element.
export function mountAudioToggle() {
  const modalWrap = document.createElement('div');
  modalWrap.innerHTML = `
    <div class="modal-overlay" id="mic-modal-overlay" hidden>
      <div class="modal-card">
        <h3>Sound-reactive background</h3>
        <p>Uses your microphone to make the background particles move with sound, live, in your browser. Nothing is recorded, stored, or sent anywhere — turn it off anytime from the same button.</p>
        <p class="modal-error" id="mic-modal-error" hidden></p>
        <div class="modal-actions">
          <button class="btn" id="mic-cancel" type="button">Not now</button>
          <button class="btn btn-primary" id="mic-enable" type="button">Enable Microphone</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modalWrap.firstElementChild);

  const toggle = document.createElement('button');
  toggle.className = 'audio-toggle';
  toggle.id = 'audio-toggle';
  toggle.type = 'button';
  toggle.setAttribute('aria-label', 'Enable sound-reactive background');
  toggle.textContent = '🎤';

  const overlay = document.getElementById('mic-modal-overlay');
  const enableBtn = document.getElementById('mic-enable');
  const cancelBtn = document.getElementById('mic-cancel');
  const errorEl = document.getElementById('mic-modal-error');
  let active = false;

  function closeModal() {
    overlay.hidden = true;
    errorEl.hidden = true;
  }

  toggle.addEventListener('click', () => {
    if (active) {
      stopMic();
      active = false;
      toggle.classList.remove('listening');
      toggle.setAttribute('aria-label', 'Enable sound-reactive background');
      return;
    }
    overlay.hidden = false;
  });

  cancelBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !overlay.hidden) closeModal();
  });

  enableBtn.addEventListener('click', async () => {
    enableBtn.disabled = true;
    try {
      await requestMic();
      active = true;
      toggle.classList.add('listening');
      toggle.setAttribute('aria-label', 'Disable sound-reactive background');
      closeModal();
    } catch (err) {
      errorEl.textContent =
        err.name === 'NotAllowedError'
          ? 'Microphone access was denied. You can allow it later from your browser’s site settings.'
          : 'Could not access the microphone on this device.';
      errorEl.hidden = false;
    } finally {
      enableBtn.disabled = false;
    }
  });

  return toggle;
}
