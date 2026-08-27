/**
 * ============================================================================
 * RD3 TECH — WEB APP HTTP POST ENDPOINT
 * ============================================================================
 *
 * Receives submissions from the RD3 Tech website contact form.
 *
 * FLOW
 *
 * Website
 *    ↓
 * doPost()
 *    ↓
 * Extract raw parameters
 *    ↓
 * mapFormPayload()
 *    ↓
 * Honeypot
 *    ↓
 * Rate limiting
 *    ↓
 * Google Form
 *    ↓
 * Spam / Review evaluation
 *    ↓
 * Build email data
 *    ↓
 * Admin Email
 *    ↓
 * Client Email
 *    ↓
 * JSON response
 *
 * Email failures are isolated from one another.
 * ============================================================================
 */


/**
 * ============================================================================
 * MAIN WEB APP ENDPOINT
 * ============================================================================
 */
function doPost(e) {

  Logger.log('============================================================');
  Logger.log('RD3 TECH — doPost START');
  Logger.log('============================================================');

  try {

    // ------------------------------------------------------------------------
    // 1. CONFIGURATION
    // ------------------------------------------------------------------------

    Logger.log(
      'Incoming parameter payload: ' +
      JSON.stringify(e)
    );

    const formConfig =
      (typeof getFormConfig === 'function')
        ? getFormConfig()
        : {};

    const reviewConfig =
      (typeof getReviewConfig === 'function')
        ? getReviewConfig()
        : {};

    const spamConfig =
      (typeof getSpamConfig === 'function')
        ? getSpamConfig()
        : {};

    const rateLimitConfig =
      (typeof getRateLimitConfig === 'function')
        ? getRateLimitConfig()
        : {
            enabled: true,
            cooldownSeconds: 60
          };

    const adminEmail =
      (
        formConfig.settings &&
        formConfig.settings.adminEmail
      )
        ? String(formConfig.settings.adminEmail).trim()
        : 'tom@rd3tech.com';

    Logger.log(
      'Admin email: ' +
      adminEmail
    );


    // ------------------------------------------------------------------------
    // 2. EXTRACT RAW PARAMETERS
    // ------------------------------------------------------------------------

    let rawParams = {};

    if (
      e &&
      e.parameter &&
      Object.keys(e.parameter).length > 0
    ) {

      rawParams = e.parameter;

    } else if (
      e &&
      e.postData &&
      e.postData.contents
    ) {

      try {

        rawParams =
          JSON.parse(
            e.postData.contents
          );

      } catch (jsonErr) {

        rawParams =
          parseQueryString(
            e.postData.contents
          );
      }
    }

    Logger.log(
      'Raw parameters: ' +
      JSON.stringify(rawParams)
    );


    // ------------------------------------------------------------------------
    // 3. MAP WEBSITE PAYLOAD
    // ------------------------------------------------------------------------

    const mapped =
      mapFormPayload(rawParams);

    const payload =
      mapped.payload;

    const displaySchema =
      mapped.displaySchema;

    Logger.log(
      'Mapped payload: ' +
      JSON.stringify(payload)
    );


    // ------------------------------------------------------------------------
    // 4. CORE VALUES
    // ------------------------------------------------------------------------

    const client =
      payload.client || {};

    const request =
      payload.request || {};

    const name =
      client.name || 'Not provided';

    const userEmail =
      client.email
        ? String(client.email)
            .trim()
            .toLowerCase()
        : '';

    const category =
      request.situation ||
      'General Inquiry';

    const userGoal =
      request.goal ||
      '';

    const selectedUrgency =
      request.timeframe ||
      'Medium';

    const submissionDate =
      payload.submissionDate ||
      Utilities.formatDate(
        new Date(),
        Session.getScriptTimeZone(),
        'yyyy-MM-dd HH:mm:ss z'
      );

    Logger.log(
      'Name: ' +
      name
    );

    Logger.log(
      'Email: ' +
      userEmail
    );

    Logger.log(
      'Category: ' +
      category
    );

    Logger.log(
      'Urgency: ' +
      selectedUrgency
    );


    // ------------------------------------------------------------------------
    // 5. HONEYPOT
    // ------------------------------------------------------------------------

    const honeypotValue =
      rawParams.website_url ||
      rawParams.hp_comments ||
      '';

    if (
      honeypotValue &&
      String(honeypotValue).trim() !== ''
    ) {

      Logger.log(
        'HONEYPOT TRIPPED'
      );

      return createJsonResponse({
        status: 'success',
        message: 'Form submitted successfully.'
      });
    }


    // ------------------------------------------------------------------------
    // 6. RATE LIMITING
    // ------------------------------------------------------------------------

    if (
      rateLimitConfig.enabled &&
      userEmail &&
      userEmail !== 'not provided'
    ) {

      const cache =
        CacheService.getScriptCache();

      const cacheKey =
        'rl_' +
        Utilities.base64Encode(
          userEmail
        );

      const isCooldown =
        cache.get(cacheKey);

      if (isCooldown) {

        Logger.log(
          'RATE LIMIT TRIGGERED FOR: ' +
          userEmail
        );

        return createJsonResponse({

          status: 'error',

          message:
            'Please wait ' +
            (
              rateLimitConfig.cooldownSeconds ||
              60
            ) +
            ' seconds before submitting another request.'

        });
      }

      cache.put(
        cacheKey,
        'active',
        rateLimitConfig.cooldownSeconds || 60
      );
    }


    // ------------------------------------------------------------------------
    // 7. GOOGLE FORM RECORDING
    // ------------------------------------------------------------------------

    try {

      Logger.log(
        'Starting Google Form submission...'
      );

      const FORM_ID =
        '10ahsRmbXxFjcVGOY3IjZcrptctulxcS4sdQygAOp9mc';

      const form =
        FormApp.openById(
          FORM_ID
        );

      const formResponse =
        form.createResponse();

      const items =
        form.getItems();

      const responseMap = {

        name:
          client.name,

        email:
          client.email,

        phone:
          client.phone,

        location:
          client.location,

        pref:
          client.preferredContact,

        usedBefore:
          client.isPreviousCustomer
            ? 'Yes'
            : 'No',

        clientType:
          client.contactingAs,

        category:
          category,

        urgency:
          selectedUrgency,

        goal:
          userGoal

      };

      let submittedAnswers = 0;

      items.forEach(function(item) {

        const itemType =
          item.getType();

        const title =
          item.getTitle()
            .toLowerCase()
            .trim();

        let valueToSubmit = null;


        // Name
        if (
          title.indexOf('name') !== -1
        ) {

          valueToSubmit =
            responseMap.name;

        }

        // Email
        else if (
          title.indexOf('email') !== -1
        ) {

          valueToSubmit =
            responseMap.email;

        }

        // Phone
        else if (
          title.indexOf('phone') !== -1
        ) {

          valueToSubmit =
            responseMap.phone;

        }

        // Location / Address
        else if (
          title.indexOf('location') !== -1 ||
          title.indexOf('address') !== -1
        ) {

          valueToSubmit =
            responseMap.location;

        }

        // Preferred contact
        else if (
          title.indexOf('contact') !== -1 ||
          title.indexOf('prefer') !== -1
        ) {

          valueToSubmit =
            responseMap.pref;

        }

        // Used before
        else if (
          title.indexOf('used') !== -1 ||
          title.indexOf('before') !== -1
        ) {

          valueToSubmit =
            responseMap.usedBefore;

        }

        // Contacting as
        else if (
          title.indexOf('client') !== -1 ||
          title.indexOf('contacting as') !== -1
        ) {

          valueToSubmit =
            responseMap.clientType;

        }

        // Help category
        else if (
          title.indexOf('category') !== -1 ||
          title.indexOf('help') !== -1 ||
          title.indexOf('situation') !== -1
        ) {

          valueToSubmit =
            responseMap.category;

        }

        // Urgency
        else if (
          title.indexOf('urgency') !== -1 ||
          title.indexOf('priority') !== -1 ||
          title.indexOf('timeframe') !== -1
        ) {

          valueToSubmit =
            responseMap.urgency;

        }

        // Goal
        else if (
          title.indexOf('goal') !== -1 ||
          title.indexOf('enquiry') !== -1 ||
          title.indexOf('achieve') !== -1 ||
          title.indexOf('details') !== -1
        ) {

          valueToSubmit =
            responseMap.goal;

        }


        if (
          valueToSubmit !== null &&
          valueToSubmit !== undefined &&
          String(valueToSubmit).trim() !== ''
        ) {

          try {

            if (
              itemType ===
              FormApp.ItemType.TEXT
            ) {

              formResponse
                .withItemResponse(
                  item
                    .asTextItem()
                    .createResponse(
                      String(valueToSubmit)
                    )
                );

              submittedAnswers++;

            }

            else if (
              itemType ===
              FormApp.ItemType.PARAGRAPH_TEXT
            ) {

              formResponse
                .withItemResponse(
                  item
                    .asParagraphTextItem()
                    .createResponse(
                      String(valueToSubmit)
                    )
                );

              submittedAnswers++;

            }

            else if (
              itemType ===
              FormApp.ItemType.MULTIPLE_CHOICE
            ) {

              const mcItem =
                item.asMultipleChoiceItem();

              const validChoices =
                mcItem
                  .getChoices()
                  .map(function(choice) {
                    return choice.getValue();
                  });

              const match =
                validChoices.find(function(choice) {

                  return choice
                    .toLowerCase()
                    .trim() ===
                    String(valueToSubmit)
                      .toLowerCase()
                      .trim();

                });

              if (match) {

                formResponse
                  .withItemResponse(
                    mcItem.createResponse(
                      match
                    )
                  );

                submittedAnswers++;

              } else {

                Logger.log(
                  'No exact Google Form choice match for [' +
                  item.getTitle() +
                  '] value [' +
                  valueToSubmit +
                  ']'
                );
              }

            }

            else if (
              itemType ===
              FormApp.ItemType.LIST
            ) {

              const listItem =
                item.asListItem();

              const validChoices =
                listItem
                  .getChoices()
                  .map(function(choice) {
                    return choice.getValue();
                  });

              const match =
                validChoices.find(function(choice) {

                  return choice
                    .toLowerCase()
                    .trim() ===
                    String(valueToSubmit)
                      .toLowerCase()
                      .trim();

                });

              if (match) {

                formResponse
                  .withItemResponse(
                    listItem.createResponse(
                      match
                    )
                  );

                submittedAnswers++;

              } else {

                Logger.log(
                  'No exact Google Form list choice match for [' +
                  item.getTitle() +
                  '] value [' +
                  valueToSubmit +
                  ']'
                );
              }
            }

          } catch (itemError) {

            Logger.log(
              'Could not set Google Form field [' +
              item.getTitle() +
              ']: ' +
              itemError.toString()
            );
          }
        }
      });


      if (
        submittedAnswers > 0
      ) {

        formResponse.submit();

        Logger.log(
          'Google Form submission successful. Answers: ' +
          submittedAnswers
        );

      } else {

        Logger.log(
          'WARNING: No Google Form answers were submitted.'
        );
      }


    } catch (formError) {

      Logger.log(
        'Google Form logging failed: ' +
        formError.toString()
      );

      // IMPORTANT:
      // Google Form failure does NOT stop email processing.
    }


    // ------------------------------------------------------------------------
    // 8. SPAM CHECK
    // ------------------------------------------------------------------------

    const spamResult =
      (typeof checkSpamKeywords === 'function')
        ? checkSpamKeywords(
            payload,
            spamConfig
          )
        : {
            isSpam: false,
            matchedKeywords: []
          };


    Logger.log(
      'Spam result: ' +
      JSON.stringify(spamResult)
    );


    // ------------------------------------------------------------------------
    // 9. REVIEW CHECK
    // ------------------------------------------------------------------------

    const reviewResult =
      (typeof checkReviewKeywords === 'function')
        ? checkReviewKeywords(
            payload,
            reviewConfig
          )
        : {
            needsReview: false,
            matchedKeywords: []
          };


    Logger.log(
      'Review result: ' +
      JSON.stringify(reviewResult)
    );


    // ------------------------------------------------------------------------
    // 10. URGENCY CHECK
    // ------------------------------------------------------------------------

    const isUrgent =
      String(selectedUrgency)
        .toLowerCase()
        .indexOf('high') !== -1 ||
      String(selectedUrgency)
        .toLowerCase() === 'urgent';


    Logger.log(
      'Urgent: ' +
      isUrgent
    );


    // ------------------------------------------------------------------------
    // 11. SUBJECT PREFIX
    // ------------------------------------------------------------------------

    let subjectPrefix = '';


    if (
      spamResult.isSpam
    ) {

      subjectPrefix +=
        (
          spamConfig.settings &&
          spamConfig.settings.flagSubjectPrefix
        )
          ? spamConfig.settings.flagSubjectPrefix
          : '[SPAM] ';
    }


    if (
      isUrgent
    ) {

      subjectPrefix +=
        '[URGENT] ';
    }


    if (
      reviewResult.needsReview
    ) {

      subjectPrefix +=
        (
          reviewConfig.settings &&
          reviewConfig.settings.flagSubjectPrefix
        )
          ? reviewConfig.settings.flagSubjectPrefix
          : '[FLAGGED] ';
    }


    // ------------------------------------------------------------------------
    // 12. TEMPLATE FIELD ARRAY
    // ------------------------------------------------------------------------

    const fields = [

      {
        title: 'Name',
        value:
          client.name ||
          'Not provided'
      },

      {
        title: 'Email Address',
        value:
          client.email ||
          'Not provided'
      },

      {
        title: 'Phone',
        value:
          client.phone ||
          'Not provided'
      },

      {
        title: 'Address / Location',
        value:
          client.location ||
          'Not provided'
      },

      {
        title: 'Preferred Contact',
        value:
          client.preferredContact ||
          'Not provided'
      },

      {
        title: 'Used RD3 Tech Before',
        value:
          client.isPreviousCustomer
            ? 'Yes'
            : 'No'
      },

      {
        title: 'Contacting As',
        value:
          client.contactingAs ||
          'Not provided'
      },

      {
        title: 'Help Category',
        value:
          category
      },

      {
        title: 'Urgency Level',
        value:
          selectedUrgency
      },

      {
        title: 'Enquiry / Details',
        value:
          userGoal ||
          'Not provided'
      }

    ];


    // ------------------------------------------------------------------------
    // 13. SECURITY EVALUATION OBJECT
    // ------------------------------------------------------------------------

    const secEval = {

      isSpam:
        !!spamResult.isSpam,

      requiresReview:
        !!reviewResult.needsReview,

      isUrgent:
        !!isUrgent,

      spamFlags:
        spamResult.matchedKeywords || [],

      reviewFlags:
        reviewResult.matchedKeywords || [],

      flags:
        [
          ...(spamResult.matchedKeywords || []),
          ...(reviewResult.matchedKeywords || [])
        ]

    };


    // ------------------------------------------------------------------------
    // 14. ADMIN EMAIL
    // ------------------------------------------------------------------------

    let adminEmailSent = false;


    try {

      Logger.log('============================================================');
      Logger.log('ADMIN EMAIL — START');
      Logger.log('============================================================');

      if (
        !adminEmail ||
        adminEmail.indexOf('@') === -1
      ) {

        throw new Error(
          'Invalid admin email address: ' +
          adminEmail
        );
      }


      Logger.log(
        'Recipient: ' +
        adminEmail
      );


      const adminTemplate =
        HtmlService.createTemplateFromFile(
          'AdminEmail'
        );


      // Variables required by AdminEmail.html

      adminTemplate.name =
        name;

      adminTemplate.userEmail =
        userEmail;

      adminTemplate.fields =
        fields;

      adminTemplate.submissionDate =
        submissionDate;

      adminTemplate.displaySchema =
        displaySchema;

      adminTemplate.request =
        request;

      adminTemplate.client =
        client;

      adminTemplate.secEval =
        secEval;

      adminTemplate.isUrgent =
        isUrgent;


      const adminHtml =
        adminTemplate
          .evaluate()
          .getContent();


      Logger.log(
        'Admin template rendered successfully.'
      );


      const adminSubject =
        `${subjectPrefix}[Website Enquiry] ${name} — ${category}`;


      MailApp.sendEmail({

        to:
          adminEmail,

        replyTo:
          (
            userEmail &&
            userEmail.indexOf('@') !== -1
          )
            ? userEmail
            : adminEmail,

        subject:
          adminSubject,

        htmlBody:
          adminHtml

      });


      adminEmailSent = true;


      Logger.log(
        'ADMIN EMAIL SENT SUCCESSFULLY'
      );


    } catch (adminError) {

      Logger.log(
        'ADMIN EMAIL FAILED: ' +
        adminError.toString()
      );

      if (
        adminError.stack
      ) {

        Logger.log(
          adminError.stack
        );
      }
    }


    // ------------------------------------------------------------------------
    // 15. CLIENT EMAIL
    // ------------------------------------------------------------------------

    let clientEmailSent = false;


    if (
      userEmail &&
      userEmail !== 'not provided' &&
      userEmail.indexOf('@') !== -1
    ) {

      try {

        Logger.log('============================================================');
        Logger.log('CLIENT EMAIL — START');
        Logger.log('============================================================');

        Logger.log(
          'Recipient: ' +
          userEmail
        );


        const clientTemplate =
          HtmlService.createTemplateFromFile(
            'ClientEmail'
          );


        clientTemplate.name =
          name;

        clientTemplate.fields =
          fields;

        clientTemplate.submissionDate =
          submissionDate;

        clientTemplate.displaySchema =
          displaySchema;

        clientTemplate.client =
          client;

        clientTemplate.request =
          request;


        const clientHtml =
          clientTemplate
            .evaluate()
            .getContent();


        Logger.log(
          'Client template rendered successfully.'
        );


        const cleanCategory =
          category
            .replace(
              /^Help with\s+/i,
              ''
            )
            .trim();


        const clientSubject =
          `Thanks ${name}, we’ll be in touch to help you with ${cleanCategory} | RD3 Tech`;


        MailApp.sendEmail({

          to:
            userEmail,

          replyTo:
            adminEmail,

          subject:
            clientSubject,

          htmlBody:
            clientHtml

        });


        clientEmailSent = true;


        Logger.log(
          'CLIENT EMAIL SENT SUCCESSFULLY'
        );


      } catch (clientError) {

        Logger.log(
          'CLIENT EMAIL FAILED: ' +
          clientError.toString()
        );

        if (
          clientError.stack
        ) {

          Logger.log(
            clientError.stack
          );
        }
      }

    } else {

      Logger.log(
        'CLIENT EMAIL NOT SENT — INVALID EMAIL: ' +
        userEmail
      );
    }


    // ------------------------------------------------------------------------
    // 16. FINAL RESULT
    // ------------------------------------------------------------------------

    Logger.log('============================================================');
    Logger.log('RD3 TECH — doPost COMPLETE');
    Logger.log('============================================================');

    Logger.log(
      'Admin email sent: ' +
      adminEmailSent
    );

    Logger.log(
      'Client email sent: ' +
      clientEmailSent
    );

    Logger.log(
      'Spam: ' +
      spamResult.isSpam
    );

    Logger.log(
      'Review: ' +
      reviewResult.needsReview
    );

    Logger.log(
      'Urgent: ' +
      isUrgent
    );

    Logger.log('============================================================');


    return createJsonResponse({

      status:
        'success',

      message:
        'Enquiry sent successfully.',

      adminEmailSent:
        adminEmailSent,

      clientEmailSent:
        clientEmailSent

    });


  } catch (error) {

    Logger.log('============================================================');
    Logger.log('FATAL ERROR IN doPost');
    Logger.log('============================================================');

    Logger.log(
      error.toString()
    );

    if (
      error.stack
    ) {

      Logger.log(
        error.stack
      );
    }

    Logger.log('============================================================');


    return createJsonResponse({

      status:
        'error',

      message:
        error.toString()

    });
  }
}


