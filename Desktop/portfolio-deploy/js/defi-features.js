// ========================================
//   DEFI FEATURES - Professional Portfolio
//   Yield Farming, Staking, DeFi Analytics
// ========================================

class DeFiFeatures {
    constructor() {
        this.web3 = null;
        this.account = null;
        this.init();
    }

    async init() {
        await this.setupWeb3();
        this.setupYieldFarming();
        this.setupStaking();
        this.setupLiquidityPools();
        this.setupGovernance();
        this.setupDeFiAnalytics();
        this.setupRealTimePrices();
    }

    async setupWeb3() {
        // Only detect if wallet is available, but don't auto-connect
        if (typeof window.ethereum !== 'undefined') {
            console.log('Wallet detected, waiting for user to connect...');
            // Don't auto-request accounts - let user click the connect button
            /*
            try {
                // Request account access
                await window.ethereum.request({ method: 'eth_requestAccounts' });

                // Initialize Web3
                this.web3 = new ethers.BrowserProvider(window.ethereum);
                this.signer = await this.web3.getSigner();
                this.account = await this.signer.getAddress();

                console.log('Web3 connected:', this.account);
                this.updateUI();
            } catch (error) {
                console.error('Web3 connection failed:', error);
                this.showWeb3Error();
            }
            */
        } else {
            console.log('MetaMask not detected');
            // Don't show prompt automatically
            // this.showMetaMaskPrompt();
        }
    }

    // Yield Farming Features
    setupYieldFarming() {
        this.createYieldFarmingInterface();
        this.setupYieldCalculators();
        this.setupYieldStrategies();
    }

