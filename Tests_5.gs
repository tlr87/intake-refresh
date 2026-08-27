/**
 * ============================================================================
 * MappingTests.gs
 * ============================================================================
 */

function test_locationMapping() {
  Logger.log('============================================================');
  Logger.log('RD3 TECH — LOCATION FIELD VERIFICATION TEST');
  Logger.log('============================================================');

  // Test Case 1: Standard Website Form Payload (form_location)
  const webPayload = {
    form_name: 'Location Test User',
    form_email: 'location.test1@example.com',
    form_location: '123 Regent Street, Whangārei'
  };

  // Test Case 2: Google Form Entry Parameter Payload (entry.1366120320)
  const formPayload = {
    'entry.776532163': 'Google Form User',
    'entry.1530707551': 'location.test2@example.com',
    'entry.1366120320': '456 Kamo Road, Whangārei'
  };

  // Test Case 3: Direct API / Object Key (location)
  const directPayload = {
    name: 'Direct User',
    email: 'location.test3@example.com',
    location: '789 Onerahi Road, Whangārei'
  };

  const testCases = [
    { name: 'Website Params (form_location)', input: webPayload, expected: '123 Regent Street, Whangārei' },
    { name: 'Google Form Entry (entry.1366120320)', input: formPayload, expected: '456 Kamo Road, Whangārei' },
    { name: 'Direct Object (location)', input: directPayload, expected: '789 Onerahi Road, Whangārei' }
  ];

  let passCount = 0;

  testCases.forEach(function(test, idx) {
    Logger.log('\n--- Test Case ' + (idx + 1) + ': ' + test.name + ' ---');
    const mapped = mapFormPayload(test.input);
    const resolvedLocation = mapped.payload.client.location;

    if (resolvedLocation === test.expected && resolvedLocation !== 'Not provided') {
      Logger.log('✓ PASS: Location correctly resolved (' + resolvedLocation + ')');
      passCount++;
    } else {
      Logger.log('❌ FAIL: Expected "' + test.expected + '" but got "' + resolvedLocation + '"');
    }
  });

  Logger.log('\n============================================================');
  Logger.log('RESULTS: ' + passCount + '/' + testCases.length + ' Location tests passed.');
  Logger.log('============================================================');
}