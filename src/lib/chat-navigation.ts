export type DashboardRole = "PATIENT" | "COUNSELOR";

export type DashboardNavLink = {
  href: string;
  label: string;
  match: string;
  description?: string;
};

type RouteContext = {
  pattern: string;
  label: string;
  description: string;
  navigationHint: string;
  availableHere?: string[];
  notAvailableHere?: string[];
};

type RoleNavigationConfig = {
  roleLabel: string;
  dashboardRoute: string;
  profileRoute: string;
  navLinks: DashboardNavLink[];
  workflowFacts: string[];
  routeContexts: RouteContext[];
};

function matchesRoute(pattern: string, pathname: string): boolean {
  if (pattern.endsWith("/*")) {
    return pathname.startsWith(pattern.slice(0, -1));
  }

  return pathname === pattern;
}

function findCurrentRouteContext(
  routeContexts: RouteContext[],
  pathname: string
): RouteContext | undefined {
  return routeContexts.find((route) => matchesRoute(route.pattern, pathname));
}

const sharedFacts = [
  'The user is already logged in and is using the chatbot inside the dashboard.',
  'Never tell the user to log in, sign in, sign up, register, or access a different account unless they explicitly ask about authentication problems.',
  'All dashboard pages share the same fixed top navbar, so users usually do not need to go back to the dashboard just to reach another top-level destination.',
  'Use the current page plus the persistent top navbar as the starting point for navigation unless the requested action truly requires a different page.',
  'Landing page "/" has the public overview of the platform.',
  '"/login" and "/register" are public auth pages, but dashboard users have already passed that step.',
  'If a user asks how to perform an action, describe the exact implemented flow and do not invent extra buttons or shortcuts.',
];

export const patientNavLinks: DashboardNavLink[] = [
  { href: "/dashboard/patient", label: "Home", match: "home", description: "patient dashboard home" },
  { href: "/dashboard/patient/emotion-test", label: "Emotion-Test", match: "emotion", description: "ai emotion analysis page" },
  {
    href: "/dashboard/patient#find-counselors",
    label: "Book a Session",
    match: "book",
    description: "persistent navbar link that scrolls to the browse counselors section on the patient dashboard",
  },
  {
    href: "/dashboard/patient/appointments",
    label: "My Appointments",
    match: "appointments",
    description: "patient appointments page",
  },
];

export const counselorNavLinks: DashboardNavLink[] = [
  { href: "/dashboard/counselor", label: "Home", match: "home", description: "counselor dashboard home" },
  {
    href: "/dashboard/counselor/availability",
    label: "Availability",
    match: "availability",
    description: "manage recurring schedule and available slots",
  },
  {
    href: "/dashboard/counselor/appointments",
    label: "My Appointments",
    match: "appointments",
    description: "counselor appointments page",
  },
];