    createYieldFarmingInterface() {
        const yieldSection = document.createElement('section');
        yieldSection.className = 'yield-farming-section';
        yieldSection.innerHTML = `
            <div class="container">
                <div class="section-header">
                    <span class="section-label">💰 Yield Farming</span>
                    <h2 class="section-title gradient-text">DeFi Yield Strategies</h2>
                    <p class="section-description">Maximize your returns with advanced yield farming strategies</p>
                </div>

                <div class="yield-grid">
                    <!-- Yield Calculator -->
                    <div class="yield-calculator card card-elevated">
                        <div class="card-header">
                            <h3 class="card-title">🧮 Yield Calculator</h3>
                        </div>
                        <div class="card-body">
                            <div class="calculator-inputs">
                                <div class="form-group">
                                    <label class="form-label">Initial Investment (USD)</label>
                                    <input type="number" class="form-input" id="initial-investment" value="1000">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">APY (%)</label>
                                    <input type="number" class="form-input" id="apy" value="25" step="0.1">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Compounding Period</label>
                                    <select class="form-select" id="compound-period">
                                        <option value="daily">Daily</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="monthly">Monthly</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Investment Period (Days)</label>
                                    <input type="number" class="form-input" id="investment-period" value="365">
                                </div>
                                <button class="btn btn-primary btn-block" onclick="defiFeatures.calculateYield()">
                                    Calculate Returns
                                </button>
                            </div>
                            <div class="yield-results" id="yield-results">
                                <div class="result-item">
                                    <span class="result-label">Final Amount:</span>
                                    <span class="result-value" id="final-amount">$0</span>
                                </div>
                                <div class="result-item">
                                    <span class="result-label">Total Profit:</span>
                                    <span class="result-value profit" id="total-profit">$0</span>
                                </div>
                                <div class="result-item">
                                    <span class="result-label">ROI:</span>
                                    <span class="result-value" id="roi">0%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Yield Strategies -->
                    <div class="yield-strategies">
                        <h3 class="strategies-title">🎯 Top Yield Strategies</h3>
                        <div class="strategy-list">
                            ${this.generateYieldStrategies()}
                        </div>
                    </div>

                    <!-- Farm Pools -->
                    <div class="farm-pools">
                        <h3 class="pools-title">🏆 Active Farm Pools</h3>
                        <div class="pools-grid">
                            ${this.generateFarmPools()}
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add to main content
        const mainContent = document.querySelector('main') || document.body;
        mainContent.appendChild(yieldSection);
    }

    generateYieldStrategies() {
        const strategies = [
            {
                name: 'ETH-USDC Liquidity',
                apy: '15-25%',
                risk: 'Medium',
                description: 'Provide liquidity to Uniswap V3 ETH-USDC pool',
                tvl: '$50M+'
            },
            {
                name: 'Stablecoin Yield',
                apy: '8-12%',
                risk: 'Low',
                description: 'Lend stablecoins on Aave or Compound',
                tvl: '$100M+'
            },
            {
                name: 'Layer 2 Farming',
                apy: '20-35%',
                risk: 'High',
                description: 'High-yield farms on Arbitrum and Optimism',
                tvl: '$25M+'
            },
            {
                name: 'LST Staking',
                apy: '4-8%',
                risk: 'Low',
                description: 'Liquid staking tokens like rETH, wstETH',
                tvl: '$200M+'
            }
        ];

        return strategies.map(strategy => `
            <div class="strategy-card card card-interactive">
                <div class="strategy-header">
                    <h4 class="strategy-name">${strategy.name}</h4>
                    <span class="strategy-apy neon-text">${strategy.apy}</span>
                </div>
                <p class="strategy-description">${strategy.description}</p>
                <div class="strategy-stats">
                    <div class="stat">
                        <span class="stat-label">Risk:</span>
                        <span class="stat-value risk-${strategy.risk.toLowerCase()}">${strategy.risk}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">TVL:</span>
                        <span class="stat-value">${strategy.tvl}</span>
                    </div>
                </div>
                <button class="btn btn-primary btn-sm">Start Farming</button>
            </div>
        `).join('');
    }

    generateFarmPools() {
        const pools = [
            {
                token1: 'ETH',
                token2: 'USDC',
                apr: '18.5%',
                fees: '0.3%',
                tvl: '$2.5M',
                multiplier: '2.5x'
            },
            {
                token1: 'WBTC',
                token2: 'ETH',
                apr: '22.1%',
                fees: '0.05%',
                tvl: '$1.8M',
                multiplier: '3.0x'
            },
            {
                token1: 'USDT',
                token2: 'USDC',
                apr: '12.3%',
                fees: '0.01%',
                tvl: '$5.2M',
                multiplier: '1.5x'
            }
        ];

        return pools.map(pool => `
            <div class="pool-card card card-interactive">
                <div class="pool-tokens">
                    <div class="token-pair">
                        <span class="token">${pool.token1}</span>
                        <span class="pair-separator">/</span>
                        <span class="token">${pool.token2}</span>
                    </div>
                    <div class="pool-multiplier">${pool.multiplier}</div>
                </div>
                <div class="pool-stats">
                    <div class="pool-stat">
                        <span class="stat-label">APR:</span>
                        <span class="stat-value highlight">${pool.apr}</span>
                    </div>
                    <div class="pool-stat">
                        <span class="stat-label">Fees:</span>
                        <span class="stat-value">${pool.fees}</span>
                    </div>
                    <div class="pool-stat">
                        <span class="stat-label">TVL:</span>
                        <span class="stat-value">${pool.tvl}</span>
                    </div>
                </div>
                <div class="pool-actions">
                    <button class="btn btn-primary btn-sm">Add Liquidity</button>
                    <button class="btn btn-secondary btn-sm">Details</button>
                </div>
            </div>
        `).join('');
    }

    calculateYield() {
        const principal = parseFloat(document.getElementById('initial-investment').value);
        const apy = parseFloat(document.getElementById('apy').value) / 100;
        const period = document.getElementById('compound-period').value;
        const days = parseInt(document.getElementById('investment-period').value);

        let n;
        switch (period) {
            case 'daily': n = 365; break;
            case 'weekly': n = 52; break;
            case 'monthly': n = 12; break;
            default: n = 365;
        }

        const rate = apy / n;
        const time = (days / 365) * n;
        const finalAmount = principal * Math.pow(1 + rate, time);
        const profit = finalAmount - principal;
        const roi = (profit / principal) * 100;

        document.getElementById('final-amount').textContent = `$${finalAmount.toFixed(2)}`;
        document.getElementById('total-profit').textContent = `$${profit.toFixed(2)}`;
        document.getElementById('roi').textContent = `${roi.toFixed(2)}%`;

        // Animate results
        this.animateValue('final-amount', 0, finalAmount, 1000);
        this.animateValue('total-profit', 0, profit, 1000);
    }

    // Staking Features
    setupStaking() {
        this.createStakingInterface();
        this.setupStakingPools();
        this.setupGovernanceStaking();
    }

    createStakingInterface() {
        const stakingSection = document.createElement('section');
        stakingSection.className = 'staking-section';
        stakingSection.innerHTML = `
            <div class="container">
                <div class="section-header">
                    <span class="section-label">🔒 Staking</span>
                    <h2 class="section-title gradient-text">Stake & Earn Rewards</h2>
                    <p class="section-description">Stake your tokens and earn passive rewards</p>
                </div>

                <div class="staking-grid">
                    <!-- Staking Calculator -->
                    <div class="staking-calculator card card-elevated">
                        <div class="card-header">
                            <h3 class="card-title">💎 Staking Calculator</h3>
                        </div>
                        <div class="card-body">
                            <div class="staking-inputs">
                                <div class="form-group">
                                    <label class="form-label">Amount to Stake</label>
                                    <input type="number" class="form-input" id="stake-amount" value="100">
                                    <select class="form-select" id="stake-token">
                                        <option value="ETH">ETH</option>
                                        <option value="MATIC">MATIC</option>
                                        <option value="AVAX">AVAX</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Staking Duration</label>
                                    <select class="form-select" id="stake-duration">
                                        <option value="flexible">Flexible</option>
                                        <option value="30">30 Days</option>
                                        <option value="90">90 Days</option>
                                        <option value="180">180 Days</option>
                                        <option value="365">365 Days</option>
                                    </select>
                                </div>
                                <button class="btn btn-primary btn-block" onclick="defiFeatures.calculateStakingRewards()">
                                    Calculate Rewards
                                </button>
                            </div>
                            <div class="staking-rewards" id="staking-rewards">
                                <div class="reward-item">
                                    <span class="reward-label">Daily Rewards:</span>
                                    <span class="reward-value" id="daily-rewards">0</span>
                                </div>
                                <div class="reward-item">
                                    <span class="reward-label">Total Rewards:</span>
                                    <span class="reward-value" id="total-rewards">0</span>
                                </div>
                                <div class="reward-item">
                                    <span class="reward-label">APY:</span>
                                    <span class="reward-value" id="staking-apy">0%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Staking Pools -->
                    <div class="staking-pools">
                        <h3 class="pools-title">🎯 Active Staking Pools</h3>
                        <div class="pools-grid">
                            ${this.generateStakingPools()}
                        </div>
                    </div>
                </div>
            </div>
        `;

        const mainContent = document.querySelector('main') || document.body;
        mainContent.appendChild(stakingSection);
    }

    generateStakingPools() {
        const pools = [
            {
                token: 'ETH',
                type: 'Liquid Staking',
                apy: '4.5%',
                tvl: '$15M+',
                unstaking: 'Instant',
                rewards: 'ETH + LSD'
            },
            {
                token: 'MATIC',
                type: 'Native Staking',
                apy: '6.8%',
                tvl: '$8M+',
                unstaking: '3-5 days',
                rewards: 'MATIC'
            },
            {
                token: 'AVAX',
                type: 'Delegated Staking',
                apy: '8.2%',
                tvl: '$3M+',
                unstaking: '2 weeks',
                rewards: 'AVAX'
            }
        ];

        return pools.map(pool => `
            <div class="staking-pool-card card card-interactive">
                <div class="pool-header">
                    <div class="pool-token">${pool.token}</div>
                    <div class="pool-type">${pool.type}</div>
                </div>
                <div class="pool-apy highlight neon-text">${pool.apy}</div>
                <div class="pool-info">
                    <div class="info-item">
                        <span class="info-label">TVL:</span>
                        <span class="info-value">${pool.tvl}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Unstaking:</span>
                        <span class="info-value">${pool.unstaking}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Rewards:</span>
                        <span class="info-value">${pool.rewards}</span>
                    </div>
                </div>
                <div class="pool-actions">
                    <button class="btn btn-primary btn-sm">Stake Now</button>
                </div>
            </div>
        `).join('');
    }

    calculateStakingRewards() {
        const amount = parseFloat(document.getElementById('stake-amount').value);
        const duration = document.getElementById('stake-duration').value;
        const token = document.getElementById('stake-token').value;

        let apy;
        switch (token) {
            case 'ETH': apy = 0.045; break;
            case 'MATIC': apy = 0.068; break;
            case 'AVAX': apy = 0.082; break;
            default: apy = 0.05;
        }

        let durationMultiplier = 1;
        if (duration !== 'flexible') {
            durationMultiplier = 1 + (parseInt(duration) / 365) * 0.2; // Bonus for longer duration
        }

        const adjustedApy = apy * durationMultiplier;
        const dailyRewards = (amount * adjustedApy) / 365;
        const days = duration === 'flexible' ? 365 : parseInt(duration);
        const totalRewards = dailyRewards * days;

        document.getElementById('daily-rewards').textContent = `${dailyRewards.toFixed(6)} ${token}`;
        document.getElementById('total-rewards').textContent = `${totalRewards.toFixed(6)} ${token}`;
        document.getElementById('staking-apy').textContent = `${(adjustedApy * 100).toFixed(2)}%`;
    }

    // Liquidity Pools
    setupLiquidityPools() {
        this.createLiquidityInterface();
    }

    createLiquidityInterface() {
        const liquiditySection = document.createElement('section');
        liquiditySection.className = 'liquidity-section';
        liquiditySection.innerHTML = `
            <div class="container">
                <div class="section-header">
                    <span class="section-label">💧 Liquidity Pools</span>
                    <h2 class="section-title gradient-text">Provide Liquidity & Earn Fees</h2>
                    <p class="section-description">Become a liquidity provider and earn trading fees</p>
                </div>

                <div class="liquidity-interface">
                    <div class="add-liquidity card card-elevated">
                        <h3 class="card-title">Add Liquidity</h3>
                        <div class="liquidity-form">
                            <div class="token-input">
                                <label class="form-label">Token A</label>
                                <div class="input-group">
                                    <input type="number" class="form-input" placeholder="0.0">
                                    <select class="token-select">
                                        <option value="ETH">ETH</option>
                                        <option value="USDC">USDC</option>
                                        <option value="WBTC">WBTC</option>
                                    </select>
                                </div>
                            </div>
                            <div class="token-swap-icon">⇅</div>
                            <div class="token-input">
                                <label class="form-label">Token B</label>
                                <div class="input-group">
                                    <input type="number" class="form-input" placeholder="0.0">
                                    <select class="token-select">
                                        <option value="USDC">USDC</option>
                                        <option value="ETH">ETH</option>
                                        <option value="USDT">USDT</option>
                                    </select>
                                </div>
                            </div>
                            <div class="fee-tier">
                                <label class="form-label">Fee Tier</label>
                                <div class="fee-options">
                                    <button class="fee-option" data-fee="0.01">0.01%</button>
                                    <button class="fee-option active" data-fee="0.05">0.05%</button>
                                    <button class="fee-option" data-fee="0.3">0.3%</button>
                                    <button class="fee-option" data-fee="1.0">1.0%</button>
                                </div>
                            </div>
                            <button class="btn btn-primary btn-block">Add Liquidity</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const mainContent = document.querySelector('main') || document.body;
        mainContent.appendChild(liquiditySection);
    }

