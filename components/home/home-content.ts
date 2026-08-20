export const HOME_SUCCESS_STORIES = [
  { name: "Grace A.", city: "Lagos", country: "Nigeria", amount: "₦384,000 earned", text: "Reliable way to earn extra income each month after my main job.", joined: "Joined 2025", initial: "GA" },
  { name: "Samuel K.", city: "Accra", country: "Ghana", amount: "₦520,000 earned", text: "Work on AI data projects from anywhere while studying at university.", joined: "Joined 2025", initial: "SK" },
  { name: "Amina H.", city: "Abuja", country: "Nigeria", amount: "₦1.85M disbursed", text: "Recruited verified earners quickly for our mobile app launch campaign.", joined: "Verified Hirer", initial: "AH" },
  { name: "David O.", city: "Port Harcourt", country: "Nigeria", amount: "₦410,000 earned", text: "Instant bank withdrawals work every single time without delay.", joined: "Joined 2025", initial: "DO" },
  { name: "Blessing E.", city: "Benin", country: "Nigeria", amount: "₦290,000 earned", text: "Great platform for flexible side income on weekends.", joined: "Joined 2025", initial: "BE" },
  { name: "Kofi M.", city: "Kumasi", country: "Ghana", amount: "₦640,000 earned", text: "Completed over 1,500 survey microtasks during my free time.", joined: "Top Earner", initial: "KM" },
  { name: "Ada N.", city: "Enugu", country: "Nigeria", amount: "₦375,000 earned", text: "Proofreading tasks match my schedule perfectly.", joined: "Joined 2025", initial: "AN" },
  { name: "Emmanuel T.", city: "Ibadan", country: "Nigeria", amount: "₦480,000 earned", text: "AI model labeling tasks pay very well for attentive work.", joined: "Pro Contributor", initial: "ET" },
  { name: "Zainab B.", city: "Kano", country: "Nigeria", amount: "₦1.45M disbursed", text: "Hired top remote chat support earners for our e-commerce business.", joined: "Verified Hirer", initial: "ZB" },
  { name: "Chioma U.", city: "Asaba", country: "Nigeria", amount: "₦310,000 earned", text: "User-friendly interface and transparent payout tracking.", joined: "Joined 2025", initial: "CU" },
  { name: "Tariq S.", city: "Nairobi", country: "Kenya", amount: "₦720,000 earned", text: "Highest quality digital work platform in Africa.", joined: "Top Earner", initial: "TS" },
  { name: "Funke O.", city: "Abeokuta", country: "Nigeria", amount: "₦265,000 earned", text: "Quick social media tasks during breaks pay instantly to my bank.", joined: "Joined 2025", initial: "FO" },
] as const;

export const HOME_FAQS = [
  {
    question: "Who can join ZOLANZO?",
    answer: "Anyone who meets our platform requirements can create a free account on ZOLANZO. Whether you're a student, freelancer, remote worker, stay-at-home parent, or professional looking to earn extra income, you'll be able to explore available opportunities that match your skills and experience."
  },
  {
    question: "How do I get paid?",
    answer: "Once your completed task has been reviewed and approved, your earnings are credited to your ZOLANZO wallet. You can request a withdrawal to your supported local bank account whenever your available balance meets the minimum withdrawal requirement."
  },
  {
    question: "How long does task approval take?",
    answer: "Approval times depend on the employer and the type of task you've completed. Many simple tasks are reviewed within a few hours, while larger projects may take a little longer. You'll always be able to monitor the status of every submission from your dashboard."
  },
  {
    question: "Can I work from my phone?",
    answer: "Yes. Many opportunities on ZOLANZO are designed specifically for smartphones. Some advanced projects may require a laptop or desktop computer, but the platform clearly indicates any device requirements before you apply."
  },
  {
    question: "Are employers verified?",
    answer: "We review employers before campaigns are published to help maintain trust and quality across the marketplace. While verification helps improve platform safety, we also encourage workers to review task details carefully before accepting any opportunity."
  },
  {
    question: "How do businesses hire workers?",
    answer: "Businesses can create campaigns, define task requirements, set budgets, and securely fund projects through escrow. Once a campaign is approved, qualified workers can begin completing tasks while employers monitor progress and performance from their dashboard."
  },
  {
    question: "Is it free to join ZOLANZO?",
    answer: "Yes. Creating a ZOLANZO account is free. Once your account is set up, you can browse available opportunities, build your profile, and start applying for suitable tasks without paying any registration fee."
  },
  {
    question: "What kinds of jobs are available?",
    answer: "ZOLANZO offers a growing variety of digital opportunities including AI training, surveys, social media engagement, writing, customer support, virtual assistance, data-related projects, and many other remote tasks from verified employers."
  },
  {
    question: "Can I complete more than one task at a time?",
    answer: "Yes, provided you meet the requirements for each task and can complete them within the stated deadlines. Managing multiple tasks responsibly can help you increase your earnings while maintaining a strong approval rating."
  },
  {
    question: "How does ZOLANZO protect workers?",
    answer: "We use employer reviews, secure escrow payments, platform moderation, and quality checks to help create a safer marketplace for everyone. We continuously monitor campaigns and investigate reports to maintain a trusted environment for both workers and employers."
  }
] as const;

export type HomeFaq = (typeof HOME_FAQS)[number];
