function testDoPost() {
  var mockEvent = {
    parameter: {
      name: 'Jane Doe (Test)',
      email: 'tom.revill@gmail.com',
      phone: '021 555 1234',
      preferredContact: 'Email',
      usedBefore: 'No',
      contactingAs: 'Small Business',
      location: 'Auckland',
      helpCategory: 'Help with Something Broken?',
      userGoal: 'Testing the doPost endpoint to confirm data writing and handling.',
      urgency: 'Medium',
      website_url: ''          // empty honeypot
    },
    postData: {
      type: 'application/x-www-form-urlencoded',
      length: 0,               // optional but realistic
      contents: 'name=Jane+Doe+%28Test%29&email=jane.test%40example.com&phone=021+555+1234&preferredContact=Email&usedBefore=No&contactingAs=Small+Business&location=Auckland&helpCategory=Help+with+Something+Broken%3F&userGoal=Testing+the+doPost+endpoint+to+confirm+data+writing+and+handling.&urgency=Medium&website_url='
    }
  };

  // ... rest stays the same
}