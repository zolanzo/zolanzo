import ProductPreviewPage from "../app/dev/product-preview/page";

console.log("=== ZOLANZO Real Product Test Audit ===");

if (typeof ProductPreviewPage === "function") {
  console.log("✓ /dev/product-preview route component exists and is a valid React component.");
} else {
  console.error("❌ /dev/product-preview component is invalid.");
  process.exit(1);
}

console.log("🎉 /dev/product-preview verification passed successfully!");
