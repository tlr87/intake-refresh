/**
 * ============================================================================
 * FULL MAPPING DIAGNOSTIC TEST
 * ============================================================================
 *
 * Purpose:
 * Walk through EVERY FIELD_SCHEMA entry and show exactly how each field
 * is processed from incoming parameters into the final mapped payload.
 *
 * This test does NOT modify the mapping engine.
 */
function testFullMappingDiagnostic() {

  Logger.log('');
  Logger.log('============================================================');
  Logger.log('RD3 TECH — FULL FIELD MAPPING DIAGNOSTIC');
  Logger.log('============================================================');

  /**
   * Simulated incoming request.
   *
   * These represent the Google Forms entry IDs currently defined
   * in FIELD_SCHEMA.
   */
  const params = {

    'entry.776532163': 'Tom Tom',
    'entry.1530707551': 'tom.revill@gmail.com',
    'entry.2118395637': '021 123 4567',
    'entry.1366120320': 'Whangarei',
    'entry.1955012690': 'Email',
    'entry.1871615748': 'Yes',
    'entry.480241942': 'Home or Family',
    'entry.1402987091': 'Help with Something Broken?',
    'entry.785917515': 'TV',
    'entry.790093298': 'High'

  };


  Logger.log('');
  Logger.log('------------------------------------------------------------');
  Logger.log('1. RAW INPUT');
  Logger.log('------------------------------------------------------------');

  Logger.log(JSON.stringify(params, null, 2));


  /**
   * Process every field individually.
   */
  FIELD_SCHEMA.forEach(function(field, index) {

    Logger.log('');
    Logger.log('============================================================');
    Logger.log(
      'FIELD ' +
      (index + 1) +
      ' / ' +
      FIELD_SCHEMA.length
    );
    Logger.log('============================================================');

    Logger.log('Key:         ' + field.key);
    Logger.log('Form Field:  ' + field.formField);
    Logger.log('Label:       ' + field.label);
    Logger.log('Section:     ' + field.section);
    Logger.log('Default:     ' + JSON.stringify(field.default));
    Logger.log(
      'Aliases:     ' +
      JSON.stringify(field.aliases || [])
    );


    /**
     * Build the exact list of keys that the mapper checks.
     *
     * This mirrors getMappedFieldValue().
     */
    const possibleKeys = [
      field.formField,
      field.key,
      field.label
    ];

    if (Array.isArray(field.aliases)) {
      possibleKeys.push.apply(
        possibleKeys,
        field.aliases
      );
    }


    Logger.log('');
    Logger.log('Possible incoming keys:');
    Logger.log(JSON.stringify(possibleKeys));


    /**
     * Find the actual matching incoming key.
     */
    const incomingKeys = Object.keys(params);

    let matchedKey = null;
    let rawValue = undefined;

    for (let i = 0; i < possibleKeys.length; i++) {

      const wanted = String(possibleKeys[i])
        .trim()
        .toLowerCase();

      for (let j = 0; j < incomingKeys.length; j++) {

        const actual = incomingKeys[j]
          .trim()
          .toLowerCase();

        if (actual === wanted) {

          const value = params[incomingKeys[j]];

          if (
            value !== undefined &&
            value !== null &&
            String(value).trim() !== ''
          ) {

            matchedKey = incomingKeys[j];
            rawValue = value;

            break;
          }
        }
      }

      if (matchedKey !== null) {
        break;
      }
    }


    Logger.log('');
    Logger.log('MATCH RESULT');
    Logger.log('------------------------------------------------------------');

    if (matchedKey !== null) {

      Logger.log('Matched key:       ' + matchedKey);
      Logger.log('Raw value:         ' + JSON.stringify(rawValue));

    } else {

      Logger.log('Matched key:       NONE');
      Logger.log('Raw value:         undefined');
    }


    /**
     * Reproduce the processing performed by mapFormPayload().
     */
    let processedValue;
    let processing = 'Standard string processing';
    let usedDefault = false;


    if (matchedKey === null) {

      processedValue = field.default;
      usedDefault = true;
      processing = 'Default value applied';

    } else if (field.key === 'usedBefore') {

      processedValue =
        normalisePreviousCustomer(rawValue);

      processing =
        'normalisePreviousCustomer() → Boolean';

    } else {

      processedValue = String(rawValue).trim();

    }


    Logger.log('');
    Logger.log('PROCESSING');
    Logger.log('------------------------------------------------------------');
    Logger.log('Processing:         ' + processing);
    Logger.log('Default used:       ' + usedDefault);
    Logger.log(
      'Processed value:    ' +
      JSON.stringify(processedValue)
    );
    Logger.log(
      'Processed type:     ' +
      typeof processedValue
    );


    /**
     * Show where the value ultimately goes.
     */
    Logger.log('');
    Logger.log('FINAL PAYLOAD DESTINATION');
    Logger.log('------------------------------------------------------------');

    Logger.log(
      'payload.' +
      field.section +
      '.' +
      field.key
    );

    Logger.log(
      'Final value:        ' +
      JSON.stringify(processedValue)
    );


    /**
     * Display-schema representation.
     */
    let displayValue;

    if (field.key === 'usedBefore') {

      displayValue =
        processedValue ? 'Yes' : 'No';

    } else {

      displayValue =
        String(processedValue);
    }


    Logger.log('');
    Logger.log('DISPLAY SCHEMA');
    Logger.log('------------------------------------------------------------');

    Logger.log(
      JSON.stringify({
        key: field.key,
        label: field.label,
        value: displayValue
      })
    );

  });


  /**
   * Now run the ACTUAL mapper as well.
   *
   * This confirms that the diagnostic agrees with the real
   * mapFormPayload() function.
   */
  Logger.log('');
  Logger.log('============================================================');
  Logger.log('2. ACTUAL mapFormPayload() RESULT');
  Logger.log('============================================================');

  const result = mapFormPayload(params);


  Logger.log('');
  Logger.log('FINAL PAYLOAD');
  Logger.log('------------------------------------------------------------');

  Logger.log(
    JSON.stringify(
      result.payload,
      null,
      2
    )
  );


  Logger.log('');
  Logger.log('DISPLAY SCHEMA');
  Logger.log('------------------------------------------------------------');

  Logger.log(
    JSON.stringify(
      result.displaySchema,
      null,
      2
    )
  );


  Logger.log('');
  Logger.log('============================================================');
  Logger.log('DIAGNOSTIC COMPLETE');
  Logger.log('============================================================');
}






