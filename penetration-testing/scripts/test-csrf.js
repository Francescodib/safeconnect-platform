/**
 * CSRF (Cross-Site Request Forgery) Penetration Testing
 * Author: Francesco di Biase
 *
 * Tests the application's CSRF protection mechanisms
 */

const axios = require('axios');
const chalk = require('chalk');

const BASE_URL = process.env.API_URL || 'http://localhost:5000/api';

const results = {
  total: 0,
  passed: 0,
  failed: 0,
  tests: []
};

let authToken = null;
let validCsrfToken = null;
let csrfCookie = null;

async function login() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'user@safeconnect.com',
      password: 'User123!@#'
    });
    authToken = response.data.data.accessToken;
    console.log(chalk.green('Authenticated successfully\n'));
  } catch (error) {
    console.log(chalk.yellow('Could not authenticate, some tests may fail\n'));
  }
}

async function fetchCsrfToken() {
  try {
    const response = await axios.get(`${BASE_URL}/csrf-token`, {
      withCredentials: true
    });
    validCsrfToken = response.data.data.csrfToken;

    // Extract csrf-token cookie from response headers
    const setCookieHeaders = response.headers['set-cookie'];
    if (setCookieHeaders) {
      for (const cookie of setCookieHeaders) {
        if (cookie.startsWith('csrf-token=')) {
          csrfCookie = cookie.split(';')[0];
        }
      }
    }

    console.log(chalk.green('CSRF token obtained successfully\n'));
    return true;
  } catch (error) {
    console.log(chalk.red('Failed to obtain CSRF token\n'));
    return false;
  }
}

function addResult(name, passed, reason) {
  results.total++;
  if (passed) {
    results.passed++;
    console.log(chalk.green(`PASS - ${name}`));
  } else {
    results.failed++;
    console.log(chalk.red(`FAIL - ${name}`));
  }
  if (reason) {
    console.log(chalk.gray(`  Reason: ${reason}`));
  }
  results.tests.push({ name, status: passed ? 'PASS' : 'FAIL', reason });
}

async function testPostWithoutCsrfToken() {
  console.log(chalk.blue('\nTest: POST request without CSRF token'));

  try {
    const response = await axios({
      method: 'POST',
      url: `${BASE_URL}/documents`,
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      data: {
        title: 'CSRF Test Document',
        content: 'Testing without CSRF token',
        shared: false
      },
      validateStatus: () => true
    });

    const isProtected = response.status === 403;
    addResult(
      'POST without CSRF token is rejected',
      isProtected,
      `Status: ${response.status} (expected 403)`
    );
  } catch (error) {
    addResult('POST without CSRF token is rejected', false, error.message);
  }
}

async function testPostWithInvalidCsrfToken() {
  console.log(chalk.blue('\nTest: POST request with invalid CSRF token'));

  try {
    const response = await axios({
      method: 'POST',
      url: `${BASE_URL}/documents`,
      headers: {
        Authorization: `Bearer ${authToken}`,
        'X-CSRF-Token': 'invalid-csrf-token-12345',
        Cookie: 'csrf-token=different-invalid-token'
      },
      data: {
        title: 'CSRF Test Document',
        content: 'Testing with invalid CSRF token',
        shared: false
      },
      validateStatus: () => true
    });

    const isProtected = response.status === 403;
    addResult(
      'POST with invalid CSRF token is rejected',
      isProtected,
      `Status: ${response.status} (expected 403)`
    );
  } catch (error) {
    addResult('POST with invalid CSRF token is rejected', false, error.message);
  }
}

async function testPostWithMismatchedTokens() {
  console.log(chalk.blue('\nTest: POST request with mismatched CSRF tokens (header != cookie)'));

  try {
    const response = await axios({
      method: 'POST',
      url: `${BASE_URL}/documents`,
      headers: {
        Authorization: `Bearer ${authToken}`,
        'X-CSRF-Token': validCsrfToken,
        Cookie: 'csrf-token=completely-different-token'
      },
      data: {
        title: 'CSRF Test Document',
        content: 'Testing with mismatched tokens',
        shared: false
      },
      validateStatus: () => true
    });

    const isProtected = response.status === 403;
    addResult(
      'POST with mismatched CSRF tokens is rejected',
      isProtected,
      `Status: ${response.status} (expected 403)`
    );
  } catch (error) {
    addResult('POST with mismatched CSRF tokens is rejected', false, error.message);
  }
}

