
/**
 * ============================================================================
 * RD3 TECH — WEB APP ROUTER
 * ============================================================================
 *
 * FILE:
 *   WebAppRouter.gs
 *
 * CURRENT HTML FILES:
 *
 *   Index.html
 *   JSON_Editor.html
 *   ReferenceTemplate.html
 *   ReferenceWebForm.html
 *   WebAppRouterError.html
 *
 * IMPORTANT:
 *
 *   Reference.html DOES NOT EXIST.
 *   TemplateReference.html DOES NOT EXIST.
 *   WebFormReference.html DOES NOT EXIST.
 *
 * ============================================================================
 */


/**
 * ============================================================================
 * WEB APP ENTRY POINT
 * ============================================================================
 */
function doGet(e) {

  try {

    var page = getRequestedPage_(e);

    /**
     * ------------------------------------------------------------------------
     * AUTHORISATION
     * ------------------------------------------------------------------------
     */
    if (!isWebAppUserAuthorized_()) {
      return renderAccessDenied_();
    }


    /**
     * ------------------------------------------------------------------------
     * PAGE STATUS
     * ------------------------------------------------------------------------
     */
    var pageStatus = getPageStatus_(page);

    if (!pageStatus.functional) {

      return renderRouterError_(
        page,
        pageStatus.message
      );

    }


    /**
     * ------------------------------------------------------------------------
     * ROUTING
     * ------------------------------------------------------------------------
     */
    switch (page) {

      /**
       * ADMIN HOME
       */
      case 'index':
      case '':
        return renderIndex_();


      /**
       * JSON CONFIGURATION EDITOR
       */
      case 'editor':
      case 'json_editor':
      case 'json-editor':
        return renderJsonEditor_();


      /**
       * EMAIL TEMPLATE REFERENCE
       *
       * HTML FILE:
       *   ReferenceTemplate.html
       */
      case 'template':
      case 'templates':
      case 'referencetemplate':
      case 'templatereference':
      case 'template-reference':
      case 'emailtemplates':
      case 'email-templates':
        return renderTemplateReference_();


      /**
       * WEB FORM REFERENCE
       *
       * HTML FILE:
       *   ReferenceWebForm.html
       */
      case 'webform':
      case 'webformreference':
      case 'referencewebform':
      case 'webform-reference':
      case 'form':
        return renderWebFormReference_();


      /**
       * UNKNOWN ROUTE
       */
      default:

        return renderRouterError_(
          page,
          'The requested page is not registered with WebAppRouter.gs.'
        );

    }

  } catch (err) {

    return renderRouterError_(
      'unknown',
      getErrorMessage_(err)
    );

  }

}


/**
 * ============================================================================
 * GET REQUESTED PAGE
 * ============================================================================
 */
function getRequestedPage_(e) {

  if (
    e &&
    e.parameter &&
    e.parameter.page
  ) {

    return String(
      e.parameter.page
    )
      .toLowerCase()
      .trim();

  }

  return 'index';

}


/**
 * ============================================================================
 * PAGE STATUS
 * ============================================================================
 *
 * Central functionality switch.
 *
 * The router controls whether a route is currently functional.
 *
 * IMPORTANT:
 *
 * Apps Script server-side JavaScript cannot inspect the rendered DOM of
 * another HTML file.
 *
 * Therefore this function does NOT attempt to inspect HTML IDs or classes.
 *
 * HTML pages may separately use isDocumentationPage() for browser-side
 * documentation/status logic.
 * ============================================================================
 */
