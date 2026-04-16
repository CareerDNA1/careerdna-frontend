import React from 'react';
import Button from '../Common/Button';
import instructionsGraphic from '../../Assets/images/instructions_graphic.png';
import './Instructions.css';

export default function Instructions({ onStart }) {
  return (
    <main className="instp">
      <div className="instp-container">
        {/* LEFT: Content card */}
        <section className="card content-card" aria-labelledby="instp-title">
          <h1 id="instp-title">Before You Begin…</h1>

          <ul className="instp-list">
            <li>
              <span className="i">🧬</span>
              <span>
                This survey is designed to help you discover your unique <strong>Career DNA</strong>.
              </span>
            </li>

            <li>
              <span className="i">⏱️</span>
              <span>
                There are <strong>96 short questions</strong> (1–5 or binary choices). Most people
                finish in <strong>20–25 mins</strong> in one sitting and your progress
                <strong> auto-saves</strong> as you go.
              </span>
            </li>

            <li>
              <span className="i">🧘‍♂️</span>
              <span>
                <strong>Quiet space:</strong> switch on <em>Do Not Disturb</em>, mute notifications,
                and use headphones if it’s noisy. Full-screen your browser to stay focused.
              </span>
            </li>

            <li>
              <span className="i">💭</span>
              <span>
                Answer <strong>honestly and instinctively</strong>. Go with your first reaction rather
                than overthinking. But it's fine to pause and think of situations.
              </span>
            </li>

            <li>
              <span className="i">⚖️</span>
              <span>
                Choosing the <strong>middle option</strong> (option 3) is fine if you're unsure, but the ends of the scale (1 or 5) signal a stronger view.
              </span>
            </li>

            
          </ul>
        </section>

        {/* RIGHT: Blue image panel with button INSIDE */}
        <aside className="image-panel" aria-label="Start survey">
          <img src={instructionsGraphic} alt="" loading="eager" decoding="async" />
          <Button type="primary" className="panel-cta" onClick={onStart}>
            Start CareerDNA Survey
          </Button>
        </aside>
      </div>
    </main>
  );
}
