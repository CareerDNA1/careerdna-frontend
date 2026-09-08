import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import './TeamPage.css';
import logo from '../Assets/images/logo-career-dna.png';
import georgePhoto from '../Assets/images/George-opt.jpg';
import danPhoto from '../Assets/images/Dan.jpg';
import naeemaPhoto from '../Assets/images/Naeema.jpg';
import giannisPhoto from '../Assets/images/Giannis.jpg';

const TEAM = [
  {
    photo: georgePhoto,
    alt: 'George Alexandridis',
    name: 'Prof George Alexandridis',
    role: 'Founder & CEO',
    bio: "George is a Professor and senior education leader with extensive experience in career development, employability and student success. He has led innovative work helping students better understand their strengths, motivations and future career direction, while developing programmes and initiatives focused on future-ready skills, self-awareness and career decision-making. His work has supported hundreds of young people in navigating study and career pathways in a rapidly changing world.",
  },
  {
    photo: danPhoto,
    alt: 'Dan Kiernan',
    name: 'Dan Kiernan',
    role: 'Head of Employability & Career Guidance',
    bio: "Dan is a careers expert and coach with extensive experience helping students and graduates turn self-awareness into confident, informed career decisions. Through his work at Oxford's Saïd Business School and several other leading universities, he has guided thousands of young people through the transition from education to meaningful work. This has given him deep, practical insight into what helps people find direction, clarity and purpose in their careers. A LinkedIn Top Voice for Jobs and Careers, author of a careers advice column for the Gen-Z publication Thred Media, and a TEDx speaker, he is one of the UK's most recognised voices on graduate employability and career transitions. At CareerDNA, he leads on employability, ensuring the platform's behavioural insights translate into real, actionable career guidance for young people.",
  },
  {
    photo: naeemaPhoto,
    alt: 'Dr Naeema Pasha',
    name: 'Dr Naeema Pasha',
    role: 'Future of Work Strategic Advisor',
    bio: "Dr Naeema Pasha is an internationally recognised expert on the future of work, employability and inclusive leadership. Her work focuses on how organisations, universities and young professionals can adapt to rapidly changing workforce expectations, emerging technologies and evolving career pathways. She has worked extensively across higher education, leadership development and workforce transformation, with particular expertise in Gen Z, diversity and the future skills agenda.",
  },
  {
    photo: giannisPhoto,
    alt: 'Dr Giannis Haralampopoulos',
    name: 'Dr Giannis Haralampopoulos',
    role: 'Technical Director & AI Lead',
    bio: "Giannis is an expert in machine learning, natural language processing and data science, with a strong focus on privacy-preserving and ethical AI. An Assistant Professor in Data Analytics, his research spans deep learning, NLP applications and human-centred AI systems, with published work in leading international journals and conferences. He has contributed to major funded research programmes across Europe, working in interdisciplinary environments that apply AI to complex real-world challenges. At CareerDNA, he leads the platform's technical development, overseeing the AI architecture, analytics framework and intelligent recommendation systems that translate behavioural data into personalised, meaningful career insights.",
  },
];

export default function TeamPage() {
  // Which card's bio is expanded on phone. Desktop/tablet ignore this (bio always shown).
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <main className="team-page">
      <header className="team-page-nav" aria-label="Team page navigation">
        <RouterLink to="/" className="team-page-logo-link" aria-label="Back to CareerDNA home">
          <img src={logo} alt="CareerDNA Logo" className="team-page-logo" />
        </RouterLink>

        <RouterLink to="/" className="team-page-home-link" aria-label="Back to CareerDNA home">
          <span aria-hidden="true" className="team-page-home-icon">⌂</span>
          <span>Back to home</span>
          <span aria-hidden="true" className="team-page-home-arrow">›</span>
        </RouterLink>
      </header>

      <section className="team-section" aria-labelledby="team-title">
        <div className="team-section__inner">
          <div className="team-heading">
            <h1 id="team-title">Meet our senior team</h1>
            <p>
              CareerDNA is developed by leading voices in education, learning, behaviour and career science, with a vision to help young people better understand themselves and make more confident choices about their future.
            </p>
            <div className="team-section-divider" />
          </div>

          <div className="team-grid">
            {TEAM.map((member, i) => {
              const isOpen = openIndex === i;
              const bioId = `team-bio-${i}`;
              return (
                <article
                  className={`team-member-card${isOpen ? ' is-open' : ''}`}
                  key={member.name}
                >
                  <div className="team-photo-frame">
                    <img src={member.photo} alt={member.alt} className="team-photo" />
                  </div>

                  <div className="team-member-copy">
                    <h2>{member.name}</h2>
                    <p className="team-role">{member.role}</p>

                    {/* Phone-only accordion trigger (hidden on tablet/desktop via CSS). */}
                    <button
                      type="button"
                      className="team-bio-toggle"
                      aria-expanded={isOpen}
                      aria-controls={bioId}
                      onClick={() => setOpenIndex(isOpen ? null : i)}
                    >
                      <span>{isOpen ? 'Hide bio' : 'Read bio'}</span>
                      <span className="team-bio-chevron" aria-hidden="true">⌄</span>
                    </button>

                    <p className="team-bio" id={bioId}>
                      {member.bio}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <footer className="team-footer" aria-label="CareerDNA footer">
        <div className="team-footer-inner">
          <p className="team-footer-tagline">
            Science-backed career discovery for students and early career explorers.
          </p>

          <nav className="team-footer-links" aria-label="Footer links">
            <a href="/legal#privacy">Privacy Policy</a>
            <span aria-hidden="true">·</span>
            <a href="/legal#terms">Terms of Use</a>
            <span aria-hidden="true">·</span>
            <a href="mailto:hello@mycareerdna.io">Contact</a>
            <span aria-hidden="true">·</span>
            <a href="#report-problem">Report a problem</a>
          </nav>

          <p className="team-footer-copy">
            © 2026 CareerDNA. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}
