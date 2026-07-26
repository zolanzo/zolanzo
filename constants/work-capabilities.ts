/**
 * Work Capabilities — atomic building blocks of every Task Template.
 *
 * Templates are compositions of capabilities, not hardcoded one-offs.
 * Adding Instagram Follow vs LinkedIn Follow = same capabilities,
 * different config — not new engine code.
 *
 * Distinct from CampaignCapability in campaign-types.ts
 * (those are platform requirements: KYC, escrow, geo gates).
 */

export const WORK_CAPABILITIES = [
  "opens_url",
  "requires_login",
  "downloads_app",
  "opens_app",
  "creates_account",
  "runs_test",
  "takes_photo",
  "captures_screenshot",
  "uploads_photo",
  "uploads_video",
  "records_audio",
  "records_screen",
  "captures_gps",
  "verifies_location",
  "submits_text",
  "submits_json",
  "collects_rating",
  "collects_review",
  "labels_image",
  "labels_video",
  "translates_text",
  "transcribes_audio",
  "fills_form",
  "completes_survey",
  "places_call",
  "sends_message",
  "joins_community",
  "follows_profile",
  "engages_content",
  "uploads_file",
  "attaches_link",
  "captures_device_info",
  "captures_logs",
  "confirms_action",
  "waits_duration",
  "custom_step",
  // Sprint 2 aliases / expansions (canonical catalog entries)
  "captures_photo",
  "captures_video",
  "captures_audio",
  "labels_audio",
  "answers_questions",
  "submits_rating",
  "submits_review",
  "joins_group",
  "follows_account",
  "calls_phone",
  "custom_capability",
] as const;

export type WorkCapability = (typeof WORK_CAPABILITIES)[number];

export type WorkCapabilityDefinition = {
  id: WorkCapability;
  label: string;
  description: string;
  /** What evidence this capability typically produces */
  evidenceKinds: readonly EvidenceKind[];
  /** Whether worker device/runtime must support it */
  clientRuntime?: "web" | "mobile" | "either";
};

export const EVIDENCE_KINDS = [
  "text",
  "file",
  "image",
  "video",
  "audio",
  "link",
  "json",
  "location",
  "screen_recording",
  "logs",
  "rating",
  "custom",
] as const;

export type EvidenceKind = (typeof EVIDENCE_KINDS)[number];

export const WORK_CAPABILITY_CATALOG: Record<
  WorkCapability,
  WorkCapabilityDefinition
