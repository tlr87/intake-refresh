/**
 * ============================================================================
 * Tests_Handlers.js
 * ============================================================================
 *
 * Tests:
 *   1. onFormSubmit(e)
 *   2. doPost(e)
 *
 * These tests DO NOT send email.
 * They validate that each handler can receive an event, parse it, map it,
 * and produce the expected pipeline data.
 *
 * Run:
 *   testOnFormSubmitHandler
 *   testDoPostHandler
 * ============================================================================
 */

/**
 * ============================================================================
 * TEST: onFormSubmit(e)
 * ============================================================================
 *
 * Uses the existing mock Google Form event.
 *
 * Does NOT call onFormSubmit() because that function sends real email.
 *
 * Tests:
 *   1. Mock event is valid
 *   2. Form responses are extracted
 *   3. Respondent email is extracted from the event
 *   4. Mapping.gs produces a payload
 *   5. Core client/request fields are mapped correctly
 *
 * IMPORTANT:
 *   The respondent email comes from:
 *
 *     e.response.getRespondentEmail()
 *
 *   It is therefore explicitly supplied to rawParams using the FIELD_SCHEMA
 *   email field title so that mapFormPayload() sees the same shape as normal
 *   form-response data.
 *
 * ============================================================================
 */
function testOnFormSubmitHandler() {

  Logger.log(
    '============================================================'
  );

  Logger.log(
    'onFormSubmit(e) TEST'
  );

  Logger.log(
    '============================================================'
  );


  // ==========================================================================
  // Create mock event
  // ==========================================================================

  const e =
    generateMockFormEvent();


  if (!e || !e.response) {

    throw new Error(
      'onFormSubmit test failed: mock event is invalid.'
    );

  }


  // ==========================================================================
  // Extract raw form parameters
  // ==========================================================================

  const rawParams = {};

  const itemResponses =
    e.response.getItemResponses();


  itemResponses.forEach(function(itemResponse) {

    const title =
      String(
        itemResponse
          .getItem()
          .getTitle() || ''
      ).trim();


    const raw =
      itemResponse.getResponse();


    const value =
      Array.isArray(raw)
        ? raw.join(', ')
        : String(raw || '');


    rawParams[title] =
      value;

  });


  // ==========================================================================
  // Extract respondent email
  // ==========================================================================

  const respondentEmail =
    String(
      e.response.getRespondentEmail() || ''
    ).trim();


  if (!respondentEmail) {

    throw new Error(
      'onFormSubmit test failed: mock respondent email is missing.'
    );

  }


  // ==========================================================================
  // IMPORTANT:
  //
  // Add respondent email using the LIVE FIELD_SCHEMA email title.
  //
  // mapFormPayload() maps form fields by their configured title/aliases.
  // The Google Form respondent email is not necessarily an item response.
  // ==========================================================================

  const emailField =
    FIELD_SCHEMA.find(function(field) {

      return field.key === 'email';

    });


  if (!emailField) {

    throw new Error(
      'onFormSubmit test failed: FIELD_SCHEMA email field was not found.'
    );

  }


  rawParams[emailField.title] =
    respondentEmail;


  // Keep this too because some existing mapping code may use "email".
  rawParams.email =
    respondentEmail;


  Logger.log(
    'Respondent email: ' +
    respondentEmail
  );


  // ==========================================================================
  // Map payload
  // ==========================================================================

  const mapped =
    mapFormPayload(
      rawParams
    );


  if (!mapped || !mapped.payload) {

    throw new Error(
      'onFormSubmit test failed: Mapping.gs returned no payload.'
    );

  }


  const payload =
    mapped.payload;


  const client =
    payload.client || {};


  const request =
    payload.request || {};


  // ==========================================================================
  // Validate client name
  // ==========================================================================

  if (
    client.name !== 'Jane Doe'
  ) {

    throw new Error(
      'onFormSubmit test failed: client name was not mapped correctly. ' +
      'Expected "Jane Doe", got "' +
      client.name +
      '".'
    );

  }


  // ==========================================================================
  // Validate respondent email
  // ==========================================================================

  if (
    client.email !== respondentEmail
  ) {

    throw new Error(
      'onFormSubmit test failed: respondent email was not mapped correctly. ' +
      'Expected "' +
      respondentEmail +
      '", got "' +
      client.email +
      '".'
    );

  }


  // ==========================================================================
  // Validate request fields
  // ==========================================================================

  if (
    !request.helpCategory
  ) {

    throw new Error(
      'onFormSubmit test failed: help category is missing.'
    );

  }


  if (
    !request.userGoal
  ) {

    throw new Error(
      'onFormSubmit test failed: user goal is missing.'
    );

  }


  if (
    !request.urgency
  ) {

    throw new Error(
      'onFormSubmit test failed: urgency is missing.'
    );

  }


  // ==========================================================================
  // Output
  // ==========================================================================

  Logger.log(
    'Event received: YES'
  );

  Logger.log(
    'Raw form data extracted: YES'
  );

  Logger.log(
    'Respondent email extracted: YES'
  );

  Logger.log(
    'Mapping successful: YES'
  );

  Logger.log(
    'Client: ' +
    client.name
  );

  Logger.log(
    'Email: ' +
    client.email
  );

  Logger.log(
    'Help Category: ' +
    request.helpCategory
  );

  Logger.log(
    'Urgency: ' +
    request.urgency
  );


  Logger.log(
    '============================================================'
  );

  Logger.log(
    '✅ onFormSubmit(e) TEST PASSED'
  );

  Logger.log(
    '============================================================'
  );


  return mapped;

}

