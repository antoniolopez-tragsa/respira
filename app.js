(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const el = {
    pattern: $('pattern-select'),
    description: $('pattern-description'),
    title: $('session-title'),
    inhale: $('inhale-seconds'),
    hold: $('hold-seconds'),
    exhale: $('exhale-seconds'),
    rest: $('rest-seconds'),
    sessionDuration: $('session-duration'),
    stage: $('breathing-stage'),
    orb: $('breath-orb'),
    orbPhase: $('orb-phase'),
    orbCount: $('orb-count'),
    orbCaption: $('orb-caption'),
    heading: $('phase-heading'),
    subtitle: $('phase-subtitle'),
    progress: $('phase-progress-bar'),
    cycles: $('cycle-count'),
    sessionClock: $('session-clock'),
    status: $('session-status'),
    startStop: $('start-stop-button'),
    startStopLabel: $('start-stop-label'),
    startStopIcon: $('start-stop-icon'),
    musicEnabled: $('music-enabled'),
    musicSelect: $('music-select'),
    musicVolume: $('music-volume'),
    volumeValue: $('volume-value'),
    music: $('background-music'),
    musicOptions: $('music-options'),
    musicCredit: $('music-credit'),
    voiceEnabled: $('voice-enabled'),
    installButton: $('install-button')
  };

  const presets = {
    '468': { title: 'Respiración 4 · 6 · 8', description: 'Inspira 4 s, mantén 6 s y exhala 8 s.', values: [4, 6, 8, 0] },
    '444': { title: 'Respiración 4 · 4 · 4', description: 'Tres fases equilibradas: inspira, mantén y exhala durante 4 segundos.', values: [4, 4, 4, 0] },
    'box': { title: 'Respiración en caja', description: 'Cuatro fases iguales: inspira, mantén, exhala y haz una pausa de 4 segundos.', values: [4, 4, 4, 4] },
    '478': { title: 'Respiración 4 · 7 · 8', description: 'Inspira 4 s, mantén 7 s y exhala lentamente durante 8 s. Empieza con pocas rondas y sin forzar.', values: [4, 7, 8, 0] },
    '55': { title: 'Respiración suave 5 · 5', description: 'Una inspiración de 5 s seguida de una exhalación de 5 s, sin retenciones.', values: [5, 0, 5, 0] },
    'custom': { title: 'Respiración personalizada', description: 'Ajusta los segundos de cada fase a un ritmo que te resulte cómodo.', values: null }
  };

  const musicTracks = {
    wholesome: {
      name: 'Wholesome',
      author: 'Kevin MacLeod',
      url: 'https://upload.wikimedia.org/wikipedia/commons/f/f2/Wholesome_by_Kevin_MacLeod.ogg',
      source: 'https://commons.wikimedia.org/wiki/File:Wholesome_by_Kevin_MacLeod.ogg',
      license: 'https://creativecommons.org/licenses/by/4.0/',
      licenseName: 'CC BY 4.0'
    },
    peaceful: {
      name: 'Peaceful ambient',
      author: 'Tamlin Lollis Love',
      url: 'https://upload.wikimedia.org/wikipedia/commons/8/84/Peaceful.ogg',
      source: 'https://commons.wikimedia.org/wiki/File:Peaceful.ogg',
      license: 'https://creativecommons.org/licenses/by-sa/3.0/',
      licenseName: 'CC BY-SA 3.0'
    }
  };

  const cues = {
    inhale: $('cue-inhale'),
    hold: $('cue-hold'),
    exhale: $('cue-exhale')
  };

  let isRunning = false;
  let phases = [];
  let phaseIndex = 0;
  let phaseStartedAt = 0;
  let phaseEndsAt = 0;
  let sessionStartedAt = 0;
  let cycleCount = 0;
  let tickHandle = null;
  let deferredInstallPrompt = null;
  let currentTrackKey = el.musicSelect.value;

  const phaseCopy = {
    inhale: { heading: 'Inspira con suavidad', subtitle: 'Deja que el aire entre sin llenar los pulmones a la fuerza.', orb: 'Inspira', caption: 'toma aire lentamente', cue: 'inhale', scale: 1.11 },
    hold: { heading: 'Mantén sin tensión', subtitle: 'Quédate aquí solo si la retención te resulta cómoda.', orb: 'Aguanta', caption: 'permanece en calma', cue: 'hold', scale: 1.11 },
    exhale: { heading: 'Suelta el aire', subtitle: 'Exhala despacio, relajando la mandíbula y los hombros.', orb: 'Exhala', caption: 'deja ir el aire', cue: 'exhale', scale: .91 },
    rest: { heading: 'Descansa un instante', subtitle: 'Haz una pausa natural antes de volver a inspirar.', orb: 'Pausa', caption: 'descansa sin forzar', cue: 'hold', scale: .91 }
  };

  function formatTime(seconds) {
    const safe = Math.max(0, Math.floor(seconds));
    const minutes = Math.floor(safe / 60);
    const remainder = safe % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
  }

  function getInputValues() {
    const clamp = (input, min, max) => {
      let value = Number.parseInt(input.value, 10);
      if (!Number.isFinite(value)) value = min;
      value = Math.min(max, Math.max(min, value));
      input.value = String(value);
      return value;
    };
    return [
      clamp(el.inhale, 1, 60),
      clamp(el.hold, 0, 60),
      clamp(el.exhale, 1, 60),
      clamp(el.rest, 0, 60)
    ];
  }

  function buildPhases() {
    const [inhale, hold, exhale, rest] = getInputValues();
    const built = [
      { key: 'inhale', label: 'Inspira', duration: inhale },
      { key: 'hold', label: 'Aguanta', duration: hold },
      { key: 'exhale', label: 'Exhala', duration: exhale },
      { key: 'rest', label: 'Pausa', duration: rest }
    ].filter((phase) => phase.duration > 0);
    return built;
  }

  function lockSettings(locked) {
    [el.pattern, el.inhale, el.hold, el.exhale, el.rest, el.sessionDuration].forEach((control) => {
      control.disabled = locked;
    });
  }

  function updateSessionTitle() {
    const preset = presets[el.pattern.value] || presets.custom;
    const values = getInputValues();
    const [i, h, e, r] = values;
    const description = el.pattern.value === 'custom'
      ? `Inspira ${i} s${h ? `, mantén ${h} s` : ''}, exhala ${e} s${r ? ` y pausa ${r} s` : ''}.`
      : preset.description;
    el.description.textContent = description;
    el.title.textContent = el.pattern.value === 'custom' ? 'Respiración personalizada' : preset.title;
  }

  function applyPreset(key) {
    const preset = presets[key] || presets.custom;
    if (preset.values) {
      [el.inhale.value, el.hold.value, el.exhale.value, el.rest.value] = preset.values.map(String);
    }
    updateSessionTitle();
  }

  function playCue(cueKey) {
    if (!el.voiceEnabled.checked || !isRunning) return;
    const audio = cues[cueKey];
    if (!audio) return;
    Object.values(cues).forEach((item) => {
      if (item !== audio) {
        item.pause();
        item.currentTime = 0;
      }
    });
    try {
      audio.currentTime = 0;
      const promise = audio.play();
      if (promise && typeof promise.catch === 'function') promise.catch(() => {});
    } catch (_) { /* Los avisos son opcionales; el temporizador continúa si el navegador bloquea el audio. */ }
  }

  function updatePhaseVisual(phase) {
    const copy = phaseCopy[phase.key];
    el.orb.dataset.phase = phase.key;
    el.orb.style.setProperty('--phase-duration', `${phase.duration}s`);
    el.orbPhase.textContent = copy.orb;
    el.orbCaption.textContent = copy.caption;
    el.heading.textContent = copy.heading;
    el.subtitle.textContent = copy.subtitle;
    el.orb.style.setProperty('--scale', String(copy.scale));
    el.orbCount.textContent = String(phase.duration);
  }

  function setActivePhase(index, useScheduledStart = false) {
    phaseIndex = index;
    const phase = phases[phaseIndex];
    phaseStartedAt = useScheduledStart ? phaseEndsAt : Date.now();
    phaseEndsAt = phaseStartedAt + phase.duration * 1000;
    updatePhaseVisual(phase);
    playCue(phaseCopy[phase.key].cue);
    el.progress.style.width = '0%';
  }

  function updateStatus(running, label) {
    el.status.classList.toggle('is-running', running);
    el.status.innerHTML = `<span class="status-dot"></span> ${label}`;
  }

  function updateSessionClock(now = Date.now()) {
    const duration = Number(el.sessionDuration.value);
    if (!isRunning) {
      el.sessionClock.textContent = duration ? `Sesión de ${duration / 60} min` : 'Sin límite de tiempo';
      return;
    }
    if (!duration) {
      el.sessionClock.textContent = `En curso · ${formatTime((now - sessionStartedAt) / 1000)}`;
    } else {
      const remaining = Math.max(0, duration - (now - sessionStartedAt) / 1000);
      el.sessionClock.textContent = `${formatTime(remaining)} restantes`;
    }
  }

  function setButtonState(running, finished = false) {
    el.startStop.classList.toggle('is-stop', running);
    el.startStopLabel.textContent = running ? 'Terminar sesión' : (finished ? 'Repetir sesión' : 'Comenzar');
    if (running) {
      el.startStopIcon.innerHTML = '<rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />';
    } else {
      el.startStopIcon.innerHTML = '<path d="M8 5.5 18 12 8 18.5v-13Z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />';
    }
    el.startStop.setAttribute('aria-label', running ? 'Terminar sesión de respiración' : (finished ? 'Repetir sesión de respiración' : 'Comenzar sesión de respiración'));
  }

  function stopCueAudio() {
    Object.values(cues).forEach((audio) => {
      audio.pause();
      try { audio.currentTime = 0; } catch (_) { /* ignore */ }
    });
  }

  function stopMusic() {
    el.music.pause();
    try { el.music.currentTime = 0; } catch (_) { /* ignore */ }
  }

  function startMusic() {
    if (!el.musicEnabled.checked || !isRunning) return;
    el.music.volume = Number(el.musicVolume.value) / 100;
    const track = musicTracks[currentTrackKey];
    if (!track) return;
    if (!el.music.src || !el.music.src.endsWith(new URL(track.url).pathname)) {
      el.music.src = track.url;
      el.music.load();
    }
    const promise = el.music.play();
    if (promise && typeof promise.catch === 'function') {
      promise.catch(() => {
        el.musicCredit.textContent = 'No se pudo iniciar la música. Comprueba la conexión; los ejercicios y avisos siguen funcionando.';
      });
    }
  }

  function startSession() {
    phases = buildPhases();
    if (!phases.length) return;
    isRunning = true;
    cycleCount = 0;
    sessionStartedAt = Date.now();
    el.cycles.textContent = '0';
    el.stage.classList.add('is-running');
    lockSettings(true);
    setButtonState(true);
    updateStatus(true, 'En curso');
    el.orbCaption.textContent = 'preparando la respiración';
    stopCueAudio();
    setActivePhase(0);
    startMusic();
    updateSessionClock();
    tickHandle = window.setInterval(tick, 100);
  }

  function stopSession(completed = false) {
    if (tickHandle !== null) {
      window.clearInterval(tickHandle);
      tickHandle = null;
    }
    isRunning = false;
    el.stage.classList.remove('is-running');
    lockSettings(false);
    stopCueAudio();
    stopMusic();
    setButtonState(false, completed);
    updateStatus(false, completed ? 'Completado' : 'Preparado');
    el.orb.dataset.phase = 'idle';
    el.orb.style.setProperty('--phase-duration', '.7s');
    el.orb.style.setProperty('--scale', '1');
    el.orbPhase.textContent = completed ? 'Muy bien' : 'A tu ritmo';
    el.orbCount.textContent = '—';
    el.orbCaption.textContent = completed ? 'has terminado tu pausa' : 'cuando estés listo';
    el.heading.textContent = completed ? 'Has terminado tu pausa' : 'Encuentra una postura cómoda';
    el.subtitle.textContent = completed ? 'Tómate unos segundos antes de volver a tus tareas.' : 'Relaja los hombros y deja que la respiración fluya sin forzarla.';
    el.progress.style.width = '0%';
    updateSessionClock();
  }

  function advancePhase() {
    const previousIndex = phaseIndex;
    const nextIndex = (phaseIndex + 1) % phases.length;
    if (nextIndex === 0 && previousIndex === phases.length - 1) {
      cycleCount += 1;
      el.cycles.textContent = String(cycleCount);
    }
    setActivePhase(nextIndex, true);
  }

  function tick() {
    if (!isRunning) return;
    const now = Date.now();
    const maxSession = Number(el.sessionDuration.value);
    if (maxSession > 0 && now - sessionStartedAt >= maxSession * 1000) {
      stopSession(true);
      return;
    }

    // Si el navegador suspende la pestaña durante un rato, retomamos en una fase limpia sin
    // disparar una cadena de avisos atrasados al volver a primer plano.
    if (now - phaseEndsAt > 120000) {
      phaseStartedAt = now;
      phaseEndsAt = now + phases[phaseIndex].duration * 1000;
      playCue(phaseCopy[phases[phaseIndex].key].cue);
    } else {
      let guard = 0;
      while (now >= phaseEndsAt && guard < 20 && isRunning) {
        advancePhase();
        guard += 1;
      }
      if (guard === 20 && now >= phaseEndsAt) {
        phaseStartedAt = now;
        phaseEndsAt = now + phases[phaseIndex].duration * 1000;
      }
    }
    const phase = phases[phaseIndex];
    const phaseLength = phase.duration * 1000;
    const fraction = Math.min(1, Math.max(0, (now - phaseStartedAt) / phaseLength));
    el.progress.style.width = `${fraction * 100}%`;
    el.orbCount.textContent = String(Math.max(0, Math.ceil((phaseEndsAt - now) / 1000)));
    updateSessionClock(now);
  }

  function updateMusicCredit() {
    const track = musicTracks[currentTrackKey];
    el.musicCredit.replaceChildren();
    const line1 = document.createElement('span');
    line1.textContent = `${track.name} — ${track.author}. `;
    const sourceLink = document.createElement('a');
    sourceLink.href = track.source;
    sourceLink.target = '_blank';
    sourceLink.rel = 'noopener noreferrer';
    sourceLink.textContent = 'Fuente';
    const middle = document.createTextNode(' · ');
    const licenseLink = document.createElement('a');
    licenseLink.href = track.license;
    licenseLink.target = '_blank';
    licenseLink.rel = 'noopener noreferrer';
    licenseLink.textContent = track.licenseName;
    const line2 = document.createElement('div');
    line2.style.marginTop = '4px';
    line2.textContent = 'La música se carga desde Wikimedia Commons y necesita conexión a internet.';
    el.musicCredit.append(line1, sourceLink, middle, licenseLink, line2);
  }

  function updateMusicOptions() {
    const enabled = el.musicEnabled.checked;
    el.musicOptions.classList.toggle('is-muted', !enabled);
    if (!enabled) {
      stopMusic();
    } else if (isRunning) {
      startMusic();
    }
  }

  el.pattern.addEventListener('change', () => {
    if (isRunning) return;
    applyPreset(el.pattern.value);
  });

  [el.inhale, el.hold, el.exhale, el.rest].forEach((input) => {
    input.addEventListener('change', () => {
      if (isRunning) return;
      el.pattern.value = 'custom';
      getInputValues();
      updateSessionTitle();
    });
    input.addEventListener('input', () => {
      if (!isRunning) {
        el.pattern.value = 'custom';
        updateSessionTitle();
      }
    });
  });

  el.sessionDuration.addEventListener('change', () => updateSessionClock());
  el.startStop.addEventListener('click', () => isRunning ? stopSession(false) : startSession());
  el.musicEnabled.addEventListener('change', updateMusicOptions);
  el.musicSelect.addEventListener('change', () => {
    currentTrackKey = el.musicSelect.value;
    updateMusicCredit();
    if (isRunning && el.musicEnabled.checked) {
      stopMusic();
      startMusic();
    }
  });
  el.musicVolume.addEventListener('input', () => {
    el.music.volume = Number(el.musicVolume.value) / 100;
    el.volumeValue.textContent = `${el.musicVolume.value}%`;
  });

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    el.installButton.hidden = false;
  });
  el.installButton.addEventListener('click', async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    el.installButton.hidden = true;
  });
  window.addEventListener('appinstalled', () => {
    el.installButton.hidden = true;
    deferredInstallPrompt = null;
  });

  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {
        // La aplicación sigue siendo funcional aunque el navegador no permita instalar el service worker.
      });
    });
  }

  applyPreset(el.pattern.value);
  updateMusicOptions();
  updateMusicCredit();
  updateSessionClock();
})();
