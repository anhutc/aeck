/**
 * Utility to manage website favicon dynamically based on app branding.
 */

export const updateFavicon = (emoji?: string, fallbackSvgUrl = '/favicon.svg') => {
  try {
    let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }

    if (!emoji || emoji.trim() === '') {
      link.href = fallbackSvgUrl;
      link.type = 'image/svg+xml';
      return;
    }

    const cleanEmoji = emoji.trim();
    // Render emoji as an SVG Data URI
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <text y="0.88em" font-size="80" text-anchor="middle" x="50">${cleanEmoji}</text>
      </svg>
    `.trim();

    link.href = `data:image/svg+xml,${encodeURIComponent(svg)}`;
    link.type = 'image/svg+xml';

    // Also update apple-touch-icon if present or create one
    let appleLink = document.querySelector<HTMLLinkElement>("link[rel='apple-touch-icon']");
    if (!appleLink) {
      appleLink = document.createElement('link');
      appleLink.rel = 'apple-touch-icon';
      document.head.appendChild(appleLink);
    }
    appleLink.href = fallbackSvgUrl;
  } catch (err) {
    console.warn('Could not update favicon:', err);
  }
};
