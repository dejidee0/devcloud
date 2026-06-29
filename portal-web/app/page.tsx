"use client";

import { useEffect, useMemo, useState } from "react";
import type { Route } from "next";
import Link from "next/link";
import {
  Brain,
  Globe,
  KeyRound,
  MapPin,
  Rocket,
  ShieldCheck,
  Terminal,
  Users,
  Video,
  X,
  Check
} from "lucide-react";
import styles from "./page.module.css";

type Accent = "gold" | "green" | "blue" | "purple";

const features: { title: string; description: string; icon: typeof ShieldCheck; accent: Accent }[] = [
  {
    title: "Zero Trust Network",
    description:
      "Tailscale WireGuard mesh. No public SSH ports. No exposed IPs. Invisible to port scanners and security audits.",
    icon: ShieldCheck,
    accent: "gold"
  },
  {
    title: "Location Freedom",
    description:
      "Route traffic through EU nodes automatically. Work from Lagos, Abuja, Accra or anywhere. Clients see professional infrastructure.",
    icon: Globe,
    accent: "green"
  },
  {
    title: "One-Click Environments",
    description:
      "Pick .NET, Node, Python, Java, React, Flutter or C++. Full environment running in under 60 seconds. Zero local setup.",
    icon: Terminal,
    accent: "blue"
  },
  {
    title: "AI Code Review",
    description:
      "Type devcloud review. AI analyzes your last commit, finds bugs, security issues, and improvement suggestions. Never leave your terminal.",
    icon: Brain,
    accent: "purple"
  },
  {
    title: "Secrets Vault",
    description:
      "Infisical-powered vault integrated directly. No .env files anywhere. No WhatsApp credential sharing. Secrets never touch developer laptops.",
    icon: KeyRound,
    accent: "gold"
  },
  {
    title: "Session Recording",
    description:
      "Every terminal session recorded, timestamped, searchable. Enterprise clients get full audit compliance without asking.",
    icon: Video,
    accent: "green"
  },
  {
    title: "Client Portal",
    description:
      "Professional client dashboard. Project status, deployment history, ticket tracking. Replace WhatsApp updates with a real portal.",
    icon: Users,
    accent: "blue"
  },
  {
    title: "AI Deploy Assistant",
    description:
      "AI checks database migrations, runs risk analysis, identifies breaking changes. Get a deploy risk score before you ship anything.",
    icon: Rocket,
    accent: "purple"
  },
  {
    title: "Location Switcher",
    description:
      "Spin your traffic exit node to match your client's region. Working with a US client? Route through New York. UK client? Switch to London. One click.",
    icon: MapPin,
    accent: "gold"
  }
];

const withoutItems = [
  "AnyDesk flagged by SentinelOne as malicious remote access",
  "CrowdStrike blocks your session mid-sprint",
  "Client IT team bans your IP range because you're in Nigeria",
  "You lose the contract because you can't access their systems",
  "Credentials shared over WhatsApp. One leak ends everything.",
  "New developer setup takes 2 days of config hell"
];

const withItems = [
  "WireGuard encryption — identical to normal VPN traffic",
  "VSCode Remote SSH — whitelisted by every corporate EDR",
  "Traffic routes through EU server — location becomes irrelevant",
  "Win enterprise contracts with full audit trail and compliance",
  "Infisical secrets vault — credentials never leave the server",
  "New developer live in under 10 minutes"
];

