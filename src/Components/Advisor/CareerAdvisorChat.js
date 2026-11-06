import React, { useEffect, useMemo, useRef, useState } from 'react';
import { renderSafeMarkdown } from '../../utils/renderSafeMarkdown';
import { highlightAdvisorTerms } from '../../utils/advisorTerms';
import { PaperPlaneRight } from 'phosphor-react';
import AdvisorAvatar from './AdvisorAvatar';
import './CareerAdvisorChat.css';
import ReportLimitModal from '../Common/ReportLimitModal';
import { applyCouponCode } from '../../utils/applyCoupon';
import { loadAdvisorConversation, sendAdvisorMessage } from '../../utils/careerAdvisor';
import { clearAdvisorPrefill } from '../../utils/advisorPanel';
import InlineError from '../Common/InlineError';
import { friendlyError } from '../../utils/friendlyError';

const FALLBACK_STARTER_PROMPTS = [
  'How did you decide which career worlds are better matches for me?',
  'What A-levels or subject choices would fit my profile best?',
  'How can I use this profile in a university application?',
  'What type of skills do I need to develop for the top recommended career roles?',
];

function normalizePromptText(value = '') {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function deriveUsedStarterPrompts(messages = [], prompts = []) {
  const promptMap = new Map(
    (Array.isArray(prompts) ? prompts : [])
      .map((prompt) => normalizePromptText(prompt))
      .filter(Boolean)
      .map((prompt) => [prompt.toLowerCase(), prompt])
  );

  if (!promptMap.size) return [];

  const used = [];
  const seen = new Set();
  for (const message of Array.isArray(messages) ? messages : []) {
    if (String(message?.role || '').toLowerCase() !== 'user') continue;
    const key = normalizePromptText(message?.content).toLowerCase();
    if (!key || !promptMap.has(key) || seen.has(key)) continue;
    seen.add(key);
    used.push(promptMap.get(key));
  }
  return used;
}

function AdvisorAiIcon() {
  return <AdvisorAvatar />;
}


function renderPlainText(content = '') {
  const text = String(content || '');
  return text.split('\n').map((line, index) => (
    <React.Fragment key={`${index}-${line.slice(0, 12)}`}>
      {line}
      {index < text.split('\n').length - 1 ? <br /> : null}
    </React.Fragment>
  ));
}

// variant: 'page' (full) or 'drawer' (compact, inside Your Advisor drawer).
// context: { section, title, questions } for what the student is looking at;
// its questions lead the suggestions and tag the messages sent from there.
// prefill / prefillSend: a question handed over by an "Ask your advisor" button.
export default function CareerAdvisorChat({ assessmentRunId, embedded = false, variant = 'page', context = null, generalQuestions = null, prefill = '', prefillSend = false, active = true }) {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [starterPrompts, setStarterPrompts] = useState(FALLBACK_STARTER_PROMPTS);
  const [usedStarterPrompts, setUsedStarterPrompts] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  // Earlier conversation could not be fetched (the advisor still works).
  const [loadError, setLoadError] = useState('');
  const [reloadTick, setReloadTick] = useState(0);
  const [entitlement, setEntitlement] = useState(null);
  const [limitReached, setLimitReached] = useState(false);
  const [showTopUp, setShowTopUp] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const messagesRef = useRef(null);
  const latestAssistantRef = useRef(null);
  const bottomRef = useRef(null);
  const shouldScrollAfterSendRef = useRef(false);
  const textareaRef = useRef(null);
  const handleSendRef = useRef(null);

  // Messages are shown newest-last and the chat opens at the bottom. Only the
  // most recent PAGE_SIZE are rendered at first; scrolling to the top reveals
  // the earlier ones a page at a time, keeping the scroll position in place.
  const PAGE_SIZE = 10;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loadingEarlier, setLoadingEarlier] = useState(false);
  const didInitialScrollRef = useRef(false);

  const hasMessages = messages.length > 0;
  const isDrawer = variant === 'drawer';
  const section = context?.section || '';

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!assessmentRunId) return;
      try {
        setLoading(true);
        setErrorMsg('');
        setLoadError('');
        const data = await loadAdvisorConversation({ assessmentRunId });
        if (cancelled) return;
        const loadedMessages = Array.isArray(data?.messages) ? data.messages : [];
        const loadedStarterPrompts = Array.isArray(data?.starterPrompts) && data.starterPrompts.length ? data.starterPrompts : FALLBACK_STARTER_PROMPTS;
        setConversation(data?.conversation || null);
        setMessages(loadedMessages);
        if (data?.entitlement) setEntitlement(data.entitlement);
        setLimitReached(false);
        setStarterPrompts(loadedStarterPrompts);
        setUsedStarterPrompts(deriveUsedStarterPrompts(loadedMessages, loadedStarterPrompts));
      } catch (err) {
        // A failed history load must not block the advisor: fall back to the
        // starter questions so it is still usable, and show a small, calm note
        // with a retry so the earlier conversation can be fetched again.
        if (!cancelled) {
          setStarterPrompts(FALLBACK_STARTER_PROMPTS);
          setUsedStarterPrompts(deriveUsedStarterPrompts([], FALLBACK_STARTER_PROMPTS));
          const friendly = friendlyError(err, 'load your earlier conversation');
          setLoadError(friendly.kind === 'user'
            ? 'We could not load your earlier advisor conversation. You can still ask a question.'
            : friendly.message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [assessmentRunId, reloadTick]);

  // A question handed over from a section button: send it, or place it in the
  // box, once the conversation has loaded.
  useEffect(() => {
    if (loading || !prefill) return;
    if (prefillSend) {
      clearAdvisorPrefill();
      if (handleSendRef.current) handleSendRef.current(prefill);
    } else {
      setInput(prefill);
      clearAdvisorPrefill();
      textareaRef.current?.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, prefill, prefillSend]);

  // Closing the drawer throws away an unsent question, so the box is empty
  // the next time it opens (a question handed over by a section button is
  // placed after this, when the drawer opens again).
  useEffect(() => {
    if (!active) { setInput(''); setErrorMsg(''); }
  }, [active]);

  // Scroll inside the message list only (never the page behind it).
  const scrollList = (top, smooth) => {
    const el = messagesRef.current;
    if (!el) return;
    if (smooth && typeof el.scrollTo === 'function') el.scrollTo({ top, behavior: 'smooth' });
    else el.scrollTop = top;
  };

  // Land at the bottom once the history is in; then follow new messages.
  useEffect(() => {
    const el = messagesRef.current;
    if (!el || loading) return;
    if (!didInitialScrollRef.current) {
      didInitialScrollRef.current = true;
      setVisibleCount(PAGE_SIZE);
      requestAnimationFrame(() => scrollList(el.scrollHeight, false));
      return;
    }
    // Position of a message's top edge within the scrolling list.
    const topOf = (node) => node.getBoundingClientRect().top - el.getBoundingClientRect().top + el.scrollTop - 6;
    if (sending) {
      // Put the question at the top so the answer appears right under it.
      const users = el.querySelectorAll('.career-advisor-message.user');
      const lastUser = users[users.length - 1];
      scrollList(lastUser ? Math.max(0, topOf(lastUser)) : el.scrollHeight, true);
      return;
    }
    if (shouldScrollAfterSendRef.current && latestAssistantRef.current) {
      // Land at the top of the advisor's answer, not the bottom of it.
      scrollList(Math.max(0, topOf(latestAssistantRef.current)), true);
      shouldScrollAfterSendRef.current = false;
    }
  }, [messages, sending, loading]);

  // Reveal the previous page when the student scrolls to the top, keeping
  // what they are reading where it is.
  const handleMessagesScroll = () => {
    const el = messagesRef.current;
    if (!el || loadingEarlier || visibleCount >= messages.length) return;
    if (el.scrollTop > 24) return;
    setLoadingEarlier(true);
    const prevHeight = el.scrollHeight;
    const prevTop = el.scrollTop;
    setTimeout(() => {
      setVisibleCount((n) => Math.min(messages.length, n + PAGE_SIZE));
      requestAnimationFrame(() => {
        const node = messagesRef.current;
        if (node) node.scrollTop = node.scrollHeight - prevHeight + prevTop;
        setLoadingEarlier(false);
      });
    }, 350);
  };

  // Suggestion row: which card is in view (dots), whether there is more to
  // either side (arrow buttons), mouse drag-to-scroll, and the "fly into the
  // box" effect when a card is chosen.
  const suggRowRef = useRef(null);
  const [suggIdx, setSuggIdx] = useState(0);
  const [suggEdges, setSuggEdges] = useState({ left: false, right: false });
  const suggDragRef = useRef({ down: false, x: 0, start: 0, moved: false });
  const suggFlyingRef = useRef(false);
  const onSuggScroll = () => {
    const row = suggRowRef.current;
    if (!row || !row.children.length) return;
    const first = row.children[0].offsetLeft;
    let best = 0; let dist = Infinity;
    Array.from(row.children).forEach((el, i) => {
      const d = Math.abs(el.offsetLeft - first - row.scrollLeft);
      if (d < dist) { dist = d; best = i; }
    });
    const left = row.scrollLeft > 4;
    const right = row.scrollLeft + row.clientWidth < row.scrollWidth - 4;
    // At the far end the last card can never reach the left edge (two show
    // at once), so light the last dot there instead of the one before it.
    if (!right && left) best = row.children.length - 1;
    setSuggIdx(best);
    setSuggEdges((prev) => (prev.left === left && prev.right === right ? prev : { left, right }));
  };
  const suggStep = (dir) => {
    const row = suggRowRef.current;
    if (!row || !row.children.length) return;
    const card = row.children[0].getBoundingClientRect().width + 8;
    row.scrollBy({ left: dir * card, behavior: 'smooth' });
  };
  // Mouse: press and drag sideways scrolls the row; a drag never counts as a
  // click. Touch screens scroll natively and do not fire a click after a swipe.
  const onSuggPointerDown = (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    const row = suggRowRef.current;
    if (!row) return;
    suggDragRef.current = { down: true, x: e.clientX, start: row.scrollLeft, moved: false };
    const move = (ev) => {
      const d = suggDragRef.current;
      if (!d.down) return;
      const dx = ev.clientX - d.x;
      if (!d.moved && Math.abs(dx) > 6) { d.moved = true; row.classList.add('is-dragging'); }
      if (d.moved) row.scrollLeft = d.start - dx;
    };
    const up = () => {
      suggDragRef.current.down = false;
      row.classList.remove('is-dragging');
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      // Settle on the nearest card once the drag ends.
      if (suggDragRef.current.moved) {
        const first = row.children[0]?.offsetLeft || 0;
        const near = Array.from(row.children).reduce((b, el) => (Math.abs(el.offsetLeft - first - row.scrollLeft) < Math.abs(b.offsetLeft - first - row.scrollLeft) ? el : b), row.children[0]);
        if (near) row.scrollTo({ left: near.offsetLeft - first, behavior: 'smooth' });
        // The click that follows this release is ignored, then clicks work again.
        window.setTimeout(() => { suggDragRef.current.moved = false; }, 0);
      }
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  // Choosing a card: a copy of it glides down into the message box and the
  // question is placed there, ready to edit. Nothing is sent until the
  // student presses Send, so a stray tap never uses up a question.
  const placeSuggestion = (prompt) => {
    setInput(prompt);
    const box = textareaRef.current;
    if (box) {
      window.requestAnimationFrame(() => {
        box.focus();
        const end = prompt.length;
        try { box.setSelectionRange(end, end); } catch (_) { /* ignore */ }
      });
    }
  };
  const chooseSuggestion = (prompt, el) => {
    if (suggDragRef.current.moved) return;
    if (sending || suggFlyingRef.current) return;
    const box = textareaRef.current;
    const reduce = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!el || !box || reduce) { placeSuggestion(prompt); return; }
    suggFlyingRef.current = true;
    const from = el.getBoundingClientRect();
    const to = box.getBoundingClientRect();
    const ghost = document.createElement('div');
    ghost.className = 'cdna-sugg__ghost';
    ghost.textContent = prompt;
    Object.assign(ghost.style, { left: `${from.left}px`, top: `${from.top}px`, width: `${from.width}px` });
    document.body.appendChild(ghost);
    // Next frame: move it onto the message box.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      ghost.style.transform = `translate(${to.left + 12 - from.left}px, ${to.top + (to.height - from.height) / 2 - from.top}px)`;
      ghost.style.width = `${Math.max(120, to.width - 24)}px`;
      ghost.classList.add('is-landing');
    }));
    window.setTimeout(() => {
      ghost.remove();
      suggFlyingRef.current = false;
      placeSuggestion(prompt);
    }, 430);
  };
  useEffect(() => {
    const t = window.setTimeout(onSuggScroll, 60);
    return () => window.clearTimeout(t);
  });
  // The message box grows with its text (up to its CSS max-height, then it
  // scrolls), so a placed suggestion is readable in full before sending.
  // Set as an important inline style because some stylesheet rules pin the
  // height with !important.
  useEffect(() => {
    const box = textareaRef.current;
    if (!box) return;
    box.style.removeProperty('height');
    if (!input) return;
    const min = parseFloat(window.getComputedStyle(box).minHeight) || 0;
    const next = Math.max(min, box.scrollHeight + 2);
    box.style.setProperty('height', `${next}px`, 'important');
  }, [input]);

  const placeholder = useMemo(() => {
    if (sending) return 'Thinking…';
    return 'Ask me anything';
  }, [sending, context?.title]);

  const markStarterPromptUsed = (prompt = '') => {
    const cleanPrompt = String(prompt || '').trim();
    if (!cleanPrompt) return;
    setUsedStarterPrompts((prev) => (prev.includes(cleanPrompt) ? prev : [...prev, cleanPrompt]));
  };

  const handleSend = async (textOverride = '') => {
    const text = String(textOverride || input || '').trim();
    if (sending) return;

    if (limitReached || !hasAdvisorRemaining) {
      setShowLimitModal(true);
      return;
    }

    if (!text) return;

    if (textOverride) markStarterPromptUsed(text);
    shouldScrollAfterSendRef.current = true;

    const optimisticUserMessage = {
      id: `local-user-${Date.now()}`,
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };

    try {
      setSending(true);
      setErrorMsg('');
      setInput('');
      setMessages((prev) => [...prev, optimisticUserMessage]);
      setVisibleCount((n) => n + 2);

      const data = await sendAdvisorMessage({
        assessmentRunId,
        conversationId: conversation?.id || '',
        message: text,
        section: section || undefined,
      });

      const returnedMessages = Array.isArray(data?.messages) ? data.messages : [];
      setConversation(data?.conversation || conversation || null);
      if (data?.entitlement) {
        setEntitlement(data.entitlement);
        const remaining = Number(data.entitlement?.advisorQuestionsRemaining ?? 0);
        setLimitReached(!data.entitlement?.advisorUnlimited && remaining <= 0);
      }
      if (Array.isArray(data?.starterPrompts) && data.starterPrompts.length) {
        setStarterPrompts(data.starterPrompts);
        setUsedStarterPrompts((prev) => {
          const derived = deriveUsedStarterPrompts(returnedMessages, data.starterPrompts);
          return Array.from(new Set([...prev, ...derived]));
        });
      }
      setMessages((prev) => {
        const withoutOptimistic = prev.filter((msg) => msg.id !== optimisticUserMessage.id);
        // A safeguarding reply carries the helpline card with it.
        const withCard = data?.safeguarding
          ? returnedMessages.map((m) => (m.role === 'assistant' ? { ...m, safeguarding: data.safeguarding } : m))
          : returnedMessages;
        return [...withoutOptimistic, ...withCard];
      });
    } catch (err) {
      const isAdvisorLimit = err?.code === 'ADVISOR_LIMIT_REACHED' || err?.error === 'ADVISOR_LIMIT_REACHED' || /advisor questions/i.test(err?.message || '');
      if (err?.entitlement) setEntitlement(err.entitlement);
      if (isAdvisorLimit) {
        setLimitReached(true);
        setShowLimitModal(true);
        setErrorMsg('');
        setInput(text);
      } else {
        setErrorMsg(friendlyError(err, 'send your question').message);
        setInput(text);
      }
      setMessages((prev) => prev.filter((msg) => msg.id !== optimisticUserMessage.id));
    } finally {
      setSending(false);
    }
  };

  handleSendRef.current = handleSend;

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const handleApplyCoupon = async (code) => {
    await applyCouponCode(code);
    setShowLimitModal(false);
    setLimitReached(false);
    setErrorMsg('');
  };

  const usedStarterPromptKeys = useMemo(
    () => new Set(usedStarterPrompts.map((prompt) => normalizePromptText(prompt).toLowerCase())),
    [usedStarterPrompts]
  );

  const advisorUnlimited = Boolean(entitlement?.advisorUnlimited);
  const advisorRemaining = entitlement?.advisorQuestionsRemaining;
  const hasAdvisorRemaining = advisorUnlimited || Number(advisorRemaining || 0) > 0;
  const askedKeys = useMemo(
    () => new Set(messages.filter((m) => m.role === 'user').map((m) => normalizePromptText(m.content).toLowerCase())),
    [messages]
  );
  const notAsked = (q) => q && !askedKeys.has(normalizePromptText(q).toLowerCase());
  // 1) Follow-ups: the questions the advisor suggested at the end of its last
  // answer. They lead whenever the latest message is an advisor answer (not
  // a safeguarding reply) and some are still unasked.
  const lastMessage = messages.length ? messages[messages.length - 1] : null;
  const followUpPrompts = (!sending && lastMessage && lastMessage.role === 'assistant' && !lastMessage.flagged && !lastMessage.safeguarding
    && Array.isArray(lastMessage.followUps) ? lastMessage.followUps : []).filter(notAsked);
  // 2) Starters: the questions for the tab the student is on, then the general
  // pool for their stage. The pool is rotated by how many questions they have
  // asked, so it moves on even when they type their own questions.
  const contextPrompts = (Array.isArray(context?.questions) ? context.questions : []).filter(notAsked);
  const generalPool = (Array.isArray(generalQuestions) && generalQuestions.length ? generalQuestions : starterPrompts)
    .filter((prompt) => notAsked(prompt) && !usedStarterPromptKeys.has(normalizePromptText(prompt).toLowerCase()));
  const askedCount = askedKeys.size;
  const rotateBy = generalPool.length ? (askedCount * 2) % generalPool.length : 0;
  const generalPrompts = [...generalPool.slice(rotateBy), ...generalPool.slice(0, rotateBy)];
  const promptLimit = isDrawer ? 4 : 5; // one swipeable row, so a few more fit
  const showingFollowUps = followUpPrompts.length > 0;
  const visiblePrompts = showingFollowUps
    ? followUpPrompts.slice(0, 3)
    : [...contextPrompts, ...generalPrompts.filter((p) => !contextPrompts.includes(p))].slice(0, promptLimit);
  const disableAdvisorInput = sending;
  const sendTooltip = sending
    ? 'Your advisor is thinking'
    : limitReached || !hasAdvisorRemaining
      ? 'Get more advisor questions'
      : 'Send message';
  const disableSendButton = sending;

  return (
    <section className={`career-advisor-shell ${embedded ? 'is-embedded' : ''} ${isDrawer ? 'is-drawer' : ''}`} aria-label="Your Advisor">
      {showTopUp && (
        <ReportLimitModal
          mode="advisor"
          intent="buy"
          currentPlan={entitlement?.plan || 'free'}
          entitlement={entitlement}
          onClose={() => setShowTopUp(false)}
          onApplyCoupon={handleApplyCoupon}
        />
      )}
      {showLimitModal && (
        <ReportLimitModal
          mode="advisor"
          currentPlan={entitlement?.plan || 'free'}
          entitlement={entitlement}
          onClose={() => setShowLimitModal(false)}
          onReturnToProfile={() => { window.location.href = '/profile'; }}
          onApplyCoupon={handleApplyCoupon}
        />
      )}
      <div className="career-advisor-header">
        <div className="career-advisor-title-row">
          <span className="career-advisor-avatar career-advisor-avatar--title" aria-hidden="true">
            <AdvisorAiIcon />
          </span>
          <h2>Your Advisor</h2>
        </div>
        <p>
          Explore why certain options were recommended, compare alternatives, plan next steps, or turn your profile into language you can use with parents, applications, or interviews.
        </p>
      </div>

      <div className="career-advisor-panel">
        {loading ? (
          <div className="career-advisor-loading" role="status" aria-label="Loading advisor chat">
            <span className="cdna-load-spinner" aria-hidden="true" />
            <span>Loading advisor chat&hellip;</span>
          </div>
        ) : (
          <>
            <div ref={messagesRef} className={`career-advisor-messages ${!hasMessages ? 'is-empty' : ''}`} onScroll={handleMessagesScroll}>
              {hasMessages && visibleCount < messages.length ? (
                <div className={`career-advisor-earlier${loadingEarlier ? ' is-loading' : ''}`} role="status">
                  {loadingEarlier ? <><span className="cdna-load-spinner" aria-hidden="true" /><span>Loading earlier messages…</span></> : <span>Scroll up for earlier messages</span>}
                </div>
              ) : null}
              {!hasMessages ? null : (
                messages.slice(Math.max(0, messages.length - visibleCount)).map((message, index, shown) => {
                  const isLatestAssistant = message.role === 'assistant' && !shown.slice(index + 1).some((nextMessage) => nextMessage.role === 'assistant');
                  // The conversation follows the student across re-runs. Where
                  // the run changes between two messages, mark it so an older
                  // answer is read against the results it was given for.
                  const prev = index > 0 ? shown[index - 1] : null;
                  const prevRun = prev?.assessmentRunId || null;
                  const runChanged = Boolean(prevRun && message.assessmentRunId && prevRun !== message.assessmentRunId);
                  // A new assessment, or a move between school and university,
                  // also resets what the advisor remembers (backend), so say so.
                  const contextChanged = Boolean(runChanged && prev?.contextKey && message.contextKey && prev.contextKey !== message.contextKey);
                  let dividerText = 'Your results were updated here';
                  if (contextChanged) {
                    if (prev.stage && message.stage && prev.stage !== message.stage && (message.stage === 'school' || message.stage === 'university')) {
                      dividerText = `You moved to ${message.stage === 'university' ? 'university' : 'school'}. Your advisor is now using your new results.`;
                    } else {
                      const when = message.assessmentDate ? new Date(message.assessmentDate) : null;
                      const label = when && !Number.isNaN(when.getTime()) ? when.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
                      dividerText = `New assessment${label ? ` on ${label}` : ''}. Your advisor is now using your new results.`;
                    }
                  }

                  return (
                  <React.Fragment key={message.id || `${message.role}-${message.createdAt}-${message.content?.slice(0, 12)}`}>
                  {runChanged ? (
                    <div className="career-advisor-run-divider" role="separator" aria-label={dividerText}>
                      <span>{dividerText}</span>
                    </div>
                  ) : null}
                  <div
                    className={`career-advisor-message ${message.role === 'assistant' ? 'assistant' : 'user'}`}
                    ref={isLatestAssistant ? latestAssistantRef : null}
                  >
                    <div className="career-advisor-message-label">
                      {message.role === 'assistant' ? (
                        <>
                          <span className="career-advisor-avatar" aria-hidden="true">
                            <AdvisorAiIcon />
                          </span>
                          <span>Your Advisor</span>
                        </>
                      ) : 'You'}
                    </div>
                    {message.role === 'assistant' ? (
                      <>
                        <div
                          className="career-advisor-message-content career-advisor-markdown"
                          dangerouslySetInnerHTML={{ __html: highlightAdvisorTerms(renderSafeMarkdown(message.content).__html) }}
                        />
                        {message.safeguarding ? (
                          <div className="career-advisor-helplines" role="note" aria-label="Where to get support">
                            <div className="career-advisor-helplines__title">If you need someone to talk to right now</div>
                            {(message.safeguarding.helplines || []).map((h) => (
                              <div className="career-advisor-helplines__row" key={h.name}>
                                <strong>{h.name}</strong>
                                <span>{h.detail}</span>
                                {h.url ? <a href={h.url} target="_blank" rel="noopener noreferrer">Visit</a> : null}
                              </div>
                            ))}
                            <div className="career-advisor-helplines__foot">You can also tell a parent, carer, teacher or your school's safeguarding lead. They are there for exactly this.</div>
                          </div>
                        ) : null}
                      </>
                    ) : (
                      <div className="career-advisor-message-content">
                        {renderPlainText(message.content)}
                      </div>
                    )}
                  </div>
                  </React.Fragment>
                  );
                })
              )}
              {sending ? (
                <div className="career-advisor-message assistant">
                  <div className="career-advisor-message-label">
                    <span className="career-advisor-avatar" aria-hidden="true">
                      <AdvisorAiIcon />
                    </span>
                    <span>Your Advisor</span>
                  </div>
                  <div className="career-advisor-message-content muted career-advisor-thinking"><span className="cdna-load-spinner" aria-hidden="true" /><span>Thinking…</span></div>
                </div>
              ) : null}
              <div ref={bottomRef} />
            </div>

            {/* Suggested questions: one swipeable row with a small "Try asking"
                label. It steps aside while the student types and returns when
                the box is empty. On wide panels the cards wrap instead. */}
            {visiblePrompts.length > 0 && !input.trim() ? (
              <div className="cdna-sugg">
                <div className="cdna-sugg__head">
                  <span>{showingFollowUps ? 'Ask next' : 'Try asking'}</span>
                </div>
                <div className="cdna-sugg__track">
                  {suggEdges.left ? (
                    <button type="button" className="cdna-sugg__arrow cdna-sugg__arrow--left" onClick={() => suggStep(-1)} aria-label="Previous suggestions">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
                    </button>
                  ) : null}
                  <div key={visiblePrompts.join('|')} className="cdna-sugg__row" aria-label={showingFollowUps ? 'Suggested follow-up questions' : 'Suggested questions'} onScroll={onSuggScroll} onPointerDown={onSuggPointerDown} ref={suggRowRef}>
                    {visiblePrompts.map((prompt) => (
                      <button key={prompt} type="button" className="cdna-sugg__chip" onClick={(e) => chooseSuggestion(prompt, e.currentTarget)} disabled={sending} draggable={false}>
                        {prompt}
                      </button>
                    ))}
                  </div>
                  {suggEdges.right ? (
                    <button type="button" className="cdna-sugg__arrow cdna-sugg__arrow--right" onClick={() => suggStep(1)} aria-label="More suggestions">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
                    </button>
                  ) : null}
                </div>
                {(suggEdges.left || suggEdges.right) ? (
                  <div className="cdna-sugg__dots" aria-hidden="true">
                    {visiblePrompts.map((p, i) => <span key={p} className={i === suggIdx ? 'is-on' : ''} />)}
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* Allowance shown only when it is about to run out (2, 1 or none
                left), with a Top up link that opens the same top-up window as
                the Profile page, without leaving this page. */}
            {entitlement && !advisorUnlimited && Math.max(0, Number(advisorRemaining || 0)) <= 2 ? (() => {
              const left = Math.max(0, Number(advisorRemaining || 0));
              return (
                <div className={`career-advisor-credit-note ${limitReached || !hasAdvisorRemaining ? 'is-empty' : ''}`}>
                  {left === 0 ? 'No questions left' : `${left} question${left === 1 ? '' : 's'} left`}
                  {' · '}
                  <button type="button" className="career-advisor-topup" onClick={() => setShowTopUp(true)}>Top up</button>
                </div>
              );
            })() : null}

            {loadError && !loading ? (
              <InlineError compact message={loadError} onRetry={() => setReloadTick((t) => t + 1)} />
            ) : null}
            {errorMsg ? <div className="career-advisor-error">{errorMsg}</div> : null}

            <div className="career-advisor-input-row">
              <textarea
                ref={textareaRef}
                aria-label="Your question for the Advisor"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={disableAdvisorInput}
                maxLength={3000}
                rows={1}
              />
              <button
                type="button"
                className="career-advisor-send-button"
                onClick={() => handleSend()}
                disabled={disableSendButton}
                aria-label={sendTooltip}
                data-tooltip={sendTooltip}
              >
                <PaperPlaneRight size={20} weight="fill" aria-hidden="true" />
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
