import { useEffect } from "react";

const EMAIL_PATTERN = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
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
  const matches: Text[] = [];

  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const element = node.parentElement;

    if (!element) continue;
    if (element.closest("script, style, textarea")) continue;
    if (element.closest(".clerk-email-private, .clerk-email-revealed")) continue;

    EMAIL_PATTERN.lastIndex = 0;
    if (EMAIL_PATTERN.test(node.data)) matches.push(node);
  }

  for (const node of matches) {
    if (!node.isConnected) continue;
    const fragment = document.createDocumentFragment();
    let offset = 0;
    EMAIL_PATTERN.lastIndex = 0;

    for (const match of node.data.matchAll(EMAIL_PATTERN)) {
      const email = match[0];
      const index = match.index;
      fragment.append(node.data.slice(offset, index));

      const element = document.createElement("span");
      element.textContent = privateEmail(email);
      element.className = "clerk-email-private";
      element.tabIndex = 0;
      element.setAttribute("role", "button");
      element.setAttribute("aria-label", "Reveal email address");
      originalEmails.set(element, email);
      fragment.append(element);
      offset = index + email.length;
    }

    fragment.append(node.data.slice(offset));
    node.replaceWith(fragment);
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
