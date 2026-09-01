
/**
 * ============================================================================
 * RD3 TECH — GOOGLE FORM SUBMISSION HANDLER
 * ============================================================================
 *
 * Uses Mapping.gs as the single source of truth for field extraction.
 *
 * IMPORTANT:
 * The canonical property is:
 *
 *     client.contactPreference
 *
 * This must remain consistent with:
 *
 *     FIELD_SCHEMA.contactPreference
 *     AdminEmail.html
 *     ClientEmail.html
 *
 * ============================================================================
 */

function onFormSubmit(e) {

  // ------------------------------------------------------------------
  // 0. DEFENSIVE EVENT CHECK
  // ------------------------------------------------------------------

  if (!e || !e.response) {
    Logger.log('⚠️ Manual test run – injecting mock event');
    e = generateMockFormEvent();
  }


  // ------------------------------------------------------------------
  // 1. LOAD CONFIGURATION
  // ------------------------------------------------------------------

  const formConfig =
    typeof getFormConfig === 'function'
      ? getFormConfig()
      : {};

  const reviewConfig =
    typeof getReviewConfig === 'function'
      ? getReviewConfig()
      : {};

  const spamConfig =
    typeof getSpamConfig === 'function'
      ? getSpamConfig()
      : {};

  const adminEmail =
    formConfig &&
    formConfig.settings &&
    formConfig.settings.adminEmail
      ? formConfig.settings.adminEmail
      : 'tom@rd3tech.com';


  // ------------------------------------------------------------------
  // 2. TURN FORM ITEM RESPONSES INTO SIMPLE KEY/VALUE OBJECT
  // ------------------------------------------------------------------

  const rawParams = {};
  const itemResponses = e.response.getItemResponses();

  itemResponses.forEach(itemResponse => {

    const title =
      itemResponse
        .getItem()
        .getTitle();

    const raw =
      itemResponse.getResponse();

    const value =
      Array.isArray(raw)
        ? raw.join(', ')
        : String(raw || '');

    rawParams[title] = value;
  });


  // ------------------------------------------------------------------
  // 3. RESPONDENT EMAIL
  // ------------------------------------------------------------------

  let respondentEmail = '';

  try {
    respondentEmail =
      e.response.getRespondentEmail() || '';
  } catch (err) {
    Logger.log(
      '⚠️ Unable to read respondent email: ' +
      err.message
    );
  }

  if (respondentEmail) {
    rawParams['email'] = respondentEmail;
  }


  // ------------------------------------------------------------------
  // 4. MAP USING Mapping.gs
  // ------------------------------------------------------------------

  const mapped = mapFormPayload(rawParams);

  if (!mapped || !mapped.payload) {

    Logger.log(
      '❌ mapFormPayload() did not return a valid payload.'
    );

    return;
  }

  const payload = mapped.payload;


  // ------------------------------------------------------------------
  // 5. PAYLOAD REFERENCES
  // ------------------------------------------------------------------

  const client =
    payload.client || {};

  const request =
    payload.request || {};

  const security =
    payload.security || {};


  // ------------------------------------------------------------------
  // 6. DEBUG CONTACT PREFERENCE
  // ------------------------------------------------------------------
  //
  // This confirms the value survives Mapping.gs before the email
  // template is created.
  //

  Logger.log('============================================================');
  Logger.log('GOOGLE FORM CONTACT PREFERENCE');
  Logger.log('============================================================');

  Logger.log(
    'payload.client.contactPreference = "' +
    String(client.contactPreference || '') +
    '"'
  );

  Logger.log(
    'payload.client = ' +
    JSON.stringify(client, null, 2)
  );

  Logger.log('============================================================');


  // ------------------------------------------------------------------
  // 7. HONEYPOT CHECK
  // ------------------------------------------------------------------

  const honeypotValue =
    String(security.honeypot || '').trim();

  if (honeypotValue !== '') {

    Logger.log(
      '🚫 HONEYPOT TRIPPED: "' +
      honeypotValue +
      '"'
    );

    return;
  }


  // ------------------------------------------------------------------
  // 8. MODERATION
  // ------------------------------------------------------------------

  const userGoal =
    String(request.userGoal || '').trim();


  const reviewResult =
    typeof checkReviewKeywords === 'function'
      ? checkReviewKeywords(
          userGoal,
          reviewConfig
        )
      : {
          needsReview: false,
          matchedKeywords: []
        };


  const spamResult =
    typeof checkSpamKeywords === 'function'
      ? checkSpamKeywords(
          userGoal,
          spamConfig
        )
      : {
          isSpam: false,
          matchedKeywords: []
        };


  const isUrgent =
    String(request.urgency || '')
      .trim()
      .toLowerCase() === 'high';


  // ------------------------------------------------------------------
  // 9. FORMATTED DATE
  // ------------------------------------------------------------------

  const formattedDate =
    Utilities.formatDate(
      new Date(),
      Session.getScriptTimeZone() ||
        'Pacific/Auckland',
      'dd MMMM yyyy, h:mm a'
    );


  // ------------------------------------------------------------------
  // 10. BUILD CLIENT DATA
  // ------------------------------------------------------------------
  //
  // IMPORTANT:
  //
  // DO NOT use:
  //
  //     preferredContact
  //
  // The templates use:
  //
  //     safeClient.contactPreference
  //
  // Therefore the property MUST be:
  //
  //     contactPreference
  //

  const clientData = {

    name:
      client.name ||
      'Website Visitor',

    firstName:
      client.name
        ? client.name.split(' ')[0]
        : 'there',

    email:
      client.email ||
      'N/A',

    phone:
      client.phone ||
      'N/A',

    location:
      client.location ||
      'N/A',

    contactPreference:
      client.contactPreference ||
      'Not provided',

    isPreviousCustomer:
      !!client.usedBefore,

    contactingAs:
      client.contactingAs ||
      'Not provided'
  };


  // ------------------------------------------------------------------
  // 11. VERIFY CLIENT DATA BEFORE EMAIL
  // ------------------------------------------------------------------

  Logger.log('============================================================');
  Logger.log('CLIENT DATA PASSED TO EMAIL TEMPLATE');
  Logger.log('============================================================');

  Logger.log(
    JSON.stringify(
      clientData,
      null,
      2
    )
  );

  Logger.log(
    'clientData.contactPreference = "' +
    clientData.contactPreference +
    '"'
  );

  Logger.log('============================================================');


  // ------------------------------------------------------------------
  // 12. BUILD REQUEST DATA
  // ------------------------------------------------------------------

  const requestData = {

    helpCategory:
      request.helpCategory ||
      'Not specified',

    userGoal:
      request.userGoal ||
      'Not specified',

    urgency:
      request.urgency ||
      'Not specified'
  };


  // ------------------------------------------------------------------
  // 13. BUILD SECURITY EVALUATION
  // ------------------------------------------------------------------

  const secEvalData = {

    isSpam:
      !!spamResult.isSpam,

    requiresReview:
      !!reviewResult.needsReview,

    isUrgent:
      isUrgent,

    spamScore:
      spamResult.isSpam
        ? 100
        : 0,

    statusText:
      spamResult.isSpam
        ? 'Flagged Spam'
        : (
            reviewResult.needsReview
              ? 'Requires Review'
              : 'Passed Security Check'
          ),

    spamFlags:
      spamResult.matchedKeywords ||
      [],

    reviewFlags:
      reviewResult.matchedKeywords ||
      [],

    flags: [

      ...(spamResult.matchedKeywords || [])
        .map(
          k => 'SPAM: ' + k
        ),

      ...(reviewResult.matchedKeywords || [])
        .map(
          k => 'REVIEW: ' + k
        )
    ]
  };


  // ------------------------------------------------------------------
  // 14. SUBJECT PREFIX
  // ------------------------------------------------------------------

  let subjectPrefix = '';


  if (spamResult.isSpam) {

    subjectPrefix +=
      (
        spamConfig &&
        spamConfig.settings &&
        spamConfig.settings.flagSubjectPrefix
      )
        ? spamConfig.settings.flagSubjectPrefix
        : '[SPAM] ';
  }


  if (isUrgent) {
    subjectPrefix += '[URGENT] ';
  }


  if (reviewResult.needsReview) {

    subjectPrefix +=
      (
        reviewConfig &&
        reviewConfig.settings &&
        reviewConfig.settings.flagSubjectPrefix
      )
        ? reviewConfig.settings.flagSubjectPrefix
        : '[FLAGGED] ';
  }


  // ------------------------------------------------------------------
  // 15. ADMIN EMAIL
  // ------------------------------------------------------------------

  try {

    const adminTemplate =
      HtmlService.createTemplateFromFile(
        'AdminEmail'
      );


    adminTemplate.submissionDate =
      formattedDate;

    adminTemplate.client =
      clientData;

    adminTemplate.request =
      requestData;

    adminTemplate.secEval =
      secEvalData;


    const adminHtmlBody =
      adminTemplate
        .evaluate()
        .getContent();


    MailApp.sendEmail({

      to:
        adminEmail,

      replyTo:
        clientData.email !== 'N/A'
          ? clientData.email
          : adminEmail,

      subject:
        EMAIL_SUBJECTS.admin(
          subjectPrefix,
          clientData.name,
          requestData.helpCategory
        ),

      htmlBody:
        adminHtmlBody
    });


    Logger.log(
      '✅ Admin email sent'
    );


  } catch (err) {

    Logger.log(
      '❌ Admin email failed: ' +
      err.stack
    );
  }


  // ------------------------------------------------------------------
  // 16. CLIENT EMAIL
  // ------------------------------------------------------------------

  if (
    clientData.email &&
    clientData.email !== 'N/A'
  ) {

    try {

      const clientTemplate =
        HtmlService.createTemplateFromFile(
          'ClientEmail'
        );


      clientTemplate.submissionDate =
        formattedDate;

      clientTemplate.client =
        clientData;

      clientTemplate.request =
        requestData;


      const clientHtmlBody =
        clientTemplate
          .evaluate()
          .getContent();


      MailApp.sendEmail({

        to:
          clientData.email,

        replyTo:
          adminEmail,

        subject:
          EMAIL_SUBJECTS.client(
            clientData.name,
            requestData.helpCategory
          ),

        htmlBody:
          clientHtmlBody
      });


      Logger.log(
        '✅ Client email sent'
      );


    } catch (err) {

      Logger.log(
        '⚠️ Client email failed: ' +
        err.stack
      );
    }

  } else {

    Logger.log(
      '⚠️ Client email skipped — no valid email address'
    );
  }
}


