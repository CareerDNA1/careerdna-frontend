import React, { useEffect, useMemo, useRef, useState } from 'react';
import { renderSafeMarkdown } from '../../utils/renderSafeMarkdown';
import { PaperPlaneRight } from 'phosphor-react';
import { BrainCircuit } from 'lucide-react';
import './CareerAdvisorChat.css';
import ReportLimitModal from '../Common/ReportLimitModal';
import { applyCouponCode } from '../../utils/applyCoupon';
import { loadAdvisorConversation, sendAdvisorMessage } from '../../utils/careerAdvisor';
import { clearAdvisorPrefill } from '../../utils/advisorPanel';

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
  return <BrainCircuit aria-hidden="true" focusable="false" />;
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
export default function CareerAdvisorChat({ assessmentRunId, embedded = false, variant = 'page', context = null, generalQuestions = null, prefill = '', prefillSend = false }) {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [starterPrompts, setStarterPrompts] = useState(FALLBACK_STARTER_PROMPTS);
  const [usedStarterPrompts, setUsedStarterPrompts] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [entitlement, setEntitlement] = useState(null);
  const [limitReached, setLimitReached] = useState(false);
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
      } catch {
        // A failed background history load must NOT show a scary error just for
        // opening the tab. Fall back to the starter questions so the advisor is
        // still usable; a real error only surfaces if a question the user
        // actually sends fails.
        if (!cancelled) {
          setStarterPrompts(FALLBACK_STARTER_PROMPTS);
          setUsedStarterPrompts(deriveUsedStarterPrompts([], FALLBACK_STARTER_PROMPTS));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [assessmentRunId]);

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

  const placeholder = useMemo(() => {
    if (sending) return 'Thinking…';
    return context?.title ? `Ask about ${context.title}…` : 'Ask your advisor a question…';
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
        return [...withoutOptimistic, ...returnedMessages];
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
        setErrorMsg(err.message || 'Could not send your question.');
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
  const contextPrompts = (Array.isArray(context?.questions) ? context.questions : [])
    .filter((q) => q && !askedKeys.has(normalizePromptText(q).toLowerCase()));
  const generalPrompts = (Array.isArray(generalQuestions) && generalQuestions.length ? generalQuestions : starterPrompts)
    .filter((prompt) => !usedStarterPromptKeys.has(normalizePromptText(prompt).toLowerCase()) && !askedKeys.has(normalizePromptText(prompt).toLowerCase()));
  const promptLimit = isDrawer ? (hasMessages ? 2 : 4) : (hasMessages ? 3 : 5);
  const visiblePrompts = [...contextPrompts, ...generalPrompts.filter((p) => !contextPrompts.includes(p))].slice(0, promptLimit);
  const disableAdvisorInput = sending;
  const sendTooltip = sending
    ? 'Your advisor is thinking'
    : limitReached || !hasAdvisorRemaining
      ? 'Get more advisor questions'
      : 'Send message';
  const disableSendButton = sending;

  return (
    <section className={`career-advisor-shell ${embedded ? 'is-embedded' : ''} ${isDrawer ? 'is-drawer' : ''}`} aria-label="Your Advisor">
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

                  return (
                  <div
                    key={message.id || `${message.role}-${message.createdAt}-${message.content?.slice(0, 12)}`}
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
                      <div
                        className="career-advisor-message-content career-advisor-markdown"
                        dangerouslySetInnerHTML={renderSafeMarkdown(message.content)}
                      />
                    ) : (
                      <div className="career-advisor-message-content">
                        {renderPlainText(message.content)}
                      </div>
                    )}
                  </div>
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

            {visiblePrompts.length > 0 ? (
              <div className="career-advisor-suggestions">
                <div className="career-advisor-prompt-intro">{context?.title ? `About ${context.title}, or ask your own.` : 'Choose one of these questions or ask your own.'}</div>
                <div className="career-advisor-prompts" aria-label="Suggested questions">
                  {visiblePrompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => handleSend(prompt)}
                      disabled={sending}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {entitlement ? (
              <div className={`career-advisor-credit-note ${limitReached || !hasAdvisorRemaining ? 'is-empty' : ''}`}>
                {advisorUnlimited
                  ? 'Unlimited advisor questions'
                  : `${Math.max(0, Number(advisorRemaining || 0))} advisor question${Math.max(0, Number(advisorRemaining || 0)) === 1 ? '' : 's'} remaining`}
              </div>
            ) : null}

            {errorMsg ? <div className="career-advisor-error">{errorMsg}</div> : null}

            <div className="career-advisor-input-row">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={disableAdvisorInput}
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
