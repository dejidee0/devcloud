"use client";

import { useEffect, useMemo, useState } from "react";
import type { Route } from "next";
import Link from "next/link";
import {
  Brain,
  Check,
  Globe,
  KeyRound,
  MapPin,
  Rocket,
  ShieldCheck,
  Terminal,
  Users,
  Video,
  X
} from "lucide-react";
import styles from "./page.module.css";

type Accent = "gold" | "green" | "blue" | "purple";

const features: { title: string; description: string; icon: typeof ShieldCheck; accent: Accent }[] = [
  {
    title: "Zero Trust Network",
    description: "Private, secure developer access without exposing infrastructure to the public internet.",
    icon: ShieldCheck,
    accent: "gold"
  },
  {
    title: "Global Infrastructure",
    description:
      "Run environments in regions that best serve your customers, compliance requirements, and performance needs.",
    icon: Globe,
    accent: "green"
  },
  {
    title: "One-Click Environments",
    description:
      "Launch fully configured development environments for .NET, Node.js, Python, Java, Flutter, React, and more in minutes.",
    icon: Terminal,
    accent: "blue"
  },
  {
    title: "AI Code Review",
    description:
      "Review commits, identify issues, and receive actionable recommendations directly within your workflow.",
    icon: Brain,
    accent: "purple"
  },
  {
    title: "Secrets Vault",
    description:
      "Securely manage credentials, API keys, and sensitive configuration without exposing them across devices or communication channels.",
    icon: KeyRound,
    accent: "gold"
  },
  {
    title: "Session Audit Logs",
    description:
      "Maintain searchable activity records and operational visibility for security, governance, and compliance.",
    icon: Video,
    accent: "green"
  },
  {
    title: "Team Portal",
    description:
      "Track project activity, deployments, tickets, and delivery progress through a centralized workspace.",
    icon: Users,
    accent: "blue"
  },
  {
    title: "AI Deployment Assistant",
    description:
      "Analyze deployments before release, identify risks, and improve confidence before shipping changes.",
    icon: Rocket,
    accent: "purple"
  },
  {
    title: "Regional Routing",
    description:
      "Optimize connectivity and performance by selecting infrastructure regions that align with your users and customers.",
    icon: MapPin,
    accent: "gold"
  }
];

const withoutItems = [
  "Inconsistent development environments",
  "Lengthy onboarding processes",
  "Credentials shared across multiple tools",
  "Limited visibility and auditability",
  "Difficult cross-team collaboration",
  "Manual reporting and operational overhead"
];

const withItems = [
  "Standardized cloud environments",
  "Onboarding in minutes",
  "Centralized secrets management",
  "Complete audit trails",
  "Built-in collaboration workflows",
  "Automated reporting and governance"
];

const aiCards = [
  {
    title: "AI Environment Builder",
    description:
      "Describe your stack in plain English. DevCloud provisions infrastructure, configures dependencies, and prepares your environment for development.",
    block: [
      { text: '> "Build a Django REST API with PostgreSQL, Redis, and Celery"', tone: "prompt" },
      { text: "AI: Provisioning managed environment...", tone: "muted" },
      { text: "\u2713 Environment ready", tone: "ok" },
      { text: "\u2713 PostgreSQL configured", tone: "ok" },
      { text: "\u2713 Redis running", tone: "ok" },
      { text: "\u2713 Worker services started", tone: "ok" }
    ]
  },
  {
    title: "AI Ticket Generator",
    description:
      "Convert product requirements into structured engineering work complete with acceptance criteria and implementation tasks.",
    block: [
      { text: '> "Turn checkout requirements into implementation tickets"', tone: "prompt" },
      { text: "\u2713 Acceptance criteria generated", tone: "ok" },
      { text: "\u2713 Tasks assigned by workflow area", tone: "ok" }
    ]
  },
  {
    title: "AI Security Scanner",
    description:
      "Continuously analyze repositories for vulnerabilities, exposed credentials, insecure dependencies, and configuration risks.",
    block: [
      { text: "Repository scan completed", tone: "muted" },
      { text: "\u2713 No exposed secrets detected", tone: "ok" },
      { text: "\u2713 Dependency risk report generated", tone: "accent" }
    ]
  },
  {
    title: "AI Project Reports",
    description:
      "Generate professional project updates, sprint summaries, deployment reports, and stakeholder documentation automatically.",
    block: [
      { text: "Sprint Report - Week 26", tone: "accent" },
      { text: "Commits: 47 | Tickets: 12 closed", tone: "muted" },
      { text: "\u2713 Deployment summary attached", tone: "ok" },
      { text: "\u2713 Stakeholder update ready", tone: "ok" }
    ]
  }
];