    // Governance Features
    setupGovernance() {
        this.createGovernanceInterface();
    }

    createGovernanceInterface() {
        const governanceSection = document.createElement('section');
        governanceSection.className = 'governance-section';
        governanceSection.innerHTML = `
            <div class="container">
                <div class="section-header">
                    <span class="section-label">🏛️ Governance</span>
                    <h2 class="section-title gradient-text">Participate in Governance</h2>
                    <p class="section-description">Shape the future of the protocol</p>
                </div>

                <div class="governance-grid">
                    <div class="governance-overview card card-elevated">
                        <h3 class="card-title">Your Voting Power</h3>
                        <div class="voting-stats">
                            <div class="stat">
                                <span class="stat-label">Governance Tokens:</span>
                                <span class="stat-value highlight">1,250 GVT</span>
                            </div>
                            <div class="stat">
                                <span class="stat-label">Voting Power:</span>
                                <span class="stat-value">0.05%</span>
                            </div>
                            <div class="stat">
                                <span class="stat-label">Proposals Voted:</span>
                                <span class="stat-value">12</span>
                            </div>
                        </div>
                    </div>

                    <div class="active-proposals">
                        <h3 class="proposals-title">📊 Active Proposals</h3>
                        <div class="proposals-list">
                            ${this.generateProposals()}
                        </div>
                    </div>
                </div>
            </div>
        `;

        const mainContent = document.querySelector('main') || document.body;
        mainContent.appendChild(governanceSection);
    }

