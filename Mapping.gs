/**
 * ============================================================================
 * Mapping.gs
 * ============================================================================
 *
 * SINGLE SOURCE OF TRUTH FOR FORM FIELDS
 *
 * FIELD_SCHEMA contains:
 *   - Google Form metadata
 *   - Application mapping metadata
 *
 * If a Google Form field changes, this is the primary place to update.
 * ============================================================================
 */

/**
 * ============================================================================
 * Email subject mapping
 * ============================================================================
 */


const EMAIL_SUBJECTS = {
  admin: (subjectPrefix, clientName, helpCategory) =>
    `${subjectPrefix || ''}[New Enquiry] ${clientName} | ${helpCategory} — RD3 Tech`,

  client: (clientName, helpCategory) =>
    `Thanks ${clientName || 'there'}, we’ll be in touch to help! | ${helpCategory} | RD3 Tech`
};

const FIELD_SCHEMA = [

  // ==========================================================================
  // CLIENT
  // ==========================================================================

  {
    key: 'name',
    formField: 'form_name',

    // Google Form
    title: 'Name',
    entryId: 'entry.943904063',
    type: 'text',

    // Application
    aliases: [
      'name',
      'full name'
    ],
    label: 'Full Name',
    section: 'client',
    default: 'Not provided'
  },

  {
    key: 'email',
    formField: 'form_email',

    // Google Form
    title: 'Email',
    entryId: 'entry.2015577610',
    type: 'text',

    // Application
    aliases: [
      'email',
      'email address'
    ],
    label: 'Email Address',
    section: 'client',
    default: 'Not provided'
  },

  {
    key: 'phone',
    formField: 'form_phone',

    // Google Form
    title: 'Phone',
    entryId: 'entry.38229443',
    type: 'text',

    // Application
    aliases: [
      'phone',
      'phone number'
    ],
    label: 'Phone Number',
    section: 'client',
    default: 'Not provided'
  },

  {
    key: 'location',
    formField: 'form_location',

    // Google Form
    title: 'Address / Location:',
    entryId: 'entry.1374165657',
    type: 'text',

    // Application
    aliases: [
      'location',
      'address',
      'address / location'
    ],
    label: 'Location / Address',
    section: 'client',
    default: 'Not provided'
  },

  {
    key: 'contactPreference',
    formField: 'form_contactPreference',

    // Google Form
    title: 'How would you prefer us to contact you?',
    entryId: 'entry.786887502',
    type: 'dropdown',

    // Application
    aliases: [
      'contactPreference',
      'preferredContact',
      'how would you prefer us to contact you',
      'prefer us to contact',
      'preferred contact'
    ],
    label: 'Preferred Contact',
    section: 'client',
    default: 'Not provided'
  },

  {
    key: 'contactingAs',
    formField: 'form_clientType',

    // Google Form
    title: 'I am contacting RD3 Tech as:',
    entryId: 'entry.1187723509',
    type: 'dropdown',

    // Application
    aliases: [
      'clientType',
      'contactingAs',
      'i am contacting rd3 tech as',
      'contacting as'
    ],
    label: 'Contacting As',
    section: 'client',
    default: 'Not provided'
  },

  {
    key: 'usedBefore',
    formField: 'form_usedBefore',

    // Google Form
    title: 'Have you used RD3 Tech before?',
    entryId: 'entry.1059088719',
    type: 'dropdown',

    // Application
    aliases: [
      'usedBefore',
      'have you used rd3 tech before',
      'previous customer',
      'used before'
    ],
    label: 'Previous Customer',
    section: 'client',
    default: 'No'
  },


  // ==========================================================================
  // REQUEST
  // ==========================================================================

  {
    key: 'helpCategory',
    formField: 'form_helpCategory',

    // Google Form
    title: 'What can we help you with?',
    entryId: 'entry.534946962',
    type: 'dropdown',

    // Application
    aliases: [
      'helpCategory',
      'what can we help you with',
      'need help with',
      'help with'
    ],
    label: 'Need Help With',
    section: 'request',
    default: 'Not specified'
  },

  {
    key: 'userGoal',
    formField: 'form_userGoal',

    // Google Form
    title: 'What Are You Trying To Achieve?',
    entryId: 'entry.1272748221',
    type: 'paragraph',

    // Application
    aliases: [
      'userGoal',
      'goal',
      'details',
      'what are you trying to achieve',
      'trying to achieve',
      'desired outcome'
    ],
    label: 'Desired Outcome / Goal',
    section: 'request',
    default: 'Not specified'
  },

  {
    key: 'urgency',
    formField: 'form_urgency',

    // Google Form
    title: 'How Urgent Is This For You?',
    entryId: 'entry.1183805901',
    type: 'dropdown',

    // Application
    aliases: [
      'urgency',
      'how urgent is this for you',
      'how urgent'
    ],
    label: 'How Urgent Is This?',
    section: 'request',
    default: 'Medium'
  },


  // ==========================================================================
  // HONEYPOT
  // ==========================================================================

  {
    key: 'honeypot',
    formField: 'form_honeypot',

    // Google Form
    title: 'Website URL  \n\n\nSecurity Check: Please leave this field empty.',
    entryId: 'entry.663587071',
    type: 'text',

    // Application
    aliases: [
      'website url',
      'security check',
      'please leave this field empty',
      'leave blank',
      'honeypot',
      'website url security check: please leave this field empty.'
    ],
    label: 'Honeypot',
    section: 'security',
    default: ''
  },

];