const roleNavigation: Record<DashboardRole, RoleNavigationConfig> = {
  PATIENT: {
    roleLabel: "patient",
    dashboardRoute: "/dashboard/patient",
    profileRoute: "/dashboard/patient/profile",
    navLinks: patientNavLinks,
    workflowFacts: [
      'The patient home page has two main call-to-action buttons: "Take an Emotion Test" and "Book a Session".',
      'Patients can start booking from the persistent top navbar item "Book a Session" from dashboard pages.',
      '"Book a Session" takes the user to the browse counselors section on the patient dashboard, where they can choose a counselor and then a slot.',
      '"My Appointments" shows upcoming, ongoing, completed, missed, and cancelled appointments.',
      'The patient profile page is opened from the circular profile icon in the top-right navbar, not from a text "Profile" link on the dashboard.',
      'Appointment cards on the patient appointments page are clickable and open a detail page at "/dashboard/patient/appointments/[id]".',
      'Actions such as cancel appointment, adjust time, add a patient note, and submit a review happen from the appointment detail page, not directly on the list card.',
      'The patient profile page route is "/dashboard/patient/profile".',
    ],
    routeContexts: [
      {
        pattern: "/dashboard/patient",
        label: "patient dashboard home",
        description: 'The patient is on the main dashboard page with hero actions and the browse counselors section.',
        navigationHint: 'Start directions from the patient dashboard and mention nearby actions like "Book a Session" or "Take an Emotion Test" when relevant.',
        availableHere: ["Book a Session", "Take an Emotion Test", "browse counselors"],
      },
      {
        pattern: "/dashboard/patient/appointments",
        label: "patient appointments list",
        description: 'The patient is viewing the appointments list with tabs such as upcoming, ongoing, completed, missed, and cancelled.',
        navigationHint: 'For appointment actions, start from the appointments list and explain when the user must click a card to open its detail page. For booking a new session, direct the user to the persistent top navbar item "Book a Session" rather than saying it is on this page.',
        availableHere: ["view appointments", "open an appointment detail page"],
        notAvailableHere: ["Book a Session button in the page body"],
      },
      {
        pattern: "/dashboard/patient/appointments/*",
        label: "patient appointment detail page",
        description: 'The patient is already inside a single appointment detail page.',
        navigationHint: 'If the requested action exists on the detail page, tell the user to use it there instead of sending them back to the list or dashboard. If they need to book a new session or open another top-level page, direct them to the persistent top navbar rather than telling them that the action is on this detail page or that they must return to the dashboard first.',
        availableHere: ["cancel appointment", "adjust appointment time", "add patient note", "submit review"],
        notAvailableHere: ["Book a Session in the page body", "browse counselors in the page body"],
      },
      {
        pattern: "/dashboard/patient/profile",
        label: "patient profile page",
        description: 'The patient is on their profile page.',
        navigationHint: 'Start from the profile page and only send the user elsewhere if the requested action is not available here. For booking a new session, direct the user to the persistent top navbar item "Book a Session" instead of implying it is on the profile page.',
        availableHere: ["view profile"],
        notAvailableHere: ["Book a Session in the page body"],
      },
      {
        pattern: "/dashboard/patient/emotion-test",
        label: "emotion test page",
        description: 'The patient is on the AI emotion analysis page.',
        navigationHint: 'Start from the emotion test page when explaining next steps and avoid resetting directions back to the dashboard unless needed.',
        availableHere: ["emotion test"],
      },
    ],
  },
  COUNSELOR: {
    roleLabel: "counselor",
    dashboardRoute: "/dashboard/counselor",
    profileRoute: "/dashboard/counselor/profile",
    navLinks: counselorNavLinks,
    workflowFacts: [
      'The counselor dashboard highlights practice stats and upcoming schedule information.',
      '"Availability" is where counselors manage recurring schedule and slot availability.',
      '"My Appointments" shows the counselor appointment list.',
      'The counselor profile page is opened from the circular profile icon in the top-right navbar, not from a text "Profile" link inside the main dashboard content.',
      'Appointment cards on the counselor appointments page are clickable and open a detail page at "/dashboard/counselor/appointments/[id]".',
      'Actions such as cancel appointment, adjust appointment time, mark complete, and report a patient happen from the appointment detail page, not directly on the list card.',
      'The counselor profile page route is "/dashboard/counselor/profile".',
    ],
    routeContexts: [
      {
        pattern: "/dashboard/counselor",
        label: "counselor dashboard home",
        description: 'The counselor is on the main dashboard page with stats and quick actions.',
        navigationHint: 'Start directions from the counselor dashboard and mention nearby actions like "Availability" or profile access when relevant.',
      },
      {
        pattern: "/dashboard/counselor/availability",
        label: "counselor availability page",
        description: 'The counselor is managing schedule and slot availability.',
        navigationHint: 'Start from the availability page for schedule-related questions and avoid bouncing back to the dashboard unnecessarily.',
      },
      {
        pattern: "/dashboard/counselor/appointments",
        label: "counselor appointments list",
        description: 'The counselor is viewing the appointments list.',
        navigationHint: 'For appointment actions, start from the appointments list and explain when the user must click a card to open its detail page.',
      },
      {
        pattern: "/dashboard/counselor/appointments/*",
        label: "counselor appointment detail page",
        description: 'The counselor is already inside a single appointment detail page.',
        navigationHint: 'If the requested action exists on the detail page, tell the user to use it there instead of sending them back to the dashboard. If they need profile or another top-level page, direct them to the persistent top navbar rather than telling them to return to the dashboard.',
      },
      {
        pattern: "/dashboard/counselor/profile",
        label: "counselor profile page",
        description: 'The counselor is on their profile page.',
        navigationHint: 'Start from the profile page and only redirect elsewhere if the requested action is not on this page.',
      },
    ],
  },
};

