import IconGalleryPage from "../app/dev/icon-gallery/page";

console.log("=== ZOLANZO /dev/icon-gallery Verification Audit ===");

if (typeof IconGalleryPage === "function") {
  console.log("✓ /dev/icon-gallery page component exists and is a valid React component.");
} else {
  console.error("❌ /dev/icon-gallery page component is invalid.");
  process.exit(1);
}

console.log("🎉 /dev/icon-gallery route verification passed!");
