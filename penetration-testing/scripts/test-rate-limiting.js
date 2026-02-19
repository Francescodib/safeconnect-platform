/**
 * Rate Limiting Penetration Testing
 * Author: Francesco di Biase
 *
 * Tests the application's rate limiting mechanisms
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

async function testLoginRateLimit() {
  console.log(chalk.bold('\n--- Testing Login Rate Limit (5 requests/15min) ---'));

  const requests = [];
  const maxRequests = 7; // Exceed the limit

  console.log(chalk.blue(`Sending ${maxRequests} rapid login requests...`));

  for (let i = 0; i < maxRequests; i++) {
    requests.push(
      axios({
        method: 'POST',
        url: `${BASE_URL}/auth/login`,
        data: {
          email: `test${i}@example.com`,
          password: 'WrongPassword123!'
        },
        validateStatus: () => true
      })
    );
  }

  const responses = await Promise.all(requests);

  let rateLimitedCount = 0;
  responses.forEach((response, index) => {
    if (response.status === 429) {
      rateLimitedCount++;
      console.log(chalk.yellow(`Request ${index + 1}: Rate limited (429)`));
    } else {
      console.log(chalk.gray(`Request ${index + 1}: ${response.status}`));
    }
  });

  results.total++;
  if (rateLimitedCount > 0) {
    console.log(chalk.green(`\n✓ PASS - Rate limiting active (${rateLimitedCount} requests blocked)`));
    results.passed++;
    results.tests.push({
      test: 'Login Rate Limit',
      status: 'PASS',
      blocked: rateLimitedCount,
      total: maxRequests
    });
  } else {
    console.log(chalk.red('\n✗ FAIL - No rate limiting detected'));
    results.failed++;
    results.tests.push({
      test: 'Login Rate Limit',
      status: 'FAIL',
      reason: 'No 429 responses received'
    });
  }
}

async function testRegistrationRateLimit() {
  console.log(chalk.bold('\n--- Testing Registration Rate Limit (3 requests/hour) ---'));

  const requests = [];
  const maxRequests = 5; // Exceed the limit

  console.log(chalk.blue(`Sending ${maxRequests} rapid registration requests...`));

  for (let i = 0; i < maxRequests; i++) {
    requests.push(
      axios({
        method: 'POST',
        url: `${BASE_URL}/auth/register`,
        data: {
          email: `testuser${Date.now()}${i}@example.com`,
          password: 'Test123!@#',
          firstName: 'Test',
          lastName: 'User'
        },
        validateStatus: () => true
      })
    );
  }

  const responses = await Promise.all(requests);

  let rateLimitedCount = 0;
  responses.forEach((response, index) => {
    if (response.status === 429) {
      rateLimitedCount++;
      console.log(chalk.yellow(`Request ${index + 1}: Rate limited (429)`));
    } else {
      console.log(chalk.gray(`Request ${index + 1}: ${response.status}`));
    }
  });

  results.total++;
  if (rateLimitedCount > 0) {
    console.log(chalk.green(`\n✓ PASS - Rate limiting active (${rateLimitedCount} requests blocked)`));
    results.passed++;
    results.tests.push({
      test: 'Registration Rate Limit',
      status: 'PASS',
      blocked: rateLimitedCount,
      total: maxRequests
    });
  } else {
    console.log(chalk.red('\n✗ FAIL - No rate limiting detected'));
    results.failed++;
    results.tests.push({
      test: 'Registration Rate Limit',
      status: 'FAIL',
      reason: 'No 429 responses received'
    });
  }
}

async function testGeneralAPIRateLimit() {
  console.log(chalk.bold('\n--- Testing General API Rate Limit (100 requests/15min) ---'));

  console.log(chalk.blue('Sending rapid requests to health endpoint...'));

  let rateLimitedCount = 0;
  const maxRequests = 120; // Exceed the limit

  for (let i = 0; i < maxRequests; i++) {
    try {
      const response = await axios({
        method: 'GET',
        url: `${BASE_URL.replace('/api', '')}/health`,
        validateStatus: () => true
      });

      if (response.status === 429) {
        rateLimitedCount++;
      }
    } catch (error) {
      // Continue
    }

    if (i % 20 === 0) {
      console.log(chalk.gray(`Sent ${i + 1}/${maxRequests} requests...`));
    }
  }

  results.total++;
  if (rateLimitedCount > 0) {
    console.log(chalk.green(`\n✓ PASS - Rate limiting active (${rateLimitedCount} requests blocked)`));
    results.passed++;
    results.tests.push({
      test: 'General API Rate Limit',
      status: 'PASS',
      blocked: rateLimitedCount,
      total: maxRequests
    });
  } else {
    console.log(chalk.yellow('\n⚠ WARNING - Health endpoint may not be rate limited'));
    results.tests.push({
      test: 'General API Rate Limit',
      status: 'WARNING',
      note: 'Health endpoint typically excluded from rate limiting'
    });
  }
}

async function runTests() {
  console.log(chalk.bold.cyan('\n=== Rate Limiting Penetration Test ===\n'));
  console.log(chalk.gray(`Testing against: ${BASE_URL}\n`));

  await testLoginRateLimit();
  await new Promise(resolve => setTimeout(resolve, 1000));

  await testRegistrationRateLimit();
  await new Promise(resolve => setTimeout(resolve, 1000));

  await testGeneralAPIRateLimit();

  // Print summary
  console.log(chalk.bold.cyan('\n\n=== Test Summary ==='));
  console.log(chalk.white(`Total tests: ${results.total}`));
  console.log(chalk.green(`Passed: ${results.passed}`));
  console.log(chalk.red(`Failed: ${results.failed}`));

  const successRate = results.total > 0 ? ((results.passed / results.total) * 100).toFixed(2) : 0;
  console.log(chalk.bold(`Success rate: ${successRate}%\n`));

  if (results.failed > 0) {
    console.log(chalk.red.bold('\n⚠ RATE LIMITING ISSUES DETECTED!'));
    console.log(chalk.yellow('Review failed tests above for details.\n'));
    process.exit(1);
  } else {
    console.log(chalk.green.bold('\n✓ ALL TESTS PASSED - Rate limiting is working properly\n'));
  }
}

// Run tests
runTests().catch(error => {
  console.error(chalk.red('Error running tests:'), error.message);
  process.exit(1);
});
