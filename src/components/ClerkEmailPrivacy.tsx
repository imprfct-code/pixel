import { useEffect } from "react";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const originalEmails = new WeakMap<HTMLElement, string>();
const revealedEmails = new WeakSet<HTMLElement>();

function privateEmail(email: string) {
  let hash = 0;
  for (const character of email) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return `artist${String(hash % 10_000).padStart(4, "0")}@pixelmail.dev`;
}

function revealEmail(element: HTMLElement) {
  const email = originalEmails.get(element);
  if (!email) return;

  revealedEmails.add(element);
  element.textContent = email;
  element.classList.remove("clerk-email-private");
  element.classList.add("clerk-email-revealed");
  element.removeAttribute("aria-label");
  element.removeAttribute("role");
  element.removeAttribute("tabindex");
}

function maskEmails(root: ParentNode) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const matches: HTMLElement[] = [];

  while (walker.nextNode()) {
    const node = walker.currentNode;
    const email = node.textContent?.trim() ?? "";
    const element = node.parentElement;

    if (!element || !EMAIL_PATTERN.test(email)) continue;
    if (!element.closest('[class*="cl-"]')) continue;
    if (element.textContent?.trim() !== email) continue;
    if (originalEmails.has(element) || revealedEmails.has(element)) continue;

    originalEmails.set(element, email);
    matches.push(element);
  }

  for (const element of matches) {
    const email = originalEmails.get(element);
    if (!email) continue;
    element.textContent = privateEmail(email);
    element.classList.add("clerk-email-private");
    element.tabIndex = 0;
    element.setAttribute("role", "button");
    element.setAttribute("aria-label", "Reveal email address");
  }
}

export function ClerkEmailPrivacy() {
  useEffect(() => {
    let animationFrame = 0;
    const scan = () => {
      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(() => maskEmails(document.body));
    };
    const revealFromEvent = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return false;
      const email = target.closest<HTMLElement>(".clerk-email-private");
      if (!email) return false;
      revealEmail(email);
      return true;
    };
    const handleClick = (event: MouseEvent) => {
      if (!revealFromEvent(event.target)) return;
      event.preventDefault();
      event.stopPropagation();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      if (!revealFromEvent(event.target)) return;
      event.preventDefault();
      event.stopPropagation();
    };

    scan();
    const observer = new MutationObserver(scan);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    document.addEventListener("click", handleClick, true);
    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      cancelAnimationFrame(animationFrame);
      observer.disconnect();
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, []);

  return null;
}
