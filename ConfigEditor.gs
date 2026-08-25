/**
 * ============================================================================
 * RD3 TECH — INTERNAL CONFIG EDITOR (INTERNAL USE ONLY)
 * ============================================================================
 * Run `openConfigEditor()` inside the Apps Script Editor menu/toolbar.
 */

function openConfigEditor() {
  const htmlOutput = HtmlService.createHtmlOutput(getConfigEditorHtml())
    .setWidth(750)
    .setHeight(650)
    .setTitle('RD3 Tech — Configuration JSON Editor');

  // Try to open as modal dialog in bounded sheet/doc, otherwise launch standalone fallback
  try {
    SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'RD3 Tech Config Editor');
  } catch(e) {
    // If not bound to a spreadsheet, show in Apps Script UI context
    Logger.log("Displaying Config Editor HTML (Standalone execution)");
    return htmlOutput;
  }
}

/**
 * Reads config safely from PropertiesService or returns defaults
 */
function getEditorConfig(key) {
  const props = PropertiesService.getScriptProperties();
  const stored = props.getProperty(key);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {}
  }

  // Fallback defaults if key is not yet set
  const defaults = {
    RATE_LIMIT_CONFIG: { enabled: true, cooldownSeconds: 60 },
    REVIEW_CONFIG: { autoApproveDomains: ["rd3tech.com"], flaggedKeywords: ["crypto", "seo", "casino"] },
    SPAM_CONFIG: { maxMessageLength: 5000, botHoneypotFieldName: "website_url" },
    URGENCY_CONFIG: {
      High: { color: "#dc2626", label: "HIGH URGENCY" },
      Medium: { color: "#d97706", label: "MEDIUM URGENCY" },
      Low: { color: "#16a34a", label: "LOW URGENCY" }
    }
  };

  return defaults[key] || {};
}

function getConfigEditorHtml() {
  const rateLimit = JSON.stringify(getEditorConfig('RATE_LIMIT_CONFIG'), null, 2);
  const review = JSON.stringify(getEditorConfig('REVIEW_CONFIG'), null, 2);
  const spam = JSON.stringify(getEditorConfig('SPAM_CONFIG'), null, 2);
  const urgency = JSON.stringify(getEditorConfig('URGENCY_CONFIG'), null, 2);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <base target="_top">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 16px; background: #f8fafc; color: #0f172a; }
        .editor-container { display: flex; flex-direction: column; gap: 16px; }
        .config-group { display: flex; flex-direction: column; }
        label { font-weight: 700; font-size: 12px; text-transform: uppercase; color: #475569; margin-bottom: 6px; letter-spacing: 0.5px; }
        textarea { width: 100%; height: 110px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 12px; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; box-sizing: border-box; background: #ffffff; color: #0f172a; }
        textarea:focus { border-color: #0066cc; outline: 2px solid #0066cc22; }
        .actions { display: flex; gap: 12px; align-items: center; margin-top: 8px; }
        .btn { background: #0066cc; color: #ffffff; border: none; padding: 10px 18px; font-size: 13px; font-weight: 600; border-radius: 6px; cursor: pointer; transition: background 0.2s; }
        .btn:hover { background: #0052a3; }
        #status { font-size: 13px; font-weight: 500; display: none; padding: 8px 12px; border-radius: 6px; }
        .success { background: #dcfce7; color: #166534; }
        .error { background: #fee2e2; color: #991b1b; }
      </style>
    </head>
    <body>
      <div class="editor-container">
        <div class="config-group">
          <label>RATE_LIMIT_CONFIG (Cooldown Window)</label>
          <textarea id="RATE_LIMIT_CONFIG">${escapeHtmlEditor(rateLimit)}</textarea>
        </div>

        <div class="config-group">
          <label>REVIEW_CONFIG</label>
          <textarea id="REVIEW_CONFIG">${escapeHtmlEditor(review)}</textarea>
        </div>

        <div class="config-group">
          <label>SPAM_CONFIG</label>
          <textarea id="SPAM_CONFIG">${escapeHtmlEditor(spam)}</textarea>
        </div>

        <div class="config-group">
          <label>URGENCY_CONFIG</label>
          <textarea id="URGENCY_CONFIG">${escapeHtmlEditor(urgency)}</textarea>
        </div>

        <div class="actions">
          <button class="btn" onclick="saveConfigs()">Save Configurations</button>
          <div id="status"></div>
        </div>
      </div>

      <script>
        function saveConfigs() {
          const keys = ['RATE_LIMIT_CONFIG', 'REVIEW_CONFIG', 'SPAM_CONFIG', 'URGENCY_CONFIG'];
          const payload = {};
          const statusDiv = document.getElementById('status');
          
          try {
            keys.forEach(key => {
              const val = document.getElementById(key).value;
              payload[key] = JSON.parse(val);
            });
          } catch (e) {
            statusDiv.className = 'error';
            statusDiv.style.display = 'block';
            statusDiv.textContent = 'Invalid JSON format: ' + e.message;
            return;
          }

          google.script.run
            .withSuccessHandler(() => {
              statusDiv.className = 'success';
              statusDiv.style.display = 'block';
              statusDiv.textContent = 'Saved successfully!';
              setTimeout(() => { statusDiv.style.display = 'none'; }, 4000);
            })
            .withFailureHandler((err) => {
              statusDiv.className = 'error';
              statusDiv.style.display = 'block';
              statusDiv.textContent = 'Save failed: ' + err.message;
            })
            .saveAllConfigs(payload);
        }
      </script>
    </body>
    </html>
  `;
}

/**
 * Saves JSON objects directly to PropertiesService
 */
function saveAllConfigs(payload) {
  const props = PropertiesService.getScriptProperties();
  Object.keys(payload).forEach(key => {
    props.setProperty(key, JSON.stringify(payload[key]));
  });
  return true;
}

function escapeHtmlEditor(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}



/**
 * Renders the Config Editor UI when accessing the script URL in a browser.
 */
function doGet(e) {
  return HtmlService.createHtmlOutput(getConfigEditorHtml())
    .setTitle('RD3 Tech Config Editor');
}