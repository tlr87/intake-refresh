
/**
 * ============================================================================
 * RD3 TECH — WEB APP ROUTER
 * ============================================================================
 *
 * FILE:
 *   WebAppRouter.gs
 *
 * PURPOSE:
 *   Central router for the RD3 Tech ADMIN / DEVELOPMENT Web App.
 *
 * DEVELOPMENT ROUTES:
 *
 *   /dev
 *       -> Index.html
 *
 *   /dev?page=editor
 *       -> JSON_Editor.html
 *
 *   /dev?page=reference
 *       -> Reference.html
 *
 *   /dev?page=template
 *       -> TemplateReference.html
 *
 *   /dev?page=webform
 *       -> WebFormReference.html
 *
 *   /dev?page=anything-else
 *       -> RouterError.html
 *
 * IMPORTANT:
 *   This file contains ROUTING ONLY.
 *
 * Configuration logic belongs in:
 *
 *   ConfigEditor.gs
 *
 * Fallback providers belong in their own files.
 *
 * HTML pages remain separate:
 *
 *   Index.html
 *   JSON_Editor.html
 *   Reference.html
 *   TemplateReference.html
 *   WebFormReference.html
 *   RouterError.html
 *
 * NOTE:
 *   This router is intended for the /dev deployment.
 *
 *   The /exec deployment is reserved for the production/front-facing
 *   form application.
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

    var page =
      getRequestedPage_(e);


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
     * ROUTING
     * ------------------------------------------------------------------------
     */
    switch (page) {

      /**
       * Main admin landing page.
       */
      case 'index':
      case '':
        return renderIndex_();


      /**
       * JSON Configuration Editor.
       */
      case 'editor':
      case 'json_editor':
      case 'json-editor':
        return renderJsonEditor_();


      /**
       * General reference page.
       */
      case 'reference':
      case 'ref':
        return renderReference_();


      /**
       * Template reference.
       */
      case 'template':
      case 'templatereference':
      case 'template-reference':
        return renderTemplateReference_();


      /**
       * Front-facing Web Form reference.
       */
      case 'webform':
      case 'webformreference':
      case 'webform-reference':
        return renderWebFormReference_();


      /**
       * Unknown route.
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
      err && err.message
        ? err.message
        : String(err)
    );

  }

}


/**
 * ============================================================================
 * GET REQUESTED PAGE
 * ============================================================================
 *
 * Safely extracts:
 *
 *   ?page=index
 *   ?page=editor
 *   ?page=reference
 *
 * Defaults to:
 *
 *   index
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
 * RENDER INDEX
 * ============================================================================
 *
 * Main administration landing page.
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
 *
 * Loads configuration data from ConfigEditor.gs.
 *
 * IMPORTANT:
 *   getInitialData() remains in ConfigEditor.gs.
 *
 * WebAppRouter.gs only passes the data to the page.
 * ============================================================================
 */
function renderJsonEditor_() {

  var template =
    HtmlService.createTemplateFromFile(
      'JSON_Editor'
    );


  /**
   * ConfigEditor.gs owns getInitialData().
   */
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
 * RENDER REFERENCE
 * ============================================================================
 */
function renderReference_() {

  var template =
    HtmlService.createTemplateFromFile(
      'Reference'
    );


  template.webAppUrl =
    getWebAppUrl_();


  return template
    .evaluate()
    .setTitle(
      'RD3 Tech — Reference'
    )
    .setXFrameOptionsMode(
      HtmlService.XFrameOptionsMode.ALLOWALL
    );

}


/**
 * ============================================================================
 * RENDER TEMPLATE REFERENCE
 * ============================================================================
 *
 * Optional page.
 *
 * If TemplateReference.html does not yet exist, this route will produce the
 * Router Error page instead of crashing the entire Web App.
 * ============================================================================
 */
function renderTemplateReference_() {

  var template =
    HtmlService.createTemplateFromFile(
      'TemplateReference'
    );


  template.webAppUrl =
    getWebAppUrl_();


  return template
    .evaluate()
    .setTitle(
      'RD3 Tech — Template Reference'
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
 * Optional page.
 *
 * This is intended to document the front-facing form rather than the
 * administration/configuration interface.
 * ============================================================================
 */
function renderWebFormReference_() {

  var template =
    HtmlService.createTemplateFromFile(
      'WebFormReference'
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
 *
 * Internal RD3 Tech administration users.
 *
 * IMPORTANT:
 *   This is deliberately separate from routing.
 * ============================================================================
 */
function isWebAppUserAuthorized_() {

  var allowedUsers = [

    'tom@rd3tech.com',
    'tom.revill@gmail.com'

  ];


  /**
   * If no users are configured, allow access.
   */
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

      '<h1>🚫 Access Denied</h1>' +

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
 * Used when:
 *
 *   - a page is not registered
 *   - a page cannot be rendered
 *   - a rendering exception occurs
 *
 * This intentionally uses a dedicated RouterError.html page.
 * ============================================================================
 */
function renderRouterError_(
  requestedPage,
  errorMessage
) {

  var template =
    HtmlService.createTemplateFromFile(
      'RouterError'
    );


  template.requestedPage =
    requestedPage || 'unknown';


  template.errorMessage =
    errorMessage || '';


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

}


/**
 * ============================================================================
 * ROUTER TEST
 * ============================================================================
 *
 * Tests the renderer functions directly.
 *
 * Run:
 *
 *   testWebAppRouter
 *
 * This does NOT require a Web App deployment.
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
      '✔ Index: ' +
      index.getTitle()
    );


  } catch (err) {

    Logger.log(
      '✖ Index failed: ' +
      err.message
    );

  }


  try {

    var editor =
      renderJsonEditor_();

    Logger.log(
      '✔ JSON_Editor: ' +
      editor.getTitle()
    );


  } catch (err) {

    Logger.log(
      '✖ JSON_Editor failed: ' +
      err.message
    );

  }


  try {

    var reference =
      renderReference_();

    Logger.log(
      '✔ Reference: ' +
      reference.getTitle()
    );


  } catch (err) {

    Logger.log(
      '✖ Reference failed: ' +
      err.message
    );

  }


  try {

    var template =
      renderTemplateReference_();

    Logger.log(
      '✔ TemplateReference: ' +
      template.getTitle()
    );


  } catch (err) {

    Logger.log(
      '⚠ TemplateReference not available yet.'
    );

  }


  try {

    var webForm =
      renderWebFormReference_();

    Logger.log(
      '✔ WebFormReference: ' +
      webForm.getTitle()
    );


  } catch (err) {

    Logger.log(
      '⚠ WebFormReference not available yet.'
    );

  }


  Logger.log(
    '============================================'
  );

  Logger.log(
    '✔ Router render test completed.'
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
 * Tests the routing logic without deploying the Web App.
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
    'reference',
    'template',
    'webform',
    'unknown'

  ];


  routes.forEach(
    function(page) {

      try {

        var result =
          doGet({

            parameter: {

              page:
                page

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
          err.message
        );

      }

    }
  );


  Logger.log(
    '============================================'
  );

  Logger.log(
    '✔ Route test completed.'
  );

  Logger.log(
    '============================================'
  );

}

