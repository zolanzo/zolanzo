"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import type { HomeFaq } from "@/components/home/home-content";

export function HomeFaqAccordion({ faqs }: { faqs: readonly HomeFaq[] }) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="max-w-[800px] mx-auto divide-y divide-zinc-200/80">
      {faqs.map((faq, index) => {
        const isOpen = openFaq === index;
        return (
          <div key={faq.question} className="py-4">
            <button
              type="button"
              onClick={() => setOpenFaq(isOpen ? null : index)}
              className="w-full py-2 flex items-center justify-between gap-4 text-left font-bold text-zinc-950 text-base sm:text-lg hover:text-[#008744] transition-colors cursor-pointer"
              aria-expanded={isOpen}
            >
              <span>{faq.question}</span>
              <HugeiconsIcon
                icon={ArrowDown01Icon}
                size={20}
                className={`text-[#008744] transition-transform duration-200 shrink-0 ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isOpen && (
              <div className="pt-2 pb-2">
                <p className="text-sm sm:text-base text-zinc-600 leading-relaxed font-normal">
                  {faq.answer}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