/**
 * ============================================================================
 * SAVE TO SHEET
 * ============================================================================
 */
function saveToSheet(data) {

  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  if (!ss) {
    return;
  }


  let sheet =
    ss.getSheetByName(
      'Submissions'
    );


  if (!sheet) {

    sheet =
      ss.insertSheet(
        'Submissions'
      );

    sheet.appendRow([

      'Timestamp',
      'Name',
      'Email',
      'Phone',
      'Location',
      'Preferred Contact',
      'Used Before',
      'Client Type',
      'Category',
      'Urgency',
      'Goal / Outcome'

    ]);
  }


  sheet.appendRow([

    data.timestamp,
    data.name,
    data.email,
    data.phone,
    data.location,
    data.pref,
    data.usedBefore,
    data.clientType,
    data.category,
    data.urgency,
    data.goal

  ]);
}


/**
 * ============================================================================
 * PARSE URL-ENCODED POST DATA
 * ============================================================================
 */
function parseQueryString(queryString) {

  const params = {};

  if (!queryString) {
    return params;
  }


  const pairs =
    queryString.split('&');


  for (
    let i = 0;
    i < pairs.length;
    i++
  ) {

    const pair =
      pairs[i].split('=');


    const key =
      decodeURIComponent(
        pair[0]
      );


    const value =
      decodeURIComponent(
        (
          pair[1] || ''
        ).replace(
          /\+/g,
          ' '
        )
      );


    if (key) {

      params[key] =
        value;
    }
  }


  return params;
}


/**
 * ============================================================================
 * JSON RESPONSE
 * ============================================================================
 */
function createJsonResponse(data) {

  return ContentService
    .createTextOutput(
      JSON.stringify(data)
    )
    .setMimeType(
      ContentService.MimeType.JSON
    );
}


/**
 * ============================================================================
 * HTML ESCAPING
 * ============================================================================
 */
function escapeHtml(text) {

  return String(text)

    .replace(
      /&/g,
      '&amp;'
    )

    .replace(
      /</g,
      '&lt;'
    )

    .replace(
      />/g,
      '&gt;'
    )

    .replace(
      /"/g,
      '&quot;'
    )

    .replace(
      /'/g,
      '&#039;'
    );
}