    generateProposals() {
        const proposals = [
            {
                title: 'Introduce Multi-token Farming',
                description: 'Enable farming with up to 4 tokens in a single position',
                status: 'Active',
                votes: { for: '2.1M', against: '0.5M' },
                timeLeft: '2 days 14 hours'
            },
            {
                title: 'Reduce Platform Fees to 0.1%',
                description: 'Lower transaction fees to increase competitiveness',
                status: 'Active',
                votes: { for: '1.8M', against: '1.2M' },
                timeLeft: '5 days 8 hours'
            },
            {
                title: 'Add Support for LayerZero',
                description: 'Enable cross-chain transactions via LayerZero protocol',
                status: 'Active',
                votes: { for: '3.5M', against: '0.3M' },
                timeLeft: '1 day 22 hours'
            }
        ];

        return proposals.map(proposal => `
            <div class="proposal-card card card-interactive">
                <div class="proposal-header">
                    <h4 class="proposal-title">${proposal.title}</h4>
                    <span class="proposal-status status-active">${proposal.status}</span>
                </div>
                <p class="proposal-description">${proposal.description}</p>
                <div class="proposal-votes">
                    <div class="vote-breakdown">
                        <div class="vote-for">
                            <span class="vote-label">For:</span>
                            <span class="vote-count">${proposal.votes.for}</span>
                        </div>
                        <div class="vote-against">
                            <span class="vote-label">Against:</span>
                            <span class="vote-count">${proposal.votes.against}</span>
                        </div>
                    </div>
                    <div class="vote-progress">
                        <div class="progress-bar">
                            <div class="progress-fill for" style="width: 75%"></div>
                            <div class="progress-fill against" style="width: 25%"></div>
                        </div>
                    </div>
                </div>
                <div class="proposal-meta">
                    <span class="time-left">⏰ ${proposal.timeLeft}</span>
                    <button class="btn btn-primary btn-sm">Vote Now</button>
                </div>
            </div>
        `).join('');
    }

