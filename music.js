export function initializeMusic(config, doc = document) {
  const toggle = doc.getElementById("music-toggle");
  const panel = doc.getElementById("music-panel");
  const audio = doc.createElement("audio");
  audio.src = config.src;
  audio.preload = "none";
  audio.loop = true;
  audio.volume = 0.35;
  panel.replaceChildren(audio);
  panel.hidden = true;
  toggle.textContent = config.playLabel;
  toggle.setAttribute("aria-pressed", "false");
  let busy = false;
  function showState() {
    toggle.textContent = audio.paused ? config.playLabel : config.pauseLabel;
    toggle.setAttribute("aria-pressed", String(!audio.paused));
  }
  audio.addEventListener("play", showState);
  audio.addEventListener("pause", showState);
  audio.addEventListener("error", () => {
    toggle.textContent = config.retryLabel;
    toggle.setAttribute("aria-pressed", "false");
  });
  toggle.addEventListener("click", async () => {
    if (busy) return;
    if (!audio.paused) {
      audio.pause();
      return;
    }
    busy = true;
    toggle.textContent = config.loadingLabel;
    toggle.setAttribute("aria-disabled", "true");
    try {
      await audio.play();
      showState();
    } catch {
      toggle.textContent = config.retryLabel;
      toggle.setAttribute("aria-pressed", "false");
    } finally {
      busy = false;
      toggle.removeAttribute("aria-disabled");
    }
  });
}
