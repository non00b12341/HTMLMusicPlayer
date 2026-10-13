(() => {
  const $ = id => document.getElementById(id);
  const audio = new Audio();
  audio.preload = 'auto';

  // The player contains only the original six songs.
  const tracks = [
    { name: "Katyusha", url: "songs/01-katyusha.mp3" },
    { name: "On the 22nd of June", url: "songs/02-on-the-22nd-of-june.mp3" },
    { name: "Sacred war", url: "songs/03-sacred-war.mp3" },
    { name: "Smuglianka", url: "songs/04-smuglianka.mp3" },
    { name: "Farewell of Slavianka", url: "songs/05-farewell-of-slavianka.mp3" },
    { name: "Kalinka", url: "songs/06-kalinka.mp3" }
  ];
  let notice = "";
  let watchdog = null;
  let current = -1;
  let order = [];
  let pos = -1;
  let shuffleOn = false;
  let loopMode = "off";

  const activeIndices = () => tracks.map((_, i) => i);
  const fmt = s => {
    if (!isFinite(s) || s < 0) s = 0;
    s = Math.floor(s);
    return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
  };

  function shuffled(first) {
    const rest = activeIndices().filter(i => i !== first);
    for (let i = rest.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rest[i], rest[j]] = [rest[j], rest[i]];
    }
    return first >= 0 && first < tracks.length ? [first, ...rest] : rest;
  }
  function buildOrder(first) {
    order = shuffleOn ? shuffled(first) : activeIndices();
    if (first >= 0 && order.includes(first) && !shuffleOn) {
      order = [first, ...order.filter(i => i !== first)];
    }
    pos = order.indexOf(first);
  }
  function load(index, autoplay) {
    current = index;
    pos = order.indexOf(index);
    notice = "";
    audio.src = tracks[index].url;
    audio.loop = loopMode === "one";
    if (autoplay) startPlayback();
    render();
  }
  function startPlayback() {
    clearTimeout(watchdog);
    const p = audio.play();
    if (p && p.catch) p.catch(err => {
      notice = "Your browser blocked playback (" + err.name + "). Click Play again.";
      render();
    });
    watchdog = setTimeout(() => {
      if (!audio.paused && audio.currentTime === 0) {
        notice = "The song is not starting. Check your browser sound settings or try another browser.";
        render();
      }
    }, 3000);
  }
  function playIndex(index) {
    buildOrder(index);
    load(index, true);
  }
  function stopAll() {
    audio.pause();
    audio.currentTime = 0;
    render();
  }
  function step(dir, manual) {
    if (current < 0) {
      buildOrder(-1);
      if (order.length) load(order[dir < 0 ? order.length - 1 : 0], true);
      return;
    }
    let p = pos + dir;
    if (p >= order.length || p < 0) {
      if (loopMode === "all" || manual) {
        if (shuffleOn && dir > 0) {
          order = shuffled(-1);
          if (order[0] === current && order.length > 1) order.push(order.shift());
        }
        p = dir > 0 ? 0 : order.length - 1;
      } else {
        return stopAll();
      }
    }
    pos = p;
    load(order[p], true);
  }
  function togglePlay() {
    if (current < 0) {
      buildOrder(-1);
      if (order.length) load(order[0], true);
      return;
    }
    if (audio.paused) startPlayback();
    else audio.pause();
  }
  audio.addEventListener("error", () => {
    const code = audio.error ? audio.error.code : 0;
    notice = code === 4 ? "This browser cannot play this file." : code === 3 ? "This song could not be decoded." : "The song could not be loaded. Check that the MP3 exists in the songs folder.";
    render();
  });
  audio.addEventListener("timeupdate", () => {
    if (notice && !audio.paused && audio.currentTime > 0) { notice = ""; render(); }
  });
  audio.addEventListener("ended", () => step(1, false));
  audio.addEventListener("play", render);
  audio.addEventListener("pause", render);
  audio.addEventListener("loadedmetadata", () => { $("dur").textContent = fmt(audio.duration); });
  audio.addEventListener("timeupdate", () => {
    const d = audio.duration || 0;
    const pct = d ? (audio.currentTime / d) * 100 : 0;
    $("fill").style.width = pct + "%";
    $("track").setAttribute("aria-valuenow", Math.round(pct));
    $("cur").textContent = fmt(audio.currentTime);
  });

  function render() {
    const playing = current >= 0 && !audio.paused;
    $("play").textContent = playing ? "Pause" : "Play";
    $("status").textContent = notice || (playing ? "Now playing" : (current >= 0 ? "Paused" : "Stopped"));
    $("title").textContent = current >= 0 ? tracks[current].name : "Pick a song";
    $("shuffle").textContent = "Shuffle: " + (shuffleOn ? "on" : "off");
    $("shuffle").setAttribute("aria-pressed", shuffleOn);
    $("loop").textContent = "Loop: " + loopMode;
    $("loop").setAttribute("aria-pressed", loopMode !== "off");
    document.title = playing ? tracks[current].name + " - Music Player" : "Music Player";
    const list = $("playlist");
    list.textContent = "";
    activeIndices().forEach((i, n) => {
      const t = tracks[i];
      const li = document.createElement("li");
      li.className = "item" + (i === current ? " active" : "");
      const b = document.createElement("button");
      b.className = "play";
      b.innerHTML = '<span class="num"></span><span class="name"></span>';
      b.querySelector(".num").textContent = n + 1;
      b.querySelector(".name").textContent = t.name;
      b.title = t.name;
      b.addEventListener("click", () => playIndex(i));
      li.appendChild(b);
      list.appendChild(li);
    });
  }

  $("play").addEventListener("click", togglePlay);
  $("next").addEventListener("click", () => step(1, true));
  $("prev").addEventListener("click", () => {
    if (current >= 0 && audio.currentTime > 3) audio.currentTime = 0;
    else step(-1, true);
  });
  $("shuffle").addEventListener("click", () => {
    shuffleOn = !shuffleOn;
    buildOrder(current);
    render();
  });
  $("loop").addEventListener("click", () => {
    loopMode = loopMode === "off" ? "one" : loopMode === "one" ? "all" : "off";
    audio.loop = loopMode === "one";
    render();
  });
  $("volume").addEventListener("input", e => { audio.volume = +e.target.value; });
  const trackEl = $("track");
  trackEl.addEventListener("click", e => {
    const r = trackEl.getBoundingClientRect();
    if (audio.duration) audio.currentTime = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * audio.duration;
  });
  trackEl.addEventListener("keydown", e => {
    if (!audio.duration) return;
    if (e.key === "ArrowRight") audio.currentTime = Math.min(audio.duration, audio.currentTime + 5);
    if (e.key === "ArrowLeft") audio.currentTime = Math.max(0, audio.currentTime - 5);
  });
  document.addEventListener("keydown", e => {
    if (e.code === "Space" && !/^(BUTTON|INPUT|SELECT)$/.test(document.activeElement.tagName) && document.activeElement.id !== "track") {
      e.preventDefault(); togglePlay();
    }
  });
  window.__player = { get state() { return { tracks: tracks.length, current, order: order.slice(), pos, shuffleOn, loopMode, }; }, audio, step, playIndex };
  buildOrder(-1);
  render();
})();