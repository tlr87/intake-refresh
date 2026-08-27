/**
 * Mapping.gs
 * SINGLE SOURCE OF TRUTH FOR FORM FIELDS.
 * To add a new question/field, simply add a row to FIELD_SCHEMA below!
 */

const FIELD_SCHEMA = [
  // --- CLIENT FIELDS ---
  { key: 'name',               aliases: ['fullName'],          label: 'Full Name',                section: 'client',  default: 'Not provided' },
  { key: 'email',              aliases: [],                    label: 'Email Address',            section: 'client',  default: 'Not provided' },
  { key: 'phone',              aliases: [],                    label: 'Phone Number',             section: 'client',  default: 'Not provided' },
  { key: 'location',           aliases: ['address'],           label: 'Location / Address',       section: 'client',  default: 'Not provided' },
  { key: 'preferredContact',   aliases: [],                    label: 'Preferred Contact Method', section: 'client',  default: 'Email' },
  { key: 'contactingAs',       aliases: [],                    label: 'Contacting As',            section: 'client',  default: 'Potential Client' },
  { key: 'isPreviousCustomer', aliases: [],                    label: 'Previous Customer',        section: 'client',  default: 'No' },

  // --- REQUEST FIELDS ---
  { key: 'situation',          aliases: ['details', 'problem'],label: 'Current Situation',         section: 'request', default: '' },
  { key: 'goal',               aliases: ['userGoal'],          label: 'Desired Outcome / Goal',   section: 'request', default: '' },
  { key: 'timeframe',          aliases: ['urgency'],           label: 'Timeframe / Priority',     section: 'request', default: 'Medium' }

  // ➕ TO ADD A NEW QUESTION, JUST COPY AND PASTE A ROW HERE:
  // { key: 'budget',          aliases: ['estBudget'],         label: 'Estimated Budget',          section: 'request', default: 'Not specified' }
];

/**
 * Automatically transforms raw form parameters into grouped sections and display labels.
 * 
 * @param {Object} rawParams - e.parameter object from form POST.
 * @returns {Object} { payload, displaySchema }
 */
function mapFormPayload(rawParams) {
  const p = rawParams || {};
  const payload = {
  submissionDate: new Date().toLocaleString("en-NZ", { timeZone: "Pacific/Auckland" }),
    client: {},
    request: {}
  };
  
  const displaySchema = {
    client: [],
    request: []
  };

  FIELD_SCHEMA.forEach(field => {
    // 1. Resolve raw parameter value using primary key or fallback aliases
    let val = p[field.key];
    if (val === undefined || val === null || val === '') {
      for (const alias of field.aliases) {
        if (p[alias] !== undefined && p[alias] !== null && p[alias] !== '') {
          val = p[alias];
          break;
        }
      }
    }

    // Format boolean or use default
    if (val === undefined || val === null || val === '') {
      val = field.default;
    } else if (typeof val === 'boolean') {
      val = val ? 'Yes' : 'No';
    }

    // 2. Map into structured payload for keyword scanner
    payload[field.section][field.key] = String(val).trim();

    // 3. Build ordered display schema for AdminEmail.html
    displaySchema[field.section].push({
      key: field.key,
      label: field.label,
      value: String(val).trim()
    });
  });

  return { payload, displaySchema };
}