/**
 * ============================================================================
 * MOCK EVENT FOR TESTING IN THE APPS SCRIPT IDE
 * ============================================================================
 */
function generateMockFormEvent() {

  return {

    response: {

      getRespondentEmail:
        function () {

          return 'test.client@example.com';
        },


      getItemResponses:
        function () {

          return [

            {
              getItem:
                function () {

                  return {
                    getTitle:
                      function () {
                        return 'Name';
                      }
                  };
                },

              getResponse:
                function () {
                  return 'Jane Doe';
                }
            },


            {
              getItem:
                function () {

                  return {
                    getTitle:
                      function () {
                        return 'Email';
                      }
                  };
                },

              getResponse:
                function () {
                  return 'jane.doe@example.com';
                }
            },


            {
              getItem:
                function () {

                  return {
                    getTitle:
                      function () {
                        return 'Phone';
                      }
                  };
                },

              getResponse:
                function () {
                  return '021 123 4567';
                }
            },


            {
              getItem:
                function () {

                  return {
                    getTitle:
                      function () {
                        return 'Address / Location:';
                      }
                  };
                },

              getResponse:
                function () {
                  return 'Whangarei';
                }
            },


            {
              getItem:
                function () {

                  return {
                    getTitle:
                      function () {
                        return 'How would you prefer us to contact you?';
                      }
                  };
                },

              getResponse:
                function () {
                  return 'Email';
                }
            },


            {
              getItem:
                function () {

                  return {
                    getTitle:
                      function () {
                        return 'Have you used RD3 Tech before?';
                      }
                  };
                },

              getResponse:
                function () {
                  return 'Yes';
                }
            },


            {
              getItem:
                function () {

                  return {
                    getTitle:
                      function () {
                        return 'I am contacting RD3 Tech as:';
                      }
                  };
                },

              getResponse:
                function () {
                  return 'Home or Family';
                }
            },


            {
              getItem:
                function () {

                  return {
                    getTitle:
                      function () {
                        return 'What can we help you with?';
                      }
                  };
                },

              getResponse:
                function () {
                  return 'Help with Something Broken?';
                }
            },


            {
              getItem:
                function () {

                  return {
                    getTitle:
                      function () {
                        return 'What Are You Trying To Achieve?';
                      }
                  };
                },

              getResponse:
                function () {
                  return 'Need help with TV setup';
                }
            },


            {
              getItem:
                function () {

                  return {
                    getTitle:
                      function () {
                        return 'How Urgent Is This For You?';
                      }
                  };
                },

              getResponse:
                function () {
                  return 'High';
                }
            },


            {
              getItem:
                function () {

                  return {
                    getTitle:
                      function () {
                        return 'Website URL Security Check: Please leave this field empty.';
                      }
                  };
                },

              getResponse:
                function () {
                  return '';
                }
            }

          ];
        }
    }
  };
}

