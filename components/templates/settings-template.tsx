import type { ReactNode } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { PageTransition } from "@/components/layout/page-transition";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/utils";

export type SettingsSection = {
  id: string;
  label: string;
  content: ReactNode;
};

export type SettingsTemplateProps = {
  title?: string;
  description?: string;
  sections: SettingsSection[];
  className?: string;
};

export function SettingsTemplate({
  title = "Settings",
  description = "Manage your workspace preferences.",
  sections,
  className,
}: SettingsTemplateProps) {
  const first = sections[0]?.id ?? "general";

  return (
    <PageTransition className={cn("flex flex-col gap-6", className)}>
      <PageHeader title={title} description={description} />
      <Tabs defaultValue={first}>
        <TabsList>
          {sections.map((section) => (
            <TabsTrigger key={section.id} value={section.id}>
              {section.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {sections.map((section) => (
          <TabsContent key={section.id} value={section.id} className="mt-6">
            {section.content}
          </TabsContent>
        ))}
      </Tabs>
    </PageTransition>
  );
}
