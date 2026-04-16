// components/landing/ArchetypesSection.js

import React from 'react';
import './ArchetypesSection.css';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Slider from "react-slick";
import {
  FaCompass,
  FaClipboardList,
  FaRegLightbulb,
  FaTrophy,
  FaBrain,
  FaPaintBrush,
  FaHandshake
} from 'react-icons/fa';

const profiles = [
  {
    name: 'Explorer',
    icon: <FaCompass aria-hidden="true" />,
    title: 'The Explorer',
    description:
      'Curious and adventurous. Explorers love discovering new ideas, places and experiences. They thrive in fast-changing environments and are motivated by learning and growth.',
  },
  {
    name: 'Organizer',
    icon: <FaClipboardList aria-hidden="true" />,
    title: 'The Organizer',
    description:
      'Reliable and methodical. Organizers enjoy bringing order to complexity, creating systems, and keeping projects on track. They take pride in clarity, precision and consistency.',
  },
  {
    name: 'Visionary',
    icon: <FaRegLightbulb aria-hidden="true" />,
    title: 'The Visionary',
    description:
      'Bold and future-focused. Visionaries see possibilities that others miss and enjoy inspiring people with big ideas. They’re motivated by purpose and long-term impact.',
  },
  {
    name: 'Achiever',
    icon: <FaTrophy aria-hidden="true" />,
    title: 'The Achiever',
    description:
      'Driven and determined. Achievers set high goals, work hard to reach them, and enjoy celebrating results. They bring focus, energy and persistence to everything they do.',
  },
  {
    name: 'Thinker',
    icon: <FaBrain aria-hidden="true" />,
    title: 'The Thinker',
    description:
      'Analytical and reflective. Thinkers love tackling complex problems, spotting patterns, and working through big questions. They’re motivated by understanding and insight.',
  },
  {
    name: 'Creator',
    icon: <FaPaintBrush aria-hidden="true" />,
    title: 'The Creator',
    description:
      'Imaginative and expressive. Creators enjoy bringing new ideas, designs or stories to life. They thrive when they can innovate, experiment and put a personal stamp on their work.',
  },
  {
    name: 'Connector',
    icon: <FaHandshake aria-hidden="true" />,
    title: 'The Connector',
    description:
      'Friendly and collaborative. Connectors are motivated by relationships and thrive when they’re working with and for others. They bring people together and create a sense of belonging.',
  },
];

const sliderSettings = {
  dots: false,
  infinite: true,
  speed: 500,
  slidesToShow: 2,
  slidesToScroll: 1,
  arrows: true,
  swipe: true,
  draggable: true,
  autoplay: true,
  autoplaySpeed: 6000,
  pauseOnHover: true,
  centerMode: true,
  centerPadding: '20px',
  variableWidth: true,
  responsive: [
    {
      breakpoint: 768,
      settings: {
        slidesToShow: 1,
        centerMode: true,
        variableWidth: false,
        centerPadding: '0px',
        arrows: false,
      },
    },
  ],
};

export default function ArchetypesSection() {
  return (
    <section id="archetypes" className="archetypes-section section">
      <div className="section-inner">
        <h2>Your Career Profiles</h2>
        <p className="intro-text">
          CareerDNA introduces a breakthrough approach: seven career profiles that, together, explain how
          people think, grow and achieve. Everyone carries a unique blend and seeing yours offers a new
          level of clarity about the paths where you can succeed and flourish.
        </p>

        <Slider {...sliderSettings} className="archetype-slider">
          {profiles.map(({ name, icon, title, description }) => (
            <div key={name}>
              <div className="archetype-card">
                <h3>
                  <span className="icon">{icon}</span>
                  <span className="title-text">{title}</span>
                </h3>
                <p>{description}</p>
              </div>
            </div>
          ))}
        </Slider>
      </div>
    </section>
  );
}
