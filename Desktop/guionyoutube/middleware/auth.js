import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { queryOne } from '../database/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'tu-secret-key-super-segura-cambiar-en-produccion';
const JWT_EXPIRES_IN = '7d';

/**
 * Genera un JWT token para un usuario
 */
export function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      username: user.username,
      plan: user.plan
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Verifica un JWT token
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Hashea una contraseña
 */
export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

/**
 * Compara una contraseña con su hash
 */
export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Middleware para proteger rutas (requiere autenticación)
 */
export function requireAuth(req, res, next) {
  try {
    // Obtener token del header o cookie
    const token = req.headers.authorization?.replace('Bearer ', '') ||
                  req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        error: 'No autenticado',
        message: 'Debes iniciar sesión para acceder a este recurso'
      });
    }

    // Verificar token
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({
        error: 'Token inválido',
        message: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente'
      });
    }

    // Verificar que el usuario existe y está activo
    const user = queryOne(
      'SELECT id, email, username, plan, credits, is_active FROM users WHERE id = ?',
      [decoded.id]
    );

    if (!user || !user.is_active) {
      return res.status(401).json({
        error: 'Usuario no válido',
        message: 'Tu cuenta no está activa'
      });
    }

    // Agregar usuario al request
    req.user = user;
    next();
  } catch (error) {
    console.error('Error en autenticación:', error);
    res.status(500).json({
      error: 'Error de autenticación',
      message: 'Ocurrió un error al verificar tu autenticación'
    });
  }
}

/**
 * Middleware para verificar que el usuario tiene un plan específico
 */
export function requirePlan(minPlan) {
  const planHierarchy = {
    'free': 0,
    'pro': 1,
    'enterprise': 2
  };

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'No autenticado'
      });
    }

    const userPlanLevel = planHierarchy[req.user.plan] || 0;
    const requiredPlanLevel = planHierarchy[minPlan] || 0;

    if (userPlanLevel < requiredPlanLevel) {
      return res.status(403).json({
        error: 'Plan insuficiente',
        message: `Esta función requiere plan ${minPlan} o superior`,
        currentPlan: req.user.plan,
        requiredPlan: minPlan
      });
    }

    next();
  };
}

/**
 * Middleware para verificar créditos
 */
export function requireCredits(amount) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'No autenticado'
      });
    }

    if (req.user.credits < amount) {
      return res.status(403).json({
        error: 'Créditos insuficientes',
        message: `Esta acción requiere ${amount} créditos. Tienes ${req.user.credits}`,
        requiredCredits: amount,
        availableCredits: req.user.credits
      });
    }

    next();
  };
}

/**
 * Middleware opcional de autenticación (no falla si no hay token)
 */
export function optionalAuth(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') ||
                  req.cookies?.token;

    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        const user = queryOne(
          'SELECT id, email, username, plan, credits, is_active FROM users WHERE id = ?',
          [decoded.id]
        );
        if (user && user.is_active) {
          req.user = user;
        }
      }
    }
    next();
  } catch (error) {
    // En caso de error, simplemente continuar sin usuario
    next();
  }
}
