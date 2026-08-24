"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import type { FaqGroup } from "@/components/faq/faq-content";

export function FaqAccordion({ groups }: { groups: readonly FaqGroup[] }) {
  const firstQuestion = groups[0]?.items[0]?.question ?? null;
  const [openQuestion, setOpenQuestion] = useState<string | null>(firstQuestion);

  return (
    <div className="mx-auto max-w-[800px] space-y-8">
      {groups.map((group) => (
        <section key={group.id} aria-labelledby={`faq-${group.id}`}>
          <h2
            id={`faq-${group.id}`}
            className="text-xs font-bold uppercase tracking-wider text-foreground"
          >
            {group.title}
          </h2>
          <div className="mt-2 divide-y divide-border">
            {group.items.map((faq) => {
              const isOpen = openQuestion === faq.question;
              return (
                <div key={faq.question} className="py-4">
                  <button
                    type="button"
                    onClick={() => setOpenQuestion(isOpen ? null : faq.question)}
                    className="flex min-h-11 w-full cursor-pointer items-center justify-between gap-4 py-2 text-left text-base font-bold text-foreground transition-colors hover:text-primary sm:text-lg"
                    aria-expanded={isOpen}
                  >
                    <span>{faq.question}</span>
                    <HugeiconsIcon
                      icon={ArrowDown01Icon}
                      size={20}
                      className={`shrink-0 text-primary transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isOpen ? (
                    <div className="pb-2 pt-2">
                      <p className="text-sm font-normal leading-relaxed text-muted-foreground sm:text-base">
                        {faq.answer}
                      </p>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
