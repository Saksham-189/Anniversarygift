import { content } from "./content.js";
import { createReasonDeck } from "./reasons.js";
import { renderSurprise } from "./surprise.js";
import { initializeMusic } from "./music.js";

initializeMusic(content.music);

document.title = content.meta.pageTitle;
document.querySelector('meta[property="og:title"]').content = content.meta.pageTitle;
document.querySelector('meta[name="description"]').content = content.welcome.subline;
document.querySelector('meta[property="og:description"]').content = content.welcome.subline;

const welcomeText = {
  "anniversary-label": content.meta.anniversaryLabel,
  "welcome-headline": content.welcome.headline,
  "welcome-subline": content.welcome.subline,
  "begin-button": content.welcome.buttonLabel,
  "timeline-heading": content.timelineIntro.heading,
  "timeline-description": content.timelineIntro.description,
  "moments-dedication": content.timelineIntro.dedication,
  "moments-story-link": content.timelineIntro.storyLinkLabel,
  "timeline-continue": content.timelineIntro.continueLabel,
  "lightbox-close": content.timelineIntro.closePhotoLabel,
  "reasons-heading": content.reasonsIntro.heading,
  "reasons-description": content.reasonsIntro.description,
  "illustrations-heading": content.illustrations.heading,
  "illustrations-description": content.illustrations.description,
  "reasons-closing": content.reasonsIntro.closingText,
  "reasons-continue": content.reasonsIntro.continueLabel,
  "reasons-reset": content.reasonsIntro.resetLabel,
  "finale-heading": content.finale.noteTitle,
  "finale-signoff": content.finale.signoff,
  "surprise-button": content.finale.surpriseButtonLabel,
  "replay-button": content.finale.replayLabel
};

for (const [id, value] of Object.entries(welcomeText)) {
  document.getElementById(id).textContent = value;
}

// Parse a calendar date in UTC so it never shifts a day across time zones.
const isoDate = content.meta.anniversaryDate;
const date = new Date(`${isoDate}T00:00:00Z`);
if (/^\d{4}-\d{2}-\d{2}$/.test(isoDate)
    && !Number.isNaN(date.getTime())
    && date.toISOString().slice(0, 10) === isoDate) {
  const dateElement = document.getElementById("anniversary-date");
  dateElement.dateTime = isoDate;
  dateElement.textContent = new Intl.DateTimeFormat(document.documentElement.lang || "en", {
    day: "numeric", month: "long", year: "numeric", timeZone: "UTC"
  }).format(date);
  dateElement.hidden = false;
}

const welcome = document.getElementById("welcome");
const timeline = document.getElementById("timeline");
const begin = document.getElementById("begin-button");
const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
const activeAnimations = new Set();
const gentleEasing = getComputedStyle(document.documentElement)
  .getPropertyValue("--ease-gentle").trim();

function scrollToStart() {
  window.scrollTo({ top: 0, behavior: "instant" });
  document.querySelector("main").scrollTop = 0;
}

async function animate(element, frames, duration) {
  if (motionPreference.matches || typeof element.animate !== "function") return;
  const animation = element.animate(frames, {
    duration, easing: gentleEasing, fill: "both"
  });
  activeAnimations.add(animation);
  try {
    await animation.finished;
  } catch {
    // A canceled effect must never interrupt navigation.
  } finally {
    activeAnimations.delete(animation);
    animation.cancel();
  }
}

motionPreference.addEventListener("change", () => {
  if (motionPreference.matches) {
    for (const animation of activeAnimations) animation.finish();
  }
});

// One quiet entrance for the whole letter, rather than unrelated effects.
void animate(document.querySelector(".welcome-letter"), [
  { opacity: 0, transform: "translateY(8px)" },
  { opacity: 1, transform: "translateY(0)" }
], 900);

let opening = false;
begin.addEventListener("click", async () => {
  if (opening) return;
  opening = true;
  begin.disabled = true;
  // End the entrance first if Begin is tapped before it completes.
  for (const animation of activeAnimations) animation.finish();
  await animate(welcome, [{ opacity: 1 }, { opacity: 0 }], 350);
  welcome.inert = true;
  welcome.hidden = true;
  timeline.hidden = false;
  timeline.inert = false;
  // Start every story photo when the visitor enters the story. Some in-app
  // browsers do not resume native lazy loading after a hidden section opens.
  for (const image of document.querySelectorAll("#timeline img")) image.loading = "eager";
  scrollToStart();
  document.getElementById("timeline-heading").focus({ preventScroll: true });
  await animate(timeline, [{ opacity: 0 }, { opacity: 1 }], 450);
});

const placeholderPhoto = "assets/photos/placeholder-1.svg";
const lightbox = document.getElementById("photo-lightbox");
const lightboxImage = document.getElementById("lightbox-image");
const lightboxFallback = document.getElementById("lightbox-fallback");
const closePhoto = document.getElementById("lightbox-close");
const photoClasses = {
  camera: "photo-camera",
  rotated: "photo-rotated",
  collage: "photo-collage"
};
let photoTrigger = null;