async function testPostWithValidCsrfToken() {
  console.log(chalk.blue('\nTest: POST request with valid CSRF token'));

  try {
    const response = await axios({
      method: 'POST',
      url: `${BASE_URL}/documents`,
      headers: {
        Authorization: `Bearer ${authToken}`,
        'X-CSRF-Token': validCsrfToken,
        Cookie: csrfCookie
      },
      data: {
        title: 'CSRF Test Document',
        content: 'Testing with valid CSRF token',
        shared: false
      },
      validateStatus: () => true
    });

    const isAccepted = response.status === 201;
    addResult(
      'POST with valid CSRF token is accepted',
      isAccepted,
      `Status: ${response.status} (expected 201)`
    );

    // Clean up
    if (response.status === 201 && response.data?.data?.id) {
      await axios.delete(`${BASE_URL}/documents/${response.data.data.id}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'X-CSRF-Token': validCsrfToken,
          Cookie: csrfCookie
        },
        validateStatus: () => true
      });
    }
  } catch (error) {
    addResult('POST with valid CSRF token is accepted', false, error.message);
  }
}

async function testGetDoesNotRequireCsrf() {
  console.log(chalk.blue('\nTest: GET request does not require CSRF token'));

  try {
    const response = await axios({
      method: 'GET',
      url: `${BASE_URL}/documents`,
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      validateStatus: () => true
    });

    const isAccepted = response.status === 200;
    addResult(
      'GET request works without CSRF token',
      isAccepted,
      `Status: ${response.status} (expected 200)`
    );
  } catch (error) {
    addResult('GET request works without CSRF token', false, error.message);
  }
}

async function testDeleteWithoutCsrfToken() {
  console.log(chalk.blue('\nTest: DELETE request without CSRF token'));

  try {
    // First create a document with valid CSRF
    const createResponse = await axios({
      method: 'POST',
      url: `${BASE_URL}/documents`,
      headers: {
        Authorization: `Bearer ${authToken}`,
        'X-CSRF-Token': validCsrfToken,
        Cookie: csrfCookie
      },
      data: {
        title: 'Document To Delete',
        content: 'Will attempt delete without CSRF',
        shared: false
      },
      validateStatus: () => true
    });

    if (createResponse.status !== 201) {
      addResult('DELETE without CSRF token is rejected', false, 'Could not create test document');
      return;
    }

    const docId = createResponse.data.data.id;

    // Attempt delete without CSRF token
    const deleteResponse = await axios({
      method: 'DELETE',
      url: `${BASE_URL}/documents/${docId}`,
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      validateStatus: () => true
    });

    const isProtected = deleteResponse.status === 403;
    addResult(
      'DELETE without CSRF token is rejected',
      isProtected,
      `Status: ${deleteResponse.status} (expected 403)`
    );

    // Clean up with valid CSRF
    await axios.delete(`${BASE_URL}/documents/${docId}`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'X-CSRF-Token': validCsrfToken,
        Cookie: csrfCookie
      },
      validateStatus: () => true
    });
  } catch (error) {
    addResult('DELETE without CSRF token is rejected', false, error.message);
  }
}

async function testLoginExemptFromCsrf() {
  console.log(chalk.blue('\nTest: Login endpoint is exempt from CSRF'));

  try {
    const response = await axios({
      method: 'POST',
      url: `${BASE_URL}/auth/login`,
      data: {
        email: 'user@safeconnect.com',
        password: 'User123!@#'
      },
      validateStatus: () => true
    });

    // Login should work without CSRF token (exempt path)
    const isExempt = response.status === 200;
    addResult(
      'Login works without CSRF token (exempt)',
      isExempt,
      `Status: ${response.status} (expected 200)`
    );
  } catch (error) {
    addResult('Login works without CSRF token (exempt)', false, error.message);
  }
}

async function runTests() {
  console.log(chalk.bold.cyan('\n=== CSRF Penetration Test ===\n'));
  console.log(chalk.gray(`Testing against: ${BASE_URL}\n`));

  await login();

  if (!authToken) {
    console.log(chalk.red('Cannot proceed without authentication'));
    process.exit(1);
  }

  const csrfReady = await fetchCsrfToken();
  if (!csrfReady) {
    console.log(chalk.red('Cannot proceed without CSRF token endpoint'));
    process.exit(1);
  }

  // Run all tests
  await testPostWithoutCsrfToken();
  await new Promise(resolve => setTimeout(resolve, 200));

  await testPostWithInvalidCsrfToken();
  await new Promise(resolve => setTimeout(resolve, 200));

  await testPostWithMismatchedTokens();
  await new Promise(resolve => setTimeout(resolve, 200));

  await testPostWithValidCsrfToken();
  await new Promise(resolve => setTimeout(resolve, 200));

  await testGetDoesNotRequireCsrf();
  await new Promise(resolve => setTimeout(resolve, 200));

  await testDeleteWithoutCsrfToken();
  await new Promise(resolve => setTimeout(resolve, 200));

  await testLoginExemptFromCsrf();

  // Print summary
  console.log(chalk.bold.cyan('\n\n=== Test Summary ==='));
  console.log(chalk.white(`Total tests: ${results.total}`));
  console.log(chalk.green(`Passed: ${results.passed}`));
  console.log(chalk.red(`Failed: ${results.failed}`));

  const successRate = ((results.passed / results.total) * 100).toFixed(2);
  console.log(chalk.bold(`Success rate: ${successRate}%\n`));

  if (results.failed > 0) {
    console.log(chalk.red.bold('\nCSRF VULNERABILITIES DETECTED!'));
    console.log(chalk.yellow('Review failed tests above for details.\n'));
    process.exit(1);
  } else {
    console.log(chalk.green.bold('\nALL TESTS PASSED - Application is protected against CSRF\n'));
  }
}

// Run tests
runTests().catch(error => {
  console.error(chalk.red('Error running tests:'), error.message);
  process.exit(1);
});
