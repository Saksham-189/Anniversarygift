// Restrict navigable sources to web URLs; empty configuration must make no request.
export function resolveSurpriseSource(value, baseURI) {
  if (typeof value !== "string" || !value.trim() || value.includes("[[")) return null;
  try {
    const url = new URL(value, baseURI);
    return ["https:", "http:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

export function renderSurprise(container, surprise, labels, doc = document) {
  container.replaceChildren();
  const text = doc.createElement("p");
  text.textContent = surprise.text;
  container.append(text);
  const unavailable = () => {
    const status = doc.createElement("p");
    status.className = "surprise-status";
    status.textContent = labels.unavailableText;
    container.append(status);
  };
  const cleanup = () => {};
  if (surprise.type === "message") return cleanup;

  const source = resolveSurpriseSource(surprise.mediaSrc, doc.baseURI);
  if (!source || !["photo", "video", "link"].includes(surprise.type)) {
    unavailable();
    return cleanup;
  }
  if (surprise.type === "link") {
    const link = doc.createElement("a");
    link.href = source;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = labels.linkLabel;
    container.append(link);
    return cleanup;
  }

  const media = doc.createElement(surprise.type === "photo" ? "img" : "video");
  if (surprise.type === "photo") {
    media.alt = surprise.photoAlt || labels.unavailableText;
    media.width = Number(surprise.photoWidth) || 1200;
    media.height = Number(surprise.photoHeight) || 900;
    media.loading = "lazy";
  } else {
    media.controls = true;
    media.playsInline = true;
    media.preload = "none";
    media.setAttribute("aria-label", labels.videoLabel);
    // No autoplay: the visitor presses Play using the native video controls.
  }
  let fullSize;
  media.addEventListener("error", () => {
    media.hidden = true;
    if (fullSize) fullSize.hidden = true;
    unavailable();
  }, { once: true });
  media.src = source;
  container.append(media);
  if (surprise.type === "photo") {
    fullSize = doc.createElement("a");
    fullSize.href = source;
    fullSize.target = "_blank";
    fullSize.rel = "noopener noreferrer";
    fullSize.textContent = labels.photoLinkLabel;
    container.append(fullSize);
  }
  return () => {
    if (surprise.type === "video") media.pause();
    media.removeAttribute("src");
    if (surprise.type === "video") media.load();
  };
}
