import { APP_CONFIG } from "@/config/app";

export type FaqItem = {
  question: string;
  answer: string;
};

export type FaqGroup = {
  id: string;
  title: string;
  items: readonly FaqItem[];
};

export const FAQ_GROUPS: readonly FaqGroup[] = [
  {
    id: "getting-started",
    title: "Getting started",
    items: [
      {
        question: "What is ZOLANZO?",
        answer:
          "ZOLANZO is a workforce marketplace for digital work. Earners complete online tasks for real income, and businesses hire workers by creating campaigns on one platform.",
      },
      {
        question: "Who can join ZOLANZO?",
        answer:
          "Anyone who meets our platform requirements can create a free account on ZOLANZO. Whether you're a student, freelancer, remote worker, stay-at-home parent, or professional looking to earn extra income, you'll be able to explore available opportunities that match your skills and experience.",
      },
      {
        question: "Is it free to create an account?",
        answer:
          "Yes. You can create a free ZOLANZO account and start exploring opportunities that match your skills.",
      },
    ],
  },
  {
    id: "finding-work",
    title: "Finding work",
    items: [
      {
        question: "What kinds of jobs are available?",
        answer:
          "ZOLANZO offers a growing variety of digital opportunities including AI training, surveys, social media engagement, writing, customer support, virtual assistance, data-related projects, and many other remote tasks from verified employers.",
      },
      {
        question: "How do I apply for a task?",
        answer:
          "Sign in, open Tasks, and choose an opportunity. Follow the on-screen steps to start. Some tasks may ask you to connect a required account first.",
      },
      {
        question: "Can I complete more than one task at a time?",
        answer:
          "Yes, provided you meet the requirements for each task and can complete them within the stated deadlines. Managing multiple tasks responsibly can help you increase your earnings while maintaining a strong approval rating.",
      },
      {
        question: "Can I work from my phone?",
        answer:
          "Yes. Many opportunities on ZOLANZO are designed specifically for smartphones. Some advanced projects may require a laptop or desktop computer, but the platform clearly indicates any device requirements before you apply.",
      },
    ],
  },
  {
    id: "task-completion",
    title: "Task completion",
    items: [
      {
        question: "How do I submit completed work?",
        answer:
          "After you start a task, follow the instructions, attach the required proof, and submit your work. You can track status from Applications.",
      },
      {
        question: "How long does task approval take?",
        answer:
          "Approval times depend on the employer and the type of task you've completed. Many simple tasks are reviewed within a few hours, while larger projects may take a little longer. You'll always be able to monitor the status of every submission from your dashboard.",
      },
      {
        question: "What happens if my submission is rejected?",
        answer:
          "Rejected work appears in Applications. Review the task guidelines and apply for other active opportunities. If you need help, contact support.",
      },
    ],
  },
  {
    id: "earnings",
    title: "Earnings & withdrawals",
    items: [
      {
        question: "How do I earn money?",
        answer:
          "You earn by completing tasks. Choose an opportunity, submit the required proof, and after approval your earnings go to your ZOLANZO wallet.",
      },
      {
        question: "How do I get paid?",
        answer:
          "Once your completed task has been reviewed and approved, your earnings are credited to your ZOLANZO wallet. You can request a withdrawal to your supported local bank account whenever your available balance meets the minimum withdrawal requirement.",
      },
      {
        question: "When can I withdraw my earnings?",
        answer:
          "When your available wallet balance meets the minimum withdrawal requirement, you can request a withdrawal from Wallet to a supported local bank account. A verified phone number and a linked bank account are used for withdrawals.",
      },
      {
        question: "Where can I see my earnings and withdrawal history?",
        answer:
          "Open Wallet to see your available balance, pending amount, transactions, and withdrawal history.",
      },
    ],
  },
  {
    id: "hiring",
    title: "Hiring on ZOLANZO",
    items: [
      {
        question: "How do businesses hire workers?",
        answer:
          "Businesses can create campaigns, define task requirements, set budgets, and securely fund projects through escrow. Once a campaign is approved, qualified workers can begin completing tasks while employers monitor progress and performance from their dashboard.",
      },
      {
        question: "How do I post an opportunity or task?",
        answer:
          "Create a hirer account, open Campaigns, and create an opportunity with requirements, slots, and budget. Campaigns are reviewed before they go live.",
      },
      {
        question: "How are workers selected?",
        answer:
          "Earners choose opportunities they can complete. Some tasks require a connected account first. Hirers review submitted work from their review queue.",
      },
    ],
  },
  {
    id: "safety",
    title: "Safety & trust",
    items: [
      {
        question: "Are hirers verified?",
        answer:
          "Campaigns are reviewed before publishing. Opportunities show verified hirer indicators so earners can see that the campaign has been reviewed.",
      },
      {
        question: "How does ZOLANZO protect workers?",
        answer:
          "We use employer reviews, secure escrow payments, platform moderation, and quality checks to help create a safer marketplace for everyone. We continuously monitor campaigns and investigate reports to maintain a trusted environment for both workers and employers.",
      },
      {
        question: "How are accounts verified?",
        answer:
          "You verify your email when you join, and you can verify your phone number in the app. Phone verification is used to accept tasks, withdraw funds, and create campaigns.",
      },
      {
        question: "What should I do if I experience a problem?",
        answer: `Message WhatsApp Support, or email ${APP_CONFIG.supportEmail}. Signed-in users can also open Help & Support in the app.`,
      },
    ],
  },
  {
    id: "account",
    title: "Account & support",
    items: [
      {
        question: "How do I update my account?",
        answer:
          "Sign in and open Profile or Settings to update your name, handle, preferences, and connected accounts.",
      },
      {
        question: "What if I forget my PIN?",
        answer:
          "Use Forgot PIN, enter the email on your account, and follow the reset steps sent to you.",
      },
      {
        question: "How do I contact ZOLANZO support?",
        answer: `Message WhatsApp Support, or email ${APP_CONFIG.supportEmail}. Signed-in users can also open Help & Support in the app.`,
      },
    ],
  },
] as const;

export const FAQ_ITEMS: readonly FaqItem[] = FAQ_GROUPS.flatMap((group) =>
  group.items.slice(),
);

export const PRESERVED_HOMEPAGE_FAQ_QUESTIONS = [
  "Who can join ZOLANZO?",
  "How do I get paid?",
  "How long does task approval take?",
  "Can I work from my phone?",
  "How do businesses hire workers?",
  "What kinds of jobs are available?",
  "Can I complete more than one task at a time?",
  "How does ZOLANZO protect workers?",
  "How do I contact ZOLANZO support?",
] as const;
