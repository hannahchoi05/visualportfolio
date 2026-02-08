import { Link } from "react-router-dom";
import { Github, Linkedin, Mail } from "lucide-react";
import { useState, useEffect, useRef } from "react";

const education = [
  {
    school: "Princeton University",
    date: "September 2023 - May 2027",
    details: [
      "Major: Computer Science (BSE)",
      "Minors: Finance, Statistics and Machine Learning",
      "Coursework: Machine Learning, Algorithms & Data Structure, Operating Systems, Advanced Programming Techniques, NLP, Programming Systems, Computer Architecture, Theory of Computation"
    ]
  },
  {
    school: "London School of Economics",
    date: "June 2024 - July 2024",
    details: [
      "GPA: 4.0/4.0",
      "Coursework: Introductory Microeconomics, Introduction to Behavioral Economics"
    ]
  },
  {
    school: "Fort Lee High School",
    date: "September 2019 - June 2023",
    details: [
      "GPA: 4.4/4.0",
      "SAT: 1540/1600 (R/W: 740, M: 800)"
    ]
  }
];

const experience = [
  {
    company: "Town Hall Ventures",
    role: "AI Fellow",
    date: "January 2026 - Present",
    bullets: [
      "Build and evaluate AI solutions that integrate with Town Hall's existing technology and data stack",
      "Unify disparate data sources including integration of external data with internal systems"
    ],
    skills: ["Python"]
  },
  {
    company: "Mirae Asset Securities",
    role: "Quant Algo Team, Summer Intern",
    date: "June 2025 - Aug 2025",
    bullets: [
      "Engineered a production-grade algorithmic trading system for 'Share Class ETF' using real-time KOSCOM market data, automated hedging, and execution strategies",
      "Developed signal-driven prototypes, iterated with traders to refine model behavior and benchmarked performance under test market",
      "Conducted extensive simulation testing to validate robustness, achieving lower latency and more stable prediction-execution alignment"
    ],
    skills: ["C#", "C++"]
  },
  {
    company: "Hoagie Plan",
    role: "Team Lead",
    date: "September 2024 - Present",
    bullets: [
      "Led the full-stack development of Princeton's academic planner application for 3k+ Princeton students, partnering with product managers and developers to prototype features and implement end-to-end functionality",
      "Managed a team of 15 developers using Linear, reviewing 7 pull requests per week, organize weekly meetings, and coordinate feature rollout using Vercel",
      "Implemented upload transcript to insert courses feature, recommended minors/certificates feature, and database migration improvements"
    ],
    skills: ["Python", "React", "Next.js", "TypeScript", "SCSS", "PostgreSQL"]
  },
  {
    company: "Niehaus Center for Globalization and Governance",
    role: "Undergraduate Research Assistant",
    date: "February 2025 - Present",
    bullets: [
      "Built ML-driven sentiment analysis pipelines to analyze trade policy uncertainty across large news corpora and identify firm reshoring announcements",
      "Used OpenAI API to extract firm reshoring announcements and economic signals, accelerating data processing for the working paper \"U.S.-China Supply Chains Under Stress\""
    ],
    skills: ["Python", "OpenAI API"]
  },
  {
    company: "Princeton University Department of Computer Science",
    role: "Undergraduate Course Assistant",
    date: "September 2024 - Present",
    bullets: [
      "Taught core CS concepts and debugging strategies for students, and provided structured feedback to strengthen students' problem-solving skills and coding best practices"
    ],
    skills: ["Java"]
  }
];

