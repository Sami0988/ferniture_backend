import sanitizeHtml from 'sanitize-html';
import { BadRequestException } from '@nestjs/common';
import { ALLOWED_PLACEHOLDERS } from '../constants/allowed-placeholders';

const PLACEHOLDER_REGEX = /\{\{(\w+)\}\}/g;

export function validateAndSanitizeTemplate(html: string): string {
  const found = [...html.matchAll(PLACEHOLDER_REGEX)].map((m) => m[1]);
  const unknown = found.filter((tag) => !ALLOWED_PLACEHOLDERS.includes(tag as any));
  if (unknown.length > 0) {
    throw new BadRequestException(
      `Unknown placeholder(s): ${[...new Set(unknown)].join(', ')}. Allowed: ${ALLOWED_PLACEHOLDERS.join(', ')}`,
    );
  }

  const clean = sanitizeHtml(html, {
    allowedTags: [
      'div', 'span', 'p', 'br', 'strong', 'b', 'em', 'i', 'u',
      'table', 'tr', 'td', 'th', 'thead', 'tbody',
      'h1', 'h2', 'h3', 'img', 'style',
    ],
    allowedAttributes: {
      '*': ['class', 'style'],
      img: ['src', 'alt', 'width', 'height'],
    },
    disallowedTagsMode: 'discard',
    allowedSchemes: ['https', 'data'],
    allowVulnerableTags: true,
  });

  return clean;
}