function handleMissingPhoto(image, fallback) {
  image.addEventListener("error", () => {
    image.alt = content.timelineIntro.missingPhotoLabel;
    if (image.getAttribute("src") !== placeholderPhoto) {
      image.src = placeholderPhoto;
    } else {
      // Even if the local placeholder is unavailable, never show a broken icon.
      image.hidden = true;
      fallback.hidden = false;
    }
  });
}

lightboxFallback.textContent = content.timelineIntro.missingPhotoLabel;
handleMissingPhoto(lightboxImage, lightboxFallback);

function openPhoto(entry, trigger, thumbnail) {
  photoTrigger = trigger;
  document.getElementById("lightbox-title").textContent = entry.title;
  document.getElementById("lightbox-caption").textContent = entry.caption;
  lightboxImage.hidden = false;
  lightboxFallback.hidden = true;
  lightboxImage.alt = thumbnail.alt;
  lightboxImage.src = thumbnail.getAttribute("src") || placeholderPhoto;
  const lightboxFrame = lightboxImage.parentElement;
  lightboxFrame.className = "lightbox-photo";
  const presentation = photoClasses[entry.photoPresentation];
  if (presentation) lightboxFrame.classList.add(presentation);
  lightbox.showModal();
  document.documentElement.classList.add("lightbox-open");
  closePhoto.focus();
}

closePhoto.addEventListener("click", () => lightbox.close());
lightbox.addEventListener("click", event => {
  const bounds = lightbox.getBoundingClientRect();
  if (event.target === lightbox && (event.clientX < bounds.left
      || event.clientX > bounds.right || event.clientY < bounds.top
      || event.clientY > bounds.bottom)) lightbox.close();
});
lightbox.addEventListener("keydown", event => {
  // Close is the only interactive element. Keep Tab/Shift+Tab inside the modal.
  if (event.key === "Tab") {
    event.preventDefault();
    closePhoto.focus();
  }
});
lightbox.addEventListener("close", () => {
  document.documentElement.classList.remove("lightbox-open");
  photoTrigger?.focus({ preventScroll: true });
});

function createTimelineEntry(entry, index) {
  const item = document.createElement("li");
  item.className = "timeline-entry";

  const marker = document.createElement("span");
  marker.className = "timeline-marker";
  marker.textContent = String(index + 1).padStart(2, "0");
  marker.setAttribute("aria-hidden", "true");

  const text = document.createElement("div");
  text.className = "timeline-text";
  const date = document.createElement("p");
  date.className = "timeline-date";
  date.textContent = entry.date;
  date.hidden = !entry.date;
  const title = document.createElement("h3");
  title.textContent = entry.title;
  const caption = document.createElement("p");
  caption.textContent = entry.caption;
  text.append(date, title, caption);

  item.append(marker, createPhotoButton(entry), text);
  return item;
}

function createPhotoButton(entry) {
  const photo = document.createElement("button");
  photo.type = "button";
  photo.className = "photo-button";
  const presentation = photoClasses[entry.photoPresentation];
  if (presentation) photo.classList.add(presentation);
  photo.setAttribute("aria-label", `${content.timelineIntro.openPhotoLabel}: ${entry.title}`);
  photo.setAttribute("aria-haspopup", "dialog");
  const image = document.createElement("img");
  image.width = 960;
  image.height = 1200;
  image.loading = "lazy";
  image.decoding = "async";
  image.alt = entry.photoAlt;
  const fallback = document.createElement("span");
  fallback.className = "photo-fallback";
  fallback.textContent = content.timelineIntro.missingPhotoLabel;
  fallback.hidden = true;
  handleMissingPhoto(image, fallback);
  image.src = entry.photo || placeholderPhoto;
  photo.append(image, fallback);
  photo.addEventListener("click", () => openPhoto(entry, photo, image));

  return photo;
}

document.getElementById("timeline-list").replaceChildren(
  ...content.timeline.map(createTimelineEntry)
);

const featuredMoment = content.timeline[Number(content.timelineIntro.featuredMomentIndex)] || content.timeline[0];
if (featuredMoment) {
  document.getElementById("moments-featured-photo").replaceChildren(createPhotoButton(featuredMoment));
}

document.getElementById("illustrations-list").replaceChildren(
  ...content.illustrations.images.map(entry => {
    const item = document.createElement("li");
    const title = document.createElement("h4");
    title.textContent = entry.title;
    const caption = document.createElement("p");
    caption.textContent = entry.caption;
    item.append(createPhotoButton(entry), title, caption);
    return item;
  })
);

const continueButton = document.getElementById("timeline-continue");
continueButton.addEventListener("click", async () => {
  if (continueButton.disabled) return;
  continueButton.disabled = true;
  await animate(timeline, [{ opacity: 1 }, { opacity: 0 }], 350);
  timeline.inert = true;
  timeline.hidden = true;
  const reasons = document.getElementById("reasons");
  reasons.hidden = false;
  reasons.inert = false;
  scrollToStart();
  document.getElementById("reasons-heading").focus({ preventScroll: true });
  await animate(reasons, [{ opacity: 0 }, { opacity: 1 }], 450);
});

