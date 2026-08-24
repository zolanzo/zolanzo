"use client";

import React, { useState } from "react";
import { WorkspaceAppShell } from "@/components/shell/workspace-app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { inviteMemberAction } from "@/features/organizations/actions/org-actions";
import { ORG_ROLE_LABELS, type OrgRole } from "@/constants/org-roles";
import type { HirerWorkspace } from "@/lib/workspace/hirer-types";

const INVITE_ROLES: Exclude<OrgRole, "owner" | "custom">[] = [
  "admin",
  "finance",
  "campaign_manager",
  "reviewer",
  "team_member",
  "read_only",
];

export function HirerTeamView({ workspace }: { workspace: HirerWorkspace }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Exclude<OrgRole, "owner" | "custom">>("campaign_manager");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    const result = await inviteMemberAction({ email, orgRole: role });
    setBusy(false);
    if (!result.ok) {
      setMessage(result.error.message);
      return;
    }
    setEmail("");
    setMessage(`Invite created for ${email}.`);
  }

  return (
    <WorkspaceAppShell workspace={workspace}>
      <div className="max-w-3xl mx-auto space-y-4 pb-20">
        <h1 className="text-xl font-black text-foreground">Team</h1>
        {!workspace.organization ? (
          <p className="text-sm text-warning bg-warning/10 border border-warning/20 rounded-2xl p-3">
            No active organization. Invites require an organization.
          </p>
        ) : (
          <form onSubmit={invite} className="rounded-2xl border border-border bg-card p-4 flex flex-col sm:flex-row gap-2">
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="flex-1 h-10 px-3 rounded-xl border border-border text-xs"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Exclude<OrgRole, "owner" | "custom">)}
              className="h-10 px-3 rounded-xl border border-border text-xs"
            >
              {INVITE_ROLES.map((key) => (
                <option key={key} value={key}>
                  {ORG_ROLE_LABELS[key]}
                </option>
              ))}
            </select>
            <button type="submit" disabled={busy} className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-bold">
              Invite
            </button>
          </form>
        )}
        {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}

        {workspace.members.length === 0 ? (
          <EmptyState title="No members loaded" description="Organization members appear here from live memberships." />
        ) : (
          <div className="space-y-2">
            {workspace.members.map((member) => (
              <div key={member.userId} className="rounded-2xl border border-border bg-card p-3 flex justify-between gap-3">
                <div>
                  <p className="text-sm font-bold">{member.displayName}</p>
                  <p className="text-[11px] text-muted-foreground">{member.email ?? "No email"}</p>
                </div>
                <p className="text-[11px] font-bold text-muted-foreground">
                  {ORG_ROLE_LABELS[member.orgRole as OrgRole] ?? member.orgRole} · {member.status}
                </p>
              </div>
            ))}
          </div>
        )}

        {workspace.invitations.length > 0 ? (
          <section className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider">Pending invites</h2>
            {workspace.invitations.map((invite) => (
              <div key={invite.id} className="rounded-2xl border border-border bg-card p-3 text-xs">
                {invite.email} · {invite.orgRole} · {invite.status}
              </div>
            ))}
          </section>
        ) : null}
      </div>
    </WorkspaceAppShell>
  );
}