const aiCards = [
  {
    title: "AI Environment Builder",
    description:
      "Describe what you're building in plain English. DevCloud AI configures the Docker environment, installs dependencies, sets up databases, and has you coding in 90 seconds.",
    block: [
      { text: '> "I need a Django REST API with PostgreSQL, Redis, and Celery"', tone: "prompt" },
      { text: "→ AI: Configuring environment...", tone: "muted" },
      { text: "✓ Python 3.12 environment ready", tone: "ok" },
      { text: "✓ PostgreSQL configured", tone: "ok" },
      { text: "✓ Redis running", tone: "ok" },
      { text: "✓ Celery worker started", tone: "ok" },
      { text: "Ready to code in 87 seconds", tone: "accent" }
    ]
  },
  {
    title: "AI Ticket Generator",
    description:
      "Describe a feature in plain English. AI structures it into tickets with acceptance criteria, story points, and assigns to the right developer based on their stack expertise.",
    block: [
      { text: '> "Add Paystack payment to checkout"', tone: "prompt" },
      { text: "→ 4 tickets created, assigned to dev-backend", tone: "ok" }
    ]
  },
  {
    title: "AI Security Scanner",
    description:
      "Continuous background scanning of every commit. Catches leaked API keys, vulnerable dependencies, SQL injection risks, and hardcoded credentials before they reach production.",
    block: [
      { text: "🟢 Last scan: 2 minutes ago", tone: "ok" },
      { text: "⚠️ 0 critical issues found", tone: "accent" },
      { text: "✓ 847 files scanned", tone: "muted" }
    ]
  },
  {
    title: "AI Client Report",
    description:
      "Sprint complete? One click generates a professional PDF client report from your session logs, completed tickets, and deployments. No manual writing. Full transparency.",
    block: [
      { text: "📄 Sprint Report - Week 26", tone: "accent" },
      { text: "Commits: 47 | Tickets: 12 closed", tone: "muted" },
      { text: "Deploy: 3 successful", tone: "ok" },
      { text: "Hours logged: 68.5", tone: "muted" }
    ]
  }
];

const stats = [
  { value: "< 60s", accent: "gold", label: "Environment spin-up" },
  { value: "7+", accent: "green", label: "Tech stacks supported" },
  { value: "100%", accent: "blue", label: "Sessions audited" }
];

const stackRowOne = [
  { name: ".NET 8", color: "#7C3AED" },
  { name: "Node.js 20", color: "#00D97E" },
  { name: "Python 3.12", color: "#0EA5E9" },
  { name: "React 18", color: "#0EA5E9" },
  { name: "Next.js 14", color: "#ededed" },
  { name: "Flutter", color: "#0EA5E9" },
  { name: "Django", color: "#00D97E" },
  { name: "FastAPI", color: "#00D97E" }
];

const stackRowTwo = [
  { name: "Java 21", color: "#F5A623" },
  { name: "Spring Boot", color: "#00D97E" },
  { name: "Vue.js", color: "#00D97E" },
  { name: "C++", color: "#0EA5E9" },
  { name: "TypeScript", color: "#0EA5E9" },
  { name: "PostgreSQL", color: "#0EA5E9" },
  { name: "SQL Server", color: "#F5A623" },
  { name: "Redis", color: "#FF3B30" },
  { name: "Docker", color: "#0EA5E9" }
];

const pricing = [
  {
    name: "Starter",
    price: "Free",
    period: "",
    features: ["1 developer", "2 environments", "5 projects", "Community support", "Basic audit logs"],
    cta: "Get Started Free",
    href: "/signup",
    featured: false,
    ctaStyle: "ghostGold"
  },
  {
    name: "Team",
    price: "$29",
    period: "/mo",
    features: [
      "Up to 5 developers",
      "Unlimited environments",
      "All AI features",
      "Client portal",
      "Full audit trail",
      "Priority support"
    ],
    cta: "Start Free Trial",
    href: "/signup",
    featured: true,
    ctaStyle: "solidGold"
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    features: [
      "Unlimited developers",
      "Dedicated server",
      "Custom domain",
      "SLA guarantee",
      "White-label option",
      "24/7 support"
    ],
    cta: "Contact Us",
    href: "/signup",
    featured: false,
    ctaStyle: "ghostWhite"
  }
];

const testimonials = [
  {
    quote:
      "We went from losing contracts because AnyDesk kept getting flagged to landing our first UK fintech client. DevCloud changed everything.",
    name: "Chidi O., Lead Developer",
    location: "Lagos"
  },
  {
    quote:
      "Our client's SentinelOne used to block us every week. Three months with DevCloud — not a single interruption.",
    name: "Amara K., CTO",
    location: "Accra"
  },
  {
    quote:
      "Onboarding a new developer used to take 2 days of environment setup. DevCloud gets them coding in 10 minutes.",
    name: "Tunde A., Engineering Lead",
    location: "Abuja"
  }
];

