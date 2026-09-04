import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import "@fontsource/geist-pixel";
import { Root } from "./Root";
import "./index.css";

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");

const convexUrl = import.meta.env.VITE_CONVEX_URL;
const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

createRoot(root).render(
  <StrictMode>
    <BrowserRouter>
      <Root convexUrl={convexUrl} clerkKey={clerkKey} />
    </BrowserRouter>
  </StrictMode>,
);