    // DeFi Analytics
    setupDeFiAnalytics() {
        this.createAnalyticsDashboard();
    }

    createAnalyticsDashboard() {
        const analyticsSection = document.createElement('section');
        analyticsSection.className = 'defi-analytics-section';
        analyticsSection.innerHTML = `
            <div class="container">
                <div class="section-header">
                    <span class="section-label">📈 DeFi Analytics</span>
                    <h2 class="section-title gradient-text">Real-time Market Insights</h2>
                    <p class="section-description">Track your DeFi portfolio performance</p>
                </div>

                <div class="analytics-grid">
                    <div class="portfolio-overview card card-elevated">
                        <h3 class="card-title">Portfolio Overview</h3>
                        <div class="portfolio-stats">
                            <div class="stat">
                                <span class="stat-label">Total Value Locked:</span>
                                <span class="stat-value highlight">$12,580</span>
                            </div>
                            <div class="stat">
                                <span class="stat-label">24h Change:</span>
                                <span class="stat-value positive">+5.2%</span>
                            </div>
                            <div class="stat">
                                <span class="stat-label">Total Earned:</span>
                                <span class="stat-value">$847.30</span>
                            </div>
                            <div class="stat">
                                <span class="stat-label">Active Positions:</span>
                                <span class="stat-value">8</span>
                            </div>
                        </div>
                    </div>

                    <div class="yield-chart card card-elevated">
                        <h3 class="card-title">Yield History</h3>
                        <canvas id="yieldChart" width="400" height="200"></canvas>
                    </div>

                    <div class="asset-allocation card card-elevated">
                        <h3 class="card-title">Asset Allocation</h3>
                        <canvas id="allocationChart" width="400" height="200"></canvas>
                    </div>
                </div>
            </div>
        `;

        const mainContent = document.querySelector('main') || document.body;
        mainContent.appendChild(analyticsSection);

        // Initialize charts after a delay
        setTimeout(() => this.initCharts(), 100);
    }

