/**
 * ============================================================================
 * Mapping.gs
 * ============================================================================
 *
 * FIELD_SCHEMA is stored as JSON in Script Properties:
 *
 *   FIELD_SCHEMA
 *
 * Mapping.gs contains the application logic only.
 * ============================================================================ */


/**
 * ============================================================================
 * EMAIL SUBJECTS
 * ============================================================================
 */

const EMAIL_SUBJECTS = {

  admin: (subjectPrefix, clientName, helpCategory) =>
    `${subjectPrefix || ''}[New Enquiry] ${clientName} | ${helpCategory} — RD3 Tech`,

  client: (clientName, helpCategory) =>
    `Thanks ${clientName || 'there'}, we’ll be in touch to help! | ${helpCategory} | RD3 Tech`

};


/**
 * ============================================================================
 * GET FIELD SCHEMA
 * ============================================================================
 *
 * Reads FIELD_SCHEMA JSON from Script Properties.
 *
 * FIELD_SCHEMA must contain a JSON array.
 */

function getFieldSchema() {

  const json = PropertiesService
    .getScriptProperties()
    .getProperty('FIELD_SCHEMA');

  if (!json) {
    throw new Error('FIELD_SCHEMA is missing from Script Properties.');
  }

  let schema;

  try {
    schema = JSON.parse(json);
  } catch (error) {
    throw new Error(
      'FIELD_SCHEMA contains invalid JSON: ' + error.message
    );
  }

  // FIELD_SCHEMA stored as object — convert internally to array
  if (
    schema &&
    typeof schema === 'object' &&
    !Array.isArray(schema)
  ) {
    return Object.keys(schema).map(function(key) {

      const field = schema[key];

      if (!field || typeof field !== 'object') {
        throw new Error(
          'Invalid FIELD_SCHEMA field: ' + key
        );
      }

      if (!field.key) {
        field.key = key;
      }

      return field;
    });
  }

  // Also allow existing array format
  if (Array.isArray(schema)) {
    return schema;
  }

  throw new Error(
    'FIELD_SCHEMA must be a JSON object or array.'
  );
}


/**
 * ============================================================================
 * NORMALISE PREVIOUS CUSTOMER
 * ============================================================================
 */

function normalisePreviousCustomer(value) {

  if (typeof value === 'boolean') {
    return value;
  }

  const normalised =
    String(value || '')
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
 * GET MAPPED FIELD VALUE
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

    const wanted =
      String(keys[i])
        .trim()
        .toLowerCase();

    for (let j = 0; j < incomingKeys.length; j++) {

      const actual =
        incomingKeys[j]
          .trim()
          .toLowerCase();

      if (
        actual === wanted ||
        actual.indexOf(wanted) !== -1 ||
        wanted.indexOf(actual) !== -1
      ) {

        const value =
          p[incomingKeys[j]];

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
 * MAP FORM PAYLOAD
 * ============================================================================
 */

function mapFormPayload(rawParams) {

  const p = rawParams || {};

  const FIELD_SCHEMA =
    getFieldSchema();

  const payload = {

    submissionDate:
      Utilities.formatDate(
        new Date(),
        Session.getScriptTimeZone() ||
          'Pacific/Auckland',
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


  FIELD_SCHEMA.forEach(function(field) {

    let value =
      getMappedFieldValue(
        p,
        field
      );


    /**
     * Previous Customer
     */

    if (field.key === 'usedBefore') {

      const boolValue =
        normalisePreviousCustomer(value);

      payload[field.section][field.key] =
        boolValue;

      displaySchema[field.section].push({

        key: field.key,

        label: field.label,

        value:
          boolValue
            ? 'Yes'
            : 'No'

      });

      return;
    }


    /**
     * Empty → default
     */

    if (
      value === undefined ||
      value === null ||
      String(value).trim() === ''
    ) {

      value = field.default;

    }


    value =
      String(value).trim();


    payload[field.section][field.key] =
      value;


    displaySchema[field.section].push({

      key: field.key,

      label: field.label,

      value: value

    });

  });


  /**
   * Debug logging
   */

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
      JSON.stringify(
        payload,
        null,
        2
      )
    );

    Logger.log(
      'Display schema: ' +
      JSON.stringify(
        displaySchema,
        null,
        2
      )
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
 * TEST ACTUAL MAPPING
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


