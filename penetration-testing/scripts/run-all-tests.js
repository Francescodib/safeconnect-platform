/**
 * Run All Penetration Tests
 * Author: Francesco di Biase
 *
 * Executes all security tests and generates a summary report
 */

const { exec } = require('child_process');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

const tests = [
  { name: 'XSS (Cross-Site Scripting)', script: 'test-xss.js' },
  { name: 'SQL Injection', script: 'test-sql-injection.js' },
  { name: 'Rate Limiting', script: 'test-rate-limiting.js' },
  { name: 'CSRF (Cross-Site Request Forgery)', script: 'test-csrf.js' }
];

const results = [];

function runTest(test) {
  return new Promise((resolve) => {
    console.log(chalk.bold.cyan(`\n${'='.repeat(60)}`));
    console.log(chalk.bold.cyan(`Running: ${test.name}`));
    console.log(chalk.bold.cyan('='.repeat(60)));

    const startTime = Date.now();

    exec(`node ${path.join(__dirname, test.script)}`, (error, stdout, stderr) => {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      console.log(stdout);
      if (stderr) console.error(stderr);

      const passed = error === null;

      results.push({
        name: test.name,
        passed,
        duration,
        output: stdout,
        error: error ? error.message : null
      });

      resolve();
    });
  });
}

async function runAllTests() {
  console.log(chalk.bold.magenta('\n╔═══════════════════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta('║                                                           ║'));
  console.log(chalk.bold.magenta('║         SafeConnect Solutions Security Testing            ║'));
  console.log(chalk.bold.magenta('║              Penetration Test Suite                       ║'));
  console.log(chalk.bold.magenta('║                                                           ║'));
  console.log(chalk.bold.magenta('╚═══════════════════════════════════════════════════════════╝\n'));

  const overallStartTime = Date.now();

  for (const test of tests) {
    await runTest(test);
    await new Promise(resolve => setTimeout(resolve, 2000)); // Delay between tests
  }

  const overallDuration = ((Date.now() - overallStartTime) / 1000).toFixed(2);

  // Print final summary
  console.log(chalk.bold.magenta('\n\n╔═══════════════════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta('║                    FINAL SUMMARY                          ║'));
  console.log(chalk.bold.magenta('╚═══════════════════════════════════════════════════════════╝\n'));

  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;

  console.log(chalk.bold('Test Results:'));
  results.forEach(result => {
    const status = result.passed ? chalk.green('✓ PASS') : chalk.red('✗ FAIL');
    const duration = chalk.gray(`(${result.duration}s)`);
    console.log(`  ${status} - ${result.name} ${duration}`);
  });

  console.log(chalk.bold(`\nTotal Tests: ${results.length}`));
  console.log(chalk.green(`Passed: ${passedCount}`));
  console.log(chalk.red(`Failed: ${failedCount}`));
  console.log(chalk.gray(`Duration: ${overallDuration}s`));

  const successRate = ((passedCount / results.length) * 100).toFixed(2);
  console.log(chalk.bold(`\nSuccess Rate: ${successRate}%`));

  // Generate report
  generateReport(results, successRate, overallDuration);

  if (failedCount > 0) {
    console.log(chalk.red.bold('\n⚠ SECURITY VULNERABILITIES DETECTED!'));
    console.log(chalk.yellow('Check the detailed report in penetration-testing/RESULTS.md\n'));
    process.exit(1);
  } else {
    console.log(chalk.green.bold('\n✓ ALL SECURITY TESTS PASSED!'));
    console.log(chalk.green('The application is secure against tested attack vectors.\n'));
  }
}

function generateReport(results, successRate, duration) {
  const timestamp = new Date().toISOString();

  const report = `# SafeConnect Solutions - Penetration Test Results

**Author:** Francesco di Biase
**Date:** ${timestamp}
**Duration:** ${duration} seconds
**Success Rate:** ${successRate}%

## Summary

Total Tests: ${results.length}
Passed: ${results.filter(r => r.passed).length}
Failed: ${results.filter(r => !r.passed).length}

## Test Results

${results.map(result => `
### ${result.name}

**Status:** ${result.passed ? '✓ PASS' : '✗ FAIL'}
**Duration:** ${result.duration} seconds

${result.error ? `**Error:** ${result.error}` : ''}

`).join('\n')}

## Conclusion

${results.every(r => r.passed)
    ? 'All security tests passed successfully. The application demonstrates strong protection against common web vulnerabilities.'
    : 'Some security tests failed. Immediate remediation is required for the identified vulnerabilities.'
}

## Tested Attack Vectors

1. **SQL Injection** - Testing parameterized queries and ORM security
2. **Cross-Site Scripting (XSS)** - Testing input sanitization
3. **Rate Limiting** - Testing DDoS protection mechanisms
4. **CSRF (Cross-Site Request Forgery)** - Testing double-submit cookie pattern

## Recommendations

${results.every(r => r.passed)
    ? '- Continue regular security testing\n- Monitor for new vulnerabilities\n- Keep dependencies updated'
    : '- Address failed security tests immediately\n- Review and enhance security controls\n- Conduct additional testing after fixes'
}
`;

  const reportPath = path.join(__dirname, '../RESULTS.md');
  fs.writeFileSync(reportPath, report);
  console.log(chalk.gray(`\nReport generated: ${reportPath}`));
}

// Run all tests
runAllTests().catch(error => {
  console.error(chalk.red('Fatal error:'), error.message);
  process.exit(1);
});