/**
 * Tests doPost(e) using a mock website POST event.
 *
 * Does NOT call doPost() itself because doPost() sends email
 * and writes to the production sheet.
 *
 * Instead, it exercises the same POST -> parsing -> Mapping.gs path.
 */
function testDoPostHandler() {

  Logger.log('============================================================');
  Logger.log('doPost(e) TEST');
  Logger.log('============================================================');

  const mockPayload = {
    Name: 'Peter Parker',
    Email: 'peter.parker@example.com',
    Phone: '021 555 1234',
    'Address / Location:': 'Auckland',
    'How would you prefer us to contact you?': 'Email',
    'Have you used RD3 Tech before?': 'No',
    'I am contacting RD3 Tech as:': 'Home or Family',
    'What can we help you with?': 'Website Support',
    'What Are You Trying To Achieve?': 'Test website submission',
    'How Urgent Is This For You?': 'High',
    'Website URL Security Check: Please leave this field empty.': ''
  };

  const e = {
    postData: {
      contents: JSON.stringify(mockPayload)
    },

    parameter: {},

    parameters: {}
  };

  const rawParams =
    parseIncomingParameters(e);

  if (!rawParams) {
    throw new Error(
      'doPost test failed: no parameters were parsed.'
    );
  }

  if (rawParams.Name !== 'Peter Parker') {
    throw new Error(
      'doPost test failed: Name was not parsed correctly.'
    );
  }

  if (rawParams.Email !== 'peter.parker@example.com') {
    throw new Error(
      'doPost test failed: Email was not parsed correctly.'
    );
  }

  const mapped =
    mapFormPayload(rawParams);

  if (!mapped || !mapped.payload) {
    throw new Error(
      'doPost test failed: Mapping.gs returned no payload.'
    );
  }

  const payload = mapped.payload;

  const client = payload.client || {};
  const request = payload.request || {};

  if (client.name !== 'Peter Parker') {
    throw new Error(
      'doPost test failed: client name was not mapped correctly.'
    );
  }

  if (client.email !== 'peter.parker@example.com') {
    throw new Error(
      'doPost test failed: client email was not mapped correctly.'
    );
  }

  if (!request.helpCategory) {
    throw new Error(
      'doPost test failed: help category is missing.'
    );
  }

  if (!request.userGoal) {
    throw new Error(
      'doPost test failed: user goal is missing.'
    );
  }

  if (request.urgency !== 'High') {
    throw new Error(
      'doPost test failed: urgency was not mapped correctly.'
    );
  }

  Logger.log('POST event received: YES');
  Logger.log('JSON parsed: YES');
  Logger.log('Mapping successful: YES');
  Logger.log('Client: ' + client.name);
  Logger.log('Email: ' + client.email);
  Logger.log('Help Category: ' + request.helpCategory);
  Logger.log('Urgency: ' + request.urgency);

  Logger.log('============================================================');
  Logger.log('✅ doPost(e) TEST PASSED');
  Logger.log('============================================================');
}