function getPageStatus_(page) {

  var statuses = {

    index: {
      functional: true,
      message: ''
    },

    editor: {
      functional: true,
      message: ''
    },

    json_editor: {
      functional: true,
      message: ''
    },

    'json-editor': {
      functional: true,
      message: ''
    },

    template: {
      functional: true,
      message: ''
    },

    templates: {
      functional: true,
      message: ''
    },

    referencetemplate: {
      functional: true,
      message: ''
    },

    templatereference: {
      functional: true,
      message: ''
    },

    'template-reference': {
      functional: true,
      message: ''
    },

    emailtemplates: {
      functional: true,
      message: ''
    },

    'email-templates': {
      functional: true,
      message: ''
    },

    webform: {
      functional: true,
      message: ''
    },

    webformreference: {
      functional: true,
      message: ''
    },

    referencewebform: {
      functional: true,
      message: ''
    },

    'webform-reference': {
      functional: true,
      message: ''
    },

    form: {
      functional: true,
      message: ''
    }

  };


  /**
   * --------------------------------------------------------------------------
   * UNKNOWN ROUTE
   * --------------------------------------------------------------------------
   *
   * Unknown routes are allowed through so the switch statement can produce
   * the proper WebAppRouterError.html page.
   */
  if (
    !Object.prototype.hasOwnProperty.call(
      statuses,
      page
    )
  ) {

    return {
      functional: true,
      message: ''
    };

  }


  return statuses[page];

}


/**
 * ============================================================================
 * CREATE PAGE UNAVAILABLE STATUS
 * ============================================================================
 */
function createPageUnavailableStatus_(page, reason) {

  return {

    functional: false,

    message:
      'The page "' +
      page +
      '" is currently marked as unavailable.' +
      (
        reason
          ? ' Reason: ' + reason
          : ''
      )

  };

}


/**
 * ============================================================================
 * RENDER INDEX
 * ============================================================================
 */
function renderIndex_() {

  var template =
    HtmlService.createTemplateFromFile(
      'Index'
    );


  template.webAppUrl =
    getWebAppUrl_();


  return template
    .evaluate()
    .setTitle(
      'RD3 Tech — Admin'
    )
    .setXFrameOptionsMode(
      HtmlService.XFrameOptionsMode.ALLOWALL
    );

}


/**
 * ============================================================================
 * RENDER JSON EDITOR
 * ============================================================================
 */
function renderJsonEditor_() {

  var template =
    HtmlService.createTemplateFromFile(
      'JSON_Editor'
    );


  template.initialDataJson =
    JSON.stringify(
      getInitialData()
    );


  template.webAppUrl =
    getWebAppUrl_();


  return template
    .evaluate()
    .setTitle(
      'RD3 Tech — Configuration Editor'
    )
    .setXFrameOptionsMode(
      HtmlService.XFrameOptionsMode.ALLOWALL
    );

}


/**
 * ============================================================================
 * GET FIELD_SCHEMA
 * ============================================================================
 *
 * FIELD_SCHEMA remains owned by ConfigEditor.gs.
 *
 * This router only reads FIELD_SCHEMA and passes it to the documentation
 * pages.
 * ============================================================================
 */
function getReferenceFieldSchema_() {

  var data =
    getInitialData();


  if (
    !data ||
    typeof data !== 'object'
  ) {

    return {};

  }


  if (
    data.FIELD_SCHEMA &&
    typeof data.FIELD_SCHEMA === 'object'
  ) {

    return data.FIELD_SCHEMA;

  }


  return {};

}


/**
 * ============================================================================
 * RENDER EMAIL TEMPLATE REFERENCE
 * ============================================================================
 *
 * HTML FILE:
 *
 *   ReferenceTemplate.html
 *
 * ============================================================================
 */
function renderTemplateReference_() {

  var template =
    HtmlService.createTemplateFromFile(
      'ReferenceTemplate'
    );


  var fieldSchema =
    getReferenceFieldSchema_();


  template.fieldSchemaJson =
    JSON.stringify(
      fieldSchema
    )
      .replace(/</g, '\\u003c')
      .replace(/>/g, '\\u003e')
      .replace(/&/g, '\\u0026');


  template.initialFieldSchemaJson =
    JSON.stringify(
      fieldSchema
    );


  template.webAppUrl =
    getWebAppUrl_();


  return template
    .evaluate()
    .setTitle(
      'RD3 Tech — Email Template Reference'
    )
    .setXFrameOptionsMode(
      HtmlService.XFrameOptionsMode.ALLOWALL
    );

}