const exitNodes = [
  { id: "fra", flag: "🇩🇪", city: "Frankfurt", country: "Germany", x: 524, y: 111, latency: 18 },
  { id: "lon", flag: "🇬🇧", city: "London", country: "United Kingdom", x: 500, y: 107, latency: 12 },
  { id: "nyc", flag: "🇺🇸", city: "New York", country: "United States", x: 294, y: 137, latency: 9 },
  { id: "sin", flag: "🇸🇬", city: "Singapore", country: "Singapore", x: 788, y: 246, latency: 14 },
  { id: "tor", flag: "🇨🇦", city: "Toronto", country: "Canada", x: 279, y: 129, latency: 11 },
  { id: "syd", flag: "🇦🇺", city: "Sydney", country: "Australia", x: 920, y: 344, latency: 22 }
];

const LAGOS = { x: 509, y: 232 };

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function LocationSwitcher() {
  const [activeId, setActiveId] = useState("fra");
  const active = useMemo(() => exitNodes.find((n) => n.id === activeId)!, [activeId]);

  const path = useMemo(() => {
    const midX = (LAGOS.x + active.x) / 2;
    const midY = Math.min(LAGOS.y, active.y) - 70;
    return `M ${LAGOS.x} ${LAGOS.y} Q ${midX} ${midY} ${active.x} ${active.y}`;
  }, [active]);

  return (
    <div className={styles.switcher}>
      <div className={styles.mapWrap}>
        <svg viewBox="0 0 1000 500" className={styles.map} role="img" aria-label="World routing map">
          <g fill="#1f1f1f">
            {/* North America */}
            <path d="M160 80 Q120 110 140 160 Q160 210 240 200 Q320 190 330 130 Q320 80 250 70 Q200 60 160 80 Z" />
            {/* South America */}
            <path d="M300 250 Q280 300 300 360 Q320 410 350 400 Q380 380 370 300 Q360 250 330 245 Q310 245 300 250 Z" />
            {/* Europe */}
            <path d="M470 90 Q450 120 480 150 Q520 160 540 130 Q545 95 510 82 Q485 78 470 90 Z" />
            {/* Africa */}
            <path d="M480 160 Q460 210 500 290 Q540 320 575 270 Q590 210 560 175 Q520 150 480 160 Z" />
            {/* Asia */}
            <path d="M545 80 Q540 130 600 175 Q700 210 800 190 Q840 150 810 100 Q740 60 640 65 Q580 68 545 80 Z" />
            {/* Australia */}
            <path d="M850 300 Q830 340 870 370 Q920 380 945 345 Q955 310 915 298 Q880 292 850 300 Z" />
          </g>

          <path d={path} className={styles.routeLine} />

          {/* Lagos origin */}
          <circle cx={LAGOS.x} cy={LAGOS.y} r="7" className={styles.originDot} />
          <circle cx={LAGOS.x} cy={LAGOS.y} r="14" className={styles.originPulse} />

          {exitNodes.map((node) => (
            <circle
              key={node.id}
              cx={node.x}
              cy={node.y}
              r={node.id === activeId ? 8 : 4}
              className={node.id === activeId ? styles.nodeActive : styles.nodeDot}
            />
          ))}
        </svg>
      </div>

      <div className={styles.switcherControls}>
        <div className={styles.switcherSide}>
          <span className={styles.switcherLabel}>Your Location</span>
          <div className={styles.switcherValue}>🇳🇬 Lagos, Nigeria</div>
        </div>

        <div className={styles.switcherSide}>
          <span className={styles.switcherLabel}>Exit Node</span>
          <div className={styles.nodeOptions}>
            {exitNodes.map((node) => (
              <button
                key={node.id}
                type="button"
                onClick={() => setActiveId(node.id)}
                className={`${styles.nodeOption} ${node.id === activeId ? styles.nodeOptionActive : ""}`}
              >
                <span>{node.flag}</span>
                <span>{node.city}</span>
                {node.id === "fra" ? <em>Default</em> : null}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.switcherStatus}>
          <div className={styles.statusLine}>
            Routing through {active.city}... <span className={styles.statusOk}>✓ Connected</span>
          </div>
          <div className={styles.latencyLine}>
            Latency to client: <strong>~{active.latency}ms</strong>
          </div>
        </div>
      </div>

      <p className={styles.switcherFootnote}>
        Your client sees traffic from <strong>{active.city}</strong>. SentinelOne sees normal VPN traffic. You stay in
        Lagos.
      </p>
    </div>
  );
}

export default function Home() {
  useEffect(() => {
    const targets = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.revealed);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, []);

  return (
    <main className={styles.page}>
      {/* SECTION 1 - NAV */}
      <header className={styles.nav}>
        <div className={styles.navInner}>
          <Link href="/" className={styles.logo}>
            DevCloud
          </Link>
          <nav className={styles.navLinks}>
            <button type="button" onClick={() => scrollToId("features")}>
              Features
            </button>
            <button type="button" onClick={() => scrollToId("how-it-works")}>
              How It Works
            </button>
            <button type="button" onClick={() => scrollToId("ai-features")}>
              AI Features
            </button>
            <button type="button" onClick={() => scrollToId("pricing")}>
              Pricing
            </button>
          </nav>
          <div className={styles.navActions}>
            <Link href="/login" className={styles.ghostBtn}>
              Sign in
            </Link>
            <Link href="/signup" className={styles.goldBtn}>
              Get Started Free
            </Link>
          </div>
        </div>
      </header>

      {/* SECTION 2 - HERO */}
      <section className={styles.hero}>
        <div className={styles.heroBlobGold} />
        <div className={styles.heroBlobGreen} />
        <div className={styles.heroGrid} />
        <div className={styles.heroInner}>
          <div className={styles.heroCopy} data-reveal>
            <span className={styles.badge}>🛡️ Trusted by teams across Lagos • Accra • Nairobi • Abuja</span>
            <h1 className={styles.heroTitle}>
              <span className={styles.white}>Work from Lagos.</span>
              <span className={styles.gold}>Bill from London.</span>
              <span className={styles.white}>SentinelOne</span>
              <span className={styles.gradientText}>Sees Nothing.</span>
            </h1>
            <p className={styles.heroSub}>
              The secure remote development platform that defeats EDR/XDR security conflicts. Your code runs in Germany.
              Your client sees clean professional output. AnyDesk gets flagged — DevCloud never does.
            </p>
            <div className={styles.heroCtas}>
              <Link href="/signup" className={styles.goldBtnLg}>
                Start Building Free
              </Link>
              <button type="button" className={styles.linkBtn} onClick={() => scrollToId("how-it-works")}>
                See How It Works →
              </button>
            </div>
            <span className={styles.trustLine}>No credit card required • 60-second setup • Cancel anytime</span>
          </div>

          <div className={styles.heroMockWrap} data-reveal>
            <div className={styles.mockup}>
              <div className={styles.mockTop}>
                <div className={styles.mockDots}>
                  <span />
                  <span />
                  <span />
                </div>
                <span className={styles.mockTitle}>DevCloud — dashboard</span>
              </div>
              <div className={styles.mockBody}>
                <div className={styles.mockSidebar}>
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
                <div className={styles.mockMain}>
                  <span className={styles.mockHeading}>Active Environments</span>
                  <div className={styles.mockRow}>
                    <i className={styles.dotGreen} />
                    <span className={styles.mockName}>client-shopify-api</span>
                    <em className={styles.badgeBlue}>.NET 8</em>
                    <span className={styles.statusGreen}>Running</span>
                  </div>
                  <div className={styles.mockRow}>
                    <i className={styles.dotGold} />
                    <span className={styles.mockName}>client-mobile-app</span>
                    <em className={styles.badgePurple}>Flutter</em>
                    <span className={styles.statusGold}>Building</span>
                  </div>
                  <div className={styles.mockRow}>
                    <i className={styles.dotGray} />
                    <span className={styles.mockName}>client-dashboard</span>
                    <em className={styles.badgeGray}>Next.js</em>
                    <span className={styles.statusGray}>Stopped</span>
                  </div>
                  <div className={styles.mockTerminal}>
                    <span>$ devcloud status</span>
                    <span>✓ All systems operational</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 - PROBLEM */}
      <section className={styles.problem}>
        <div className={styles.sectionHead} data-reveal>
          <h2 className={styles.h2}>The war every African dev team is losing</h2>
          <p className={styles.subGold}>
            Corporate security tools treat remote developers as threats. We fix that.
          </p>
        </div>
        <div className={styles.problemGrid}>
          <div className={`${styles.problemCol} ${styles.colRed}`} data-reveal>
            <h3 className={styles.colTitleRed}>Without DevCloud</h3>
            <ul>
              {withoutItems.map((item) => (
                <li key={item}>
                  <span className={styles.iconRed}>
                    <X size={15} strokeWidth={3} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className={`${styles.problemCol} ${styles.colGold}`} data-reveal>
            <h3 className={styles.colTitleGold}>With DevCloud</h3>
            <ul>
              {withItems.map((item) => (
                <li key={item}>
                  <span className={styles.iconGold}>
                    <Check size={15} strokeWidth={3} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <div className={styles.gradientDivider} />

      {/* SECTION 4 - HOW LOCATION FREEDOM WORKS */}
      <section id="how-it-works" className={styles.howSection}>
        <div className={styles.sectionHead} data-reveal>
          <h2 className={styles.h2}>How we beat the location problem</h2>
          <p className={styles.subMuted}>Your physical location is irrelevant. Here&apos;s why.</p>
        </div>

        <div className={styles.flow} data-reveal>
          <div className={styles.flowNode}>
            <div className={styles.flowIcon}>💻</div>
            <span className={styles.flowBadge}>🇳🇬 Lagos</span>
            <strong>You in Lagos</strong>
            <p>Open VSCode. Connect to DevCloud. That&apos;s it.</p>
          </div>

          <div className={`${styles.flowArrow} ${styles.arrowGold}`} aria-hidden="true" />

          <div className={`${styles.flowNode} ${styles.flowGlow}`}>
            <div className={styles.flowIcon}>🖥️</div>
            <span className={styles.flowBadge}>🇩🇪 Frankfurt</span>
            <strong>DevCloud Server in Germany</strong>
            <p>Your code lives here. Docker environments run here. Everything happens here.</p>
          </div>

          <div className={`${styles.flowArrow} ${styles.arrowGreen}`} aria-hidden="true" />

          <div className={styles.flowNode}>
            <div className={styles.flowIcon}>🏢</div>
            <span className={styles.flowBadge}>🇬🇧 London</span>
            <strong>Your Client in London</strong>
            <p>They see: clean code, professional deploys, audit logs. They don&apos;t see: your location.</p>
          </div>
        </div>

        <blockquote className={styles.howQuote} data-reveal>
          What SentinelOne sees: a developer using VSCode over SSH. What your client sees: a professional engineering
          team. What DevCloud does: everything in between.
        </blockquote>
      </section>

      {/* LOCATION SWITCHER DEMO */}
      <section className={styles.switcherSection}>
        <div className={styles.sectionHead} data-reveal>
          <h2 className={styles.h2}>Route from anywhere. Appear from everywhere.</h2>
          <p className={styles.subMuted}>
            Match your traffic to your client&apos;s region in one click. Lower latency. Higher trust.
          </p>
        </div>
        <div data-reveal>
          <LocationSwitcher />
        </div>
      </section>

      {/* SECTION 5 - FEATURES */}
      <section id="features" className={styles.featuresSection}>
        <div className={styles.sectionHead} data-reveal>
          <h2 className={styles.h2}>Built for serious engineering teams</h2>
        </div>
        <div className={styles.featureGrid}>
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <article
                key={feature.title}
                className={`${styles.featureCard} ${styles[`accent_${feature.accent}`]}`}
                data-reveal
              >
                <div className={styles.featureIcon}>
                  <Icon size={20} />
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      {/* SECTION 6 - AI FEATURES */}
      <section id="ai-features" className={styles.aiSection}>
        <div className={styles.aiGlow} />
        <div className={styles.sectionHead} data-reveal>
          <span className={styles.purpleBadge}>Powered by Claude AI</span>
          <h2 className={styles.h2}>AI built into every workflow</h2>
          <p className={styles.subMuted}>Not a chatbot bolted on. AI woven into how you build.</p>
        </div>
        <div className={styles.aiGrid}>
          {aiCards.map((card) => (
            <article key={card.title} className={styles.aiCard} data-reveal>
              <div className={styles.aiIcon}>
                <Brain size={20} />
              </div>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
              <div className={styles.codeBlock}>
                {card.block.map((line, index) => (
                  <span key={index} className={styles[`tone_${line.tone}`]}>
                    {line.text}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* SECTION 7 - STATS */}
      <section className={styles.statsSection}>
        {stats.map((stat) => (
          <div key={stat.label} className={styles.statCard} data-reveal>
            <strong className={styles[`stat_${stat.accent}`]}>{stat.value}</strong>
            <span>{stat.label}</span>
          </div>
        ))}
        <div className={styles.statCard} data-reveal>
          <strong className={styles.statZero}>
            <s>0</s> <span className={styles.statCheck}>✓</span>
          </strong>
          <span>.env files needed</span>
        </div>
      </section>

      {/* SECTION 8 - TECH MARQUEE */}
      <section className={styles.marqueeSection}>
        <div className={styles.sectionHead} data-reveal>
          <h2 className={styles.h2}>Works with every stack your clients need</h2>
        </div>
        <div className={styles.marqueeRow}>
          <div className={`${styles.marqueeTrack} ${styles.marqueeLeft}`}>
            {[...stackRowOne, ...stackRowOne].map((tech, index) => (
              <span key={`${tech.name}-${index}`} className={styles.techPill} style={{ borderColor: tech.color, color: tech.color }}>
                {tech.name}
              </span>
            ))}
          </div>
        </div>
        <div className={styles.marqueeRow}>
          <div className={`${styles.marqueeTrack} ${styles.marqueeRight}`}>
            {[...stackRowTwo, ...stackRowTwo].map((tech, index) => (
              <span key={`${tech.name}-${index}`} className={styles.techPill} style={{ borderColor: tech.color, color: tech.color }}>
                {tech.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 9 - PRICING */}
      <section id="pricing" className={styles.pricingSection}>
        <div className={styles.sectionHead} data-reveal>
          <h2 className={styles.h2}>Simple pricing. No surprises.</h2>
        </div>
        <div className={styles.pricingGrid}>
          {pricing.map((plan) => (
            <article
              key={plan.name}
              className={`${styles.priceCard} ${plan.featured ? styles.priceFeatured : ""}`}
              data-reveal
            >
              {plan.featured ? <span className={styles.popularBadge}>Most Popular</span> : null}
              <h3 className={styles.planName}>{plan.name}</h3>
              <div className={styles.planPrice}>
                {plan.price}
                {plan.period ? <span>{plan.period}</span> : null}
              </div>
              <ul className={styles.planFeatures}>
                {plan.features.map((feature) => (
                  <li key={feature}>
                    <Check size={15} className={styles.planCheck} /> {feature}
                  </li>
                ))}
              </ul>
              <Link href={plan.href as Route} className={styles[plan.ctaStyle]}>
                {plan.cta}
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* SECTION 10 - TESTIMONIALS */}
      <section className={styles.testimonialSection}>
        <div className={styles.sectionHead} data-reveal>
          <h2 className={styles.h2}>Teams building without limits</h2>
        </div>
        <div className={styles.testimonialGrid}>
          {testimonials.map((item) => (
            <article key={item.name} className={styles.testimonialCard} data-reveal>
              <p className={styles.testimonialQuote}>&ldquo;{item.quote}&rdquo;</p>
              <span className={styles.testimonialAuthor}>
                {item.name} • {item.location}
              </span>
            </article>
          ))}
        </div>
      </section>

      {/* SECTION 11 - FINAL CTA */}
      <section className={styles.finalCta}>
        <div className={styles.finalInner} data-reveal>
          <h2 className={styles.finalTitle}>Ready to work without limits?</h2>
          <p className={styles.finalSub}>Join engineering teams across Africa building for global clients</p>
          <Link href="/signup" className={styles.whiteBtn}>
            Get Started Free
          </Link>
          <span className={styles.finalNote}>No credit card required • Setup in 10 minutes • Cancel anytime</span>
        </div>
      </section>

      {/* FOOTER */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <span className={styles.logo}>DevCloud</span>
            <small>by Codewithmonk Technology</small>
          </div>
          <nav className={styles.footerLinks}>
            <button type="button" onClick={() => scrollToId("features")}>
              Features
            </button>
            <button type="button" onClick={() => scrollToId("pricing")}>
              Pricing
            </button>
            <a href="https://github.com" target="_blank" rel="noreferrer">
              Docs
            </a>
            <a href="https://github.com" target="_blank" rel="noreferrer">
              GitHub
            </a>
            <Link href="/signup">Contact</Link>
          </nav>
          <div className={styles.footerSocial}>
            <a href="https://github.com" target="_blank" rel="noreferrer" aria-label="GitHub">
              GH
            </a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer" aria-label="Twitter">
              X
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn">
              in
            </a>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <span>© 2026 DevCloud by Codewithmonk Technology. Built in Nigeria 🇳🇬, used worldwide.</span>
          <span>Privacy Policy | Terms</span>
        </div>
      </footer>
    </main>
  );
}
