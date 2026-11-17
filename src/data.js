export const categories = [
  'All stories',
  'Software Development',
  'Artificial Intelligence & Machine Learning',
  'Web and Mobile App Development',
  'Technology & Innovation',
  'Cybersecurity',
  'Cloud Computing',
  'Industry Insights',
]

export const articles = [
  {
    slug: 'building-software-for-the-next-billion-users',
    category: 'Industry Insights',
    author: 'Maya Chen',
    date: 'Nov 14, 2026',
    read: '8 min read',
    title: 'Building software for the next billion users',
    excerpt:
      'The next wave of internet users will come online with different devices, different expectations, and a fresh set of challenges. Here’s what product teams should know.',
    image:
      'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1600&q=85',
    featured: true,
    body: `The next billion people to come online won’t experience the internet the way the first billion did. They’ll arrive with mobile-first habits, new languages, and a different set of expectations for what useful technology looks like.\n\nFor product teams, that means the old playbook needs a rethink. Building for a global audience isn’t something to add in a localization sprint at the end of a project. It’s a decision that shapes the product from its first wireframe.\n\n## Start with the constraints\n\nIn many markets, a phone is the only computer a person owns. Connectivity can be intermittent, data expensive, and devices modest. These aren’t edge cases — they are the everyday context for billions of people.\n\nThat reality changes how we think about performance. A screen that loads in two seconds on office Wi-Fi might take twenty seconds on a crowded mobile network. Designing around the slower experience often makes your product better for everyone.\n\n## Make room for local context\n\nLanguage is only the beginning of localization. Teams also need to consider date formats, payment preferences, cultural references, and the way people organize information. The right answer is rarely a single global default.\n\nThe most useful research happens close to the people who will use the product. Talk to them early, test real tasks on real devices, and keep the feedback loop open after launch.\n\n## A more inclusive product is a stronger product\n\nThe work of designing for a broader audience is also the work of making software more resilient, more accessible, and more thoughtful. Smaller downloads help people on limited connections. Clearer interfaces help people who are new to a product category. Flexible layouts serve users with different needs.\n\nThe next billion users aren’t waiting for the internet to catch up with them. They’re already shaping what comes next. Our job is to listen, build with care, and keep learning.`,
  },
  {
    slug: 'the-practical-guide-to-ai-agents-at-work',
    category: 'Artificial Intelligence & Machine Learning',
    author: 'Aarav Patel',
    date: 'Nov 12, 2026',
    read: '6 min read',
    title: 'The practical guide to AI agents at work',
    excerpt:
      'AI agents are moving from demos into everyday workflows. A grounded look at where they help, where they don’t, and how to get started.',
    image:
      'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1000&q=80',
    body: `AI agents are quickly becoming a practical part of how teams work. The best starting point isn’t a grand transformation plan — it’s one repetitive task that already has a clear outcome.\n\n## Begin with a bounded workflow\n\nLook for work that follows a recognizable pattern: gathering context, checking a set of rules, and preparing a first draft. Keep a person in the loop for decisions that need judgment or carry real risk.\n\nA useful pilot has a baseline. Measure how long the task takes today, how often the output needs corrections, and what a good result looks like. Without that baseline, it’s difficult to know if a new tool is helping.\n\n## Design for oversight\n\nGive people a way to see what the agent used, review its output, and correct it. Good automation doesn’t make human judgment disappear; it gives people more time to use it where it matters.`,
  },
  {
    slug: 'a-faster-path-from-design-system-to-production',
    category: 'Software Development',
    author: 'Sofia Williams',
    date: 'Nov 10, 2026',
    read: '5 min read',
    title: 'A faster path from design system to production',
    excerpt:
      'When design tokens and components speak the same language, teams spend less time translating and more time building.',
    image:
      'https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=1000&q=80',
    body: `A design system is most useful when it feels less like a catalog and more like a shared language. When designers and engineers agree on the meaning behind a component, the handoff becomes a conversation instead of a translation exercise.\n\n## Give tokens meaningful names\n\nNames like \`space-4\` are easy to generate but difficult to reason about. Names that describe intent — \`space-card-gap\`, for example — create a better bridge between a design decision and its implementation.\n\nA small, well-maintained set of primitives is easier to adopt than a large system that tries to anticipate every possible need.`,
  },
  {
    slug: 'what-zero-trust-looks-like-for-growing-teams',
    category: 'Cybersecurity',
    author: 'Noah Kim',
    date: 'Nov 08, 2026',
    read: '7 min read',
    title: 'What zero trust looks like for growing teams',
    excerpt:
      'A thoughtful security posture is built from small, consistent decisions — not a single product or a one-time checklist.',
    image:
      'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1000&q=80',
    body: `Zero trust can sound like a complicated architecture project. In practice, it starts with a simple principle: access should be intentional, limited to what’s needed, and reviewed over time.\n\n## Put identity first\n\nFor a growing team, reliable multi-factor authentication and a clear process for onboarding and offboarding are high-impact places to begin. Know which accounts have access to production systems, and make sure those permissions still make sense as roles change.`,
  },
  {
    slug: 'the-cloud-costs-worth-keeping-an-eye-on',
    category: 'Cloud Computing',
    author: 'Ethan Brooks',
    date: 'Nov 05, 2026',
    read: '4 min read',
    title: 'The cloud costs worth keeping an eye on',
    excerpt:
      'A few lightweight habits can make cloud spend easier to understand, forecast, and improve without slowing your team down.',
    image:
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1000&q=80',
    body: `Cloud costs are easier to manage when they’re visible to the people making technical decisions. A monthly invoice is a useful record, but it’s not an operating rhythm.\n\n## Make ownership clear\n\nTag resources by team or service, set a regular review, and look for changes that don’t match product activity. The goal isn’t to minimize every line item — it’s to understand what the spend makes possible.`,
  },
  {
    slug: 'small-details-that-make-mobile-apps-feel-native',
    category: 'Web and Mobile App Development',
    author: 'Lena Ortiz',
    date: 'Nov 02, 2026',
    read: '5 min read',
    title: 'Small details that make mobile apps feel native',
    excerpt:
      'The most natural mobile experiences pay attention to the details people notice without thinking about them.',
    image:
      'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=1000&q=80',
    body: `The feeling of a well-made mobile app comes from many small decisions: how quickly a screen responds, whether a control is comfortable to reach, and whether the app behaves as people expect on their device.\n\n## Respect the platform\n\nUse familiar patterns for navigation, permission prompts, and feedback. A custom interaction should make something meaningfully easier — not just look different.`,
  },
]

export const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
