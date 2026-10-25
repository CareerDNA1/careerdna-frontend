import React, { useEffect, useMemo, useRef } from 'react';
import { describeIntroAnswers } from '../Survey/IntroQuestions';
import { showSelectionTooltip, hideSelectionTooltip } from '../Survey/SelectionInsightExplorer';
import { isDeveloperProfile, canChangeInstitution, canChangeStatus, schoolYearValue } from '../../utils/academicStatus';
import './WhereYouAreCard.css';

// "Education" inside Manage account: the facts about the person, read-only.
//
// Nothing is edited here. Every change to where someone is (status, school
// or university, year of study) is made by generating a report from New
// report under Recent reports, so the account and the report can never
// disagree. Clicking a box says why and where it changes. Country and year
// group are set when the person joins and are changed by support only.

export const SUPPORT_EMAIL = 'support@mycareerdna.io';

// Which fields are greyed out in the New report form, the tooltip on each,
// and the note under a field that is open this year.
export function statusLocks(profile) {
  const developer = isDeveloperProfile(profile);
  // Developers: nothing locked, no yearly rules, so no notes at all.
  if (developer) return { lockedFields: [], lockedNotes: {}, fieldNotes: {} };
  const statusOk = developer || canChangeStatus(profile);
  const institutionOk = developer || canChangeInstitution(profile);
  // When the status may change, the fields that go with it must be open too
  // (school or university, year group, course year); country never is.
  // Students: institution once a year on its own; the rest only with a
  // status change from September. Developers: everything but country.
  const lockedFields = statusOk
    ? ['country']
    : ['country', 'status', 'schoolYear', 'courseYear', ...(institutionOk ? [] : ['institution'])];
  return {
    lockedFields: developer ? [] : lockedFields,
    lockedNotes: {
      country: `You set this when you joined. To change your country, email ${SUPPORT_EMAIL}.`,
      status: `You set this when you joined. If you move on, for example from school to university, you can update it from September with a new report. If something has changed before then, email ${SUPPORT_EMAIL}.`,
      schoolYear: `Set when you joined and moves up each September, so it will move up again next September. If it is wrong, email ${SUPPORT_EMAIL}.`,
      courseYear: `Worked out from your course start year and moves up each September. If it is wrong, email ${SUPPORT_EMAIL}.`,
      institution: `You have already changed this once this school year. To change it again, email ${SUPPORT_EMAIL}.`,
    },
    fieldNotes: {
      status: 'A new school year: you can update your status once now, for example from school to university. The report you generate will be for your new status.',
      institution: 'You can change this once within a school year. The report you generate will use the new one.',
    },
  };
}

export default function WhereYouAreCard({ profile }) {
  // Clicking a box shows the app's white floating tooltip above it, so
  // nothing in the grid moves (an inline note stretched the row).
  const hideTimer = useRef(null);
  useEffect(() => () => { clearTimeout(hideTimer.current); hideSelectionTooltip({ force: true }); }, []);
  const showNote = (target, text) => {
    if (!target || !text) return;
    target.setAttribute('data-tooltip-body', text);
    window.requestAnimationFrame(() => {
      showSelectionTooltip(target, { pinned: true });
      clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => hideSelectionTooltip({ force: true }), 6000);
    });
  };
  const developer = isDeveloperProfile(profile);
  const a = (profile && profile.academic_status) || {};
  const rows = useMemo(() => describeIntroAnswers(a, { schoolYear: schoolYearValue(a) }), [a]);
  const { lockedNotes } = useMemo(() => statusLocks(profile), [profile]);

  // What clicking each box says. Everything changes through New report.
  const viaReport = 'from New report under Recent reports. The account changes when the report is generated.';
  const devNote = 'Developer account: change this from New report under Recent reports, or set one of your reports as current to switch to its details.';
  const notes = developer
    ? {
        country: devNote,
        status: devNote,
        institution: devNote,
        schoolYear: devNote,
        courseYear: devNote,
        uniSubject: devNote,
      }
    : {
        country: lockedNotes.country,
        status: canChangeStatus(profile)
          ? `A new school year: you can update your status once now ${viaReport}`
          : lockedNotes.status,
        institution: canChangeInstitution(profile)
          ? `You can change this once within a school year ${viaReport}`
          : lockedNotes.institution,
        schoolYear: lockedNotes.schoolYear,
        courseYear: lockedNotes.courseYear,
        uniSubject: `Your subject changes with your status or university ${viaReport}`,
      };

  if (!profile) return null;

  return (
    <>
      <div className="wya-section__head">
        <h3 className="profile-account-section-title">Education</h3>
      </div>
      <div className="profile-account-card wya-card">
        {rows.length ? (
          <div className="wya-grid">
            {rows.map((r) => {
              const text = notes[r.key] || '';
              return (
                <div className="profile-account-field" key={r.key}>
                  <span>{r.label}</span>
                  <div
                    className="profile-account-input-wrap profile-account-input-wrap--readonly profile-account-input-wrap--locked wya-locked"
                    onClick={(e) => showNote(e.currentTarget, text)}
                  >
                    <input type="text" value={r.value || 'Not set'} readOnly onFocus={(e) => e.target.blur()} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="wya-card__empty">Not set yet.</p>
        )}
      </div>
    </>
  );
}
