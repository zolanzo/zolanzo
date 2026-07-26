"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert } from "@/components/ui/alert";
import {
  setAvatarUrlAction,
  updatePrivateProfileAction,
  updatePublicProfileAction,
} from "@/features/users/actions/profile-actions";

export function ProfileForms(props: {
  publicProfile: {
    displayName: string;
    handle: string;
    avatarUrl: string | null;
    bio: string | null;
    countryCode: string | null;
  };
  privateProfile: {
    legalName: string | null;
    marketingOptIn: boolean;
  };
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-10">
      {message ? <Alert variant="success">{message}</Alert> : null}
      {error ? <Alert variant="danger">{error}</Alert> : null}

      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          setMessage(null);
          setError(null);
          startTransition(async () => {
            const result = await updatePublicProfileAction({
              displayName: String(form.get("displayName") ?? ""),
              handle: String(form.get("handle") ?? ""),
              bio: String(form.get("bio") ?? "") || null,
              countryCode: String(form.get("countryCode") ?? "") || null,
            });
            if (!result.ok) {
              setError(result.error.message);
              return;
            }
            setMessage("Public profile updated");
          });
        }}
      >
        <h2 className="font-heading text-lg font-semibold">Public profile</h2>
        <Input
          name="displayName"
          label="Display name"
          defaultValue={props.publicProfile.displayName}
          required
        />
        <Input
          name="handle"
          label="Handle"
          defaultValue={props.publicProfile.handle}
          required
        />
        <Input
          name="bio"
          label="Bio"
          defaultValue={props.publicProfile.bio ?? ""}
        />
        <Input
          name="countryCode"
          label="Country code"
          defaultValue={props.publicProfile.countryCode ?? ""}
        />
        <Button type="submit" loading={pending}>
          Save public profile
        </Button>
      </form>

      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          setMessage(null);
          setError(null);
          startTransition(async () => {
            const result = await updatePrivateProfileAction({
              legalName: String(form.get("legalName") ?? "") || null,
              marketingOptIn: form.get("marketingOptIn") === "on",
            });
            if (!result.ok) {
              setError(result.error.message);
              return;
            }
            setMessage("Private profile updated");
          });
        }}
      >
        <h2 className="font-heading text-lg font-semibold">Private profile</h2>
        <Input
          name="legalName"
          label="Legal name"
          defaultValue={props.privateProfile.legalName ?? ""}
        />
        <Checkbox
          name="marketingOptIn"
          label="Marketing emails"
          defaultChecked={props.privateProfile.marketingOptIn}
        />
        <Button type="submit" loading={pending}>
          Save private profile
        </Button>
      </form>

      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          setMessage(null);
          setError(null);
          startTransition(async () => {
            const url = String(form.get("avatarUrl") ?? "") || null;
            const result = await setAvatarUrlAction(url);
            if (!result.ok) {
              setError(result.error.message);
              return;
            }
            setMessage("Avatar URL saved");
          });
        }}
      >
        <h2 className="font-heading text-lg font-semibold">Avatar</h2>
        <Input
          name="avatarUrl"
          label="Avatar URL"
          hint="Upload pipeline can supply a URL; no processing here"
          defaultValue={props.publicProfile.avatarUrl ?? ""}
        />
        <Button type="submit" loading={pending} variant="secondary">
          Save avatar URL
        </Button>
      </form>
    </div>
  );
}
