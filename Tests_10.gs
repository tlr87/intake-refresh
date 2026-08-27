/**
 * One-click confidence test
 * Run this from the editor (select testFullPipeline → Run)
 */
function testFullPipeline() {
  Logger.log('========== STARTING FULL PIPELINE TEST ==========');

  // Simulate a real form submission with the exact titles from your live form
  const mockEvent = {
    response: {
      getRespondentEmail: function () { return 'test.client@example.com'; },
      getItemResponses: function () {
        return [
          { getItem: function () { return { getTitle: function () { return 'Name'; } }; }, getResponse: function () { return 'Tom Test'; } },
          { getItem: function () { return { getTitle: function () { return 'Email'; } }; }, getResponse: function () { return 'tom.revill@gmail.com'; } },
          { getItem: function () { return { getTitle: function () { return 'Phone'; } }; }, getResponse: function () { return '021 999 8888'; } },
          { getItem: function () { return { getTitle: function () { return 'Address / Location:'; } }; }, getResponse: function () { return 'Whangarei'; } },
          { getItem: function () { return { getTitle: function () { return 'How would you prefer us to contact you?'; } }; }, getResponse: function () { return 'Phone'; } },
          { getItem: function () { return { getTitle: function () { return 'Have you used RD3 Tech before?'; } }; }, getResponse: function () { return 'Yes'; } },
          { getItem: function () { return { getTitle: function () { return 'I am contacting RD3 Tech as:'; } }; }, getResponse: function () { return 'Small Business'; } },
          { getItem: function () { return { getTitle: function () { return 'What can we help you with?'; } }; }, getResponse: function () { return 'Help with Something Broken?'; } },
          { getItem: function () { return { getTitle: function () { return 'What Are You Trying To Achieve?'; } }; }, getResponse: function () { return 'TV not turning on'; } },
          { getItem: function () { return { getTitle: function () { return 'How Urgent Is This For You?'; } }; }, getResponse: function () { return 'High'; } },
          { getItem: function () { return { getTitle: function () { return 'Website URL Security Check: Please leave this field empty.'; } }; }, getResponse: function () { return ''; } }
        ];
      }
    }
  };

  // Run the real onFormSubmit
  onFormSubmit(mockEvent);

  Logger.log('========== TEST COMPLETE ==========');
  Logger.log('Check your inbox for:');
  Logger.log('1. Admin email (should have Preferred Contact = Phone)');
  Logger.log('2. Client email (to tom.test@example.com)');
  Logger.log('Also check Executions log for any errors.');
}