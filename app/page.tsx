import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Share01Icon,
  Robot01Icon,
  ClipboardListIcon,
  PencilEdit01Icon,
  HeadsetIcon,
  Coins01Icon,
  AnalyticsUpIcon,
  UserGroupIcon,
  CheckmarkBadge01Icon,
  CursorPointer01Icon,
  CheckmarkCircle01Icon,
  Wallet01Icon,
  Shield01Icon,
  SmartPhone01Icon,
  ArrowRight01Icon,
  CircleLock01Icon,
} from "@hugeicons/core-free-icons";
import { Navbar } from "@/components/navigation/navbar";
import { ThemedHeroImage } from "@/components/brand/themed-hero-image";
import { HomeFooter } from "@/components/home/home-footer";
import { HomeSocialOpportunities } from "@/components/home/home-social-opportunities";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-background font-sans text-foreground">
      <Navbar />

      <section className="relative w-full overflow-hidden border-b border-border bg-background py-10 text-foreground sm:py-16 lg:py-20">
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[600px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/15 via-primary/5 to-transparent blur-3xl" />

        <div className="relative z-10 mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[54%_46%]">
            <div className="flex w-full max-w-[640px] flex-col items-start text-left">
              <div className="mb-4 inline-flex max-w-full items-center gap-2 rounded-full border border-primary/20 bg-primary-subtle px-3.5 py-1.5 text-xs font-semibold text-primary">
                <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                <span>Africa&apos;s #1 Digital Workforce Marketplace</span>
              </div>

              <h1 className="space-y-2 text-left text-[42px] font-black leading-[1.02] tracking-[-0.05em] text-foreground sm:text-[56px] lg:text-[64px] xl:text-[68px]">
                <span className="block">
                  Work that <span className="font-black text-primary">pays.</span>
                </span>
                <span className="block">
                  Impact that <span className="font-black text-primary">lasts.</span>
                </span>
              </h1>

              <p className="mt-3 max-w-[500px] text-left text-base font-medium leading-relaxed text-muted-foreground sm:text-lg">
                Simple online tasks. Real income.
              </p>

              <div className="mt-7 flex w-full flex-col items-stretch sm:w-auto">
                <div className="flex w-full flex-col gap-2.5 sm:flex-row sm:items-center">
                  <Link
                    href="/tasks"
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover sm:w-auto sm:min-w-[148px]"
                  >
                    Find Work
                    <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
                  </Link>
                  <Link
                    href="/signup"
                    className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-border bg-surface px-5 text-sm font-semibold text-foreground transition-colors hover:bg-hover sm:w-auto sm:min-w-[148px]"
                  >
                    Hire Talent
                  </Link>
                </div>
                <Link
                  href="/#how-it-works"
                  className="mt-3 inline-flex h-11 items-center justify-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:mt-2.5 sm:h-auto sm:justify-start"
                >
                  How It Works
                </Link>
              </div>
            </div>

            <div className="flex w-full items-end justify-center self-end lg:justify-end">
              <div className="relative flex w-full max-w-[480px] items-end justify-center lg:max-w-none lg:justify-end">
                <ThemedHeroImage
                  alt="ZOLANZO Talent displaying mobile app interface"
                  width={620}
                  height={620}
                  className="h-auto max-h-[500px] w-full select-none object-contain object-bottom sm:max-h-[560px] lg:max-h-[600px]"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full border-b border-border bg-background-secondary py-3.5">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-8">
          <div className="grid grid-cols-3 gap-2 lg:grid-cols-6">
            {[
              { icon: Share01Icon, label: "Social Media" },
              { icon: Robot01Icon, label: "AI Training" },
              { icon: ClipboardListIcon, label: "Surveys" },
              { icon: PencilEdit01Icon, label: "Writing" },
              { icon: HeadsetIcon, label: "Virtual Assistant" },
            ].map((cat) => (
              <Link
                key={cat.label}
                href="/tasks"
                className="group flex cursor-pointer flex-col items-center justify-center rounded-xl p-2.5 text-center transition-all duration-200 hover:bg-card hover:shadow-sm"
              >
                <div className="mb-1 flex h-8 w-8 items-center justify-center rounded-lg bg-primary-subtle text-primary transition-transform group-hover:scale-105">
                  <HugeiconsIcon icon={cat.icon} size={20} className="text-primary" />
                </div>
                <span className="text-[11px] font-semibold leading-tight text-foreground sm:text-[12px]">
                  {cat.label}
                </span>
              </Link>
            ))}

            <Link
              href="/tasks"
              className="group flex cursor-pointer flex-col items-center justify-center rounded-xl p-2.5 text-center transition-all duration-200 hover:bg-card hover:shadow-sm"
            >
              <div className="mb-1 flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background transition-transform group-hover:scale-105">
                <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
              </div>
              <span className="text-[11px] font-bold leading-tight text-foreground sm:text-[12px]">
                Browse More →
              </span>
            </Link>
          </div>
        </div>
      </section>

      <section className="w-full border-b border-border bg-background py-8">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12">
          <div className="grid grid-cols-2 gap-4 divide-y divide-border sm:gap-0 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
            <div className="flex items-center gap-3.5 p-2 sm:justify-center">
              <HugeiconsIcon icon={Coins01Icon} size={24} className="shrink-0 text-primary" />
              <div>
                <p className="text-2xl font-black leading-none text-foreground sm:text-3xl">₦18M+</p>
                <p className="mt-1 text-[11px] font-semibold text-muted-foreground">Paid to workers</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-2 sm:justify-center">
              <HugeiconsIcon icon={AnalyticsUpIcon} size={24} className="shrink-0 text-warning" />
              <div>
                <p className="text-2xl font-black leading-none text-foreground sm:text-3xl">58,000+</p>
                <p className="mt-1 text-[11px] font-semibold text-muted-foreground">Tasks completed</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-2 sm:justify-center">
              <HugeiconsIcon icon={UserGroupIcon} size={24} className="shrink-0 text-primary" />
              <div>
                <p className="text-2xl font-black leading-none text-foreground sm:text-3xl">21,000+</p>
                <p className="mt-1 text-[11px] font-semibold text-muted-foreground">Active earners</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-2 sm:justify-center">
              <HugeiconsIcon icon={CheckmarkBadge01Icon} size={24} className="shrink-0 text-primary" />
              <div>
                <p className="text-2xl font-black leading-none text-foreground sm:text-3xl">98%</p>
                <p className="mt-1 text-[11px] font-semibold text-muted-foreground">Approval rate</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        className="w-full border-b border-border bg-background-secondary py-6 sm:py-8"
        id="available-tasks"
      >
        <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12">
          <div className="mb-5 text-center sm:mb-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
              Discover digital work
            </p>
            <h2 className="mt-1.5 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Social Media Tasks
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              Structured work on the platforms people already use. Browse the marketplace to see what is live.
            </p>
          </div>

          <HomeSocialOpportunities />
        </div>
      </section>

      <section className="w-full border-b border-border bg-background py-6 sm:py-8" id="how-it-works">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12">
          <div className="mb-5 text-center sm:mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">How It Works</h2>
            <div className="mx-auto mt-1.5 h-1 w-12 rounded-full bg-primary" />
          </div>

          <div className="relative mx-auto max-w-[840px]">
            <div className="absolute left-[16%] right-[16%] top-6 z-0 hidden h-0.5 bg-gradient-to-r from-primary/20 via-primary to-primary/20 sm:block" />

            <div className="relative z-10 grid grid-cols-3 gap-3 text-center">
              <div className="flex flex-col items-center space-y-2 rounded-2xl border border-border bg-muted p-3 sm:p-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
                  <HugeiconsIcon icon={CursorPointer01Icon} size={22} />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary">Step 1</span>
                <p className="text-xs font-bold leading-tight text-foreground">Choose a task</p>
              </div>

              <div className="flex flex-col items-center space-y-2 rounded-2xl border border-border bg-muted p-3 sm:p-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
                  <HugeiconsIcon icon={CheckmarkCircle01Icon} size={22} />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary">Step 2</span>
                <p className="text-xs font-bold leading-tight text-foreground">Complete it</p>
              </div>

              <div className="flex flex-col items-center space-y-2 rounded-2xl border border-border bg-muted p-3 sm:p-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
                  <HugeiconsIcon icon={Wallet01Icon} size={22} />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary">Step 3</span>
                <p className="text-xs font-bold leading-tight text-foreground">Get paid</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full border-b border-border bg-background py-6 sm:py-8">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12">
          <div className="mb-5 text-center sm:mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Why Choose ZOLANZO</h2>
            <div className="mx-auto mt-1.5 h-1 w-12 rounded-full bg-primary" />
          </div>

          <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
            <div className="space-y-1 rounded-2xl border border-border bg-muted p-3.5 text-center transition-all duration-200 hover:-translate-y-[2px] hover:border-primary/40 sm:p-4">
              <HugeiconsIcon icon={Shield01Icon} size={22} className="mx-auto text-primary" />
              <h4 className="text-xs font-bold text-foreground sm:text-sm">Verified Hirers</h4>
              <p className="text-[11px] leading-normal text-muted-foreground">Campaigns reviewed before publishing.</p>
            </div>

            <div className="space-y-1 rounded-2xl border border-border bg-muted p-3.5 text-center transition-all duration-200 hover:-translate-y-[2px] hover:border-primary/40 sm:p-4">
              <HugeiconsIcon icon={CircleLock01Icon} size={22} className="mx-auto text-primary" />
              <h4 className="text-xs font-bold text-foreground sm:text-sm">Escrow Protection</h4>
              <p className="text-[11px] leading-normal text-muted-foreground">Funds locked until tasks are approved.</p>
            </div>

            <div className="space-y-1 rounded-2xl border border-border bg-muted p-3.5 text-center transition-all duration-200 hover:-translate-y-[2px] hover:border-primary/40 sm:p-4">
              <HugeiconsIcon icon={Wallet01Icon} size={22} className="mx-auto text-primary" />
              <h4 className="text-xs font-bold text-foreground sm:text-sm">Fast Withdrawals</h4>
              <p className="text-[11px] leading-normal text-muted-foreground">Direct payout to local bank account.</p>
            </div>

            <div className="space-y-1 rounded-2xl border border-border bg-muted p-3.5 text-center transition-all duration-200 hover:-translate-y-[2px] hover:border-primary/40 sm:p-4">
              <HugeiconsIcon icon={SmartPhone01Icon} size={22} className="mx-auto text-primary" />
              <h4 className="text-xs font-bold text-foreground sm:text-sm">Work Anywhere</h4>
              <p className="text-[11px] leading-normal text-muted-foreground">Complete work from phone or PC.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-8 w-full bg-background py-5 sm:mb-12 sm:py-6">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-8">
          <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-3xl border border-border bg-elevated p-8 text-center text-foreground shadow-floating sm:p-12">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/15 via-transparent to-transparent" />

            <div className="relative z-10 mx-auto flex max-w-[650px] flex-col items-center">
              <h2 className="text-3xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-4xl sm:leading-[1.12] lg:text-5xl">
                Ready to build your digital future?
              </h2>

              <p className="mt-3 text-sm font-medium leading-relaxed text-muted-foreground sm:text-base">
                Start earning online or hire trusted talent through one secure platform.
              </p>

              <div className="mt-6 flex w-full flex-col items-center justify-center gap-3.5 sm:w-auto sm:flex-row">
                <Link
                  href="/tasks"
                  className="flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-primary px-8 text-[15px] font-bold text-primary-foreground shadow-md transition-all duration-200 hover:-translate-y-[2px] hover:bg-primary-hover sm:h-[56px] sm:w-auto"
                >
                  Find Work <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
                </Link>

                <Link
                  href="/signup"
                  className="flex h-[52px] w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface px-8 text-[15px] font-bold text-foreground transition-all duration-200 hover:-translate-y-[2px] hover:border-primary/40 hover:bg-hover sm:h-[56px] sm:w-auto"
                >
                  Hire Talent
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <HomeFooter />
    </div>
  );
}
