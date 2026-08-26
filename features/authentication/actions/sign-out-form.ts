"use server";

import { redirect } from "next/navigation";
import { signOutAction } from "@/features/authentication/actions/auth-actions";

export async function signOutFormAction(): Promise<void> {
  await signOutAction();
  redirect("/login");
}
