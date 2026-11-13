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

  if (surprise.type === "photo" && Array.isArray(surprise.photos)) {
    const template = doc.createElement("div");
    template.className = "original-collage";
    const heading = doc.createElement("h3");
    heading.textContent = surprise.templateTitle;
    const name = doc.createElement("p");
    name.className = "original-collage-name";
    name.textContent = surprise.templateName;
    const grid = doc.createElement("div");
    grid.className = "original-collage-grid";
    for (const photo of surprise.photos) {
      const source = resolveSurpriseSource(photo.src, doc.baseURI);
      if (!source) continue;
      const frame = doc.createElement("a");
      frame.className = "original-polaroid";
      if (["landscape", "sideways"].includes(photo.presentation)) frame.className += ` original-${photo.presentation}`;
      frame.href = source;
      frame.target = "_blank";
      frame.rel = "noopener noreferrer";
      frame.setAttribute("aria-label", `${surprise.originalPhotoLabel}: ${photo.alt}`);
      const image = doc.createElement("img");
      image.src = source;
      image.alt = photo.alt;
      image.width = Number(photo.width);
      image.height = Number(photo.height);
      image.loading = "eager";
      image.addEventListener("error", () => { frame.hidden = true; unavailable(); }, { once: true });
      const photoWindow = doc.createElement("span");
      photoWindow.className = "original-photo";
      photoWindow.append(image);
      frame.append(photoWindow);
      grid.append(frame);
    }
    template.append(heading, name, grid);
    container.append(template);
    return cleanup;
  }

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
