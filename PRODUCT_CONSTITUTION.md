# ZOLANZO PRODUCT CONSTITUTION

> **Permanent Architectural and UX Rules for Zolanzo**  
> Every page, feature, component, and future update in Zolanzo MUST strictly comply with these 15 rules without exception.

---

## RULE #1: ONE SCREEN = ONE PURPOSE
Every screen exists to accomplish **ONE primary objective**. Users must immediately understand why they are on a page. Every component must support that primary objective; if it does not, move it to its correct owner page. Never combine multiple applications into one page.

---

## RULE #2: THE RULE OF THREE
Every screen may have **ONLY THREE visual priorities**. Everything else becomes secondary.

- **Dashboard (`/earner/dashboard`):** 1. Money | 2. Available Work | 3. Progress
- **Tasks (`/tasks`):** 1. Discover | 2. Reward | 3. Start
- **Wallet (`/wallet`):** 1. Balance | 2. Withdraw | 3. Transactions
- **Profile (`/profile`):** 1. Identity | 2. Reputation | 3. Progress
- **Account Center (`/settings`):** 1. Manage | 2. Secure | 3. Connect
- **Hirer Dashboard (`/hirer/dashboard`):** 1. Campaigns | 2. Results | 3. Spend
- **Admin (`/developer`):** 1. Moderation | 2. Users | 3. Platform Health

---

## RULE #3: SINGLE SOURCE OF TRUTH
Every piece of information has **ONE owner page**:
- **Dashboard** owns earnings & immediate task action.
- **Tasks** owns discovery & filter mechanics.
- **Wallet** owns financial history & withdrawals.
- **Profile** owns reputation & passport identity.
- **Account Center** owns editable settings & configuration.
- **Alerts** owns notifications & communications.
- **Admin** owns platform moderation.

---

## RULE #4: NO DUPLICATION
Never display the exact same metric or editable setting twice.
- **Trust Score:** Profile only.
- **Available Balance:** Wallet owns full detail; Dashboard shows quick summary only.
- **Connected Accounts:** Account Center owns configuration; Profile shows read-only preview.
- **Bank Details:** Wallet / Account Center only.

---

## RULE #5: PROGRESSIVE DISCLOSURE
Never overwhelm the user with all information at once. Show essential information first and reveal advanced options through accordions, bottom sheets, modals, or step-by-step flows.

---

## RULE #6: ACTION FIRST
Every page must immediately answer *"What should the user do next?"* Primary actions must be visually prominent. Avoid decorative UI that delays action.

---

## RULE #7: MOBILE FIRST
Design for mobile users first (touch-friendly targets, comfortable thumb reach, minimal scrolling, high readability in bright sunlight). Desktop layouts adapt cleanly from mobile.

---

## RULE #8: VISUAL HIERARCHY
- **Primary action:** 1 main CTA.
- **Secondary actions:** Maximum 2.
- **Tertiary actions:** Subdued links or icons. Never present multiple competing buttons of equal weight.

---

## RULE #9: CONSISTENCY
All buttons, typography, spacing, cards, inputs, badges, and animations must be derived from Zolanzo's unified design system (`/components/ui`, Tailwind system tokens). No ad-hoc redesigning per page.

---

## RULE #10: REMOVE BEFORE ADD
Before introducing any new UI element or card, ask if an existing component can be replaced or merged. Make the interface better and cleaner over time, not larger or more complex.

---

## RULE #11: PERFORMANCE
Every component must maintain fast load times and 60fps interaction on low-end Android devices. Avoid heavy animation libraries, excessive DOM trees, or non-reusable code.

---

## RULE #12: ACCESSIBILITY
Ensure high color contrast (WCAG AAA standards), readable typography, clear focus states, and large tap targets (`min-h-[40px]`).

---

## RULE #13: EMOTIONAL DESIGN
The UI must evoke confidence, trust, professionalism, and clear sense of progress—resembling modern fintech apps (Moniepoint, Revolut, Stripe Identity, Apple Wallet). Never flashy, childish, or crypto-styled.

---

## RULE #14: BUSINESS FIRST
Every feature must directly serve at least one key metric:
1. Increase worker retention
2. Improve hirer success
3. Reduce support friction
4. Build ecosystem trust
5. Drive revenue

---

## RULE #15: THE 10-SECOND TEST
A first-time user must understand the purpose of any page within 10 seconds. If not, simplify immediately.
