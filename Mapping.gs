/**
 * ============================================================================
 * Mapping.gs
 * ============================================================================
 *
 * SINGLE SOURCE OF TRUTH FOR FORM FIELDS.
 *
 * The website form uses names such as:
 *
 *   rd3_name
 *   rd3_email
 *   rd3_phone
 *   rd3_contactPreference
 *   rd3_usedBefore
 *   rd3_clientType
 *   rd3_location
 *   rd3_helpCategory
 *   rd3_userGoal
 *   rd3_urgency
 *
 * This file maps those website field names into the internal RD3 payload:
 *
 *   payload.client
 *   payload.request
 *
 * If the website field names change, update the aliases here.
 * ============================================================================
 */


/**
 * ============================================================================
 * FIELD SCHEMA
 * ============================================================================
 *
 * key:
 *   Internal field name used throughout Apps Script.
 *
 * aliases:
 *   Accepted incoming names from the website/form.
 *
 * label:
 *   Human-readable label used by email/display templates.
 *
 * section:
 *   client or request.
 *
 * default:
 *   Value used when no incoming value is supplied.
 */
const FIELD_SCHEMA = [

  // --------------------------------------------------------------------------
  // CLIENT FIELDS
  // --------------------------------------------------------------------------

  {
    key: 'name',
    aliases: [
      'rd3_name',
      'fullName'
    ],
    label: 'Full Name',
    section: 'client',
    default: 'Not provided'
  },

  {
    key: 'email',
    aliases: [
      'rd3_email'
    ],
    label: 'Email Address',
    section: 'client',
    default: 'Not provided'
  },

  {
    key: 'phone',
    aliases: [
      'rd3_phone'
    ],
    label: 'Phone Number',
    section: 'client',
    default: 'Not provided'
  },

  {
    key: 'location',
    aliases: [
      'rd3_location',
      'address'
    ],
    label: 'Location / Address',
    section: 'client',
    default: 'Not provided'
  },

  {
    key: 'preferredContact',
    aliases: [
      'rd3_contactPreference'
    ],
    label: 'Preferred Contact Method',
    section: 'client',
    default: 'Email'
  },

  {
    key: 'contactingAs',
    aliases: [
      'rd3_clientType'
    ],
    label: 'Contacting As',
    section: 'client',
    default: 'Potential Client'
  },

  {
    key: 'isPreviousCustomer',
    aliases: [
      'rd3_usedBefore'
    ],
    label: 'Previous Customer',
    section: 'client',
    default: 'No'
  },


  // --------------------------------------------------------------------------
  // REQUEST FIELDS
  // --------------------------------------------------------------------------

  {
    key: 'situation',
    aliases: [
      'rd3_helpCategory',
      'details',
      'problem'
    ],
    label: 'Current Situation',
    section: 'request',
    default: ''
  },

  {
    key: 'goal',
    aliases: [
      'rd3_userGoal',
      'userGoal'
    ],
    label: 'Desired Outcome / Goal',
    section: 'request',
    default: ''
  },

  {
    key: 'timeframe',
    aliases: [
      'rd3_urgency',
      'urgency'
    ],
    label: 'Timeframe / Priority',
    section: 'request',
    default: 'Medium'
  }

];


/**
 * ============================================================================
 * NORMALISE BOOLEAN / PREVIOUS CUSTOMER VALUE
 * ============================================================================
 *
 * Converts:
 *
 *   Yes -> true
 *   No  -> false
 *
 * This is important because the email template uses:
 *
 *   client.isPreviousCustomer ? 'Yes' : 'No'
 *
 * A string such as "No" is truthy in JavaScript, so it MUST be converted
 * to an actual boolean.
 */
function normalisePreviousCustomer(value) {

  if (typeof value === 'boolean') {
    return value;
  }

  const normalised = String(value || '')
    .trim()
    .toLowerCase();

  if (
    normalised === 'yes' ||
    normalised === 'true' ||
    normalised === '1'
  ) {
    return true;
  }

  return false;
}


/**
 * ============================================================================
 * FIND FIELD VALUE
 * ============================================================================
 *
 * Looks for the primary internal key first, then checks aliases.
 */
function getMappedFieldValue(rawParams, field) {

  const p = rawParams || {};

  // --------------------------------------------------------------------------
  // Check primary key
  // --------------------------------------------------------------------------

  if (
    p[field.key] !== undefined &&
    p[field.key] !== null &&
    String(p[field.key]).trim() !== ''
  ) {
    return p[field.key];
  }

  // --------------------------------------------------------------------------
  // Check aliases
  // --------------------------------------------------------------------------

  for (const alias of field.aliases || []) {

    if (
      p[alias] !== undefined &&
      p[alias] !== null &&
      String(p[alias]).trim() !== ''
    ) {
      return p[alias];
    }

  }

  // --------------------------------------------------------------------------
  // Nothing found - use default
  // --------------------------------------------------------------------------

  return field.default;
}


/**
 * ============================================================================
 * MAP FORM PAYLOAD
 * ============================================================================
 *
 * Converts incoming website parameters into the standard RD3 payload.
 *
 * Example incoming data:
 *
 *   rd3_name = Tom Test
 *   rd3_email = tom@example.com
 *   rd3_clientType = Home or Family
 *
 * Becomes:
 *
 *   payload.client.name = Tom Test
 *   payload.client.email = tom@example.com
 *   payload.client.contactingAs = Home or Family
 *
 * @param {Object} rawParams Incoming e.parameter object.
 * @returns {Object} { payload, displaySchema }
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

    request: {}
  };

  const displaySchema = {
    client: [],
    request: []
  };


  // --------------------------------------------------------------------------
  // PROCESS FIELD SCHEMA
  // --------------------------------------------------------------------------

  FIELD_SCHEMA.forEach(function(field) {

    let value = getMappedFieldValue(p, field);

    // ------------------------------------------------------------------------
    // Special handling for previous customer
    // ------------------------------------------------------------------------

    if (field.key === 'isPreviousCustomer') {

      const boolValue = normalisePreviousCustomer(value);

      payload.client[field.key] = boolValue;

      displaySchema[field.section].push({
        key: field.key,
        label: field.label,
        value: boolValue ? 'Yes' : 'No'
      });

      return;
    }


    // ------------------------------------------------------------------------
    // Normalise all other values
    // ------------------------------------------------------------------------

    if (
      value === undefined ||
      value === null ||
      String(value).trim() === ''
    ) {
      value = field.default;
    }

    value = String(value).trim();


    // ------------------------------------------------------------------------
    // Store in structured payload
    // ------------------------------------------------------------------------

    payload[field.section][field.key] = value;


    // ------------------------------------------------------------------------
    // Store in display schema
    // ------------------------------------------------------------------------

    displaySchema[field.section].push({
      key: field.key,
      label: field.label,
      value: value
    });

  });


  // --------------------------------------------------------------------------
  // DEBUG LOGGING
  // --------------------------------------------------------------------------

  Logger.log('============================================================');
  Logger.log('RD3 FORM PAYLOAD MAPPING');
  Logger.log('============================================================');

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

  Logger.log('============================================================');


  return {
    payload: payload,
    displaySchema: displaySchema
  };
}