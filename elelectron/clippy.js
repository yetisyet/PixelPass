import { initAgent } from "https://cdn.jsdelivr.net/npm/clippyjs/dist/index.mjs";
import * as agents from "https://cdn.jsdelivr.net/npm/clippyjs/dist/agents/index.mjs";

function generateRandomBase64() {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);

  return btoa(String.fromCharCode(...bytes));
}

function oneInTenChance() {
  const randomNumber = new Uint32Array(1);
  crypto.getRandomValues(randomNumber);

  return randomNumber[0] % 10 === 0;
}

function generateBase64_24() {
  const randomString = generateRandomBase64();
  const easterEggs = [];

  if (oneInTenChance()) easterEggs.push("f3mBoY");
  if (oneInTenChance()) easterEggs.push("FurRy");

  const prefix = easterEggs.join("");
  return `${prefix}${randomString.slice(prefix.length)}`;
}

async function copyToClipboard(text) {
  if (window.pixelPassBackend?.copyText) {
    await window.pixelPassBackend.copyText(text);
    return;
  }

  await navigator.clipboard.writeText(text);
}

function createMessageBubble(target) {
  const bubble = document.createElement("div");
  let hideTimer;
  let positionFrame;

  Object.assign(bubble.style, {
    position: "fixed",
    zIndex: "10002",
    display: "none",
    visibility: "hidden",
    maxWidth: "240px",
    padding: "8px",
    border: "1px solid black",
    borderRadius: "5px",
    background: "#ffc",
    color: "black",
    fontFamily: '"Microsoft Sans", sans-serif',
    fontSize: "10pt",
    overflowWrap: "anywhere",
    pointerEvents: "none",
  });

  document.body.appendChild(bubble);

  function positionNextToClippy() {
    const targetRect = target.getBoundingClientRect();

    if (targetRect.width === 0 || targetRect.height === 0) {
      positionFrame = window.requestAnimationFrame(positionNextToClippy);
      return;
    }

    const bubbleRect = bubble.getBoundingClientRect();
    const left = Math.min(
      window.innerWidth - bubbleRect.width - 8,
      Math.max(8, targetRect.left + targetRect.width - bubbleRect.width),
    );
    const preferredTop = targetRect.top - bubbleRect.height - 15;
    const top = Math.min(
      window.innerHeight - bubbleRect.height - 8,
      preferredTop >= 8 ? preferredTop : targetRect.bottom + 15,
    );

    bubble.style.left = `${left}px`;
    bubble.style.top = `${top}px`;
    bubble.style.visibility = "visible";
    positionFrame = window.requestAnimationFrame(positionNextToClippy);
  }

  return (text) => {
    window.clearTimeout(hideTimer);
    window.cancelAnimationFrame(positionFrame);
    bubble.textContent = text;
    bubble.style.display = "block";
    bubble.style.visibility = "hidden";
    positionFrame = window.requestAnimationFrame(positionNextToClippy);

    hideTimer = window.setTimeout(() => {
      window.cancelAnimationFrame(positionFrame);
      bubble.style.display = "none";
    }, 5_000);
  };
}

async function initializeClippy() {
  const agent = await initAgent(agents.Clippy);
  const replaceMessage = createMessageBubble(agent._el);

  agent.show();
  replaceMessage(
    "Hello! I'm Clippy, your virtual assistant. Click me for a secure password!",
  );

  agent._el.addEventListener("click", async () => {
    const randomString = generateBase64_24();

    try {
      await copyToClipboard(randomString);
      replaceMessage(`${randomString} has been copied to your clipboard`);
    } catch (error) {
      console.error("Could not copy Clippy's base64 string:", error);
      replaceMessage("I couldn't copy the string to your clipboard.");
    }
  });
}

initializeClippy().catch((error) => {
  console.error("Could not initialize Clippy:", error);
});