    initCharts() {
        this.initYieldChart();
        this.initAllocationChart();
    }

    initYieldChart() {
        const canvas = document.getElementById('yieldChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        // Simple line chart implementation
        this.drawLineChart(ctx, canvas.width, canvas.height);
    }

    initAllocationChart() {
        const canvas = document.getElementById('allocationChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        // Simple pie chart implementation
        this.drawPieChart(ctx, canvas.width, canvas.height);
    }

    drawLineChart(ctx, width, height) {
        // Sample data points
        const data = [100, 120, 115, 140, 135, 160, 155, 180, 175, 200];
        const maxValue = Math.max(...data);
        const padding = 40;
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Draw grid lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 5; i++) {
            const y = padding + (chartHeight / 5) * i;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(width - padding, y);
            ctx.stroke();
        }

        // Draw line
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 3;
        ctx.beginPath();

        data.forEach((value, index) => {
            const x = padding + (chartWidth / (data.length - 1)) * index;
            const y = padding + chartHeight - (value / maxValue) * chartHeight;

            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();

        // Draw gradient fill
        const gradient = ctx.createLinearGradient(0, padding, 0, height - padding);
        gradient.addColorStop(0, 'rgba(99, 102, 241, 0.3)');
        gradient.addColorStop(1, 'rgba(99, 102, 241, 0.0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();

        data.forEach((value, index) => {
            const x = padding + (chartWidth / (data.length - 1)) * index;
            const y = padding + chartHeight - (value / maxValue) * chartHeight;

            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.lineTo(width - padding, height - padding);
        ctx.lineTo(padding, height - padding);
        ctx.closePath();
        ctx.fill();
    }

    drawPieChart(ctx, width, height) {
        const data = [
            { label: 'ETH', value: 45, color: '#627eea' },
            { label: 'USDC', value: 25, color: '#2775ca' },
            { label: 'MATIC', value: 20, color: '#8247e5' },
            { label: 'Others', value: 10, color: '#1a1a2e' }
        ];

        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 3;
        let currentAngle = -Math.PI / 2;

        data.forEach(segment => {
            const angle = (segment.value / 100) * 2 * Math.PI;

            // Draw segment
            ctx.fillStyle = segment.color;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + angle);
            ctx.closePath();
            ctx.fill();

            // Draw label
            const labelAngle = currentAngle + angle / 2;
            const labelX = centerX + Math.cos(labelAngle) * (radius + 20);
            const labelY = centerY + Math.sin(labelAngle) * (radius + 20);

            ctx.fillStyle = '#ffffff';
            ctx.font = '12px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(`${segment.label} ${segment.value}%`, labelX, labelY);

            currentAngle += angle;
        });
    }

    // Real-time Price Updates
    setupRealTimePrices() {
        this.createPriceTicker();
        this.startPriceUpdates();
    }

    createPriceTicker() {
        const ticker = document.createElement('div');
        ticker.className = 'price-ticker';
        ticker.innerHTML = `
            <div class="ticker-container">
                <div class="ticker-track">
                    <div class="ticker-item">
                        <span class="token-name">ETH</span>
                        <span class="token-price" data-token="ETH">$0.00</span>
                        <span class="price-change" data-change="ETH">0.00%</span>
                    </div>
                    <div class="ticker-item">
                        <span class="token-name">BTC</span>
                        <span class="token-price" data-token="BTC">$0.00</span>
                        <span class="price-change" data-change="BTC">0.00%</span>
                    </div>
                    <div class="ticker-item">
                        <span class="token-name">MATIC</span>
                        <span class="token-price" data-token="MATIC">$0.00</span>
                        <span class="price-change" data-change="MATIC">0.00%</span>
                    </div>
                    <div class="ticker-item">
                        <span class="token-name">AVAX</span>
                        <span class="token-price" data-token="AVAX">$0.00</span>
                        <span class="price-change" data-change="AVAX">0.00%</span>
                    </div>
                </div>
            </div>
        `;

        document.body.insertBefore(ticker, document.body.firstChild);
    }

    startPriceUpdates() {
        // Simulate real-time price updates
        setInterval(() => {
            this.updatePrices();
        }, 5000);
    }

    updatePrices() {
        const tokens = ['ETH', 'BTC', 'MATIC', 'AVAX'];
        const basePrices = {
            ETH: 2300,
            BTC: 45000,
            MATIC: 0.85,
            AVAX: 36
        };

        tokens.forEach(token => {
            const priceElement = document.querySelector(`[data-token="${token}"]`);
            const changeElement = document.querySelector(`[data-change="${token}"]`);

            if (priceElement && changeElement) {
                const basePrice = basePrices[token];
                const variance = basePrice * 0.02; // 2% variance
                const newPrice = basePrice + (Math.random() - 0.5) * variance * 2;
                const change = ((newPrice - basePrice) / basePrice) * 100;

                priceElement.textContent = `$${newPrice.toFixed(2)}`;
                changeElement.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
                changeElement.className = `price-change ${change >= 0 ? 'positive' : 'negative'}`;
            }
        });
    }

    // Utility Functions
    animateValue(elementId, start, end, duration) {
        const element = document.getElementById(elementId);
        const range = end - start;
        const increment = end > start ? 1 : -1;
        const stepTime = Math.abs(Math.floor(duration / range));
        let current = start;

        const timer = setInterval(() => {
            current += increment;
            element.textContent = `$${current.toFixed(2)}`;
            if (current === end) {
                clearInterval(timer);
            }
        }, stepTime);
    }

    updateUI() {
        if (this.account) {
            // Update UI with connected wallet
            const walletButtons = document.querySelectorAll('.wallet-btn');
            walletButtons.forEach(btn => {
                btn.textContent = `${this.account.slice(0, 6)}...${this.account.slice(-4)}`;
            });
        }
    }

    showWeb3Error() {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'web3-error notification';
        errorDiv.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <p>Failed to connect to Web3. Please check your wallet connection.</p>
        `;
        document.body.appendChild(errorDiv);

        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }

    showMetaMaskPrompt() {
        const promptDiv = document.createElement('div');
        promptDiv.className = 'metamask-prompt notification';
        promptDiv.innerHTML = `
            <i class="fab fa-ethereum"></i>
            <p>Please install MetaMask to access DeFi features</p>
            <a href="https://metamask.io" target="_blank" class="btn btn-primary">Install MetaMask</a>
        `;
        document.body.appendChild(promptDiv);
    }
}

// Initialize DeFi features
let defiFeatures;

document.addEventListener('DOMContentLoaded', () => {
    // Wait for a moment before initializing to ensure main content is loaded
    setTimeout(() => {
        defiFeatures = new DeFiFeatures();
    }, 1000);
});

// Add CSS for DeFi features
const defiCSS = `
    .yield-farming-section,
    .staking-section,
    .liquidity-section,
    .governance-section,
    .defi-analytics-section {
        padding: 5rem 0;
        background: linear-gradient(135deg, var(--color-bg) 0%, var(--color-bg-secondary) 100%);
    }

    .yield-grid,
    .staking-grid,
    .governance-grid,
    .analytics-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
        gap: 2rem;
        margin-top: 3rem;
    }

    .yield-calculator,
    .staking-calculator,
    .governance-overview {
        grid-column: span 2;
    }

    .strategy-card,
    .pool-card,
    .staking-pool-card,
    .proposal-card {
        position: relative;
        overflow: hidden;
    }

    .strategy-card::before,
    .pool-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
        transition: left 0.5s;
    }

    .strategy-card:hover::before,
    .pool-card:hover::before {
        left: 100%;
    }

    .price-ticker {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: rgba(15, 15, 35, 0.9);
        backdrop-filter: blur(10px);
        border-bottom: 1px solid var(--color-border);
        z-index: 1000;
        overflow: hidden;
    }

    .ticker-container {
        display: flex;
        white-space: nowrap;
        padding: 0.5rem 0;
    }

    .ticker-track {
        display: flex;
        animation: ticker 30s linear infinite;
    }

    .ticker-item {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 0 2rem;
        border-right: 1px solid var(--color-border);
    }

    .token-name {
        font-weight: 700;
        color: var(--color-primary);
    }

    .token-price {
        font-weight: 600;
        color: var(--color-text);
    }

    .price-change.positive {
        color: var(--color-success);
    }

    .price-change.negative {
        color: var(--color-error);
    }

    .notification {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-lg);
        padding: 2rem;
        max-width: 400px;
        text-align: center;
        z-index: 10000;
        animation: slideInDown 0.3s ease;
    }

    .notification i {
        font-size: 3rem;
        margin-bottom: 1rem;
    }

    .web3-error i {
        color: var(--color-error);
    }

    .metamask-prompt i {
        color: var(--color-primary);
    }

    @keyframes ticker {
        0% { transform: translateX(0); }
        100% { transform: translateX(-50%); }
    }

    .token-input {
        margin-bottom: 1rem;
    }

    .input-group {
        display: flex;
        gap: 1rem;
        align-items: stretch;
    }

    .input-group input {
        flex: 1;
    }

    .token-select {
        min-width: 100px;
    }

    .token-swap-icon {
        text-align: center;
        font-size: 1.5rem;
        margin: 1rem 0;
        color: var(--color-primary);
    }

    .fee-tier {
        margin: 2rem 0;
    }

    .fee-options {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 0.5rem;
    }

    .fee-option {
        padding: 0.75rem;
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: var(--radius);
        cursor: pointer;
        transition: all var(--transition-normal);
    }

    .fee-option:hover,
    .fee-option.active {
        background: var(--gradient-primary);
        color: white;
        border-color: transparent;
    }

    @media (max-width: 768px) {
        .yield-calculator,
        .staking-calculator,
        .governance-overview {
            grid-column: span 1;
        }

        .analytics-grid {
            grid-template-columns: 1fr;
        }

        .fee-options {
            grid-template-columns: repeat(2, 1fr);
        }
    }
`;

const defiStyleSheet = document.createElement('style');
defiStyleSheet.textContent = defiCSS;
document.head.appendChild(defiStyleSheet);