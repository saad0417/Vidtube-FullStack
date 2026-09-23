export const getErrorMessage = (error, fallback = 'Something went wrong') => {
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  if (error.response?.data?.message) return error.response.data.message;
  if (error.message) return error.message;
  return fallback;
};

export const copyToClipboard = async (text) => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    textArea.remove();
    return successful;
  } catch (err) {
    console.error('Copy failed:', err);
    return false;
  }
};

export const getInitials = (name) => {
  if (!name) return 'U';
  return name
    .trim()
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const DEFAULT_AVATAR =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#272727"/><circle cx="50" cy="38" r="18" fill="#4b4b4b"/><path d="M12 100c0-21 17-32 38-32s38 11 38 32z" fill="#4b4b4b"/></svg>`
  );

export const DEFAULT_THUMBNAIL =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180"><rect width="320" height="180" fill="#1c1c1c"/><circle cx="160" cy="90" r="30" fill="#2e2e2e"/><path d="M152 76l24 14-24 14z" fill="#555"/></svg>`
  );

/**
 * Videos come back from the API in two shapes: the aggregation pipelines join
 * the owner into an object, while raw documents (liked videos, playlist items)
 * keep `owner` as the creator's username string. Normalise both.
 */
export const getVideoOwner = (video) => {
  const owner = video?.owner;

  if (owner && typeof owner === 'object') {
    return {
      _id: owner._id || null,
      username: owner.username || '',
      fullName: owner.fullName || owner.username || 'VidTube Creator',
      avatar: owner.avatar || DEFAULT_AVATAR,
    };
  }

  if (typeof owner === 'string' && owner.trim()) {
    return { _id: null, username: owner, fullName: owner, avatar: DEFAULT_AVATAR };
  }

  return { _id: null, username: '', fullName: 'VidTube Creator', avatar: DEFAULT_AVATAR };
};
