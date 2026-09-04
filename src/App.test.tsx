import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vite-plus/test";
import App from "./App.tsx";

describe("App", () => {
  it("introduces the practice log", () => {
    const markup = renderToStaticMarkup(<App />);

    expect(markup).toContain("This is where day one begins.");
  });
});
