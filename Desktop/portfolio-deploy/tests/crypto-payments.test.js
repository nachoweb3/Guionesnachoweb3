/* ========================================
   CRYPTO PAYMENTS TEST SUITE
   Tests for cryptocurrency payment functionality
   ======================================== */

const assert = require('assert');

// Mock payment manager for testing
class MockPaymentManager {
    constructor() {
        this.walletAddresses = {
            BTC: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
            ETH: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
            USDT_TRC20: 'TJ6BbsbfPkmFk2jGmKD9B3pFLWGVRehonk'
        };
    }

    async convertUSDToCrypto(usdAmount, currency) {
        const fallbackRates = {
            BTC: 45000,
            ETH: 2500,
            USDT: 1
        };
        const rate = fallbackRates[currency] || 1;
        return parseFloat((usdAmount / rate).toFixed(8));
    }

    getWalletAddress(currency) {
        return this.walletAddresses[currency.toUpperCase()] || null;
    }

    generatePaymentId() {
        return 'PAY_TEST_' + Date.now();
    }
}

// Test Suite
async function runTests() {
    console.log('🧪 Running Crypto Payment Tests...\n');

    const paymentManager = new MockPaymentManager();
    let passedTests = 0;
    let failedTests = 0;

    // Test 1: USD to BTC conversion
    try {
        const btcAmount = await paymentManager.convertUSDToCrypto(100, 'BTC');
        assert(btcAmount > 0, 'BTC amount should be positive');
        assert(btcAmount < 1, 'BTC amount for $100 should be less than 1 BTC');
        console.log('✅ Test 1 passed: USD to BTC conversion');
        console.log(`   $100 = ${btcAmount} BTC`);
        passedTests++;
    } catch (error) {
        console.log('❌ Test 1 failed:', error.message);
        failedTests++;
    }

    // Test 2: USD to ETH conversion
    try {
        const ethAmount = await paymentManager.convertUSDToCrypto(100, 'ETH');
        assert(ethAmount > 0, 'ETH amount should be positive');
        console.log('✅ Test 2 passed: USD to ETH conversion');
        console.log(`   $100 = ${ethAmount} ETH`);
        passedTests++;
    } catch (error) {
        console.log('❌ Test 2 failed:', error.message);
        failedTests++;
    }

    // Test 3: USD to USDT conversion (should be 1:1)
    try {
        const usdtAmount = await paymentManager.convertUSDToCrypto(100, 'USDT');
        assert(usdtAmount === 100, 'USDT conversion should be 1:1');
        console.log('✅ Test 3 passed: USD to USDT conversion (1:1)');
        console.log(`   $100 = ${usdtAmount} USDT`);
        passedTests++;
    } catch (error) {
        console.log('❌ Test 3 failed:', error.message);
        failedTests++;
    }

    // Test 4: Get BTC wallet address
    try {
        const btcAddress = paymentManager.getWalletAddress('BTC');
        assert(btcAddress, 'BTC address should exist');
        assert(btcAddress.startsWith('bc1'), 'BTC address should start with bc1');
        console.log('✅ Test 4 passed: Get BTC wallet address');
        console.log(`   Address: ${btcAddress}`);
        passedTests++;
    } catch (error) {
        console.log('❌ Test 4 failed:', error.message);
        failedTests++;
    }

    // Test 5: Get ETH wallet address
    try {
        const ethAddress = paymentManager.getWalletAddress('ETH');
        assert(ethAddress, 'ETH address should exist');
        assert(ethAddress.startsWith('0x'), 'ETH address should start with 0x');
        assert(ethAddress.length === 42, 'ETH address should be 42 characters');
        console.log('✅ Test 5 passed: Get ETH wallet address');
        console.log(`   Address: ${ethAddress}`);
        passedTests++;
    } catch (error) {
        console.log('❌ Test 5 failed:', error.message);
        failedTests++;
    }

    // Test 6: Get unsupported currency
    try {
        const unsupportedAddress = paymentManager.getWalletAddress('XYZ');
        assert(unsupportedAddress === null, 'Unsupported currency should return null');
        console.log('✅ Test 6 passed: Unsupported currency returns null');
        passedTests++;
    } catch (error) {
        console.log('❌ Test 6 failed:', error.message);
        failedTests++;
    }

    // Test 7: Generate payment ID
    try {
        const paymentId = paymentManager.generatePaymentId();
        assert(paymentId, 'Payment ID should be generated');
        assert(paymentId.startsWith('PAY_'), 'Payment ID should start with PAY_');
        console.log('✅ Test 7 passed: Generate payment ID');
        console.log(`   Payment ID: ${paymentId}`);
        passedTests++;
    } catch (error) {
        console.log('❌ Test 7 failed:', error.message);
        failedTests++;
    }

    // Test 8: Large amount conversion
    try {
        const largeAmount = await paymentManager.convertUSDToCrypto(10000, 'BTC');
        assert(largeAmount > 0, 'Should handle large amounts');
        console.log('✅ Test 8 passed: Large amount conversion');
        console.log(`   $10,000 = ${largeAmount} BTC`);
        passedTests++;
    } catch (error) {
        console.log('❌ Test 8 failed:', error.message);
        failedTests++;
    }

    // Test Summary
    console.log('\n' + '='.repeat(50));
    console.log('TEST SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total Tests: ${passedTests + failedTests}`);
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log('='.repeat(50));

    if (failedTests === 0) {
        console.log('\n🎉 All tests passed!');
        process.exit(0);
    } else {
        console.log('\n⚠️  Some tests failed.');
        process.exit(1);
    }
}

// Run tests
if (require.main === module) {
    runTests().catch(error => {
        console.error('❌ Test suite error:', error);
        process.exit(1);
    });
}

module.exports = { runTests };
