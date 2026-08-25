/**
 * ============================================================================
 * RD3 TECH — INTERNAL CONFIG EDITOR WITH REAL-TIME SYNTAX VALIDATION
 * ============================================================================
 */

function openConfigEditor() {
  const htmlOutput = HtmlService.createHtmlOutput(getConfigEditorHtml())
    .setWidth(850)
    .setHeight(720)
    .setTitle('RD3 Tech — Configuration JSON Editor');

  try {
    SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'RD3 Tech Config Editor');
  } catch(e) {
    return htmlOutput;
  }
}

function getEditorConfig(key) {
  const props = PropertiesService.getScriptProperties();
  const stored = props.getProperty(key);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {}
  }

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
        :root {
          --bg: #0f172a;
          --panel: #1e293b;
          --border: #334155;
          --text: #f8fafc;
          --muted: #94a3b8;
          --accent: #0284c7;
          --accent-hover: #0369a1;
          --error: #ef4444;
          --success: #22c55e;
        }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 20px; background: var(--bg); color: var(--text); }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid var(--border); padding-bottom: 12px; }
        .title { font-size: 18px; font-weight: 700; color: #38bdf8; }
        .editor-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
        .config-card { background: var(--panel); border: 1px solid var(--border); border-radius: 8px; padding: 12px; display: flex; flex-direction: column; }
        .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        .label { font-weight: 700; font-size: 11px; text-transform: uppercase; color: var(--muted); letter-spacing: 0.5px; }
        .badge { font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; display: none; text-transform: uppercase; }
        .badge.valid { background: #14532d; color: #4ade80; display: inline-block; }
        .badge.invalid { background: #7f1d1d; color: #fca5a5; display: inline-block; }
        .textarea-wrapper { position: relative; flex-grow: 1; }
        textarea { width: 100%; height: 160px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 12px; padding: 10px; border: 1px solid var(--border); border-radius: 6px; box-sizing: border-box; background: #090d16; color: #e2e8f0; resize: vertical; line-height: 1.4; }
        textarea:focus { border-color: var(--accent); outline: none; }
        textarea.has-error { border-color: var(--error); background: #1c0d12; }
        .error-msg { font-size: 11px; color: #fca5a5; margin-top: 4px; min-height: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .controls { display: flex; gap: 12px; align-items: center; background: var(--panel); padding: 14px; border-radius: 8px; border: 1px solid var(--border); }
        .btn { background: var(--accent); color: #ffffff; border: none; padding: 10px 20px; font-size: 13px; font-weight: 600; border-radius: 6px; cursor: pointer; transition: background 0.2s; }
        .btn:hover { background: var(--accent-hover); }
        .btn:disabled { background: #475569; cursor: not-allowed; opacity: 0.6; }
        .btn-secondary { background: #334155; color: #f8fafc; }
        .btn-secondary:hover { background: #475569; }
        #status { font-size: 13px; font-weight: 600; display: none; padding: 8px 14px; border-radius: 6px; }
        .status-success { background: #14532d; color: #4ade80; }
        .status-error { background: #7f1d1d; color: #fca5a5; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">RD3 Tech — Protected Configuration Editor</div>
        <button class="btn btn-secondary" onclick="formatAllJSON()">Auto-Format JSON</button>
      </div>

      <div class="editor-grid">
        <div class="config-card">
          <div class="card-header">
            <span class="label">RATE_LIMIT_CONFIG</span>
            <span id="badge-RATE_LIMIT_CONFIG" class="badge valid">Valid</span>
          </div>
          <div class="textarea-wrapper">
            <textarea id="RATE_LIMIT_CONFIG" oninput="validateField('RATE_LIMIT_CONFIG')">${escapeHtmlEditor(rateLimit)}</textarea>
          </div>
          <div id="err-RATE_LIMIT_CONFIG" class="error-msg"></div>
        </div>

        <div class="config-card">
          <div class="card-header">
            <span class="label">REVIEW_CONFIG</span>
            <span id="badge-REVIEW_CONFIG" class="badge valid">Valid</span>
          </div>
          <div class="textarea-wrapper">
            <textarea id="REVIEW_CONFIG" oninput="validateField('REVIEW_CONFIG')">${escapeHtmlEditor(review)}</textarea>
          </div>
          <div id="err-REVIEW_CONFIG" class="error-msg"></div>
        </div>

        <div class="config-card">
          <div class="card-header">
            <span class="label">SPAM_CONFIG</span>
            <span id="badge-SPAM_CONFIG" class="badge valid">Valid</span>
          </div>
          <div class="textarea-wrapper">
            <textarea id="SPAM_CONFIG" oninput="validateField('SPAM_CONFIG')">${escapeHtmlEditor(spam)}</textarea>
          </div>
          <div id="err-SPAM_CONFIG" class="error-msg"></div>
        </div>

        <div class="config-card">
          <div class="card-header">
            <span class="label">URGENCY_CONFIG</span>
            <span id="badge-URGENCY_CONFIG" class="badge valid">Valid</span>
          </div>
          <div class="textarea-wrapper">
            <textarea id="URGENCY_CONFIG" oninput="validateField('URGENCY_CONFIG')">${escapeHtmlEditor(urgency)}</textarea>
          </div>
          <div id="err-URGENCY_CONFIG" class="error-msg"></div>
        </div>
      </div>

      <div class="controls">
        <button id="saveBtn" class="btn" onclick="saveConfigs()">Save Configurations</button>
        <div id="status"></div>
      </div>

      <script>
        const keys = ['RATE_LIMIT_CONFIG', 'REVIEW_CONFIG', 'SPAM_CONFIG', 'URGENCY_CONFIG'];

        function validateField(key) {
          const textarea = document.getElementById(key);
          const badge = document.getElementById('badge-' + key);
          const errDiv = document.getElementById('err-' + key);
          
          try {
            const parsed = JSON.parse(textarea.value);
            
            // Check if top-level value is a non-null object
            if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
              throw new Error('Config must be a valid JSON Object {}');
            }

            textarea.classList.remove('has-error');
            badge.className = 'badge valid';
            badge.textContent = 'Valid';
            errDiv.textContent = '';
            checkGlobalValidity();
            return true;
          } catch (e) {
            textarea.classList.add('has-error');
            badge.className = 'badge invalid';
            badge.textContent = 'Syntax Error';
            errDiv.textContent = e.message;
            checkGlobalValidity();
            return false;
          }
        }

        function checkGlobalValidity() {
          let allValid = true;
          keys.forEach(key => {
            const textarea = document.getElementById(key);
            try {
              const parsed = JSON.parse(textarea.value);
              if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) allValid = false;
            } catch(e) {
              allValid = false;
            }
          });
          document.getElementById('saveBtn').disabled = !allValid;
        }

        function formatAllJSON() {
          keys.forEach(key => {
            const textarea = document.getElementById(key);
            try {
              const parsed = JSON.parse(textarea.value);
              textarea.value = JSON.stringify(parsed, null, 2);
              validateField(key);
            } catch(e) {}
          });
        }

        function saveConfigs() {
          const payload = {};
          const statusDiv = document.getElementById('status');
          
          for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const val = document.getElementById(key).value;
            try {
              payload[key] = JSON.parse(val);
            } catch (e) {
              statusDiv.className = 'status-error';
              statusDiv.style.display = 'block';
              statusDiv.textContent = 'Blocked save: Syntax error in ' + key;
              return;
            }
          }

          document.getElementById('saveBtn').disabled = true;
          statusDiv.className = '';
          statusDiv.style.display = 'block';
          statusDiv.textContent = 'Saving...';

          google.script.run
            .withSuccessHandler(() => {
              statusDiv.className = 'status-success';
              statusDiv.textContent = '✔ Configurations successfully saved!';
              checkGlobalValidity();
              setTimeout(() => { statusDiv.style.display = 'none'; }, 4000);
            })
            .withFailureHandler((err) => {
              statusDiv.className = 'status-error';
              statusDiv.textContent = 'Save failed: ' + err.message;
              checkGlobalValidity();
            })
            .saveAllConfigs(payload);
        }

        // Run validation on initial page load
        window.onload = function() {
          keys.forEach(key => validateField(key));
        };
      </script>
    </body>
    </html>
  `;
}

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
 * Handles HTTP GET requests — serves the interactive JSON Config Editor UI.
 */
function doGet(e) {
  return HtmlService.createHtmlOutput(getConfigEditorHtml())
    .setWidth(850)
    .setHeight(720)
    .setTitle('RD3 Tech — Configuration JSON Editor');
}