/**
 * ============================================================================
 * RENDER WEB FORM REFERENCE
 * ============================================================================
 *
 * HTML FILE:
 *
 *   ReferenceWebForm.html
 *
 * ============================================================================
 */
function renderWebFormReference_() {

  var template =
    HtmlService.createTemplateFromFile(
      'ReferenceWebForm'
    );


  var fieldSchema =
    getReferenceFieldSchema_();


template.fieldSchemaJson =
  JSON.stringify(
    fieldSchema
  )
  .replace(/</g, '\\u003c')
  .replace(/>/g, '\\u003e')
  .replace(/&/g, '\\u0026');


  template.initialFieldSchemaJson =
    JSON.stringify(
      fieldSchema
    );


  template.webAppUrl =
    getWebAppUrl_();


  return template
    .evaluate()
    .setTitle(
      'RD3 Tech — Web Form Reference'
    )
    .setXFrameOptionsMode(
      HtmlService.XFrameOptionsMode.ALLOWALL
    );

}


/**
 * ============================================================================
 * WEB APP URL
 * ============================================================================
 */
function getWebAppUrl_() {

  try {

    return ScriptApp
      .getService()
      .getUrl() || '';

  } catch (err) {

    return '';

  }

}


/**
 * ============================================================================
 * AUTHORISATION
 * ============================================================================
 */
function isWebAppUserAuthorized_() {

  var allowedUsers = [

    'tom@rd3tech.com',
    'tom.revill@gmail.com'

  ];


  if (
    allowedUsers.length === 0
  ) {

    return true;

  }


  var userEmail = '';


  try {

    userEmail =
      Session
        .getActiveUser()
        .getEmail();

  } catch (err) {

    userEmail = '';

  }


  return (
    userEmail &&
    allowedUsers.indexOf(
      userEmail
    ) !== -1
  );

}


/**
 * ============================================================================
 * ACCESS DENIED
 * ============================================================================
 */
function renderAccessDenied_() {

  return HtmlService

    .createHtmlOutput(

      '<!DOCTYPE html>' +

      '<html>' +

      '<head>' +

      '<meta charset="UTF-8">' +

      '<meta name="viewport" content="width=device-width, initial-scale=1">' +

      '<title>RD3 Tech — Access Denied</title>' +

      '<style>' +

      'body {' +
        'margin:0;' +
        'padding:40px;' +
        'font-family:Arial,sans-serif;' +
        'background:#0f172a;' +
        'color:#e2e8f0;' +
      '}' +

      '.card {' +
        'max-width:620px;' +
        'margin:60px auto;' +
        'padding:32px;' +
        'background:#1e293b;' +
        'border:1px solid #334155;' +
        'border-radius:14px;' +
        'box-sizing:border-box;' +
      '}' +

      'h1 {' +
        'margin-top:0;' +
        'color:#ef4444;' +
      '}' +

      'p {' +
        'line-height:1.6;' +
      '}' +

      '</style>' +

      '</head>' +

      '<body>' +

      '<div class="card">' +

      '<h1>Access Denied</h1>' +

      '<p>' +
      'You are not authorised to access the RD3 Tech administration interface.' +
      '</p>' +

      '</div>' +

      '</body>' +

      '</html>'

    )

    .setTitle(
      'RD3 Tech — Access Denied'
    )

    .setXFrameOptionsMode(
      HtmlService.XFrameOptionsMode.ALLOWALL
    );

}


/**
 * ============================================================================
 * ROUTER ERROR
 * ============================================================================
 *
 * HTML FILE:
 *
 *   WebAppRouterError.html
 *
 * IMPORTANT:
 *
 * This reports ONLY the error that caused the current request to fail.
 *
 * It does not attempt to enumerate unrelated errors elsewhere in the project.
 * ============================================================================
 */
