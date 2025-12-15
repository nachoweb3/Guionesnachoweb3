const express = require('express');
const { Connection, PublicKey } = require('@solana/web3.js');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Configuración
const SOLANA_RPC = process.env.SOLANA_RPC || 'https://mainnet.helius-rpc.com/?api-key=c10033bd-24e6-45c8-9747-1b2d1e344985';
const PAYMENT_WALLET = new PublicKey(process.env.PAYMENT_WALLET || 'DRpKq1kYmT9Jix1ZRnFRJU5VmdkUKdEo3hsuv7ZPJmzJ');

// Precios de tiers (en SOL)
const TIER_PRICES = {
    basic: 0.1,
    pro: 0.5,
    elite: 1.0
};

// Conexión a Solana
const connection = new Connection(SOLANA_RPC);

// Base de datos en memoria (en producción usar MongoDB)
const users = new Map();
const payments = new Map();

// Cargar datos persistentes
function loadData() {
    try {
        if (fs.existsSync('./payments-db.json')) {
            const data = JSON.parse(fs.readFileSync('./payments-db.json', 'utf8'));
            Object.entries(data.users || {}).forEach(([userId, userData]) => {
                users.set(userId, userData);
            });
            Object.entries(data.payments || {}).forEach(([paymentId, paymentData]) => {
                payments.set(paymentId, paymentData);
            });
            console.log('✅ Base de datos cargada');
        }
    } catch (error) {
        console.error('Error cargando datos:', error);
    }
}

