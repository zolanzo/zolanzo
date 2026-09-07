"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { isValidEmail } from "@/lib/auth/email";
import { CONTACT_SUBJECTS } from "@/lib/contact/subjects";
import {
  expectedMathSum,
  parseMathAnswer,
  type PublicMathChallenge,
} from "@/lib/contact/math";

type ContactFormProps = {
  initialChallenge: PublicMathChallenge;
  initialName?: string;
  initialEmail?: string;
};

const SUCCESS_MESSAGE = "Message sent. We'll get back to you soon.";
const GENERIC_ERROR = "Something went wrong. Please try again.";

export function ContactForm({
  initialChallenge,
  initialName = "",
  initialEmail = "",
}: ContactFormProps) {
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [mathAnswer, setMathAnswer] = useState("");
  const [challenge, setChallenge] = useState(initialChallenge);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const mathOk = useMemo(() => {
    const parsed = parseMathAnswer(mathAnswer);
    return parsed === expectedMathSum(challenge.left, challenge.right);
  }, [mathAnswer, challenge.left, challenge.right]);

  const canSubmit =
    name.trim().length >= 2 &&
    isValidEmail(email) &&
    subject.length > 0 &&
    message.trim().length >= 4 &&
    mathOk &&
    !submitting;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          subject,
          message,
          website,
          challengeToken: challenge.token,
          mathAnswer,
        }),
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        data?: { challenge?: PublicMathChallenge };
        error?: { message?: string };
      };

      if (payload.ok && payload.data?.challenge) {
        setSuccess(SUCCESS_MESSAGE);
        setSubject("");
        setMessage("");
        setMathAnswer("");
        setWebsite("");
        setChallenge(payload.data.challenge);
        setName(initialName);
        setEmail(initialEmail);
        return;
      }

      setError(payload.error?.message || GENERIC_ERROR);
    } catch {
      setError(GENERIC_ERROR);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="sr-only" aria-hidden>
        <label htmlFor="contact-website">Company</label>
        <input
          id="contact-website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
        />
      </div>

      <Input
        id="contact-name"
        name="name"
        label="Full Name"
        required
        autoComplete="name"
        value={name}
        onChange={(event) => setName(event.target.value)}
      />

      <Input
        id="contact-email"
        name="email"
        type="email"
        label="Email Address"
        required
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />

      <Select
        id="contact-subject"
        name="subject"
        label="Subject"
        required
        placeholder="Select a subject"
        value={subject}
        onChange={(event) => setSubject(event.target.value)}
        options={CONTACT_SUBJECTS.map((item) => ({
          value: item.value,
          label: item.label,
        }))}
      />

      <Textarea
        id="contact-message"
        name="message"
        label="Message"
        required
        rows={5}
        placeholder="How can we help?"
        value={message}
        onChange={(event) => setMessage(event.target.value)}
      />

      <Input
        id="contact-math"
        name="mathAnswer"
        label={challenge.prompt}
        required
        inputMode="numeric"
        autoComplete="off"
        value={mathAnswer}
        onChange={(event) => setMathAnswer(event.target.value)}
      />

      {success ? (
        <p className="text-sm font-medium text-success" role="status">
          {success}
        </p>
      ) : null}

      {error ? (
        <p className="text-sm font-medium text-danger" role="alert">
          {error}
        </p>
      ) : null}

      <Button type="submit" fullWidth disabled={!canSubmit} loading={submitting}>
        Send Message
      </Button>
    </form>
  );
}
