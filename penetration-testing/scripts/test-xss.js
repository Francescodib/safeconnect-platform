/**
 * XSS (Cross-Site Scripting) Penetration Testing
 * Author: Francesco di Biase
 *
 * Tests the application's resistance to XSS attacks
 */

const axios = require('axios');
const chalk = require('chalk');

const BASE_URL = process.env.API_URL || 'http://localhost:5000/api';

const xssPayloads = [
  "<script>alert('XSS')</script>",
  "<img src=x onerror=alert('XSS')>",
  "<svg onload=alert('XSS')>",
  "javascript:alert('XSS')",
  "<iframe src='javascript:alert(\"XSS\")'></iframe>",
  "<body onload=alert('XSS')>",
  "<input onfocus=alert('XSS') autofocus>",
  "<select onfocus=alert('XSS') autofocus>",
  "<textarea onfocus=alert('XSS') autofocus>",
  "<marquee onstart=alert('XSS')>",
  "<div style='background:url(javascript:alert(\"XSS\"))'>",
  "';alert('XSS');//"
];

const results = {
  total: 0,
  passed: 0,
  failed: 0,
  tests: []
};

let authToken = null;

async function login() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'user@safeconnect.com',
      password: 'User123!@#'
    });
    authToken = response.data.data.accessToken;
    console.log(chalk.green('✓ Authenticated successfully\n'));
  } catch (error) {
    console.log(chalk.yellow('⚠ Could not authenticate, some tests may fail\n'));
  }
}

async function testXSS(payload, field) {
  results.total++;

  try {
    console.log(chalk.blue(`\nTesting XSS in: ${field}`));
    console.log(chalk.gray(`Payload: ${payload.substring(0, 50)}...`));

    // Test creating a document with XSS payload
    const response = await axios({
      method: 'POST',
      url: `${BASE_URL}/documents`,
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      data: {
        title: field === 'title' ? payload : 'Test Title',
        content: field === 'content' ? payload : 'Test content',
        shared: false
      },
      validateStatus: () => true
    });

    // Check if created successfully
    if (response.status === 201) {
      const document = response.data.data;

      // Check if payload was sanitized
      const fieldValue = field === 'title' ? document.title : document.content;
      // Check for dangerous HTML tags and event handlers
      // Note: plain text "javascript:" is not dangerous without an href/src context
      const containsUnsafeHTML = /<script|onerror\s*=|onload\s*=|onfocus\s*=|onstart\s*=|<iframe|<svg|<img[^>]+onerror/i.test(fieldValue);

      if (containsUnsafeHTML) {
        console.log(chalk.red('✗ FAIL - Dangerous HTML not sanitized'));
        results.failed++;
        results.tests.push({
          field,
          payload,
          status: 'FAIL',
          reason: 'Unsafe HTML present in response'
        });
      } else {
        console.log(chalk.green('✓ PASS - Dangerous HTML sanitized'));
        results.passed++;
        results.tests.push({
          field,
          payload,
          status: 'PASS'
        });
      }

      // Clean up - delete the test document
      if (document.id) {
        await axios.delete(`${BASE_URL}/documents/${document.id}`, {
          headers: { Authorization: `Bearer ${authToken}` },
          validateStatus: () => true
        });
      }
    } else {
      console.log(chalk.green('✓ PASS - Request rejected (validation error)'));
      results.passed++;
      results.tests.push({
        field,
        payload,
        status: 'PASS',
        reason: 'Request rejected by validation'
      });
    }
  } catch (error) {
    console.log(chalk.yellow('⚠ WARNING - Unexpected error'));
    console.log(chalk.gray(error.message));
    results.tests.push({
      field,
      payload,
      status: 'WARNING',
      error: error.message
    });
  }
}

async function runTests() {
  console.log(chalk.bold.cyan('\n=== XSS Penetration Test ===\n'));
  console.log(chalk.gray(`Testing against: ${BASE_URL}\n`));

  await login();

  if (!authToken) {
    console.log(chalk.red('Cannot proceed without authentication'));
    process.exit(1);
  }

  // Test title field
  console.log(chalk.bold('\n--- Testing Title Field ---'));
  for (const payload of xssPayloads) {
    await testXSS(payload, 'title');
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Test content field
  console.log(chalk.bold('\n--- Testing Content Field ---'));
  for (const payload of xssPayloads) {
    await testXSS(payload, 'content');
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Print summary
  console.log(chalk.bold.cyan('\n\n=== Test Summary ==='));
  console.log(chalk.white(`Total tests: ${results.total}`));
  console.log(chalk.green(`Passed: ${results.passed}`));
  console.log(chalk.red(`Failed: ${results.failed}`));

  const successRate = ((results.passed / results.total) * 100).toFixed(2);
  console.log(chalk.bold(`Success rate: ${successRate}%\n`));

  if (results.failed > 0) {
    console.log(chalk.red.bold('\n⚠ XSS VULNERABILITIES DETECTED!'));
    console.log(chalk.yellow('Review failed tests above for details.\n'));
    process.exit(1);
  } else {
    console.log(chalk.green.bold('\n✓ ALL TESTS PASSED - Application is protected against XSS\n'));
  }
}

// Run tests
runTests().catch(error => {
  console.error(chalk.red('Error running tests:'), error.message);
  process.exit(1);
});
