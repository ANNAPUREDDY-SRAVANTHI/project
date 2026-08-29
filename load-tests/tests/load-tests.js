const autocannon = require('autocannon');

async function runLoadTest() {
    console.log('🚀 Starting Baseline Load Testing...');
    console.log('Simulating 100 virtual users for 1 minute...\n');

    const instance = autocannon({
        url: 'http://localhost:3000', // Replace with your actual API endpoint
        connections: 100, // 100 virtual users
        duration: 60, // 1 minute
        pipelining: 1, 
    }, console.log);

    autocannon.track(instance, { renderProgressBar: true });

    instance.on('done', (result) => {
        console.log('\n✅ Load Test Completed!');
        console.log('--- Results Summary ---');
        console.log(`Requests per second (RPS): Average ${result.requests.average} req/sec`);
        console.log(`Response Time:`);
        console.log(`  - Average: ${result.latency.average} ms`);
        console.log(`  - Min: ${result.latency.min} ms`);
        console.log(`  - Max: ${result.latency.max} ms`);
        console.log('-----------------------\n');
    });
}

// Execute the tests if ran directly
if (require.main === module) {
    runLoadTest();
}

module.exports = { runLoadTest };
