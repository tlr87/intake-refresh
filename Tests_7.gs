/**
 * ============================================================================
 * TEST — CLIENT TEMPLATE FIELD DISPLAY
 * ============================================================================
 *
 * Tests:
 *   client.location
 *   client.contactPreference
 *   request.helpCategory
 *
 * Does NOT send an email.
 */
function testClientTemplateFields() {

  Logger.log('');
  Logger.log('============================================================');
  Logger.log('RD3 TECH — CLIENT TEMPLATE FIELD TEST');
  Logger.log('============================================================');

  // --------------------------------------------------------------------------
  // TEST INPUT
  // --------------------------------------------------------------------------

  var rawParams = {
    "entry.776532163": "Tom Tom",
    "entry.1530707551": "tom.revill@gmail.com",
    "entry.2118395637": "021 123 4567",
    "entry.1366120320": "Whangarei",
    "entry.1955012690": "Email",
    "entry.1871615748": "Yes",
    "entry.480241942": "Home or Family",
    "entry.1402987091": "Help with Something Broken?",
    "entry.785917515": "TV",
    "entry.790093298": "High"
  };

  Logger.log('');
  Logger.log('--- RAW INPUT ---');
  Logger.log(JSON.stringify(rawParams, null, 2));

  // --------------------------------------------------------------------------
  // MAP FORM PAYLOAD
  // --------------------------------------------------------------------------

  var result = mapFormPayload(rawParams);

  Logger.log('');
  Logger.log('--- MAPPED RESULT ---');
  Logger.log(JSON.stringify(result, null, 2));

  // mapFormPayload() returns:
  //
  // {
  //   payload: {...},
  //   displaySchema: {...}
  // }
  //
  // Therefore we extract the actual payload first.

  var payload = result.payload || {};
  var client = payload.client || {};
  var request = payload.request || {};

  // --------------------------------------------------------------------------
  // EXTRACT TEST VALUES
  // --------------------------------------------------------------------------

  var location = client.location || '';
  var contactPreference = client.contactPreference || '';
  var helpCategory = request.helpCategory || '';

  // --------------------------------------------------------------------------
  // TEST 1 — ADDRESS / LOCATION
  // --------------------------------------------------------------------------

  Logger.log('');
  Logger.log('------------------------------------------------------------');
  Logger.log('TEST 1 — ADDRESS / LOCATION');
  Logger.log('------------------------------------------------------------');

  Logger.log('Expected: Whangarei');
  Logger.log('Actual:   ' + location);

  if (location === 'Whangarei') {
    Logger.log('PASS: Address / Location mapped correctly');
  } else {
    Logger.log('FAIL: Address / Location mapping incorrect');
  }

  // --------------------------------------------------------------------------
  // TEST 2 — PREFERRED CONTACT
  // --------------------------------------------------------------------------

  Logger.log('');
  Logger.log('------------------------------------------------------------');
  Logger.log('TEST 2 — PREFERRED CONTACT');
  Logger.log('------------------------------------------------------------');

  Logger.log('Expected: Email');
  Logger.log('Actual:   ' + contactPreference);

  if (contactPreference === 'Email') {
    Logger.log('PASS: Preferred Contact mapped correctly');
  } else {
    Logger.log('FAIL: Preferred Contact mapping incorrect');
  }

  // --------------------------------------------------------------------------
  // TEST 3 — NEED HELP WITH
  // --------------------------------------------------------------------------

  Logger.log('');
  Logger.log('------------------------------------------------------------');
  Logger.log('TEST 3 — NEED HELP WITH');
  Logger.log('------------------------------------------------------------');

  Logger.log('Expected: Help with Something Broken?');
  Logger.log('Actual:   ' + helpCategory);

  if (helpCategory === 'Help with Something Broken?') {
    Logger.log('PASS: Need Help With mapped correctly');
  } else {
    Logger.log('FAIL: Need Help With mapping incorrect');
  }

  // --------------------------------------------------------------------------
  // TEST 4 — CLIENT TEMPLATE VALUES
  // --------------------------------------------------------------------------

  Logger.log('');
  Logger.log('------------------------------------------------------------');
  Logger.log('TEST 4 — CLIENT TEMPLATE VALUES');
  Logger.log('------------------------------------------------------------');

  Logger.log('Client template should receive:');
  Logger.log('client.location           = "' + location + '"');
  Logger.log('client.contactPreference  = "' + contactPreference + '"');
  Logger.log('request.helpCategory      = "' + helpCategory + '"');

  var clientTemplateData = {
    client: {
      location: location,
      contactPreference: contactPreference
    },
    request: {
      helpCategory: helpCategory
    }
  };

  Logger.log('');
  Logger.log('Template data:');
  Logger.log(JSON.stringify(clientTemplateData, null, 2));

  // --------------------------------------------------------------------------
  // TEST 5 — NEED HELP WITH DISPLAY TRANSFORMATION
  // --------------------------------------------------------------------------

  Logger.log('');
  Logger.log('------------------------------------------------------------');
  Logger.log('TEST 5 — NEED HELP WITH DISPLAY');
  Logger.log('------------------------------------------------------------');

  var displayedHelpCategory =
    (helpCategory || 'Not specified')
      .replace(/^Help with\s+/i, '');

  Logger.log('Original:  "' + helpCategory + '"');
  Logger.log('Displayed: "' + displayedHelpCategory + '"');

  if (displayedHelpCategory === 'Something Broken?') {
    Logger.log('PASS: Existing template transformation works');
  } else {
    Logger.log('FAIL: Existing template transformation unexpected');
  }

  // --------------------------------------------------------------------------
  // FINAL RESULT
  // --------------------------------------------------------------------------

  var allPassed =
    location === 'Whangarei' &&
    contactPreference === 'Email' &&
    helpCategory === 'Help with Something Broken?';

  Logger.log('');
  Logger.log('============================================================');

  if (allPassed) {
    Logger.log('RESULT: ALL FIELD MAPPING TESTS PASSED');
  } else {
    Logger.log('RESULT: ONE OR MORE FIELD MAPPING TESTS FAILED');
  }

  Logger.log('============================================================');
  Logger.log('');
}






