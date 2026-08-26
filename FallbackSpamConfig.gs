/**
 * FallbackSpamConfig.gs
 * Default backup configuration for SPAM_CONFIG including phone validation rules.
 */

function getFallbackSpamConfig() {
  return {
    settings: {
      enableSpamCheck: true,
      blockDisposableEmails: true,
      blockSuspiciousTlds: true,
      blockUrlsInContactFields: true,
      enableStrictPhoneValidation: true
    },
    categories: {
      spam: [
        "casino",
        "viagra",
        "seo rank",
        "wire money",
        "claim your prize",
        "whatsapp me",
        "telegram",
        "passive income",
        "crypto investment"
      ]
    },
    disposableDomains: [
      "mailinator.com",
      "10minutemail.com",
      "tempmail.com",
      "guerrillamail.com",
      "trashmail.com",
      "sharklasers.com",
      "yopmail.com"
    ],
    suspiciousTlds: [
      ".xyz",
      ".top",
      ".club",
      ".work",
      ".click",
      ".gq",
      ".cf",
      ".tk"
    ],
 "phoneValidation": {
  "minDigits": 7,
  "blockedPatterns": [
    "555",
    "123456",
    "1234567",
    "12345678",
    "123456789",
    "0123456",
    "01234567"
  ]
}
  };
}