const stats = [
  { value: "< 60s", accent: "gold", label: "Environment provisioning" },
  { value: "20+", accent: "green", label: "Supported technologies" },
  { value: "100%", accent: "blue", label: "Auditable activity" }
];

const stackRowOne = [
  { name: ".NET 8", color: "#7C3AED" },
  { name: "Node.js 20", color: "#00D97E" },
  { name: "Python 3.12", color: "#0EA5E9" },
  { name: "React", color: "#0EA5E9" },
  { name: "Next.js", color: "#ededed" },
  { name: "Flutter", color: "#0EA5E9" },
  { name: "Django", color: "#00D97E" },
  { name: "FastAPI", color: "#00D97E" }
];

const stackRowTwo = [
  { name: "Java", color: "#00D97E" },
  { name: "Spring Boot", color: "#00D97E" },
  { name: "Vue.js", color: "#00D97E" },
  { name: "C++", color: "#0EA5E9" },
  { name: "TypeScript", color: "#0EA5E9" },
  { name: "PostgreSQL", color: "#0EA5E9" },
  { name: "SQL Server", color: "#00D97E" },
  { name: "Redis", color: "#FF3B30" },
  { name: "Docker", color: "#0EA5E9" }
];

const pricing = [
  {
    name: "Starter",
    price: "Free",
    period: "",
    description: "Perfect for exploring DevCloud and building personal projects.",
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
    description: "For growing engineering teams that need collaboration, governance, and AI-powered workflows.",
    features: ["Up to 5 developers", "Unlimited environments", "AI features included", "Team portal", "Audit trail", "Priority support"],
    cta: "Start Free Trial",
    href: "/signup",
    featured: true,
    ctaStyle: "solidGold"
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For organizations requiring dedicated infrastructure, compliance controls, and advanced governance.",
    features: ["Unlimited developers", "Dedicated infrastructure", "Custom domains", "SLA guarantees", "White-label options", "Enterprise support"],
    cta: "Contact Sales",
    href: "/signup",
    featured: false,
    ctaStyle: "ghostWhite"
  }
];

const testimonials = [
  {
    quote:
      "DevCloud dramatically reduced onboarding time and gave our team a consistent development experience across every project.",
    name: "Engineering Lead",
    location: "Global software team"
  },
  {
    quote:
      "The combination of secure environments, audit trails, and AI workflows improved both productivity and operational visibility.",
    name: "CTO",
    location: "Distributed product company"
  },
  {
    quote:
      "We replaced several disconnected tools with a single platform and simplified how our team collaborates.",
    name: "Head of Engineering",
    location: "Enterprise delivery group"
  }
];

const regions = [
  { id: "fra", city: "Frankfurt", country: "Germany", x: 524, y: 111, latency: 18 },
  { id: "lon", city: "London", country: "United Kingdom", x: 500, y: 107, latency: 12 },
  { id: "nyc", city: "New York", country: "United States", x: 294, y: 137, latency: 9 },
  { id: "sin", city: "Singapore", country: "Singapore", x: 788, y: 246, latency: 14 },
  { id: "tor", city: "Toronto", country: "Canada", x: 279, y: 129, latency: 11 },
  { id: "syd", city: "Sydney", country: "Australia", x: 920, y: 344, latency: 22 }
];

