/**
 * WebAppHandler.gs - Production Ready
 * Handles incoming POST requests from the HTML contact form
 * and safely appends submissions to Google Sheets.
 */

function doPost(e) {
  // Prevent concurrent write collisions when multiple users submit at once
  const lock = LockService.getScriptLock();
  lock.tryLock(10000); // Wait up to 10 seconds for concurrent submissions

  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error("Invalid or empty payload received.");
    }

    // Parse incoming JSON payload from the request body
    const data = JSON.parse(e.postData.contents);
    
    // Access the active spreadsheet and targeted sheet tab
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("Form Responses") || ss.getSheets()[0];
    
    // Generate timestamp for audit tracking
    const timestamp = new Date();
    
    // Structure row data to match table columns
    const rowData = [
      timestamp,
      data.fullName || "",
      data.email || "",
      data.phone || "",
      data.company || "",
      data.serviceRequested || "",
      data.budgetRange || "",
      data.message || "",
      "New" // Default Status
    ];
    
    // Append the response row to the bottom of the sheet
    sheet.appendRow(rowData);
    
    // Return success response formatted with JSON output
    return ContentService
      .createTextOutput(JSON.stringify({ result: "success", message: "Submission recorded successfully." }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    // Return error response if parsing or appending fails
    return ContentService
      .createTextOutput(JSON.stringify({ result: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } finally {
    // Release the lock for subsequent incoming requests
    lock.releaseLock();
  }
}

/**
 * Handles GET requests and CORS preflight options
 */
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: "active", message: "RD3 Tech Web App Service is running." }))
    .setMimeType(ContentService.MimeType.JSON);
}