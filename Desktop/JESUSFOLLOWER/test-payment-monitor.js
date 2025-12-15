// Test script for payment monitoring
const PaymentMonitor = require('./payment-monitor');

async function testMonitor() {
    console.log('🔍 Testing Payment Monitor...\n');

    const monitor = new PaymentMonitor();

    // Check for recent payments
    console.log('Checking for recent payments...');
    const payment = await monitor.checkSolanaPayments();

    if (payment) {
        console.log('\n✅ Payment found:');
        console.log(`  - Signature: ${payment.signature}`);
        console.log(`  - Amount: ${payment.amount} SOL`);
        console.log(`  - Value: $${payment.valueUSD}`);
        console.log(`  - Plan: ${payment.plan}`);
        console.log(`  - Time: ${new Date(payment.timestamp).toLocaleString()}`);
    } else {
        console.log('\n❌ No new payments found');
    }

    console.log('\n✅ Test completed');
}

// Check specific transaction
async function checkSpecificTx(signature) {
    const monitor = new PaymentMonitor();
    const tx = await monitor.checkTransaction(signature);

    if (tx) {
        console.log('Transaction details:', tx);
    } else {
        console.log('Transaction not found');
    }
}

// Run test
if (process.argv[2]) {
    checkSpecificTx(process.argv[2]);
} else {
    testMonitor();
}