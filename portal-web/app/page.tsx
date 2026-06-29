"use client";

import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Code2,
  KeyRound,
  Lock,
  Play,
  Rocket,
  ShieldCheck,
  Sparkles,
  Terminal,
  Users,
  Video
} from "lucide-react";
import styles from "./page.module.css";

const features = [
  {
    title: "Zero Trust Access",
    description: "Tailscale mesh network, no exposed ports",
    icon: Lock
  },
  {
    title: "One-Click Environments",
    description: "Spin up .NET, Node, Python, Flutter in 60 seconds",
    icon: Terminal
  },
  {
    title: "Secrets Vault",
    description: "Never store credentials in .env files again",
    icon: KeyRound
  },
  {
    title: "Session Recording",
    description: "Every terminal session recorded and auditable",
    icon: Video
  },
  {
    title: "Client Portal",
    description: "Give clients professional project visibility",
    icon: Users
  },
  {
    title: "Dead Man's Switch",
    description: "Owner protection built into the infrastructure",
    icon: ShieldCheck
  }
];

const stats = [
  { value: 60, prefix: "< ", suffix: "s", label: "Environment spin-up time" },
  { value: 7, suffix: " Stacks", label: "Supported tech stacks" },
  { value: 100, suffix: "%", label: "Session audit coverage" },
  { value: 0, suffix: " .env files", label: "Secrets exposed" }
];

const steps = [
  { title: "Connect", description: "Install Tailscale, join private mesh", icon: ShieldCheck },
  { title: "Code", description: "Open VSCode, connect to remote environment", icon: Code2 },
  { title: "Deploy", description: "Push to staging or production with one click", icon: Rocket }
];

const stacks = [".NET", "Node.js", "Python", "Java", "React", "Flutter", "C++"];

function useCountUp(target: number, active: boolean) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) return;

    let frame = 0;
    const totalFrames = 48;

    function tick() {
      frame += 1;
      const progress = Math.min(frame / totalFrames, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));

      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    }

    requestAnimationFrame(tick);
  }, [active, target]);

  return value;
}

function StatCard({ stat, active }: { stat: (typeof stats)[number]; active: boolean }) {
  const value = useCountUp(stat.value, active);

  return (
    <div className={`${styles.statCard} ${styles.reveal}`} data-reveal>
      <strong>
        {stat.prefix}
        {value}
        {stat.suffix}
      </strong>
      <span>{stat.label}</span>
    </div>
  );
}

export default function Home() {
  const statsRef = useRef<HTMLElement | null>(null);
  const [statsActive, setStatsActive] = useState(false);
  const particles = useMemo(() => Array.from({ length: 28 }, (_, index) => index), []);

  useEffect(() => {
    const revealTargets = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.revealed);
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18 }
    );

    revealTargets.forEach((target) => revealObserver.observe(target));

    const statsObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setStatsActive(true);
          statsObserver.disconnect();
        }
      },
      { threshold: 0.35 }
    );

    if (statsRef.current) {
      statsObserver.observe(statsRef.current);
    }

    return () => {
      revealObserver.disconnect();
      statsObserver.disconnect();
    };
  }, []);

  return (
    <main className={styles.landing}>
      <section className={styles.hero}>
        <div className={styles.gridOverlay} />
        <div className={styles.particles} aria-hidden="true">
          {particles.map((particle) => (
            <span key={particle} style={{ "--i": particle, left: `${(particle * 37) % 100}%`, top: `${(particle * 23) % 100}%` } as CSSProperties} />
          ))}
        </div>

        <nav className={styles.nav} aria-label="Primary">
          <Link href="/" className={styles.logo}>DevCloud</Link>
          <div>
            <a href="#features">Features</a>
            <a href="#workflow">Workflow</a>
            <a href="#stack">Stack</a>
            <Link href="/login">Login</Link>
          </div>
        </nav>

        <div className={styles.heroInner}>
          <div className={`${styles.heroCopy} ${styles.reveal}`} data-reveal>
            <div className={styles.eyebrow}><Sparkles size={16} /> Secure remote development infrastructure</div>
            <h1>Your Team. Anywhere. Secure.</h1>
            <p>The remote development platform built for elite engineering teams. Secure by design. Fast by default.</p>
            <div className={styles.heroActions}>
              <Link href="/login" className={styles.primaryCta}>Get Started <ArrowRight size={18} /></Link>
              <a href="#workflow" className={styles.secondaryCta}><Play size={17} /> Watch Demo</a>
            </div>
          </div>

          <div className={`${styles.terminalWrap} ${styles.reveal}`} data-reveal>
            <div className={styles.terminalWindow}>
              <div className={styles.terminalTop}>
                <span />
                <span />
                <span />
                <em>devcloud mesh session</em>
              </div>
              <div className={styles.terminalBody}>
                <span className={styles.typeLine}>$ tailscale status --json</span>
                <span className={styles.typeLine}>peer: codemonk-devcloud-01 online</span>
                <span className={styles.typeLine}>$ devcloud env start --stack dotnet</span>
                <span className={styles.typeLine}>container ready in 42s</span>
                <span className={styles.typeLine}>$ ssh root@100.105.66.71</span>
                <span className={styles.typeLine}>secure shell established</span>
                <span className={styles.cursorLine}>_</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className={styles.section}>
        <div className={`${styles.sectionHeader} ${styles.reveal}`} data-reveal>
          <span>Capability layer</span>
          <h2>Everything your team needs</h2>
        </div>
        <div className={styles.featureGrid}>
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <article className={`${styles.featureCard} ${styles.reveal}`} key={feature.title} data-reveal>
                <div className={styles.featureIcon}><Icon size={24} /></div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section ref={statsRef} className={styles.statsSection}>
        {stats.map((stat) => <StatCard key={stat.label} stat={stat} active={statsActive} />)}
      </section>

      <section id="workflow" className={styles.section}>
        <div className={`${styles.sectionHeader} ${styles.reveal}`} data-reveal>
          <span>Workflow</span>
          <h2>How it works</h2>
        </div>
        <div className={styles.steps}>
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <article className={`${styles.stepCard} ${styles.reveal}`} key={step.title} data-reveal>
                <div className={styles.stepBadge}>{index + 1}</div>
                <div className={styles.stepIcon}><Icon size={24} /></div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section id="stack" className={styles.stackSection}>
        <div className={`${styles.sectionHeader} ${styles.reveal}`} data-reveal>
          <span>Runtime coverage</span>
          <h2>Works with your stack</h2>
        </div>
        <div className={`${styles.stackRail} ${styles.reveal}`} data-reveal>
          {stacks.concat(stacks).map((stack, index) => <span key={`${stack}-${index}`}>{stack}</span>)}
        </div>
      </section>

      <section className={`${styles.ctaSection} ${styles.reveal}`} data-reveal>
        <h2>Ready to work from anywhere?</h2>
        <p>Join engineering teams building without boundaries</p>
        <Link href="/login" className={styles.primaryCta}>Get Started Free <ArrowRight size={18} /></Link>
      </section>

      <footer className={styles.footer}>
        <div>
          <Link href="/" className={styles.logo}>DevCloud</Link>
          <span>Built by Codewithmonk Technology</span>
          <small>Copyright {new Date().getFullYear()} DevCloud. All rights reserved.</small>
        </div>
        <nav aria-label="Footer">
          <a href="#features">Features</a>
          <a href="#workflow">Workflow</a>
          <a href="#stack">Stack</a>
          <Link href="/login">Login</Link>
        </nav>
      </footer>
    </main>
  );
}
