#!/usr/bin/env node

// Check if we're running from the development environment or a packaged distribution
try {
  // In development, use the src directly with Bun
  if (process.env.NODE_ENV === "development") {
    await import("../src/index.ts");
  } else {
    // In production, use the compiled dist
    await import("../dist/index.js");
  }
} catch (error) {
  console.error("Failed to start rules CLI:", error);
  process.exit(1);
}