const reasonDeck = createReasonDeck(content.reasons);
const note = document.getElementById("reason-note");
const reasonText = document.getElementById("reason-text");
const revealReason = document.getElementById("reason-reveal");
const completedReasons = document.getElementById("reasons-complete");
const reasonsContinue = document.getElementById("reasons-continue");
let revealing = false;

function renderReason() {
  reasonText.textContent = reasonDeck.current
    || (reasonDeck.total ? content.reasonsIntro.sealedText : content.reasonsIntro.emptyText);
  note.classList.toggle("is-sealed", reasonDeck.count === 0);
  document.getElementById("reason-progress").textContent = content.reasonsIntro.progressTemplate
    .replace("{count}", reasonDeck.count).replace("{total}", reasonDeck.total);
  revealReason.textContent = reasonDeck.count ? content.reasonsIntro.nextLabel : content.reasonsIntro.revealLabel;
  revealReason.hidden = reasonDeck.done;
  completedReasons.hidden = !reasonDeck.done || revealing;
}

renderReason();
revealReason.addEventListener("click", async () => {
  if (revealing || reasonDeck.done) return;
  revealing = true;
  revealReason.setAttribute("aria-disabled", "true");
  try {
    await animate(note, [
      { transform: "perspective(900px) rotateX(0deg)", opacity: 1 },
      { transform: "perspective(900px) rotateX(65deg)", opacity: 0 }
    ], 180);
    reasonDeck.reveal();
    renderReason();
    await animate(note, [
      { transform: "perspective(900px) rotateX(-65deg)", opacity: 0 },
      { transform: "perspective(900px) rotateX(0deg)", opacity: 1 }
    ], 420);
  } finally {
    revealing = false;
    revealReason.removeAttribute("aria-disabled");
    if (reasonDeck.done) {
      completedReasons.hidden = false;
      reasonsContinue.focus({ preventScroll: true });
    }
  }
});

document.getElementById("reasons-reset").addEventListener("click", () => {
  if (revealing) return;
  reasonDeck.reset();
  renderReason();
  revealReason.focus({ preventScroll: true });
});

reasonsContinue.addEventListener("click", async () => {
  if (reasonsContinue.disabled || revealing) return;
  reasonsContinue.disabled = true;
  const reasons = document.getElementById("reasons");
  await animate(reasons, [{ opacity: 1 }, { opacity: 0 }], 350);
  reasons.inert = true;
  reasons.hidden = true;
  const finale = document.getElementById("finale");
  finale.hidden = false;
  finale.inert = false;
  scrollToStart();
  document.getElementById("finale-heading").focus({ preventScroll: true });
  await animate(finale, [{ opacity: 0 }, { opacity: 1 }], 450);
});

document.getElementById("finale-body").replaceChildren(
  ...content.finale.noteBody.map(paragraph => {
    const text = document.createElement("p");
    text.textContent = paragraph;
    return text;
  })
);

const surpriseButton = document.getElementById("surprise-button");
const surprisePanel = document.getElementById("surprise-panel");
let surpriseShown = false;
let cleanupSurprise = () => {};
surpriseButton.addEventListener("click", async () => {
  if (surpriseShown) return;
  surpriseShown = true;
  cleanupSurprise = renderSurprise(surprisePanel, content.finale.surprise, content.finale.surpriseLabels);
  surprisePanel.hidden = false;
  surpriseButton.setAttribute("aria-expanded", "true");
  surpriseButton.setAttribute("aria-disabled", "true");
  surprisePanel.focus();
  await animate(surprisePanel, [{ opacity: 0 }, { opacity: 1 }], 300);
});

let replaying = false;
document.getElementById("replay-button").addEventListener("click", async () => {
  if (replaying) return;
  replaying = true;
  for (const animation of activeAnimations) animation.finish();
  const finale = document.getElementById("finale");
  await animate(finale, [{ opacity: 1 }, { opacity: 0 }], 350);
  cleanupSurprise();
  cleanupSurprise = () => {};
  surprisePanel.replaceChildren();
  surprisePanel.hidden = true;
  surpriseShown = false;
  surpriseButton.setAttribute("aria-expanded", "false");
  surpriseButton.removeAttribute("aria-disabled");
  for (const id of ["welcome", "timeline", "reasons", "finale"]) {
    const section = document.getElementById(id);
    section.hidden = id !== "welcome";
    section.inert = id !== "welcome";
  }
  reasonDeck.reset();
  renderReason();
  begin.disabled = false;
  continueButton.disabled = false;
  reasonsContinue.disabled = false;
  opening = false;
  scrollToStart();
  document.getElementById("welcome-headline").focus({ preventScroll: true });
  await animate(document.querySelector(".welcome-letter"), [
    { opacity: 0, transform: "translateY(8px)" },
    { opacity: 1, transform: "translateY(0)" }
  ], 900);
  replaying = false;
});