const TEAM = { x: 470, y: 180 };

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function GlobalInfrastructure() {
  const [activeId, setActiveId] = useState("fra");
  const active = useMemo(() => regions.find((n) => n.id === activeId)!, [activeId]);

  const path = useMemo(() => {
    const midX = (TEAM.x + active.x) / 2;
    const midY = Math.min(TEAM.y, active.y) - 70;
    return `M ${TEAM.x} ${TEAM.y} Q ${midX} ${midY} ${active.x} ${active.y}`;
  }, [active]);

  return (
    <div className={styles.switcher}>
      <div className={styles.mapWrap}>
        <svg viewBox="0 0 1000 500" className={styles.map} role="img" aria-label="Global infrastructure routing map">
          <g fill="#1f1f1f">
            <path d="M160 80 Q120 110 140 160 Q160 210 240 200 Q320 190 330 130 Q320 80 250 70 Q200 60 160 80 Z" />
            <path d="M300 250 Q280 300 300 360 Q320 410 350 400 Q380 380 370 300 Q360 250 330 245 Q310 245 300 250 Z" />
            <path d="M470 90 Q450 120 480 150 Q520 160 540 130 Q545 95 510 82 Q485 78 470 90 Z" />
            <path d="M480 160 Q460 210 500 290 Q540 320 575 270 Q590 210 560 175 Q520 150 480 160 Z" />
            <path d="M545 80 Q540 130 600 175 Q700 210 800 190 Q840 150 810 100 Q740 60 640 65 Q580 68 545 80 Z" />
            <path d="M850 300 Q830 340 870 370 Q920 380 945 345 Q955 310 915 298 Q880 292 850 300 Z" />
          </g>

          <path d={path} className={styles.routeLine} />
          <circle cx={TEAM.x} cy={TEAM.y} r="7" className={styles.originDot} />
          <circle cx={TEAM.x} cy={TEAM.y} r="14" className={styles.originPulse} />

          {regions.map((node) => (
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
          <span className={styles.switcherLabel}>Connection Status</span>
          <div className={styles.switcherValue}>Connected through {active.city} \u2713</div>
        </div>

        <div className={styles.switcherSide}>
          <span className={styles.switcherLabel}>Infrastructure Region</span>
          <div className={styles.nodeOptions}>
            {regions.map((node) => (
              <button
                key={node.id}
                type="button"
                onClick={() => setActiveId(node.id)}
                className={`${styles.nodeOption} ${node.id === activeId ? styles.nodeOptionActive : ""}`}
              >
                <span>{node.city}</span>
                {node.id === "fra" ? <em>Default</em> : null}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.switcherStatus}>
          <div className={styles.statusLine}>
            Infrastructure healthy <span className={styles.statusOk}>\u2713 Audit trail active</span>
          </div>
          <div className={styles.latencyLine}>
            Latency optimized: <strong>~{active.latency}ms</strong>
          </div>
        </div>
      </div>

      <p className={styles.switcherFootnote}>
        Choose infrastructure regions based on customer requirements, compliance needs, and performance goals.
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
      <header className={styles.nav}>
        <div className={styles.navInner}>
          <Link href="/" className={styles.logo}>DevCloud</Link>
          <nav className={styles.navLinks}>
            <button type="button" onClick={() => scrollToId("features")}>Features</button>
            <button type="button" onClick={() => scrollToId("how-it-works")}>How It Works</button>
            <button type="button" onClick={() => scrollToId("ai-features")}>AI Features</button>
            <button type="button" onClick={() => scrollToId("pricing")}>Pricing</button>
          </nav>
          <div className={styles.navActions}>
            <Link href="/login" className={styles.ghostBtn}>Sign in</Link>
            <Link href="/signup" className={styles.goldBtn}>Get Started Free</Link>
          </div>
        </div>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroBlobGold} />
        <div className={styles.heroBlobGreen} />
        <div className={styles.heroGrid} />
        <div className={styles.heroInner}>
          <div className={styles.heroCopy} data-reveal>
            <span className={styles.badge}>Trusted by distributed engineering teams worldwide</span>
            <h1 className={styles.heroTitle}>
              <span className={styles.white}>Build from anywhere.</span>
              <span className={styles.gradientText}>Deploy everywhere.</span>
            </h1>
            <p className={styles.heroSub}>
              Secure cloud development environments, global infrastructure, AI-powered workflows, and enterprise-grade governance - all in one platform.
            </p>
            <div className={styles.heroCtas}>
              <Link href="/signup" className={styles.goldBtnLg}>Get Started Free</Link>
              <button type="button" className={styles.linkBtn} onClick={() => scrollToId("how-it-works")}>See How It Works -&gt;</button>
            </div>
            <span className={styles.trustLine}>No credit card required - Setup in minutes - Cancel anytime</span>
          </div>

          <div className={styles.heroMockWrap} data-reveal>
            <div className={styles.mockup}>
              <div className={styles.mockTop}>
                <div className={styles.mockDots}><span /><span /><span /></div>
                <span className={styles.mockTitle}>DevCloud - dashboard</span>
              </div>
              <div className={styles.mockBody}>
                <div className={styles.mockSidebar}><span /><span /><span /><span /><span /><span /></div>
                <div className={styles.mockMain}>
                  <span className={styles.mockHeading}>Platform Status</span>
                  <div className={styles.mockRow}><i className={styles.dotGreen} /><span className={styles.mockName}>environments</span><em className={styles.badgeBlue}>Healthy</em><span className={styles.statusGreen}>Active</span></div>
                  <div className={styles.mockRow}><i className={styles.dotGold} /><span className={styles.mockName}>secrets-vault</span><em className={styles.badgePurple}>Secured</em><span className={styles.statusGold}>Synced</span></div>
                  <div className={styles.mockRow}><i className={styles.dotGray} /><span className={styles.mockName}>audit-trail</span><em className={styles.badgeGray}>Governance</em><span className={styles.statusGray}>Live</span></div>
                  <div className={styles.mockTerminal}>
                    <span>$ devcloud status</span>
                    <span>{"\u2713 Environments healthy"}</span>
                    <span>{"\u2713 Secrets secured"}</span>
                    <span>{"\u2713 Audit trail active"}</span>
                    <span>{"\u2713 Team connected"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.problem}>
        <div className={styles.sectionHead} data-reveal>
          <h2 className={styles.h2}>Remote development should not create operational complexity</h2>
          <p className={styles.subGold}>
            Modern engineering teams work across cities, countries, and time zones. Infrastructure, onboarding, security, and compliance should not slow delivery.
          </p>
        </div>
        <div className={styles.problemGrid}>
          <div className={`${styles.problemCol} ${styles.colRed}`} data-reveal>
            <h3 className={styles.colTitleRed}>Without DevCloud</h3>
            <ul>{withoutItems.map((item) => <li key={item}><span className={styles.iconRed}><X size={15} strokeWidth={3} /></span>{item}</li>)}</ul>
          </div>
          <div className={`${styles.problemCol} ${styles.colGold}`} data-reveal>
            <h3 className={styles.colTitleGold}>With DevCloud</h3>
            <ul>{withItems.map((item) => <li key={item}><span className={styles.iconGold}><Check size={15} strokeWidth={3} /></span>{item}</li>)}</ul>
          </div>
        </div>
      </section>

      <div className={styles.gradientDivider} />

      <section id="how-it-works" className={styles.howSection}>
        <div className={styles.sectionHead} data-reveal>
          <h2 className={styles.h2}>Built for distributed engineering teams</h2>
          <p className={styles.subMuted}>Developers, infrastructure, and stakeholders operate through one secure platform.</p>
        </div>

        <div className={styles.flow} data-reveal>
          <div className={styles.flowNode}>
            <div className={styles.flowIcon}>01</div>
            <span className={styles.flowBadge}>Developer Workspace</span>
            <strong>Connect and build</strong>
            <p>Connect through VS Code and start building immediately. Your tools stay familiar while your environment becomes fully managed.</p>
          </div>
          <div className={`${styles.flowArrow} ${styles.arrowGold}`} aria-hidden="true" />
          <div className={`${styles.flowNode} ${styles.flowGlow}`}>
            <div className={styles.flowIcon}>02</div>
            <span className={styles.flowBadge}>Managed Cloud Environment</span>
            <strong>Standardized infrastructure</strong>
            <p>Development environments, services, databases, and deployments run in secure cloud infrastructure.</p>
          </div>
          <div className={`${styles.flowArrow} ${styles.arrowGreen}`} aria-hidden="true" />
          <div className={styles.flowNode}>
            <div className={styles.flowIcon}>03</div>
            <span className={styles.flowBadge}>Team & Client Visibility</span>
            <strong>Aligned delivery</strong>
            <p>Stakeholders gain visibility through dashboards, reports, deployments, and audit logs.</p>
          </div>
        </div>

        <blockquote className={styles.howQuote} data-reveal>
          DevCloud connects developers, infrastructure, and stakeholders through a secure, auditable workflow.
        </blockquote>
      </section>

      <section className={styles.switcherSection}>
        <div className={styles.sectionHead} data-reveal>
          <h2 className={styles.h2}>Global infrastructure. Local productivity.</h2>
          <p className={styles.subMuted}>Deploy closer to customers, improve performance, and maintain consistent workflows across regions.</p>
        </div>
        <div data-reveal><GlobalInfrastructure /></div>
      </section>

      <section id="features" className={styles.featuresSection}>
        <div className={styles.sectionHead} data-reveal>
          <h2 className={styles.h2}>Built for modern engineering teams</h2>
        </div>
        <div className={styles.featureGrid}>
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <article key={feature.title} className={`${styles.featureCard} ${styles[`accent_${feature.accent}`]}`} data-reveal>
                <div className={styles.featureIcon}><Icon size={20} /></div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section id="ai-features" className={styles.aiSection}>
        <div className={styles.aiGlow} />
        <div className={styles.sectionHead} data-reveal>
          <span className={styles.purpleBadge}>Powered by AI</span>
          <h2 className={styles.h2}>AI that accelerates engineering work</h2>
          <p className={styles.subMuted}>From environment setup to deployment reviews, DevCloud automates repetitive operational work so teams can focus on building.</p>
        </div>
        <div className={styles.aiGrid}>
          {aiCards.map((card) => (
            <article key={card.title} className={styles.aiCard} data-reveal>
              <div className={styles.aiIcon}><Brain size={20} /></div>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
              <div className={styles.codeBlock}>{card.block.map((line, index) => <span key={index} className={styles[`tone_${line.tone}`]}>{line.text}</span>)}</div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.statsSection}>
        {stats.map((stat) => <div key={stat.label} className={styles.statCard} data-reveal><strong className={styles[`stat_${stat.accent}`]}>{stat.value}</strong><span>{stat.label}</span></div>)}
        <div className={styles.statCard} data-reveal><strong className={styles.statZero}>0</strong><span>Manual environment setup</span></div>
      </section>

      <section className={styles.marqueeSection}>
        <div className={styles.sectionHead} data-reveal>
          <h2 className={styles.h2}>Works with the tools your team already uses</h2>
          <p className={styles.subMuted}>Support for modern frameworks, languages, databases, and infrastructure technologies.</p>
        </div>
        <div className={styles.marqueeRow}><div className={`${styles.marqueeTrack} ${styles.marqueeLeft}`}>{[...stackRowOne, ...stackRowOne].map((tech, index) => <span key={`${tech.name}-${index}`} className={styles.techPill} style={{ borderColor: tech.color, color: tech.color }}>{tech.name}</span>)}</div></div>
        <div className={styles.marqueeRow}><div className={`${styles.marqueeTrack} ${styles.marqueeRight}`}>{[...stackRowTwo, ...stackRowTwo].map((tech, index) => <span key={`${tech.name}-${index}`} className={styles.techPill} style={{ borderColor: tech.color, color: tech.color }}>{tech.name}</span>)}</div></div>
      </section>

      <section id="pricing" className={styles.pricingSection}>
        <div className={styles.sectionHead} data-reveal>
          <h2 className={styles.h2}>Simple pricing that scales with your team</h2>
          <p className={styles.subMuted}>Whether you are an individual developer or a global engineering organization, DevCloud grows with you.</p>
        </div>
        <div className={styles.pricingGrid}>
          {pricing.map((plan) => (
            <article key={plan.name} className={`${styles.priceCard} ${plan.featured ? styles.priceFeatured : ""}`} data-reveal>
              {plan.featured ? <span className={styles.popularBadge}>Most Popular</span> : null}
              <h3 className={styles.planName}>{plan.name}</h3>
              <div className={styles.planPrice}>{plan.price}{plan.period ? <span>{plan.period}</span> : null}</div>
              <p className={styles.subMuted}>{plan.description}</p>
              <ul className={styles.planFeatures}>{plan.features.map((feature) => <li key={feature}><Check size={15} className={styles.planCheck} /> {feature}</li>)}</ul>
              <Link href={plan.href as Route} className={styles[plan.ctaStyle]}>{plan.cta}</Link>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.testimonialSection}>
        <div className={styles.sectionHead} data-reveal>
          <h2 className={styles.h2}>Teams building with confidence</h2>
        </div>
        <div className={styles.testimonialGrid}>
          {testimonials.map((item) => <article key={item.name} className={styles.testimonialCard} data-reveal><p className={styles.testimonialQuote}>&ldquo;{item.quote}&rdquo;</p><span className={styles.testimonialAuthor}>{item.name} - {item.location}</span></article>)}
        </div>
      </section>

      <section className={styles.finalCta}>
        <div className={styles.finalInner} data-reveal>
          <h2 className={styles.finalTitle}>Build without operational friction</h2>
          <p className={styles.finalSub}>Give your team secure infrastructure, AI-powered workflows, and enterprise-ready governance from day one.</p>
          <Link href="/signup" className={styles.whiteBtn}>Get Started Free</Link>
          <span className={styles.finalNote}>No credit card required - Setup in minutes - Cancel anytime</span>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}><span className={styles.logo}>DevCloud</span><small>by Codewithmonk Technology</small></div>
          <nav className={styles.footerLinks}>
            <button type="button" onClick={() => scrollToId("features")}>Features</button>
            <button type="button" onClick={() => scrollToId("pricing")}>Pricing</button>
            <Link href="/signup">Contact</Link>
            <Link href="/login">Sign in</Link>
          </nav>
          <div className={styles.footerSocial}><a href="https://github.com" target="_blank" rel="noreferrer" aria-label="GitHub">GH</a><a href="https://twitter.com" target="_blank" rel="noreferrer" aria-label="Twitter">X</a><a href="https://linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn">in</a></div>
        </div>
        <div className={styles.footerBottom}>
          <span>Copyright 2026 DevCloud by Codewithmonk Technology. Designed for distributed engineering teams worldwide.</span>
          <span>Privacy Policy | Terms</span>
        </div>
      </footer>
    </main>
  );
}