const projects = [
  {
    title: "Predicting Corporate Credit Ratings Using Supervised Learning Models",
    bullets: [
      "Designed and trained supervised learning and deep learning models to predict corporate credit ratings, with the goal of automating parts of the rating process",
      "Scraping rating labels and features (financial market data, business position, financial indicators) from S&P Global Market Intelligence and engineering features for model input"
    ],
    skills: ["Python", "PyTorch", "NumPy", "VertexAI"]
  },
  {
    title: "TigerPop",
    bullets: [
      "Built a peer-to-peer marketplace platform for Princeton students to buy and sell secondhand clothes, dorm essentials, and textbooks locally, eliminating shipping logistics and enabling trusted campus-only exchanges"
    ],
    skills: ["Python", "React", "Next.js", "TypeScript", "TailwindCSS", "PostgreSQL"]
  },
  {
    title: "Portfolio Website",
    bullets: [
      "Designed and developed a personal portfolio website to showcase my projects and experience, using React for the frontend and Firebase for backend data management",
      "Implemented an interactive graph visualization of my skills and projects using react-force-graph, with data dynamically loaded from Firestore"
    ],
    skills: ["React", "Firebase", "JavaScript", "CSS"]
  },
  {
    title: "SilentSignal",
    bullets: [
      "Developed an Android app for real-time audio-based violent crime detection; implemented stacked classifiers to identify crime type and automatically notify nearby professionals"
    ],
    skills: ["Python", "Java"]
  }
];

function SkillTag({ skill }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '4px 12px',
      backgroundColor: '#2a2a2a',
      borderRadius: '4px',
      fontSize: '0.85rem',
      marginRight: '8px',
      marginTop: '8px',
      border: '1px solid #3a3a3a'
    }}>
      {skill}
    </span>
  );
}

function Section({ number, title, children }) {
  return (
    <section style={{ marginBottom: '4rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
        <span style={{ color: '#666', marginRight: '1rem' }}>{number}.</span>
        <h2 style={{ fontSize: '1.25rem', color: '#fff', fontWeight: 400 }}>{title}</h2>
        <div style={{ flex: 1, height: '1px', backgroundColor: '#333', marginLeft: '1rem' }}></div>
      </div>
      {children}
    </section>
  );
}

// Animated card that fades in when scrolled into view
function AnimatedCard({ children, delay = 0 }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div
      ref={ref}
      style={{
        backgroundColor: '#1a1a1a',
        borderRadius: '8px',
        padding: '1.5rem',
        marginBottom: '1rem',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
        transition: 'opacity 0.6s ease-out, transform 0.6s ease-out'
      }}
    >
      {children}
    </div>
  );
}

// Cursor glow component
function CursorGlow() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setPosition({ x: e.clientX, y: e.clientY });
      setIsVisible(true);
    };

    const handleMouseLeave = () => setIsVisible(false);

    window.addEventListener('mousemove', handleMouseMove);
    document.body.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.body.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(107, 138, 253, 0.15) 0%, transparent 70%)',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        zIndex: 0,
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.3s ease'
      }}
    />
  );
}

function Card({ children }) {
  return (
    <div style={{
      backgroundColor: '#1a1a1a',
      borderRadius: '8px',
      padding: '1.5rem',
      marginBottom: '1rem'
    }}>
      {children}
    </div>
  );
}

