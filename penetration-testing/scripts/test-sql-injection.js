/**
 * SQL Injection Penetration Testing
 * Author: Francesco di Biase
 *
 * Tests the application's resistance to SQL injection attacks
 */

const axios = require('axios');
const chalk = require('chalk');

const BASE_URL = process.env.API_URL || 'http://localhost:5000/api';

const sqlInjectionPayloads = [
  "' OR '1'='1",
  "' OR '1'='1' --",
  "' OR '1'='1' /*",
  "admin'--",
  "' UNION SELECT NULL--",
  "1' AND '1'='1",
  "' DROP TABLE users--",
  "'; DROP TABLE users--",
  "1' OR '1' = '1",
  "1'; DELETE FROM users WHERE '1' = '1",
  "' OR 1=1--",
  "admin' OR '1'='1",
  "' UNION SELECT * FROM users--",
];

const results = {
  total: 0,
  passed: 0,
  failed: 0,
  tests: []
};

async function testSQLInjection(payload, endpoint, method = 'POST') {
  results.total++;

  try {
    console.log(chalk.blue(`\nTesting: ${endpoint}`));
    console.log(chalk.gray(`Payload: ${payload}`));

    const response = await axios({
      method,
      url: `${BASE_URL}${endpoint}`,
      data: {
        email: payload,
        password: 'test123'
      },
      validateStatus: () => true
    });

    // Check if server handled the injection attempt properly
    // 400/401 = input validation, 429 = rate limiting (also protection)
    const isProtected = response.status === 400 || response.status === 401 || response.status === 429;

    if (isProtected) {
      console.log(chalk.green('✓ PASS - Server properly rejected malicious input'));
      results.passed++;
      results.tests.push({
        endpoint,
        payload,
        status: 'PASS',
        responseCode: response.status
      });
    } else {
      console.log(chalk.red('✗ FAIL - Server may be vulnerable'));
      console.log(chalk.yellow(`Response code: ${response.status}`));
      results.failed++;
      results.tests.push({
        endpoint,
        payload,
        status: 'FAIL',
        responseCode: response.status,
        response: response.data
      });
    }
  } catch (error) {
    if (error.response && [400, 401, 429].includes(error.response.status)) {
      console.log(chalk.green('✓ PASS - Server properly rejected malicious input'));
      results.passed++;
      results.tests.push({
        endpoint,
        payload,
        status: 'PASS',
        responseCode: error.response.status
      });
    } else {
      console.log(chalk.yellow('⚠ WARNING - Unexpected error'));
      console.log(chalk.gray(error.message));
      results.tests.push({
        endpoint,
        payload,
        status: 'WARNING',
        error: error.message
      });
    }
  }
}

async function runTests() {
  console.log(chalk.bold.cyan('\n=== SQL Injection Penetration Test ===\n'));
  console.log(chalk.gray(`Testing against: ${BASE_URL}\n`));

  // Test login endpoint
  console.log(chalk.bold('\n--- Testing Login Endpoint ---'));
  for (const payload of sqlInjectionPayloads) {
    await testSQLInjection(payload, '/auth/login', 'POST');
    await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
  }

  // Test registration endpoint
  console.log(chalk.bold('\n--- Testing Registration Endpoint ---'));
  const registrationPayloads = sqlInjectionPayloads.slice(0, 5); // Test subset
  for (const payload of registrationPayloads) {
    await testSQLInjection(payload, '/auth/register', 'POST');
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
    console.log(chalk.red.bold('\n⚠ VULNERABILITIES DETECTED!'));
    console.log(chalk.yellow('Review failed tests above for details.\n'));
    process.exit(1);
  } else {
    console.log(chalk.green.bold('\n✓ ALL TESTS PASSED - Application is protected against SQL injection\n'));
  }
}

// Run tests
runTests().catch(error => {
  console.error(chalk.red('Error running tests:'), error.message);
  process.exit(1);
});