// Guardar datos
function saveData() {
    try {
        const data = {
            users: Object.fromEntries(users),
            payments: Object.fromEntries(payments),
            lastUpdated: new Date().toISOString()
        };
        fs.writeFileSync('./payments-db.json', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error guardando datos:', error);
    }
}

// Verificar si una transacción es válida
async function verificarTransaccion(signature, amountExpected, fromUser, reference = null) {
    try {
        const tx = await connection.getTransaction(signature, {
            commitment: 'confirmed',
            maxSupportedTransactionVersion: 0
        });

        if (!tx) return { valid: false, error: 'Transacción no encontrada' };

        // Verificar si es una transferencia SOL
        const transfer = tx.transaction.message.instructions.find(ix =>
            ix.programId.toBase58() === '11111111111111111111111111111111'
        );

        if (!transfer) return { valid: false, error: 'No es una transferencia SOL' };

        // Verificar monto
        const lamports = transfer.lamports || 0;
        const solAmount = lamports / 1e9;

        if (Math.abs(solAmount - amountExpected) > 0.001) {
            return { valid: false, error: `Monto incorrecto: esperado ${amountExpected}, recibido ${solAmount}` };
        }

        // Verificar destinatario
        const keys = tx.transaction.message.accountKeys;
        const recipient = keys[transfer.programIdIndex]?.toBase58();

        if (recipient !== PAYMENT_WALLET.toBase58()) {
            return { valid: false, error: 'Destinatario incorrecto' };
        }

        // Verificar tiempo (últimas 24 horas)
        const txTime = tx.blockTime * 1000;
        const now = Date.now();
        if (now - txTime > 24 * 60 * 60 * 1000) {
            return { valid: false, error: 'Transacción demasiado antigua' };
        }

        return { valid: true, tx, from: keys[0]?.toBase58() };
    } catch (error) {
        return { valid: false, error: error.message };
    }
}

// API ENDPOINTS

// Obtener información del usuario
app.get('/api/user/:userId', (req, res) => {
    const userId = req.params.userId;
    const user = users.get(userId) || { tier: 'free', paidUntil: null, wallets: [] };
    res.json(user);
});

// Verificar estado de pago
app.get('/api/check-payment/:userId', (req, res) => {
    const userId = req.params.userId;
    const user = users.get(userId);

    if (!user || !user.paidUntil) {
        return res.json({ paid: false, tier: 'free' });
    }

    const now = new Date();
    const paidUntil = new Date(user.paidUntil);

    if (now > paidUntil) {
        return res.json({ paid: false, tier: 'free' });
    }

    res.json({
        paid: true,
        tier: user.tier,
        paidUntil: user.paidUntil
    });
});

// Iniciar pago
app.post('/api/initiate-payment', async (req, res) => {
    try {
        const { userId, tier, telegramId } = req.body;

        if (!TIER_PRICES[tier]) {
            return res.status(400).json({ error: 'Tier inválido' });
        }

        const paymentId = `payment_${Date.now()}_${userId}`;
        const amount = TIER_PRICES[tier];

        // Crear registro de pago
        payments.set(paymentId, {
            userId,
            telegramId,
            tier,
            amount,
            status: 'pending',
            createdAt: new Date().toISOString()
        });

        saveData();

        res.json({
            paymentId,
            amount,
            walletAddress: PAYMENT_WALLET.toBase58(),
            memo: paymentId
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error iniciando pago' });
    }
});

// Confirmar pago
app.post('/api/confirm-payment', async (req, res) => {
    try {
        const { paymentId, signature } = req.body;

        const payment = payments.get(paymentId);
        if (!payment) {
            return res.status(404).json({ error: 'Pago no encontrado' });
        }

        if (payment.status === 'confirmed') {
            return res.json({ success: true, message: 'Pago ya confirmado' });
        }

        // Verificar transacción
        const verification = await verificarTransaccion(
            signature,
            payment.amount,
            payment.userId
        );

        if (!verification.valid) {
            return res.status(400).json({ error: verification.error });
        }

        // Actualizar estado
        payment.status = 'confirmed';
        payment.signature = signature;
        payment.confirmedAt = new Date().toISOString();

        // Actualizar usuario
        const user = users.get(payment.userId) || {
            tier: 'free',
            paidUntil: null,
            wallets: []
        };

        user.tier = payment.tier;

        // Si ya tenía tiempo pagado, añadir 30 días
        const now = new Date();
        if (user.paidUntil && new Date(user.paidUntil) > now) {
            const paidUntil = new Date(user.paidUntil);
            paidUntil.setDate(paidUntil.getDate() + 30);
            user.paidUntil = paidUntil.toISOString();
        } else {
            // Nuevo pago, 30 días desde ahora
            const paidUntil = new Date();
            paidUntil.setDate(paidUntil.getDate() + 30);
            user.paidUntil = paidUntil.toISOString();
        }

        users.set(payment.userId, user);
        saveData();

        res.json({
            success: true,
            tier: payment.tier,
            paidUntil: user.paidUntil
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error confirmando pago' });
    }
});

// Webhook para notificaciones del bot
app.post('/api/webhook/payment', async (req, res) => {
    try {
        const { userId, signature, tier } = req.body;

        // Verificar y procesar pago
        const amount = TIER_PRICES[tier];
        const verification = await verificarTransaccion(signature, amount, userId);

        if (!verification.valid) {
            return res.status(400).json({ error: verification.error });
        }

        // Actualizar usuario
        const user = users.get(userId) || {
            tier: 'free',
            paidUntil: null,
            wallets: []
        };

        user.tier = tier;
        const paidUntil = new Date();
        paidUntil.setDate(paidUntil.getDate() + 30);
        user.paidUntil = paidUntil.toISOString();

        users.set(userId, user);
        saveData();

        res.json({ success: true, tier, paidUntil: user.paidUntil });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error procesando webhook' });
    }
});

// Obtener lista de pagos
app.get('/api/payments/:userId', (req, res) => {
    const userId = req.params.userId;
    const userPayments = Array.from(payments.values())
        .filter(p => p.userId === userId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(userPayments);
});

// Estadísticas
app.get('/api/stats', (req, res) => {
    const stats = {
        totalUsers: users.size,
        paidUsers: Array.from(users.values()).filter(u =>
            u.paidUntil && new Date(u.paidUntil) > new Date()
        ).length,
        tiers: {
            free: Array.from(users.values()).filter(u => u.tier === 'free').length,
            basic: Array.from(users.values()).filter(u => u.tier === 'basic').length,
            pro: Array.from(users.values()).filter(u => u.tier === 'pro').length,
            elite: Array.from(users.values()).filter(u => u.tier === 'elite').length
        },
        totalPayments: Array.from(payments.values()).filter(p => p.status === 'confirmed').length
    };

    res.json(stats);
});

// Servir frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Guardar datos periódicamente
setInterval(saveData, 5 * 60 * 1000);

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor de pagos iniciado en puerto ${PORT}`);
    loadData();
});

module.exports = app;