function renderRouterError_(
  requestedPage,
  errorMessage
) {

  try {

    var template =
      HtmlService.createTemplateFromFile(
        'WebAppRouterError'
      );


    template.requestedPage =
      requestedPage || 'unknown';


    template.errorMessage =
      errorMessage || 'Unknown router error.';


    template.webAppUrl =
      getWebAppUrl_();


    return template
      .evaluate()
      .setTitle(
        'RD3 Tech — Router Error'
      )
      .setXFrameOptionsMode(
        HtmlService.XFrameOptionsMode.ALLOWALL
      );

  } catch (errorPageError) {

    /**
     * ------------------------------------------------------------------------
     * FALLBACK ERROR PAGE
     * ------------------------------------------------------------------------
     *
     * If WebAppRouterError.html itself cannot be loaded, return plain HTML.
     *
     * This prevents the error handler from creating a second fatal error.
     */
    return HtmlService
      .createHtmlOutput(

        '<!DOCTYPE html>' +

        '<html>' +

        '<head>' +

        '<meta charset="UTF-8">' +

        '<title>RD3 Tech — Router Error</title>' +

        '</head>' +

        '<body>' +

        '<h1>RD3 Tech Router Error</h1>' +

        '<p><strong>Requested page:</strong> ' +

        escapeHtml_(
          requestedPage || 'unknown'
        ) +

        '</p>' +

        '<p><strong>Error:</strong> ' +

        escapeHtml_(
          errorMessage || 'Unknown router error.'
        ) +

        '</p>' +

        '<p><strong>Error page failure:</strong> ' +

        escapeHtml_(
          getErrorMessage_(
            errorPageError
          )
        ) +

        '</p>' +

        '</body>' +

        '</html>'

      )

      .setTitle(
        'RD3 Tech — Router Error'
      );

  }

}


/**
 * ============================================================================
 * ERROR MESSAGE HELPER
 * ============================================================================
 */
function getErrorMessage_(err) {

  if (
    err &&
    err.message
  ) {

    return String(
      err.message
    );

  }


  return String(
    err || 'Unknown error.'
  );

}


/**
 * ============================================================================
 * HTML ESCAPE HELPER
 * ============================================================================
 */
function escapeHtml_(value) {

  return String(
    value || ''
  )
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

}


/**
 * ============================================================================
 * REQUIRED HTML FILE CHECK
 * ============================================================================
 *
 * Run:
 *
 *   testRequiredHtmlFiles
 *
 * Expected files:
 *
 *   Index.html
 *   JSON_Editor.html
 *   ReferenceTemplate.html
 *   ReferenceWebForm.html
 *   WebAppRouterError.html
 *
 * Reference.html is deliberately NOT checked.
 * ============================================================================
 */
function testRequiredHtmlFiles() {

  var files = [

    'Index',
    'JSON_Editor',
    'ReferenceTemplate',
    'ReferenceWebForm',
    'WebAppRouterError'

  ];


  Logger.log(
    '============================================'
  );

  Logger.log(
    'RD3 TECH HTML FILE CHECK'
  );

  Logger.log(
    '============================================'
  );


  files.forEach(
    function(fileName) {

      try {

        HtmlService
          .createTemplateFromFile(
            fileName
          );


        Logger.log(
          'OK: ' +
          fileName +
          '.html'
        );


      } catch (err) {

        Logger.log(
          'MISSING: ' +
          fileName +
          '.html -> ' +
          getErrorMessage_(err)
        );

      }

    }
  );


  Logger.log(
    '============================================'
  );

}


/**
 * ============================================================================
 * ROUTER RENDER TEST
 * ============================================================================
 *
 * Tests the actual renderer functions.
 *
 * Run:
 *
 *   testWebAppRouter
 * ============================================================================
 */
