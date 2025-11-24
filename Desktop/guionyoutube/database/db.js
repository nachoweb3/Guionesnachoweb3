import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Crear o conectar a la base de datos
const db = new Database(join(__dirname, 'guiones.db'));

// Habilitar foreign keys
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL'); // Write-Ahead Logging para mejor performance

/**
 * Inicializa la base de datos con el schema
 */
export function initializeDatabase() {
  try {
    const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
    db.exec(schema);
    console.log('✅ Base de datos inicializada correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error);
    throw error;
  }
}

/**
 * Ejecuta una query de forma segura
 */
export function query(sql, params = []) {
  try {
    return db.prepare(sql).all(params);
  } catch (error) {
    console.error('Error en query:', error);
    throw error;
  }
}

/**
 * Ejecuta una query que devuelve un solo resultado
 */
export function queryOne(sql, params = []) {
  try {
    return db.prepare(sql).get(params);
  } catch (error) {
    console.error('Error en queryOne:', error);
    throw error;
  }
}

/**
 * Ejecuta una query de inserción/actualización
 */
export function execute(sql, params = []) {
  try {
    return db.prepare(sql).run(params);
  } catch (error) {
    console.error('Error en execute:', error);
    throw error;
  }
}

/**
 * Ejecuta múltiples queries en una transacción
 */
export function transaction(callback) {
  const txn = db.transaction(callback);
  return txn();
}

/**
 * Cierra la conexión a la base de datos
 */
export function closeDatabase() {
  db.close();
}

export default db;