function testContactPreferenceEventMapping() {

  Logger.log('========================================');
  Logger.log('CONTACT PREFERENCE EVENT MAPPING TEST');
  Logger.log('========================================');

  const schema = getFieldSchema_();

  if (!schema || !schema.contactPreference) {
    throw new Error(
      'FIELD_SCHEMA.contactPreference could not be loaded.'
    );
  }

  const field = schema.contactPreference;

  Logger.log('Schema key: ' + field.key);
  Logger.log('Schema formField: ' + field.formField);
  Logger.log('Schema entryId: ' + field.entryId);

  // ------------------------------------------------------------
  // Simulate doPost(e)
  // ------------------------------------------------------------

  const postEvent = {
    parameter: {
      form_contactPreference: 'Email'
    },
    parameters: {
      form_contactPreference: ['Email']
    }
  };

  Logger.log('');
  Logger.log('--- doPost(e) simulation ---');

  Logger.log(
    'e.parameter.form_contactPreference = ' +
    JSON.stringify(postEvent.parameter.form_contactPreference)
  );

  Logger.log(
    'e.parameters.form_contactPreference = ' +
    JSON.stringify(postEvent.parameters.form_contactPreference)
  );

  const postValue =
    postEvent.parameter[field.formField];

  Logger.log(
    'Resolved POST value = ' +
    JSON.stringify(postValue)
  );

  if (postValue !== 'Email') {
    throw new Error(
      'POST mapping FAILED: expected Email, got ' +
      JSON.stringify(postValue)
    );
  }

  // ------------------------------------------------------------
  // Simulate onFormSubmit(e)
  // ------------------------------------------------------------

  const formEvent = {
    namedValues: {
      'How would you prefer us to contact you?': ['Email']
    }
  };

  Logger.log('');
  Logger.log('--- onFormSubmit(e) simulation ---');

  Logger.log(
    'namedValues = ' +
    JSON.stringify(formEvent.namedValues, null, 2)
  );

  const title = field.title;

  const formValue =
    formEvent.namedValues[title];

  Logger.log(
    'Lookup using schema title = ' +
    JSON.stringify(formValue)
  );

  if (!formValue) {
    throw new Error(
      'FORM SUBMIT mapping FAILED: no value found for schema title: ' +
      title
    );
  }

  const resolvedFormValue =
    Array.isArray(formValue)
      ? formValue[0]
      : formValue;

  Logger.log(
    'Resolved Form value = ' +
    JSON.stringify(resolvedFormValue)
  );

  if (resolvedFormValue !== 'Email') {
    throw new Error(
      'FORM SUBMIT mapping FAILED: expected Email, got ' +
      JSON.stringify(resolvedFormValue)
    );
  }

  // ------------------------------------------------------------
  // Simulate final client object
  // ------------------------------------------------------------

  const client = {};

  client[field.key] = postValue;

  Logger.log('');
  Logger.log('--- Final client object ---');

  Logger.log(
    JSON.stringify(client, null, 2)
  );

  if (client.contactPreference !== 'Email') {
    throw new Error(
      'CLIENT mapping FAILED: contactPreference is not Email.'
    );
  }

  // ------------------------------------------------------------
  // Final result
  // ------------------------------------------------------------

  Logger.log('');
  Logger.log('========================================');
  Logger.log('PASS');
  Logger.log('========================================');

  Logger.log(
    'contactPreference = ' +
    client.contactPreference
  );

  return true;
}






/**
 * ============================================================================
 * TEST — doPost() CONTACT PREFERENCE
 * ============================================================================
 *
 * Tests the exact WordPress POST structure:
 *
 * form_contactPreference = "Email"
 *
 * Expected:
 *   payload.client.contactPreference = "Email"
 *   Admin email = "Email"
 *   Client email = "Email"
 *   Sheet = "Email"
 * ============================================================================
 */
