export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export class SecurityValidator {
  public static validateEmail(email: string): ValidationResult {
    if (!email || typeof email !== "string") return { valid: false, error: "Email is required." };
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email.trim())) {
      return { valid: false, error: "Invalid email format." };
    }
    return { valid: true };
  }

  public static validatePIN(pin: string): ValidationResult {
    if (!pin || typeof pin !== "string") return { valid: false, error: "PIN is required." };
    if (!/^\d{6}$/.test(pin.trim())) {
      return { valid: false, error: "PIN must be exactly 6 digits." };
    }
    return { valid: true };
  }

  public static validateAmount(amount: number, min = 100, max = 50000000): ValidationResult {
    if (typeof amount !== "number" || isNaN(amount)) {
      return { valid: false, error: "Invalid financial amount." };
    }
    if (amount < min) {
      return { valid: false, error: `Amount must be at least ₦${min.toLocaleString()}.` };
    }
    if (amount > max) {
      return { valid: false, error: `Amount cannot exceed ₦${max.toLocaleString()}.` };
    }
    return { valid: true };
  }

  public static validateFileUpload(file: { name: string; size: number; type: string }): ValidationResult {
    const maxSizeBytes = 25 * 1024 * 1024; // 25 MB
    const allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
      "application/zip",
    ];
    const dangerousExtensions = [".exe", ".bat", ".cmd", ".sh", ".php", ".js", ".vbs"];

    if (!file) return { valid: false, error: "No file provided." };
    if (file.size > maxSizeBytes) {
      return { valid: false, error: "File size exceeds 25MB limit." };
    }

    const lowerName = file.name.toLowerCase();
    if (dangerousExtensions.some((ext) => lowerName.endsWith(ext))) {
      return { valid: false, error: "Executable or script upload prohibited." };
    }

    if (!allowedMimeTypes.includes(file.type.toLowerCase())) {
      return { valid: false, error: "Unsupported file MIME type." };
    }

    return { valid: true };
  }
}
