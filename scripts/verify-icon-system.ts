import { Icons, CategoryIconsRegistry, BrandIconsRegistry } from "../lib/icon-registry";
import { ICON_SIZES, ICON_STROKE_WIDTH } from "../lib/icons";
import { BRAND_COLORS } from "../components/ui/brand-icons/brand-svgs";

console.log("=== ZOLANZO Premium Icon System Audit ===");

console.log(
  `✓ ICON_SIZES: Small=${ICON_SIZES.small}px, Default=${ICON_SIZES.default}px, Nav=${ICON_SIZES.navigation}px, LargeCards=${ICON_SIZES.largeCards}px, Feature=${ICON_SIZES.feature}px`,
);
console.log(`✓ ICON_STROKE_WIDTH: ${ICON_STROKE_WIDTH}`);

// Verify Brand Icons
const requiredBrands = [
  "facebook",
  "instagram",
  "tiktok",
  "youtube",
  "x",
  "twitter",
  "whatsapp",
  "telegram",
  "linkedin",
  "discord",
  "google",
  "microsoft",
  "apple",
];

const missingBrands = requiredBrands.filter((b) => !(b in BrandIconsRegistry));
if (missingBrands.length > 0) {
  console.error("❌ Missing Brand Icons in Registry:", missingBrands);
  process.exit(1);
} else {
  console.log(`✓ All ${requiredBrands.length} official brand icons verified in BrandIconsRegistry.`);
}

// Verify Brand Colors Meta
const missingColorMeta = requiredBrands.filter((b) => !(b in BRAND_COLORS));
if (missingColorMeta.length > 0) {
  console.error("❌ Missing Brand Color Meta:", missingColorMeta);
  process.exit(1);
} else {
  console.log(`✓ Brand color palettes verified for all ${requiredBrands.length} brands.`);
}

// Verify Categories
const requiredCategories = [
  "Social Media",
  "AI Training",
  "Surveys",
  "Writing",
  "Content Creation",
  "Graphic Design",
  "Video Editing",
  "Photography",
  "Voice Recording",
  "Translation",
  "Data Entry",
  "Data Annotation",
  "Customer Support",
  "Virtual Assistant",
  "Software Testing",
  "Web Development",
  "Mobile Development",
  "UI/UX Design",
  "Marketing",
  "Sales",
  "Research",
  "Moderation",
  "Field Tasks",
  "Delivery",
  "Finance",
  "Accounting",
  "Education",
  "Healthcare",
  "Legal",
  "Engineering",
  "Agriculture",
  "Logistics",
  "Manufacturing",
  "Hospitality",
  "Beauty & Fashion",
  "Events",
  "Other",
];

const missingCategories = requiredCategories.filter((c) => !(c in CategoryIconsRegistry));
if (missingCategories.length > 0) {
  console.error("❌ Missing Category Mappings:", missingCategories);
  process.exit(1);
} else {
  console.log(`✓ All ${requiredCategories.length} category icon mappings verified.`);
}

// Verify System Icons
const requiredSystemIcons = [
  "home",
  "explore",
  "jobs",
  "messages",
  "wallet",
  "payments",
  "notifications",
  "profile",
  "dashboard",
  "teams",
  "organization",
  "settings",
  "help",
  "logout",
  "search",
  "filter",
  "sort",
  "menu",
  "close",
  "add",
  "edit",
  "delete",
  "save",
  "upload",
  "download",
  "share",
  "refresh",
  "copy",
  "forward",
  "back",
  "verified",
  "badge",
  "shield",
  "shieldCheck",
  "lock",
  "unlock",
  "fingerprint",
  "identity",
  "certificate",
  "card",
  "bank",
  "coins",
  "receipt",
  "invoice",
  "deposit",
  "withdrawal",
  "escrow",
  "mail",
  "phone",
  "chat",
  "bell",
  "video",
  "folder",
  "file",
  "image",
  "camera",
  "paperclip",
  "chart",
  "pieChart",
  "trendingUp",
  "trendingDown",
  "activity",
  "target",
  "calendar",
  "clock",
  "globe",
  "language",
  "qrCode",
  "star",
  "heart",
  "bookmark",
  "gift",
  "trophy",
  "fire",
  "sparkles",
];

const missingSystemIcons = requiredSystemIcons.filter((i) => !(i in Icons));
if (missingSystemIcons.length > 0) {
  console.error("❌ Missing System Icons:", missingSystemIcons);
  process.exit(1);
} else {
  console.log(`✓ All ${requiredSystemIcons.length} system icons verified in central registry.`);
}

console.log("🎉 All Premium Icon System checks passed successfully!");