/**
 * ============================================================================
 * TEST — CLIENT TEMPLATE RENDERING
 * ============================================================================
 *
 * Tests the actual ClientTemplate.html template using the mapped payload.
 *
 * Does NOT send an email.
 * Does NOT trigger onFormSubmit().
 */
function testClientTemplateRendering() {

  Logger.log('');
  Logger.log('============================================================');
  Logger.log('RD3 TECH — CLIENT TEMPLATE RENDERING TEST');
  Logger.log('============================================================');

  // --------------------------------------------------------------------------
  // TEST INPUT
  // --------------------------------------------------------------------------

  var rawParams = {
    "entry.776532163": "Tom Tom",
    "entry.1530707551": "tom.revill@gmail.com",
    "entry.2118395637": "021 123 4567",
    "entry.1366120320": "Whangarei",
    "entry.1955012690": "Email",
    "entry.1871615748": "Yes",
    "entry.480241942": "Home or Family",
    "entry.1402987091": "Help with Something Broken?",
    "entry.785917515": "TV",
    "entry.790093298": "High"
  };

  // --------------------------------------------------------------------------
  // MAP PAYLOAD
  // --------------------------------------------------------------------------

  Logger.log('');
  Logger.log('--- MAPPING FORM DATA ---');

  var result = mapFormPayload(rawParams);

  var payload = result.payload || {};

  Logger.log('Payload created: ' + !!payload);

  // --------------------------------------------------------------------------
  // EXTRACT TEMPLATE VARIABLES
  // --------------------------------------------------------------------------

  var client = payload.client || {};
  var request = payload.request || {};
  var submissionDate = payload.submissionDate || '';

  Logger.log('');
  Logger.log('--- TEMPLATE VARIABLES ---');

  Logger.log('client.name:               ' + client.name);
  Logger.log('client.email:              ' + client.email);
  Logger.log('client.phone:              ' + client.phone);
  Logger.log('client.location:           ' + client.location);
  Logger.log('client.contactPreference:  ' + client.contactPreference);
  Logger.log('client.contactingAs:       ' + client.contactingAs);
  Logger.log('client.usedBefore:          ' + client.usedBefore);

  Logger.log('request.helpCategory:      ' + request.helpCategory);
  Logger.log('request.userGoal:          ' + request.userGoal);
  Logger.log('request.urgency:           ' + request.urgency);

  // --------------------------------------------------------------------------
  // CREATE TEMPLATE
  // --------------------------------------------------------------------------

  Logger.log('');
  Logger.log('--- CREATING CLIENT TEMPLATE ---');

  var template = HtmlService.createTemplateFromFile('ClientEmail');

  // --------------------------------------------------------------------------
  // PASS VARIABLES TO TEMPLATE
  // --------------------------------------------------------------------------

  template.payload = payload;
  template.client = client;
  template.request = request;
  template.submissionDate = submissionDate;

  Logger.log('Template variables assigned.');

  // --------------------------------------------------------------------------
  // EVALUATE TEMPLATE
  // --------------------------------------------------------------------------

  Logger.log('');
  Logger.log('--- EVALUATING TEMPLATE ---');

  var htmlOutput;

  try {

    htmlOutput = template.evaluate();

    Logger.log('PASS: ClientTemplate.html evaluated successfully.');

  } catch (error) {

    Logger.log('FAIL: ClientTemplate.html evaluation failed.');
    Logger.log('Error: ' + error);

    return;
  }

  // --------------------------------------------------------------------------
  // GET HTML
  // --------------------------------------------------------------------------

  var html = htmlOutput.getContent();

  Logger.log('');
  Logger.log('--- RENDERED HTML CHECK ---');

  Logger.log('HTML length: ' + html.length);

  // --------------------------------------------------------------------------
  // TEST 1 — LOCATION
  // --------------------------------------------------------------------------

  Logger.log('');
  Logger.log('------------------------------------------------------------');
  Logger.log('TEST 1 — ADDRESS / LOCATION');
  Logger.log('------------------------------------------------------------');

  if (html.indexOf('Whangarei') !== -1) {
    Logger.log('PASS: "Whangarei" exists in rendered HTML.');
  } else {
    Logger.log('FAIL: "Whangarei" NOT found in rendered HTML.');
  }

  // --------------------------------------------------------------------------
  // TEST 2 — PREFERRED CONTACT
  // --------------------------------------------------------------------------

  Logger.log('');
  Logger.log('------------------------------------------------------------');
  Logger.log('TEST 2 — PREFERRED CONTACT');
  Logger.log('------------------------------------------------------------');

  if (html.indexOf('Email') !== -1) {
    Logger.log('PASS: "Email" exists in rendered HTML.');
  } else {
    Logger.log('FAIL: "Email" NOT found in rendered HTML.');
  }

  // --------------------------------------------------------------------------
  // TEST 3 — NEED HELP WITH
  // --------------------------------------------------------------------------

  Logger.log('');
  Logger.log('------------------------------------------------------------');
  Logger.log('TEST 3 — NEED HELP WITH');
  Logger.log('------------------------------------------------------------');

  if (html.indexOf('Something Broken?') !== -1) {
    Logger.log('PASS: "Something Broken?" exists in rendered HTML.');
  } else {
    Logger.log('FAIL: "Something Broken?" NOT found in rendered HTML.');
  }

  // --------------------------------------------------------------------------
  // TEST 4 — ORIGINAL HELP CATEGORY
  // --------------------------------------------------------------------------

  Logger.log('');
  Logger.log('------------------------------------------------------------');
  Logger.log('TEST 4 — HELP CATEGORY TRANSFORMATION');
  Logger.log('------------------------------------------------------------');

  if (html.indexOf('Help with Something Broken?') === -1 &&
      html.indexOf('Something Broken?') !== -1) {

    Logger.log('PASS: "Help with " prefix was removed by template.');

  } else if (html.indexOf('Something Broken?') !== -1) {

    Logger.log('PASS: Displayed help category exists.');

  } else {

    Logger.log('FAIL: Expected help category display not found.');
  }

  // --------------------------------------------------------------------------
  // TEST 5 — OTHER CLIENT DATA
  // --------------------------------------------------------------------------

  Logger.log('');
  Logger.log('------------------------------------------------------------');
  Logger.log('TEST 5 — OTHER CLIENT DATA');
  Logger.log('------------------------------------------------------------');

  var otherFieldsPassed =
    html.indexOf('Tom Tom') !== -1 &&
    html.indexOf('tom.revill@gmail.com') !== -1 &&
    html.indexOf('021 123 4567') !== -1 &&
    html.indexOf('TV') !== -1;

  if (otherFieldsPassed) {
    Logger.log('PASS: Other client/request values rendered.');
  } else {
    Logger.log('FAIL: One or more other values missing.');
  }

  // --------------------------------------------------------------------------
  // TEST 6 — NO TEMPLATE ERRORS
  // --------------------------------------------------------------------------

  Logger.log('');
  Logger.log('------------------------------------------------------------');
  Logger.log('TEST 6 — TEMPLATE ERROR CHECK');
  Logger.log('------------------------------------------------------------');

  var hasReferenceError =
    html.indexOf('ReferenceError') !== -1 ||
    html.indexOf('TypeError') !== -1 ||
    html.indexOf('undefined') !== -1;

  if (!hasReferenceError) {
    Logger.log('PASS: No obvious template errors found in rendered HTML.');
  } else {
    Logger.log('FAIL: Possible template error detected.');
  }

  // --------------------------------------------------------------------------
  // OPTIONAL — LOG RELEVANT HTML
  // --------------------------------------------------------------------------

  Logger.log('');
  Logger.log('--- RELEVANT RENDERED HTML ---');

  var locationPos = html.indexOf('Whangarei');

  if (locationPos !== -1) {
    Logger.log(
      html.substring(
        Math.max(0, locationPos - 300),
        Math.min(html.length, locationPos + 500)
      )
    );
  }

  // --------------------------------------------------------------------------
  // FINAL
  // --------------------------------------------------------------------------

  var passed =
    html.indexOf('Whangarei') !== -1 &&
    html.indexOf('Email') !== -1 &&
    html.indexOf('Something Broken?') !== -1 &&
    html.indexOf('Tom Tom') !== -1 &&
    html.indexOf('tom.revill@gmail.com') !== -1 &&
    html.indexOf('021 123 4567') !== -1 &&
    html.indexOf('TV') !== -1 &&
    !hasReferenceError;

  Logger.log('');
  Logger.log('============================================================');

  if (passed) {
    Logger.log('RESULT: CLIENT TEMPLATE RENDERING PASSED');
  } else {
    Logger.log('RESULT: CLIENT TEMPLATE RENDERING FAILED');
  }

  Logger.log('============================================================');
  Logger.log('');
}