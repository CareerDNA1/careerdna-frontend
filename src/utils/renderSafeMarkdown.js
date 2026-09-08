// src/utils/renderSafeMarkdown.js
import DOMPurify from 'dompurify';
import { marked } from 'marked';

marked.setOptions({
  breaks: true,
  gfm: true,
});

const SAFE_MARKDOWN_CONFIG = {
  USE_PROFILES: { html: true },
  ALLOW_UNKNOWN_PROTOCOLS: false,
};

export function renderSafeMarkdown(markdown = '') {
  const rawHtml = marked.parse(String(markdown || ''), {
    breaks: true,
    gfm: true,
  });

  return {
    __html: DOMPurify.sanitize(rawHtml, SAFE_MARKDOWN_CONFIG),
  };
}

export default renderSafeMarkdown;
