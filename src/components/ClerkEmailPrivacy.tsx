import { useEffect } from "react";

const EMAIL_PATTERN = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
const originalEmails = new WeakMap<HTMLElement, string>();
const CLERK_ROOTS =
  ".cl-userButtonPopoverCard, .cl-userProfile-root, .cl-signIn-root, .cl-signUp-root";

function privateEmail(email: string) {
  let hash = 0;
  for (const character of email) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return `artist${String(hash % 10_000).padStart(4, "0")}@pixelmail.dev`;
}

function containsEmail(value: string) {
  EMAIL_PATTERN.lastIndex = 0;
  return EMAIL_PATTERN.test(value);
}

function createPrivateEmail(email: string) {
  const element = document.createElement("span");
  element.textContent = privateEmail(email);
  element.className = "clerk-email-private";
  element.tabIndex = 0;
  element.setAttribute("role", "button");
  element.setAttribute("aria-label", "Reveal email address");
  originalEmails.set(element, email);
  return element;
}

function revealEmail(element: HTMLElement) {
  const email = originalEmails.get(element);
  if (!email) return;

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

    if (containsEmail(node.data)) matches.push(node);
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

      fragment.append(createPrivateEmail(email));
      offset = index + email.length;
    }

    fragment.append(node.data.slice(offset));
    node.replaceWith(fragment);
  }

  maskSplitEmails(root);
}

function maskSplitEmails(root: ParentNode) {
  const candidates = Array.from(root.querySelectorAll<HTMLElement>("*"));

  for (const element of candidates.reverse()) {
    if (element.closest("script, style, textarea")) continue;
    if (element.closest(".clerk-email-private, .clerk-email-revealed")) continue;
    if (!containsEmail(element.textContent ?? "")) continue;
    if (Array.from(element.children).some((child) => containsEmail(child.textContent ?? ""))) {
      continue;
    }

    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const nodes: Text[] = [];
    while (walker.nextNode()) nodes.push(walker.currentNode as Text);
    const text = nodes.map((node) => node.data).join("");
    const matches = Array.from(text.matchAll(EMAIL_PATTERN)).reverse();

    for (const match of matches) {
      const start = locateTextOffset(nodes, match.index);
      const end = locateTextOffset(nodes, match.index + match[0].length);
      if (!start || !end) continue;

      const range = document.createRange();
      range.setStart(start.node, start.offset);
      range.setEnd(end.node, end.offset);
      range.deleteContents();
      range.insertNode(createPrivateEmail(match[0]));
    }
  }
}

function locateTextOffset(nodes: Text[], offset: number) {
  let cursor = 0;
  for (const node of nodes) {
    const end = cursor + node.data.length;
    if (offset <= end) return { node, offset: offset - cursor };
    cursor = end;
  }
  return undefined;
}

export function ClerkEmailPrivacy() {
  useEffect(() => {
    let animationFrame = 0;
    const scan = () => {
      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(() => {
        for (const root of document.querySelectorAll(CLERK_ROOTS)) maskEmails(root);
      });
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
    const observer = new MutationObserver((records) => {
      const changed = records.some((record) => {
        const parent =
          record.target instanceof Element ? record.target : record.target.parentElement;
        if (parent?.closest(CLERK_ROOTS)) return true;
        return Array.from(record.addedNodes).some(
          (node) =>
            node instanceof Element &&
            (node.matches(CLERK_ROOTS) || node.querySelector(CLERK_ROOTS)),
        );
      });
      if (changed) scan();
    });
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