export default function HomePage() {
  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#121212', 
      color: '#a0a0a0',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      position: 'relative'
    }}>
      {/* Cursor Glow Effect */}
      <CursorGlow />

      {/* Navigation */}
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'right',
        gap: '2rem',
        padding: '1.5rem 2rem',
        backgroundColor: 'rgba(18, 18, 18, 0.95)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
        zIndex: 100
      }}>
        <button onClick={() => scrollTo('education')} style={navStyle}>Education</button>
        <button onClick={() => scrollTo('experience')} style={navStyle}>Experience</button>
        <button onClick={() => scrollTo('projects')} style={navStyle}>Projects</button>
        <Link to="/map" style={{
          ...navStyle,
          backgroundColor: '#fff',
          color: '#000',
          padding: '8px 16px',
          borderRadius: '6px',
          fontWeight: 500
        }}>
          Explore!
        </Link>
      </nav>

      {/* Social Links */}
      <div style={{
        position: 'fixed',
        right: '2rem',
        top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        zIndex: 100
      }}>
        <a href="https://github.com/hannahchoi05" target="_blank" rel="noopener noreferrer" style={iconStyle}>
          <Github size={24} />
        </a>
        <a href="https://www.linkedin.com/in/hannah-e-choi/" target="_blank" rel="noopener noreferrer" style={iconStyle}>
          <Linkedin size={24} />
        </a>
        <a href="mailto:hc8499@princeton.edu" style={iconStyle}>
          <Mail size={24} />
        </a>
      </div>

      {/* Main Content */}
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '0 2rem' }}>
        {/* Hero */}
        <section style={{ 
          minHeight: '100vh', 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center',
          paddingTop: '60px'
        }}>
          <p style={{ color: '#666', marginBottom: '0.5rem' }}>Hi, my name is</p>
          <h1 style={{ 
            fontSize: '4rem', 
            fontWeight: 700, 
            color: '#fff',
            marginBottom: '1.5rem',
            lineHeight: 1.1
          }}>
            Hannah Choi
          </h1>
          <p style={{ 
            fontSize: '1.1rem', 
            lineHeight: 1.7,
            maxWidth: '600px'
          }}>
            I am an undergraduate at Princeton University studying Computer Science with minors in Finance and Statistics and Machine Learning. I am graduating in May 2027 and am looking for full-time roles. Contact me!
          </p>
        </section>

        {/* Education */}
        <div id="education">
          <Section number="01" title="Education">
            {education.map((edu, i) => (
              <AnimatedCard key={i} delay={i * 100}>
                <h3 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '0.25rem' }}>{edu.school}</h3>
                <p style={{ color: '#e07c4c', fontSize: '0.9rem', marginBottom: '1rem' }}>{edu.date}</p>
                <ul style={{ paddingLeft: '1.25rem', margin: 0 }}>
                  {edu.details.map((detail, j) => (
                    <li key={j} style={{ marginBottom: '0.5rem', lineHeight: 1.5 }}>{detail}</li>
                  ))}
                </ul>
              </AnimatedCard>
            ))}
          </Section>
        </div>

        {/* Experience */}
        <div id="experience">
          <Section number="02" title="Experience">
            {experience.map((exp, i) => (
              <AnimatedCard key={i} delay={i * 100}>
                <h3 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '0.25rem' }}>{exp.company}</h3>
                <p style={{ color: '#888', fontSize: '0.95rem', marginBottom: '0.25rem' }}>{exp.role}</p>
                <p style={{ color: '#e07c4c', fontSize: '0.9rem', marginBottom: '1rem' }}>{exp.date}</p>
                <ul style={{ paddingLeft: '1.25rem', margin: 0 }}>
                  {exp.bullets.map((bullet, j) => (
                    <li key={j} style={{ marginBottom: '0.5rem', lineHeight: 1.5 }}>{bullet}</li>
                  ))}
                </ul>
                <div style={{ marginTop: '1rem' }}>
                  {exp.skills.map((skill, j) => (
                    <SkillTag key={j} skill={skill} />
                  ))}
                </div>
              </AnimatedCard>
            ))}
          </Section>
        </div>

        {/* Projects */}
        <div id="projects">
          <Section number="03" title="Projects">
            {projects.map((proj, i) => (
              <AnimatedCard key={i} delay={i * 100}>
                <h3 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '1rem' }}>{proj.title}</h3>
                <ul style={{ paddingLeft: '1.25rem', margin: 0 }}>
                  {proj.bullets.map((bullet, j) => (
                    <li key={j} style={{ marginBottom: '0.5rem', lineHeight: 1.5 }}>{bullet}</li>
                  ))}
                </ul>
                <div style={{ marginTop: '1rem' }}>
                  {proj.skills.map((skill, j) => (
                    <SkillTag key={j} skill={skill} />
                  ))}
                </div>
              </AnimatedCard>
            ))}
          </Section>
        </div>

        {/* Footer spacing */}
        <div style={{ height: '4rem' }}></div>
      </main>
    </div>
  );
}

const navStyle = {
  background: 'none',
  border: 'none',
  color: '#a0a0a0',
  fontSize: '0.95rem',
  cursor: 'pointer',
  textDecoration: 'none',
  transition: 'color 0.2s'
};

const iconStyle = {
  color: '#fff',
  transition: 'opacity 0.2s',
  opacity: 0.8
};
