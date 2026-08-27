function testEmailPipeline() {
  Logger.log('============================================================');
  Logger.log('STARTING MANUAL EMAIL TEST');
  Logger.log('============================================================');

  const mockWebParams = {
    form_name: 'Test User',
    form_email: 'tom.revill@gmail.com',
    form_phone: '+64 21 000 0000',
    form_location: 'Auckland, NZ',
    form_contactPreference: 'Email',
    form_clientType: 'Potential Client',
    form_usedBefore: 'Yes',
    form_helpCategory: 'Google Workspace Integration',
    form_userGoal: 'Test automated submission pipeline',
    form_urgency: 'High'
  };

  // 1. Destructure payload and displaySchema directly from mapFormPayload
  const { payload, displaySchema } = mapFormPayload(mockWebParams);

  // Safety check
  if (!payload || !payload.client) {
    Logger.log('ERROR: mapFormPayload() failed to return a valid payload.');
    return;
  }

  const client = payload.client;
  const request = payload.request;
  const recipient = client.email || Session.getActiveUser().getEmail();

  // 2. Build Simple HTML Body
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #e0e0e0; border-radius: 6px;">
      <h2 style="color: #1a73e8; margin-top: 0;">RD3 Tech — Pipeline Test</h2>
      <p style="color: #555;">Automated test email confirming payload mapping.</p>
      
      <h3 style="border-bottom: 2px solid #eee; padding-bottom: 5px; color: #333;">Client Info</h3>
      <ul style="line-height: 1.6; color: #444;">
        <li><strong>Name:</strong> ${client.name}</li>
        <li><strong>Email:</strong> ${client.email}</li>
        <li><strong>Phone:</strong> ${client.phone}</li>
        <li><strong>Location:</strong> ${client.location}</li>
        <li><strong>Contact Pref:</strong> ${client.contactPreference}</li>
        <li><strong>Previous Customer:</strong> ${client.usedBefore ? 'Yes' : 'No'}</li>
      </ul>

      <h3 style="border-bottom: 2px solid #eee; padding-bottom: 5px; color: #333;">Request Details</h3>
      <ul style="line-height: 1.6; color: #444;">
        <li><strong>Category:</strong> ${request.helpCategory}</li>
        <li><strong>Goal:</strong> ${request.userGoal}</li>
        <li><strong>Urgency:</strong> ${request.urgency}</li>
      </ul>

      <p style="font-size: 12px; color: #888; margin-top: 20px;">Timestamp: ${payload.submissionDate}</p>
    </div>
  `;

  // 3. Send Email
  try {
    MailApp.sendEmail({
      to: recipient,
      subject: `[TEST] Submission from ${client.name}`,
      htmlBody: htmlBody
    });

    Logger.log('============================================================');
    Logger.log('SUCCESS: Test email sent to ' + recipient);
    Logger.log('============================================================');
  } catch (err) {
    Logger.log('ERROR sending email: ' + err.toString());
  }
}



/**
 * Diagnostic test to verify Spreadsheet access and property configuration.
 */
function test_diagnoseSheetAccess() {
  Logger.log('============================================================');
  Logger.log('DIAGNOSING SPREADSHEET ACCESS');
  Logger.log('============================================================');

  // 1. Check Script Properties
  const props = PropertiesService.getScriptProperties().getProperties();
  Logger.log('Script Properties Found: ' + JSON.stringify(Object.keys(props)));

  const sheetId = props['SPREADSHEET_ID'] || (typeof getFormConfig === 'function' ? getFormConfig().spreadsheetId : null);
  Logger.log('Target Spreadsheet ID: ' + sheetId);

  if (!sheetId) {
    Logger.log('❌ FAIL: No Spreadsheet ID found in Script Properties or Config.');
    return;
  }

  // 2. Test Direct Opening
  try {
    const ss = SpreadsheetApp.openById(sheetId);
    Logger.log('✓ SUCCESS: Opened Spreadsheet: "' + ss.getName() + '"');

    const sheets = ss.getSheets().map(s => s.getName());
    Logger.log('Available Sheet Tabs: ' + JSON.stringify(sheets));

  } catch (err) {
    Logger.log('❌ FAIL: SpreadsheetApp.openById() failed.');
    Logger.log('Error: ' + err.toString());
  }
}



/**
 * ============================================================================
 * RD3 TECH — GOOGLE SHEET RECORDING TEST
 * ============================================================================
 * Verifies that form submissions are successfully written to the Google Sheet.
 * ============================================================================
 */
function test_saveToSheet_DirectWrite() {
  const TARGET_SHEET_ID = '1xKJWg66c4h4rdRjRg-BrTqpS_V76RYYJfF_6V2lJ-1g';

  Logger.log('============================================================');
  Logger.log('RD3 TECH — GOOGLE SHEET RECORDING TEST');
  Logger.log('Target Sheet ID: ' + TARGET_SHEET_ID);
  Logger.log('============================================================');

  // 1. Setup mock form parameters matching client website schema
  const mockWebParams = {
    form_name: 'Sheet Test User',
    form_email: 'sheet.test@example.com',
    form_phone: '021 999 8888',
    form_location: 'Whangārei Test Lab',
    form_contactPreference: 'Email',
    form_clientType: 'Small Business',
    form_usedBefore: 'Yes',
    form_helpCategory: 'Help with Something Better?',
    form_userGoal: 'AUTOMATED TEST ROW — Verifying saveToSheet pipeline writing capability.',
    form_urgency: 'Medium'
  };

  Logger.log('1. Mapping mock payload...');
  const mapped = mapFormPayload(mockWebParams);
  const payload = mapped.payload;

  Logger.log('Data to record: ' + JSON.stringify(payload));

  // 2. Attempt to save raw mapped payload directly to sheet
  try {
    Logger.log('2. Attempting to write row to Google Sheet [' + TARGET_SHEET_ID + ']...');
    
    // Pass the mapped payload directly into saveToSheet
    const result = saveToSheet(payload);

    Logger.log('Write attempt completed.');
    Logger.log('Saver Output: ' + JSON.stringify(result));

    if (result === true) {
      Logger.log('============================================================');
      Logger.log('✓ PASS: SHEET RECORDING SUCCESSFUL');
      Logger.log('Check Google Sheet (' + TARGET_SHEET_ID + ') to confirm the test row appears.');
      Logger.log('============================================================');
    } else {
      Logger.log('============================================================');
      Logger.log('⚠️ WARNING: saveToSheet returned false for Sheet ID: ' + TARGET_SHEET_ID);
      Logger.log('============================================================');
    }

  } catch (err) {
    Logger.log('============================================================');
    Logger.log('❌ FAIL: SHEET RECORDING FAILED');
    Logger.log('Target Sheet ID: ' + TARGET_SHEET_ID);
    Logger.log('Error Details: ' + err.toString());
    if (err.stack) {
      Logger.log('Stack Trace: ' + err.stack);
    }
    Logger.log('============================================================');
  }
}
