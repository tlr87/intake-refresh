
/**
 * ============================================================================
 * RD3 TECH — CONFIG EDITOR
 * ============================================================================
 *
 * Responsibilities:
 *
 *   - Google Sheets custom menu
 *   - Open Config Editor
 *   - Read configuration
 *   - Save configuration
 *   - Restore individual configuration defaults
 *   - Restore all configuration defaults
 *
 * Web-app routing:
 *
 *   WebAppRouter.gs
 *
 * Fallback providers:
 *
 *   ConfigFallbacks.gs
 *
 * Form automation:
 *
 *   FormUpdate.gs
 *
 * ============================================================================
 */


/**
 * ============================================================================
 * GOOGLE SHEETS MENU
 * ============================================================================
 */
function onOpen() {

  SpreadsheetApp
    .getUi()
    .createMenu('RD3 Tech')
    .addItem(
      '⚙️ Open Config Editor',
      'openConfigEditor'
    )
    .addToUi();

}


/**
 * ============================================================================
 * OPEN CONFIG EDITOR
 * ============================================================================
 */
function openConfigEditor() {

  const template =
    HtmlService.createTemplateFromFile('Index');

  template.initialDataJson =
    JSON.stringify(
      getInitialData()
    );

  const htmlOutput =
    template
      .evaluate()
      .setWidth(920)
      .setHeight(720)
      .setTitle(
        'RD3 Tech — Configuration JSON Editor'
      );


  try {

    SpreadsheetApp
      .getUi()
      .showModalDialog(
        htmlOutput,
        'RD3 Tech Config Editor'
      );

  } catch (e) {

    return htmlOutput;

  }

}


/**
 * ============================================================================
 * READ INITIAL CONFIGURATION DATA
 * ============================================================================
 *
 * Existing Script Properties are loaded first.
 *
 * If a known configuration property does not exist, its fallback provider
 * supplies the value in memory only.
 *
 * Fallback defaults are NOT automatically written here.
 * ============================================================================
 */
function getInitialData() {

  const store =
    PropertiesService.getScriptProperties();

  const rawProps =
    store.getProperties() || {};


  const fallbacks = {

    REVIEW_CONFIG:
      getFallbackReviewConfig(),

    URGENCY_CONFIG:
      getUrgencyConfigFallback(),

    SPAM_CONFIG:
      getFallbackSpamConfig(),

    RATE_LIMIT_CONFIG:
      getFallbackRateLimitConfig(),

    FORM_CONFIG:
      getFallbackFormConfig(),

    FIELD_SCHEMA:
      getFallbackFieldSchema()

  };


  const parsedMap = {};


  Object.keys(rawProps).forEach(function(key) {

    try {

      parsedMap[key] =
        JSON.parse(
          rawProps[key]
        );

    } catch (e) {

      parsedMap[key] =
        rawProps[key];

    }

  });


  Object.keys(fallbacks).forEach(function(key) {

    if (!(key in parsedMap)) {

      parsedMap[key] =
        fallbacks[key];

    }

  });


  return parsedMap;

}


/**
 * ============================================================================
 * SAVE CONFIGURATION DATA
 * ============================================================================
 */
function saveAllConfigs(payload) {

  if (
    !payload ||
    typeof payload !== 'object'
  ) {

    throw new Error(
      'Invalid configuration payload.'
    );

  }


  const store =
    PropertiesService.getScriptProperties();


  Object.keys(payload).forEach(function(key) {

    const value =
      typeof payload[key] === 'string'
        ? payload[key]
        : JSON.stringify(payload[key]);


    store.setProperty(
      key,
      value
    );

  });


  return true;

}


/**
 * ============================================================================
 * RESTORE ONE CONFIGURATION KEY
 * ============================================================================
 */
function resetKeyToFallback(key) {

  var fallbackData = null;


  if (key === 'REVIEW_CONFIG') {

    fallbackData =
      getFallbackReviewConfig();

  } else if (key === 'URGENCY_CONFIG') {

    fallbackData =
      getUrgencyConfigFallback();

  } else if (key === 'SPAM_CONFIG') {

    fallbackData =
      getFallbackSpamConfig();

  } else if (key === 'RATE_LIMIT_CONFIG') {

    fallbackData =
      getFallbackRateLimitConfig();

  } else if (key === 'FORM_CONFIG') {

    fallbackData =
      getFallbackFormConfig();

  } else if (key === 'FIELD_SCHEMA') {

    fallbackData =
      getFallbackFieldSchema();

  }


  if (fallbackData !== null) {

    const json =
      JSON.stringify(fallbackData);


    PropertiesService
      .getScriptProperties()
      .setProperty(
        key,
        json
      );


    return json;

  }


  throw new Error(
    'No fallback provider defined for key: ' +
    key
  );

}


/**
 * ============================================================================
 * RESET ALL SCRIPT PROPERTIES TO DEFAULT
 * ============================================================================
 *
 * WARNING:
 * This intentionally deletes ALL Script Properties.
 * ============================================================================
 */
function resetAllScriptPropertiesToDefault() {

  const store =
    PropertiesService.getScriptProperties();


  store.deleteAllProperties();


  const defaults = {

    REVIEW_CONFIG:
      getFallbackReviewConfig(),

    URGENCY_CONFIG:
      getUrgencyConfigFallback(),

    SPAM_CONFIG:
      getFallbackSpamConfig(),

    RATE_LIMIT_CONFIG:
      getFallbackRateLimitConfig(),

    FORM_CONFIG:
      getFallbackFormConfig(),

    FIELD_SCHEMA:
      getFallbackFieldSchema()

  };


  Object.keys(defaults).forEach(function(key) {

    store.setProperty(
      key,
      JSON.stringify(
        defaults[key]
      )
    );

  });


  Logger.log(
    '✔ All Script Properties cleared and re-populated with defaults!'
  );


  return true;

}
