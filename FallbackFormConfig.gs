/**
 * Fallback configuration for Google Form fields and system email settings.
 * Used when Script Properties ('FORM_CONFIG') is unpopulated.
 * 
 * @returns {Object} Complete FORM_CONFIG schema.
 */
function getFallbackFormConfig() {
  return {
    settings: {
      adminEmail: "tom@rd3tech.com",
      companyName: "RD3 Tech",
      enableEmailDispatch: true
    },
    fields: {
      name: {
        titleMatch: "name",
        required: true,
        type: "string"
      },
      email: {
        titleMatch: "email",
        required: true,
        type: "string"
      },
      phone: {
        titleMatch: "phone",
        required: false,
        type: "string"
      },
      contactPreference: {
        titleMatch: "preferred method",
        required: false,
        type: "string"
      },
      usedBefore: {
        titleMatch: "used our services before",
        required: false,
        type: "string"
      },
      clientType: {
        titleMatch: "who are you getting help for",
        required: false,
        type: "string"
      },
      helpCategory: {
        titleMatch: "what do you need help with",
        required: false,
        type: "array"
      },
      userGoal: {
        titleMatch: "what are you trying to achieve",
        required: true,
        type: "string"
      },
      urgency: {
        titleMatch: "urgency",
        required: false,
        type: "string"
      },

      // HONEYPOT TRAP CONFIGURATION
      // Matches hidden/security fields like "Security Check", "Leave blank", or "website_url"
      honeypot: {
        titleMatch: "leave blank",
        required: false,
        type: "string"
      }
    }
  };
}