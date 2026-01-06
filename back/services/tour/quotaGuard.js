let quotaBlockedUntil = 0;

export const isQuotaBlocked = () => Date.now() < quotaBlockedUntil;

export const blockQuota = (ms = 60 * 1000) => {
  quotaBlockedUntil = Date.now() + ms;
};