> = {
  opens_url: {
    id: "opens_url",
    label: "Open URL",
    description: "Worker opens a provided URL.",
    evidenceKinds: ["link", "image"],
    clientRuntime: "either",
  },
  requires_login: {
    id: "requires_login",
    label: "Requires Login",
    description: "Worker authenticates on a third-party property.",
    evidenceKinds: ["image", "text"],
    clientRuntime: "either",
  },
  downloads_app: {
    id: "downloads_app",
    label: "Download App",
    description: "Worker downloads/installs an application.",
    evidenceKinds: ["image", "logs"],
    clientRuntime: "mobile",
  },
  opens_app: {
    id: "opens_app",
    label: "Open App",
    description: "Worker launches the installed application.",
    evidenceKinds: ["image", "logs"],
    clientRuntime: "mobile",
  },
  creates_account: {
    id: "creates_account",
    label: "Create Account",
    description: "Worker registers an account per brief.",
    evidenceKinds: ["image", "text", "link"],
    clientRuntime: "either",
  },
  runs_test: {
    id: "runs_test",
    label: "Run Test",
    description: "Worker executes a test script or checklist.",
    evidenceKinds: ["text", "logs", "image", "video"],
    clientRuntime: "either",
  },
  takes_photo: {
    id: "takes_photo",
    label: "Take Photo",
    description: "Worker captures a photo with device camera.",
    evidenceKinds: ["image"],
    clientRuntime: "mobile",
  },
  captures_screenshot: {
    id: "captures_screenshot",
    label: "Capture Screenshot",
    description: "Worker captures screen evidence.",
    evidenceKinds: ["image"],
    clientRuntime: "either",
  },
  uploads_photo: {
    id: "uploads_photo",
    label: "Upload Photo",
    description: "Worker uploads one or more photos.",
    evidenceKinds: ["image"],
    clientRuntime: "either",
  },
  uploads_video: {
    id: "uploads_video",
    label: "Upload Video",
    description: "Worker uploads video evidence.",
    evidenceKinds: ["video"],
    clientRuntime: "either",
  },
  records_audio: {
    id: "records_audio",
    label: "Record Audio",
    description: "Worker records spoken audio.",
    evidenceKinds: ["audio"],
    clientRuntime: "either",
  },
  records_screen: {
    id: "records_screen",
    label: "Record Screen",
    description: "Worker records a screen session.",
    evidenceKinds: ["screen_recording"],
    clientRuntime: "either",
  },
  captures_gps: {
    id: "captures_gps",
    label: "Capture GPS",
    description: "Worker shares GPS coordinates.",
    evidenceKinds: ["location"],
    clientRuntime: "mobile",
  },
  verifies_location: {
    id: "verifies_location",
    label: "Verify Location",
    description: "System/worker confirms location against geofence.",
    evidenceKinds: ["location", "json"],
    clientRuntime: "mobile",
  },
  submits_text: {
    id: "submits_text",
    label: "Submit Text",
    description: "Worker submits freeform or structured text.",
    evidenceKinds: ["text"],
    clientRuntime: "either",
  },
  submits_json: {
    id: "submits_json",
    label: "Submit JSON",
    description: "Worker or client runtime submits structured JSON.",
    evidenceKinds: ["json"],
    clientRuntime: "either",
  },
  collects_rating: {
    id: "collects_rating",
    label: "Collect Rating",
    description: "Worker provides a numeric/star rating.",
    evidenceKinds: ["rating", "json"],
    clientRuntime: "either",
  },
  collects_review: {
    id: "collects_review",
    label: "Collect Review",
    description: "Worker writes a review (optionally posts externally).",
    evidenceKinds: ["text", "link", "image"],
    clientRuntime: "either",
  },
  labels_image: {
    id: "labels_image",
    label: "Label Image",
    description: "Worker annotates an image.",
    evidenceKinds: ["json", "image"],
    clientRuntime: "either",
  },
  labels_video: {
    id: "labels_video",
    label: "Label Video",
    description: "Worker annotates video segments/frames.",
    evidenceKinds: ["json", "video"],
    clientRuntime: "either",
  },
  translates_text: {
    id: "translates_text",
    label: "Translate Text",
    description: "Worker translates content between languages.",
    evidenceKinds: ["text", "file"],
    clientRuntime: "either",
  },
  transcribes_audio: {
    id: "transcribes_audio",
    label: "Transcribe Audio",
    description: "Worker produces a transcript from audio.",
    evidenceKinds: ["text", "json"],
    clientRuntime: "either",
  },
  fills_form: {
    id: "fills_form",
    label: "Fill Form",
    description: "Worker completes a structured form.",
    evidenceKinds: ["json", "image"],
    clientRuntime: "either",
  },
  completes_survey: {
    id: "completes_survey",
    label: "Complete Survey",
    description: "Worker answers survey questions.",
    evidenceKinds: ["json"],
    clientRuntime: "either",
  },
  places_call: {
    id: "places_call",
    label: "Place Call",
    description: "Worker places an outbound call (lead calling).",
    evidenceKinds: ["logs", "audio", "text"],
    clientRuntime: "mobile",
  },
  sends_message: {
    id: "sends_message",
    label: "Send Message",
    description: "Worker sends a message on a channel.",
    evidenceKinds: ["image", "text"],
    clientRuntime: "either",
  },
  joins_community: {
    id: "joins_community",
    label: "Join Community",
    description: "Worker joins a group/community.",
    evidenceKinds: ["image", "link"],
    clientRuntime: "either",
  },
  follows_profile: {
    id: "follows_profile",
    label: "Follow Profile",
    description: "Worker follows a social profile.",
    evidenceKinds: ["image", "link"],
    clientRuntime: "either",
  },
  engages_content: {
    id: "engages_content",
    label: "Engage Content",
    description: "Worker likes/comments/shares content.",
    evidenceKinds: ["image", "link"],
    clientRuntime: "either",
  },
  uploads_file: {
    id: "uploads_file",
    label: "Upload File",
    description: "Worker uploads an arbitrary file.",
    evidenceKinds: ["file"],
    clientRuntime: "either",
  },
  attaches_link: {
    id: "attaches_link",
    label: "Attach Link",
    description: "Worker provides a proof URL.",
    evidenceKinds: ["link"],
    clientRuntime: "either",
  },
  captures_device_info: {
    id: "captures_device_info",
    label: "Capture Device Info",
    description: "Runtime captures device/OS metadata.",
    evidenceKinds: ["json", "logs"],
    clientRuntime: "either",
  },
  captures_logs: {
    id: "captures_logs",
    label: "Capture Logs",
    description: "Worker or runtime attaches diagnostic logs.",
    evidenceKinds: ["logs"],
    clientRuntime: "either",
  },
  confirms_action: {
    id: "confirms_action",
    label: "Confirm Action",
    description: "Worker confirms a checklist step.",
    evidenceKinds: ["json"],
    clientRuntime: "either",
  },
  waits_duration: {
    id: "waits_duration",
    label: "Wait Duration",
    description: "Worker waits a required duration (e.g. app session).",
    evidenceKinds: ["logs", "json"],
    clientRuntime: "either",
  },
  custom_step: {
    id: "custom_step",
    label: "Custom Step",
    description: "Client-defined step with custom evidence schema.",
    evidenceKinds: ["custom", "text", "file", "json"],
    clientRuntime: "either",
  },
  captures_photo: {
    id: "captures_photo",
    label: "Capture Photo",
    description: "Worker captures a photo (camera).",
    evidenceKinds: ["image"],
    clientRuntime: "mobile",
  },
  captures_video: {
    id: "captures_video",
    label: "Capture Video",
    description: "Worker captures video evidence.",
    evidenceKinds: ["video"],
    clientRuntime: "either",
  },
  captures_audio: {
    id: "captures_audio",
    label: "Capture Audio",
    description: "Worker captures audio evidence.",
    evidenceKinds: ["audio"],
    clientRuntime: "either",
  },
  labels_audio: {
    id: "labels_audio",
    label: "Label Audio",
    description: "Worker annotates audio segments.",
    evidenceKinds: ["json", "audio"],
    clientRuntime: "either",
  },
  answers_questions: {
    id: "answers_questions",
    label: "Answer Questions",
    description: "Worker answers structured questions.",
    evidenceKinds: ["json", "text"],
    clientRuntime: "either",
  },
  submits_rating: {
    id: "submits_rating",
    label: "Submit Rating",
    description: "Worker submits a rating score.",
    evidenceKinds: ["rating", "json"],
    clientRuntime: "either",
  },
  submits_review: {
    id: "submits_review",
    label: "Submit Review",
    description: "Worker submits a written review.",
    evidenceKinds: ["text", "link", "image"],
    clientRuntime: "either",
  },
  joins_group: {
    id: "joins_group",
    label: "Join Group",
    description: "Worker joins a group or community.",
    evidenceKinds: ["image", "link"],
    clientRuntime: "either",
  },
  follows_account: {
    id: "follows_account",
    label: "Follow Account",
    description: "Worker follows an account/profile.",
    evidenceKinds: ["image", "link"],
    clientRuntime: "either",
  },
  calls_phone: {
    id: "calls_phone",
    label: "Call Phone",
    description: "Worker places a phone call.",
    evidenceKinds: ["logs", "audio", "text"],
    clientRuntime: "mobile",
  },
  custom_capability: {
    id: "custom_capability",
    label: "Custom Capability",
    description: "Extensible custom work capability.",
    evidenceKinds: ["custom", "text", "file", "json"],
    clientRuntime: "either",
  },
};

/** Helper: union of evidence kinds required by a capability set */
export function evidenceKindsForCapabilities(
  capabilities: readonly WorkCapability[],
): EvidenceKind[] {
  const set = new Set<EvidenceKind>();
  for (const id of capabilities) {
    const def = WORK_CAPABILITY_CATALOG[id];
    for (const kind of def.evidenceKinds) {
      set.add(kind);
    }
  }
  return [...set];
}