function testDoPostContactPreference() {

  Logger.log('============================================================');
  Logger.log('RD3 TECH — doPost CONTACT PREFERENCE TEST');
  Logger.log('============================================================');

  // --------------------------------------------------------------------------
  // Simulate the exact POST coming from WordPress
  // --------------------------------------------------------------------------

  const e = {

    parameter: {

      form_name: 'Jane Doe',

      form_email: 'jane.doe@example.com',

      form_phone: '021 123 4567',

      form_location: 'Whangarei',

      form_contactPreference: 'Email',

      form_usedBefore: 'Yes',

      form_contactingAs: 'Home or Family',

      form_helpCategory: 'Help with Something Broken?',

      form_userGoal: 'Need help with TV setup',

      form_urgency: 'High',

      form_honeypot: ''

    },

    parameters: {

      form_name: ['Jane Doe'],

      form_email: ['jane.doe@example.com'],

      form_phone: ['021 123 4567'],

      form_location: ['Whangarei'],

      form_contactPreference: ['Email'],

      form_usedBefore: ['Yes'],

      form_contactingAs: ['Home or Family'],

      form_helpCategory: ['Help with Something Broken?'],

      form_userGoal: ['Need help with TV setup'],

      form_urgency: ['High'],

      form_honeypot: ['']

    }

  };


  // --------------------------------------------------------------------------
  // STEP 1 — Test POST parameter extraction
  // --------------------------------------------------------------------------

  Logger.log('');
  Logger.log('--- STEP 1: parseIncomingParameters() ---');

  const rawParams = parseIncomingParameters(e);

  Logger.log(
    'form_contactPreference = "' +
    String(rawParams.form_contactPreference || '') +
    '"'
  );


  if (rawParams.form_contactPreference !== 'Email') {

    throw new Error(
      'FAIL: parseIncomingParameters() did not return "Email".'
    );

  }

  Logger.log('PASS: POST parameter contains Email');


  // --------------------------------------------------------------------------
  // STEP 2 — Test Mapping.gs
  // --------------------------------------------------------------------------

  Logger.log('');
  Logger.log('--- STEP 2: mapFormPayload() ---');

  const mapped = mapFormPayload(rawParams);

  const payload = mapped.payload || {};

  const client = payload.client || {};

  Logger.log('Mapped client object:');
  Logger.log(JSON.stringify(client, null, 2));

  Logger.log(
    'payload.client.contactPreference = "' +
    String(client.contactPreference || '') +
    '"'
  );


  if (client.contactPreference !== 'Email') {

    throw new Error(
      'FAIL: mapFormPayload() lost contactPreference. ' +
      'Expected "Email", got "' +
      String(client.contactPreference || '') +
      '"'
    );

  }

  Logger.log('PASS: Mapping returned contactPreference = Email');


  // --------------------------------------------------------------------------
  // STEP 3 — Test complete doPost()
  // --------------------------------------------------------------------------

  Logger.log('');
  Logger.log('--- STEP 3: doPost() ---');

  const result = doPost(e);

  Logger.log('');
  Logger.log('doPost() RESPONSE:');

  if (result) {

    Logger.log(
      result.getContent()
    );

  } else {

    Logger.log(
      'doPost() returned no response.'
    );

  }


  // --------------------------------------------------------------------------
  // FINAL RESULT
  // --------------------------------------------------------------------------

  Logger.log('');
  Logger.log('============================================================');
  Logger.log('FINAL RESULT');
  Logger.log('============================================================');

  Logger.log(
    'Expected contactPreference: Email'
  );

  Logger.log(
    'Mapped contactPreference: ' +
    String(client.contactPreference || 'NOT PROVIDED')
  );

  if (client.contactPreference === 'Email') {

    Logger.log('PASS — doPost received and mapped Email');

  } else {

    Logger.log('FAIL — contactPreference was lost');

  }

  Logger.log('============================================================');
}