function testOnFormSubmitMapping() {

  Logger.log('');
  Logger.log('============================================================');
  Logger.log('RD3 TECH — onFormSubmit() MAPPING DIAGNOSTIC');
  Logger.log('============================================================');


  // -------------------------------------------------------------------------
  // 1. CREATE TEST EVENT
  // -------------------------------------------------------------------------

  const e = generateMockFormEvent();
  const formResponse = e.response;

  Logger.log('');
  Logger.log('------------------------------------------------------------');
  Logger.log('1. FORM RESPONSE');
  Logger.log('------------------------------------------------------------');

  Logger.log(
    'Respondent email: ' +
    formResponse.getRespondentEmail()
  );


  // -------------------------------------------------------------------------
  // 2. GET CONFIGURATION
  // -------------------------------------------------------------------------

  const formConfig = getFormConfig();
  const fieldsConfig = formConfig.fields || {};

  const nameTitle =
    fieldsConfig.name
      ? fieldsConfig.name.titleMatch.toLowerCase()
      : 'name';

  const emailTitle =
    fieldsConfig.email
      ? fieldsConfig.email.titleMatch.toLowerCase()
      : 'email';

  const goalTitle =
    fieldsConfig.userGoal
      ? fieldsConfig.userGoal.titleMatch.toLowerCase()
      : 'goal';

  const urgencyTitle =
    fieldsConfig.urgency
      ? fieldsConfig.urgency.titleMatch.toLowerCase()
      : 'urgency';

  const honeypotTitle =
    fieldsConfig.honeypot
      ? fieldsConfig.honeypot.titleMatch.toLowerCase()
      : 'leave blank';


  Logger.log('');
  Logger.log('------------------------------------------------------------');
  Logger.log('2. TITLE MATCH CONFIGURATION');
  Logger.log('------------------------------------------------------------');

  Logger.log('nameTitle:      ' + nameTitle);
  Logger.log('emailTitle:     ' + emailTitle);
  Logger.log('goalTitle:      ' + goalTitle);
  Logger.log('urgencyTitle:   ' + urgencyTitle);
  Logger.log('honeypotTitle:  ' + honeypotTitle);


  // -------------------------------------------------------------------------
  // 3. VARIABLES USED BY onFormSubmit()
  // -------------------------------------------------------------------------

  let name = '';
  let extractedUserEmail =
    formResponse.getRespondentEmail() || '';

  let userGoal = '';
  let selectedUrgency = '';
  let honeypotValue = '';
  let phone = '';
  let location = '';
  let preferredContact = 'Email';
  let isPreviousCustomer = false;
  let contactingAs = 'Individual';
  let situation = '';
  let timeframe = '';

  const itemResponses =
    formResponse.getItemResponses();


  // -------------------------------------------------------------------------
  // 4. SHOW EVERY FORM RESPONSE
  // -------------------------------------------------------------------------

  Logger.log('');
  Logger.log('============================================================');
  Logger.log('3. RAW GOOGLE FORM RESPONSES');
  Logger.log('============================================================');

  itemResponses.forEach(function(itemResponse, index) {

    const title =
      itemResponse.getItem().getTitle();

    const rawResponse =
      itemResponse.getResponse();

    const lowerTitle =
      title.toLowerCase();


    Logger.log('');
    Logger.log(
      'FIELD ' +
      (index + 1) +
      ' / ' +
      itemResponses.length
    );

    Logger.log('------------------------------------------------------------');

    Logger.log('Title:       ' + title);
    Logger.log('Lower title: ' + lowerTitle);
    Logger.log(
      'Raw value:   ' +
      JSON.stringify(rawResponse)
    );


    // ---------------------------------------------------------
    // SHOW EVERY MATCH THAT onFormSubmit() WOULD MAKE
    // ---------------------------------------------------------

    const matches = [];


    if (
      lowerTitle.includes(nameTitle)
    ) {
      matches.push('name');
    }

    if (
      lowerTitle.includes(emailTitle)
    ) {
      matches.push('email');
    }

    if (
      lowerTitle.includes(goalTitle)
    ) {
      matches.push('userGoal');
    }

    if (
      lowerTitle.includes(urgencyTitle)
    ) {
      matches.push('selectedUrgency');
    }

    if (
      lowerTitle.includes(honeypotTitle)
    ) {
      matches.push('honeypotValue');
    }

    if (
      lowerTitle.includes('phone')
    ) {
      matches.push('phone');
    }

    if (
      lowerTitle.includes('location') ||
      lowerTitle.includes('address')
    ) {
      matches.push('location');
    }

    if (
      lowerTitle.includes('preferred contact')
    ) {
      matches.push('preferredContact');
    }

    if (
      lowerTitle.includes('previous')
    ) {
      matches.push('isPreviousCustomer');
    }

    if (
      lowerTitle.includes('as an individual') ||
      lowerTitle.includes('business')
    ) {
      matches.push('contactingAs');
    }

    if (
      lowerTitle.includes('situation')
    ) {
      matches.push('situation');
    }

    if (
      lowerTitle.includes('timeframe') ||
      lowerTitle.includes('how soon')
    ) {
      matches.push('timeframe');
    }


    if (matches.length) {

      Logger.log(
        'MATCHES:      ' +
        matches.join(', ')
      );

    } else {

      Logger.log(
        'MATCHES:      NONE'
      );
    }


    // ---------------------------------------------------------
    // APPLY EXACT SAME LOGIC AS onFormSubmit()
    // ---------------------------------------------------------

    if (
      lowerTitle.includes(nameTitle) &&
      !name
    ) {
      name = String(rawResponse);
    }

    if (
      lowerTitle.includes(emailTitle) &&
      !extractedUserEmail
    ) {
      extractedUserEmail =
        String(rawResponse);
    }

    if (
      lowerTitle.includes(goalTitle)
    ) {
      userGoal =
        String(rawResponse);
    }

    if (
      lowerTitle.includes(urgencyTitle)
    ) {
      selectedUrgency =
        String(rawResponse);
    }

    if (
      lowerTitle.includes(honeypotTitle)
    ) {
      honeypotValue =
        String(rawResponse);
    }

    if (
      lowerTitle.includes('phone')
    ) {
      phone =
        String(rawResponse);
    }

    if (
      lowerTitle.includes('location') ||
      lowerTitle.includes('address')
    ) {
      location =
        String(rawResponse);
    }

    if (
      lowerTitle.includes('preferred contact')
    ) {
      preferredContact =
        String(rawResponse);
    }

    if (
      lowerTitle.includes('previous')
    ) {
      isPreviousCustomer =
        String(rawResponse)
          .toLowerCase()
          .includes('yes');
    }

    if (
      lowerTitle.includes('as an individual') ||
      lowerTitle.includes('business')
    ) {
      contactingAs =
        String(rawResponse);
    }

    if (
      lowerTitle.includes('situation')
    ) {
      situation =
        String(rawResponse);
    }

    if (
      lowerTitle.includes('timeframe') ||
      lowerTitle.includes('how soon')
    ) {
      timeframe =
        String(rawResponse);
    }

  });


  // -------------------------------------------------------------------------
  // 5. SHOW EXACT VARIABLES PRODUCED BY onFormSubmit()
  // -------------------------------------------------------------------------

  Logger.log('');
  Logger.log('============================================================');
  Logger.log('4. VARIABLES PRODUCED BY onFormSubmit()');
  Logger.log('============================================================');

  Logger.log('');
  Logger.log('CLIENT');
  Logger.log('------------------------------------------------------------');

  Logger.log('name:                 ' + JSON.stringify(name));
  Logger.log(
    'extractedUserEmail:   ' +
    JSON.stringify(extractedUserEmail)
  );
  Logger.log('phone:                ' + JSON.stringify(phone));
  Logger.log('location:             ' + JSON.stringify(location));
  Logger.log(
    'preferredContact:     ' +
    JSON.stringify(preferredContact)
  );
  Logger.log(
    'isPreviousCustomer:   ' +
    JSON.stringify(isPreviousCustomer)
  );
  Logger.log(
    'contactingAs:         ' +
    JSON.stringify(contactingAs)
  );


  Logger.log('');
  Logger.log('REQUEST');
  Logger.log('------------------------------------------------------------');

  Logger.log(
    'situation:            ' +
    JSON.stringify(situation)
  );

  Logger.log(
    'userGoal:             ' +
    JSON.stringify(userGoal)
  );

  Logger.log(
    'selectedUrgency:      ' +
    JSON.stringify(selectedUrgency)
  );

  Logger.log(
    'timeframe:            ' +
    JSON.stringify(timeframe)
  );


  Logger.log('');
  Logger.log('SECURITY');
  Logger.log('------------------------------------------------------------');

  Logger.log(
    'honeypotValue:        ' +
    JSON.stringify(honeypotValue)
  );


  // -------------------------------------------------------------------------
  // 6. BUILD EXACT SAME OBJECTS AS onFormSubmit()
  // -------------------------------------------------------------------------

  const clientData = {
    name: name || 'Website Visitor',
    firstName: name
      ? name.split(' ')[0]
      : 'there',
    email: extractedUserEmail || 'N/A',
    phone: phone || 'N/A',
    location: location || 'N/A',
    preferredContact: preferredContact,
    isPreviousCustomer: isPreviousCustomer,
    contactingAs: contactingAs
  };


  const requestData = {
    situation:
      situation ||
      userGoal ||
      'Not specified',

    userGoal:
      userGoal ||
      'Not specified',

    urgency:
      timeframe ||
      selectedUrgency ||
      'Not specified'
  };


  // -------------------------------------------------------------------------
  // 7. SHOW FINAL EMAIL DATA
  // -------------------------------------------------------------------------

  Logger.log('');
  Logger.log('============================================================');
  Logger.log('5. FINAL EMAIL DATA');
  Logger.log('============================================================');

  Logger.log('');
  Logger.log('CLIENT DATA');
  Logger.log('------------------------------------------------------------');

  Logger.log(
    JSON.stringify(
      clientData,
      null,
      2
    )
  );


  Logger.log('');
  Logger.log('REQUEST DATA');
  Logger.log('------------------------------------------------------------');

  Logger.log(
    JSON.stringify(
      requestData,
      null,
      2
    )
  );


  // -------------------------------------------------------------------------
  // 8. SUMMARY
  // -------------------------------------------------------------------------

  Logger.log('');
  Logger.log('============================================================');
  Logger.log('6. MAPPING SUMMARY');
  Logger.log('============================================================');

  Logger.log(
    'Form fields received: ' +
    itemResponses.length
  );

  Logger.log(
    'Name:                 ' +
    (name ? 'OK' : 'MISSING')
  );

  Logger.log(
    'Email:                ' +
    (extractedUserEmail ? 'OK' : 'MISSING')
  );

  Logger.log(
    'Phone:                ' +
    (phone ? 'OK' : 'MISSING')
  );

  Logger.log(
    'Location:             ' +
    (location ? 'OK' : 'MISSING')
  );

  Logger.log(
    'Preferred Contact:    ' +
    (preferredContact ? 'OK' : 'MISSING')
  );

  Logger.log(
    'Previous Customer:    ' +
    (isPreviousCustomer ? 'Yes' : 'No')
  );

  Logger.log(
    'Contacting As:        ' +
    (contactingAs ? 'OK' : 'MISSING')
  );

  Logger.log(
    'Situation:            ' +
    (situation ? 'OK' : 'MISSING')
  );

  Logger.log(
    'User Goal:            ' +
    (userGoal ? 'OK' : 'MISSING')
  );

  Logger.log(
    'Urgency:              ' +
    (selectedUrgency ? 'OK' : 'MISSING')
  );

  Logger.log('');
  Logger.log('============================================================');
  Logger.log('onFormSubmit() MAPPING DIAGNOSTIC COMPLETE');
  Logger.log('============================================================');
}