/**
 * ============================================================================
 * Normalise Previous Customer
 * ============================================================================
 */
function normalisePreviousCustomer(value) {

  if (typeof value === 'boolean') {
    return value;
  }

  const normalised = String(value || '')
    .trim()
    .toLowerCase();

  return (
    normalised === 'yes' ||
    normalised === 'true' ||
    normalised === '1'
  );
}


/**
 * ============================================================================
 * Get mapped field value
 * ============================================================================
 *
 * Matches against:
 *   - formField
 *   - key
 *   - label
 *   - title
 *   - entryId
 *   - aliases
 *
 * All matching is case-insensitive.
 *
 * Partial matching is retained because it helps with long Google Form
 * question titles.
 * ============================================================================
 */
function getMappedFieldValue(rawParams, field) {

  const p = rawParams || {};

  const keys = [
    field.formField,
    field.key,
    field.label,
    field.title,
    field.entryId
  ];

  if (Array.isArray(field.aliases)) {
    keys.push.apply(keys, field.aliases);
  }

  const incomingKeys = Object.keys(p);

  for (let i = 0; i < keys.length; i++) {

    if (!keys[i]) {
      continue;
    }

    const wanted = String(keys[i])
      .trim()
      .toLowerCase();

    for (let j = 0; j < incomingKeys.length; j++) {

      const actual = incomingKeys[j]
        .trim()
        .toLowerCase();

      // Exact match
      if (actual === wanted) {

        const value = p[incomingKeys[j]];

        if (
          value !== undefined &&
          value !== null &&
          String(value).trim() !== ''
        ) {
          return value;
        }
      }

      // Partial match
      if (
        actual.indexOf(wanted) !== -1 ||
        wanted.indexOf(actual) !== -1
      ) {

        const value = p[incomingKeys[j]];

        if (
          value !== undefined &&
          value !== null &&
          String(value).trim() !== ''
        ) {
          return value;
        }
      }
    }
  }

  return field.default;
}


/**
 * ============================================================================
 * Map form payload
 * ============================================================================
 */
function mapFormPayload(rawParams) {

  const p = rawParams || {};

  const payload = {

    submissionDate: Utilities.formatDate(
      new Date(),
      Session.getScriptTimeZone() || 'Pacific/Auckland',
      'yyyy-MM-dd HH:mm:ss z'
    ),

    client: {},

    request: {},

    security: {}

  };

  const displaySchema = {

    client: [],

    request: [],

    security: []

  };


  FIELD_SCHEMA.forEach(function (field) {

    let value = getMappedFieldValue(
      p,
      field
    );


    // ------------------------------------------------------------------------
    // Special handling for Previous Customer
    // ------------------------------------------------------------------------

    if (field.key === 'usedBefore') {

      const boolValue =
        normalisePreviousCustomer(value);

      payload[field.section][field.key] =
        boolValue;

      displaySchema[field.section].push({

        key: field.key,

        label: field.label,

        value: boolValue
          ? 'Yes'
          : 'No'

      });

      return;
    }


    // ------------------------------------------------------------------------
    // Empty → default
    // ------------------------------------------------------------------------

    if (
      value === undefined ||
      value === null ||
      String(value).trim() === ''
    ) {

      value = field.default;

    }


    value = String(value).trim();


    payload[field.section][field.key] =
      value;


    displaySchema[field.section].push({

      key: field.key,

      label: field.label,

      value: value

    });

  });


  // --------------------------------------------------------------------------
  // Optional debug logging
  // --------------------------------------------------------------------------

  const debug =
    PropertiesService
      .getScriptProperties()
      .getProperty('DEBUG_MAPPING') === 'true';


  if (debug) {

    Logger.log(
      '============================================================'
    );

    Logger.log(
      'RD3 FORM PAYLOAD MAPPING'
    );

    Logger.log(
      '============================================================'
    );

    Logger.log(
      'Raw parameters: ' +
      JSON.stringify(p)
    );

    Logger.log(
      'Mapped payload: ' +
      JSON.stringify(payload)
    );

    Logger.log(
      'Display schema: ' +
      JSON.stringify(displaySchema)
    );

    Logger.log(
      '============================================================'
    );
  }


  return {

    payload: payload,

    displaySchema: displaySchema

  };






}


/**
 * ============================================================================
 * Quick test helper
 * ============================================================================
 */
function testActualMapping() {

  const params = {

    'Name':
      'Tom Tom',

    'Email':
      'tom.revill@gmail.com',

    'Phone':
      '021 123 4567',

    'Address / Location:':
      'Whangarei',

    'How would you prefer us to contact you?':
      'Email',

    'Have you used RD3 Tech before?':
      'Yes',

    'I am contacting RD3 Tech as:':
      'Home or Family',

    'What can we help you with?':
      'Help with Something Broken?',

    'What Are You Trying To Achieve?':
      'TV',

    'How Urgent Is This For You?':
      'High',

    'Website URL Security Check: Please leave this field empty.':
      ''

  };


  Logger.log(
    'TEST INPUT: ' +
    JSON.stringify(params)
  );


  const result =
    mapFormPayload(params);


  Logger.log(
    'RESULT: ' +
    JSON.stringify(
      result.payload,
      null,
      2
    )
  );

}

