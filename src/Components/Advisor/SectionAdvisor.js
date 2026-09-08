import React, { useEffect, useMemo, useRef, useState } from 'react';
import { renderSafeMarkdown } from '../../utils/renderSafeMarkdown';
import { PaperPlaneTilt, Sparkle } from 'phosphor-react';
import { BrainCircuit } from 'lucide-react';
import ReportLimitModal from '../Common/ReportLimitModal';
import { applyCouponCode } from '../../utils/applyCoupon';
import { loadAdvisorConversation, sendAdvisorMessage } from '../../utils/careerAdvisor';
import './SectionAdvisor.css';

function normalize(value = '') {
  return String(value || '').trim().replace(/\s+/g, ' ').toLowerCase();
}

function renderPlainText(content = '') {
  const text = String(content || '');
  const lines = text.split('\n');
  return lines.map((line, i) => (
    <React.Fragment key={`${i}-${line.slice(0, 10)}`}>
      {line}
      {i < lines.length - 1 ? <br /> : null}
    </React.Fragment>
  ));
}

// Compact, in-context advisor panel shown at the bottom of a results section
// (Strengths, Environments, Career Worlds, Pathways, Roles). It shares one brain
// and one credit pool with the full Advisor tab (same conversation), but only
// shows the questions asked from THIS section, tagged server-side by `section`.
export default function SectionAdvisor({
  assessmentRunId,
  section,
  title = 'your results',
  suggestedQuestions = [],
}) {
  const [conversationId, setConversationId] = useState('');
  const [messages, setMessages] = useState([]); // this section's messages only
  const [entitlement, setEntitlement] = useState(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showLimitModal, setShowLimitModal] = useState(false);
  // The answer thread is collapsed by default so a long conversation (or one
  // reloaded from a previous visit) does not stretch the page. It opens when the
  // student asks something, or via the toggle.
  const [threadOpen, setThreadOpen] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!assessmentRunId) { setLoading(false); return; }
      try {
        setLoading(true);
        const data = await loadAdvisorConversation({ assessmentRunId });
        if (cancelled) return;
        setConversationId(data?.conversation?.id || '');
        if (data?.entitlement) setEntitlement(data.entitlement);
        // One unified conversation shown on every section (the section only
        // drives the heading and the suggested questions, not what's displayed).
        const all = Array.isArray(data?.messages) ? data.messages : [];
        setMessages(all);
      } catch (err) {
        if (!cancelled) setErrorMsg(err.message || 'Could not load the advisor.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [assessmentRunId, section]);

  useEffect(() => {
    if (sending) bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, sending]);

  const advisorUnlimited = Boolean(entitlement?.advisorUnlimited);
  const advisorRemaining = Number(entitlement?.advisorQuestionsRemaining || 0);
  const hasRemaining = advisorUnlimited || advisorRemaining > 0;

  const askedKeys = useMemo(
    () => new Set(messages.filter((m) => m.role === 'user').map((m) => normalize(m.content))),
    [messages]
  );
  const visibleSuggestions = useMemo(
    () => (Array.isArray(suggestedQuestions) ? suggestedQuestions : [])
      .filter((q) => q && !askedKeys.has(normalize(q)))
      .slice(0, messages.length ? 2 : 4),
    [suggestedQuestions, askedKeys, messages.length]
  );

  const handleSend = async (textOverride = '') => {
    const text = String(textOverride || input || '').trim();
    if (sending) return;
    if (!hasRemaining) { setShowLimitModal(true); return; }
    if (!text) return;

    const optimistic = { id: `local-${Date.now()}`, role: 'user', content: text, section };
    try {
      setSending(true);
      setThreadOpen(true);
      setErrorMsg('');
      setInput('');
      setMessages((prev) => [...prev, optimistic]);
      const data = await sendAdvisorMessage({ assessmentRunId, conversationId, message: text, section });
      if (data?.conversation?.id) setConversationId(data.conversation.id);
      if (data?.entitlement) setEntitlement(data.entitlement);
      const returned = Array.isArray(data?.messages) ? data.messages : [];
      setMessages((prev) => [...prev.filter((m) => m.id !== optimistic.id), ...returned]);
    } catch (err) {
      const isLimit = err?.code === 'ADVISOR_LIMIT_REACHED' || /AI Advisor questions/i.test(err?.message || '');
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      if (err?.entitlement) setEntitlement(err.entitlement);
      if (isLimit) { setShowLimitModal(true); setInput(text); }
      else { setErrorMsg(err.message || 'Could not send your question.'); setInput(text); }
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleApplyCoupon = async (code) => {
    await applyCouponCode(code);
    setShowLimitModal(false);
    setErrorMsg('');
  };

  if (!assessmentRunId) return null;

  return (
    <section className="section-advisor" aria-label={`Ask about ${title}`}>
      {showLimitModal && (
        <ReportLimitModal
          onClose={() => setShowLimitModal(false)}
          onReturnToProfile={() => { window.location.href = '/profile'; }}
          onApplyCoupon={handleApplyCoupon}
        />
      )}

      <div className="section-advisor__head">
        <span className="section-advisor__icon" aria-hidden="true"><Sparkle size={18} weight="fill" /></span>
        <span className="section-advisor__title">Ask about {title}</span>
      </div>
      <p className="section-advisor__intro">Your adviser knows your full CareerDNA. Pick a question or ask your own.</p>

      {messages.length ? (
        <button
          type="button"
          className="section-advisor__toggle"
          onClick={() => setThreadOpen((o) => !o)}
          aria-expanded={threadOpen}
        >
          {threadOpen
            ? 'Hide answers'
            : `Show your ${messages.filter((m) => m.role === 'user').length} previous question${messages.filter((m) => m.role === 'user').length === 1 ? '' : 's'}`}
        </button>
      ) : null}
      {threadOpen && messages.length ? (
        <div className="section-advisor__thread">
          {messages.map((m) => (
            <div key={m.id || `${m.role}-${m.content?.slice(0, 10)}`} className={`section-advisor__msg section-advisor__msg--${m.role}`}>
              {m.role === 'assistant' ? (
                <>
                  <span className="section-advisor__msg-label">
                    <span className="section-advisor__avatar" aria-hidden="true"><BrainCircuit /></span>
                    CareerDNA AI Advisor
                  </span>
                  <div className="section-advisor__msg-body section-advisor__markdown" dangerouslySetInnerHTML={renderSafeMarkdown(m.content)} />
                </>
              ) : (
                <div className="section-advisor__msg-body">{renderPlainText(m.content)}</div>
              )}
            </div>
          ))}
          {sending ? (
            <div className="section-advisor__msg section-advisor__msg--assistant">
              <span className="section-advisor__msg-label">
                <span className="section-advisor__avatar" aria-hidden="true"><BrainCircuit /></span>
                CareerDNA AI Advisor
              </span>
              <div className="section-advisor__msg-body muted">Thinking…</div>
            </div>
          ) : null}
          <div ref={bottomRef} />
        </div>
      ) : null}

      {loading ? (
        <div className="section-advisor__loading">Loading…</div>
      ) : (
        <>
          {visibleSuggestions.length ? (
            <div className="section-advisor__chips" aria-label="Suggested questions">
              {visibleSuggestions.map((q) => (
                <button key={q} type="button" className="section-advisor__chip" onClick={() => handleSend(q)} disabled={sending}>
                  {q}
                </button>
              ))}
            </div>
          ) : null}

          <div className="section-advisor__input-row">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={sending ? 'Thinking…' : 'Ask a question…'}
              disabled={sending}
              rows={1}
            />
            <button
              type="button"
              className="section-advisor__send"
              onClick={() => handleSend()}
              disabled={sending}
              aria-label={hasRemaining ? 'Send message' : 'Get more AI Advisor questions'}
            >
              <PaperPlaneTilt size={16} weight="fill" aria-hidden="true" />
            </button>
          </div>

          {errorMsg ? <div className="section-advisor__error">{errorMsg}</div> : null}

          {entitlement ? (
            <div className="section-advisor__credits">
              {advisorUnlimited
                ? 'Unlimited AI Advisor questions'
                : `${Math.max(0, advisorRemaining)} AI Advisor question${Math.max(0, advisorRemaining) === 1 ? '' : 's'} remaining`}
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