export function getNavLinksForRole(role: string): DashboardNavLink[] {
  return role === "COUNSELOR" ? counselorNavLinks : patientNavLinks;
}

export function buildRoleAwareNavigationContext(role: string): string {
  const config = role === "COUNSELOR" ? roleNavigation.COUNSELOR : roleNavigation.PATIENT;

  const sharedSection = sharedFacts.map((fact) => `- ${fact}`).join("\n");
  const navSection = config.navLinks
    .map((link) => `- "${link.label}" -> "${link.href}"${link.description ? ` (${link.description})` : ""}`)
    .join("\n");
  const workflowSection = config.workflowFacts.map((fact) => `- ${fact}`).join("\n");

  return [
    `CURRENT USER ROLE: ${config.roleLabel}.`,
    `CURRENT USER DASHBOARD: "${config.dashboardRoute}".`,
    `CURRENT USER PROFILE PAGE: "${config.profileRoute}".`,
    "SHARED APP FACTS:",
    sharedSection,
    "ROLE-SPECIFIC NAVIGATION:",
    navSection,
    "ROLE-SPECIFIC WORKFLOW FACTS:",
    workflowSection,
  ].join("\n");
}

export function buildCurrentPageContext(
  role: string,
  currentPathname?: string
): string {
  if (!currentPathname) {
    return [
      'CURRENT PAGE: unknown.',
      'If the user asks a navigation question and the current page is unknown, use the role-specific routes and labels, but do not assume the user is starting from the dashboard unless the question clearly says so.',
    ].join("\n");
  }

  const config = role === "COUNSELOR" ? roleNavigation.COUNSELOR : roleNavigation.PATIENT;
  const routeContext = findCurrentRouteContext(config.routeContexts, currentPathname);

  if (!routeContext) {
    return [
      `CURRENT PAGE: "${currentPathname}".`,
      'Start navigation guidance from this current page, not from login or the dashboard, unless the requested task truly requires going there.',
      'If you are unsure what is available on this page, say what the next relevant destination is from here using the exact role-specific labels.',
    ].join("\n");
  }

  return [
    `CURRENT PAGE: "${currentPathname}".`,
    `CURRENT PAGE LABEL: ${routeContext.label}.`,
    `CURRENT PAGE DESCRIPTION: ${routeContext.description}`,
    `CURRENT PAGE NAVIGATION RULE: ${routeContext.navigationHint}`,
    routeContext.availableHere?.length
      ? `ACTIONS AVAILABLE ON THIS PAGE: ${routeContext.availableHere.join(", ")}.`
      : undefined,
    routeContext.notAvailableHere?.length
      ? `ACTIONS NOT IN THIS PAGE BODY: ${routeContext.notAvailableHere.join(", ")}. If needed, direct the user to the correct navbar item or destination instead of claiming the action is on this page.`
      : undefined,
    `CRITICAL: The user is ALREADY on "${routeContext.label}". NEVER tell them to go to or open this page — they are here. Start all directions from this page.`,
    'The current page context is the highest-priority navigation context and overrides earlier assumptions from previous chat messages.',
    'If the current page already contains the requested action, say that the user can do it right here on this page.',
    'Do not say "on this page" unless the action is listed as available on this page or clearly described in the current page navigation rule.',
    'When a user asks how to navigate, begin from the current page first. Only tell them to go to another page if the action is not available on the current page.',
  ].filter(Boolean).join("\n");
}