function testWebAppRouter() {

  Logger.log(
    '============================================'
  );

  Logger.log(
    'RD3 TECH WEB APP ROUTER TEST'
  );

  Logger.log(
    '============================================'
  );


  try {

    var index =
      renderIndex_();

    Logger.log(
      'OK: Index -> ' +
      index.getTitle()
    );

  } catch (err) {

    Logger.log(
      'FAILED: Index -> ' +
      getErrorMessage_(err)
    );

  }


  try {

    var editor =
      renderJsonEditor_();

    Logger.log(
      'OK: JSON_Editor -> ' +
      editor.getTitle()
    );

  } catch (err) {

    Logger.log(
      'FAILED: JSON_Editor -> ' +
      getErrorMessage_(err)
    );

  }


  try {

    var template =
      renderTemplateReference_();

    Logger.log(
      'OK: ReferenceTemplate -> ' +
      template.getTitle()
    );

  } catch (err) {

    Logger.log(
      'FAILED: ReferenceTemplate -> ' +
      getErrorMessage_(err)
    );

  }


  try {

    var webForm =
      renderWebFormReference_();

    Logger.log(
      'OK: ReferenceWebForm -> ' +
      webForm.getTitle()
    );

  } catch (err) {

    Logger.log(
      'FAILED: ReferenceWebForm -> ' +
      getErrorMessage_(err)
    );

  }


  Logger.log(
    '============================================'
  );

  Logger.log(
    'Router render test completed.'
  );

  Logger.log(
    '============================================'
  );

}


/**
 * ============================================================================
 * ROUTE TEST
 * ============================================================================
 *
 * IMPORTANT:
 *
 * There is deliberately NO "reference" route.
 *
 * Reference.html no longer exists.
 *
 * Run:
 *
 *   testWebAppRoutes
 * ============================================================================
 */
function testWebAppRoutes() {

  Logger.log(
    '============================================'
  );

  Logger.log(
    'RD3 TECH ROUTE TEST'
  );

  Logger.log(
    '============================================'
  );


  var routes = [

    'index',
    'editor',
    'template',
    'referencetemplate',
    'webform',
    'referencewebform',
    'unknown'

  ];


  routes.forEach(
    function(page) {

      try {

        var result =
          doGet({

            parameter: {

              page: page

            }

          });


        Logger.log(
          'Route ?page=' +
          page +
          ' -> ' +
          result.getTitle()
        );


      } catch (err) {

        Logger.log(
          'Route ?page=' +
          page +
          ' FAILED -> ' +
          getErrorMessage_(err)
        );

      }

    }
  );


  Logger.log(
    '============================================'
  );

  Logger.log(
    'Route test completed.'
  );

  Logger.log(
    '============================================'
  );

}


/**
 * ============================================================================
 * FIELD_SCHEMA TEST
 * ============================================================================
 *
 * Run:
 *
 *   testReferenceFieldSchema
 * ============================================================================
 */
function testReferenceFieldSchema() {

  Logger.log(
    '============================================'
  );

  Logger.log(
    'RD3 TECH FIELD_SCHEMA REFERENCE TEST'
  );

  Logger.log(
    '============================================'
  );


  try {

    var schema =
      getReferenceFieldSchema_();


    if (
      !schema ||
      typeof schema !== 'object'
    ) {

      throw new Error(
        'FIELD_SCHEMA is missing or is not an object.'
      );

    }


    var keys;

    if (
      Array.isArray(schema)
    ) {

      keys =
        schema.map(
          function(field) {

            return (
              field &&
              field.key
            )
              ? field.key
              : '';

          }
        );

    } else {

      keys =
        Object.keys(
          schema
        );

    }


    Logger.log(
      'FIELD_SCHEMA loaded.'
    );


    Logger.log(
      'Field count: ' +
      keys.length
    );


    Logger.log(
      'Fields: ' +
      keys.join(', ')
    );


  } catch (err) {

    Logger.log(
      'FIELD_SCHEMA TEST FAILED: ' +
      getErrorMessage_(err)
    );

  }


  Logger.log(
    '============================================'
  );

}

