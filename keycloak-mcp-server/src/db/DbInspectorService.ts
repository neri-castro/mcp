import { getDbPool } from './DbConnection.js';
import { DbInspectorError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export class DbInspectorService {
  private async query<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
    const db = getDbPool();
    try {
      const result = await db.query(sql, params);
      return result.rows as T[];
    } catch (err) {
      logger.error({ err, sql }, 'DB Inspector query failed');
      throw new DbInspectorError(`Query failed: ${(err as Error).message}`);
    }
  }

  // ── Users ────────────────────────────────────────────────────────────────

  async getUsersInactive(realmId: string, days: number, limit = 100) {
    const thresholdMs = Date.now() - days * 24 * 60 * 60 * 1000;
    return this.query(
      `SELECT u.username, u.email, u.realm_id,
         to_timestamp(MAX(e.event_time)/1000) AS ultimo_login
       FROM user_entity u
       LEFT JOIN event_entity e ON u.id = e.user_id AND e.type = 'LOGIN'
       WHERE u.realm_id = $1 AND u.enabled = true
       GROUP BY u.id, u.username, u.email, u.realm_id
       HAVING MAX(e.event_time) < $2 OR MAX(e.event_time) IS NULL
       ORDER BY ultimo_login ASC NULLS FIRST
       LIMIT $3`,
      [realmId, thresholdMs, limit]
    );
  }

  async getUsersLocked(realmId: string) {
    return this.query(
      `SELECT u.id, u.username, u.email,
         bf.num_failures, bf.last_failure, bf.ip_address
       FROM user_entity u
       JOIN brute_force_user bf ON u.id = bf.user_id
       WHERE u.realm_id = $1 AND bf.failed_login_not_before > 0
       ORDER BY bf.last_failure DESC`,
      [realmId]
    );
  }

  async getUsersUnverified(realmId: string, days: number) {
    const thresholdMs = Date.now() - days * 24 * 60 * 60 * 1000;
    return this.query(
      `SELECT u.username, u.email,
         to_timestamp(u.created_timestamp/1000) AS created_at
       FROM user_entity u
       WHERE u.realm_id = $1
         AND u.email_verified = false
         AND u.created_timestamp < $2
       ORDER BY u.created_timestamp ASC`,
      [realmId, thresholdMs]
    );
  }

  async getUsersCountByRealm() {
    return this.query(
      `SELECT realm_id, COUNT(*) AS total,
         SUM(CASE WHEN enabled THEN 1 ELSE 0 END) AS activos
       FROM user_entity
       GROUP BY realm_id
       ORDER BY total DESC`
    );
  }

  // ── Roles ────────────────────────────────────────────────────────────────

  async getRolesUnused(realmId: string) {
    return this.query(
      `SELECT r.name, r.description
       FROM keycloak_role r
       LEFT JOIN user_role_mapping urm ON r.id = urm.role_id
       LEFT JOIN composite_role cr ON r.id = cr.child_role
       WHERE r.realm_id = $1
         AND urm.user_id IS NULL
         AND cr.composite IS NULL
       ORDER BY r.name`,
      [realmId]
    );
  }

  async getRolesDistribution(realmId: string) {
    return this.query(
      `SELECT r.name AS rol, COUNT(DISTINCT urm.user_id) AS usuarios
       FROM keycloak_role r
       JOIN user_role_mapping urm ON r.id = urm.role_id
       JOIN user_entity u ON urm.user_id = u.id
       WHERE r.realm_id = $1
       GROUP BY r.name
       ORDER BY usuarios DESC`,
      [realmId]
    );
  }

  // ── Clients ──────────────────────────────────────────────────────────────

  async getClientsInactive(realmId: string, days: number) {
    const thresholdMs = Date.now() - days * 24 * 60 * 60 * 1000;
    return this.query(
      `SELECT c.client_id, c.name,
         MAX(e.event_time) AS last_activity
       FROM client c
       LEFT JOIN event_entity e ON c.id = e.client_id
       WHERE c.realm_id = $1
       GROUP BY c.id, c.client_id, c.name
       HAVING MAX(e.event_time) < $2 OR MAX(e.event_time) IS NULL
       ORDER BY last_activity ASC NULLS FIRST`,
      [realmId, thresholdMs]
    );
  }

  // ── Sessions ─────────────────────────────────────────────────────────────

  async getSessionsActiveSummary(realmId: string) {
    return this.query(
      `SELECT c.client_id, COUNT(ous.user_session_id) AS sesiones_activas
       FROM offline_user_session ous
       JOIN offline_client_session ocs ON ous.user_session_id = ocs.user_session_id
       JOIN client c ON ocs.client_id = c.id
       WHERE ous.realm_id = $1
         AND ous.offline_flag = '0'
       GROUP BY c.client_id
       ORDER BY sesiones_activas DESC`,
      [realmId]
    );
  }

  async getSessionsOfflineOld(realmId: string, days: number) {
    const thresholdSec = Math.floor(Date.now() / 1000) - days * 24 * 60 * 60;
    return this.query(
      `SELECT COUNT(*) AS sesiones_expiradas, c.client_id
       FROM offline_user_session ous
       JOIN offline_client_session ocs ON ous.user_session_id = ocs.user_session_id
       JOIN client c ON ocs.client_id = c.id
       WHERE ous.last_session_refresh < $1
         AND ous.realm_id = $2
       GROUP BY c.client_id
       ORDER BY sesiones_expiradas DESC`,
      [thresholdSec, realmId]
    );
  }

  // ── Events ───────────────────────────────────────────────────────────────

  async getEventsLoginErrors(realmId: string, dateFrom: number, dateTo: number, limit = 20) {
    return this.query(
      `SELECT type, client_id, COUNT(*) AS total,
         MIN(event_time) AS primer_error,
         MAX(event_time) AS ultimo_error
       FROM event_entity
       WHERE realm_id = $1
         AND type LIKE '%ERROR%'
         AND event_time BETWEEN $2 AND $3
       GROUP BY type, client_id
       ORDER BY total DESC
       LIMIT $4`,
      [realmId, dateFrom, dateTo, limit]
    );
  }

  async getEventsFailedUsers(realmId: string, dateFrom: number, dateTo: number, limit = 20) {
    return this.query(
      `SELECT user_id, ip_address, COUNT(*) AS intentos_fallidos
       FROM event_entity
       WHERE realm_id = $1
         AND type = 'LOGIN_ERROR'
         AND event_time BETWEEN $2 AND $3
       GROUP BY user_id, ip_address
       ORDER BY intentos_fallidos DESC
       LIMIT $4`,
      [realmId, dateFrom, dateTo, limit]
    );
  }

  async getEventsActivityByHour(realmId: string, dateFrom: number, dateTo: number) {
    return this.query(
      `SELECT EXTRACT(HOUR FROM to_timestamp(event_time/1000)) AS hora,
         COUNT(*) AS logins
       FROM event_entity
       WHERE realm_id = $1
         AND type = 'LOGIN'
         AND event_time BETWEEN $2 AND $3
       GROUP BY hora
       ORDER BY hora`,
      [realmId, dateFrom, dateTo]
    );
  }

  // ── Integrity ────────────────────────────────────────────────────────────

  async getIntegrityOrphans() {
    return this.query(
      `SELECT 'user_attribute sin user' AS tipo, COUNT(*) AS total
       FROM user_attribute ua
       LEFT JOIN user_entity u ON ua.user_id = u.id
       WHERE u.id IS NULL
       UNION ALL
       SELECT 'user_role_mapping sin user', COUNT(*)
       FROM user_role_mapping urm
       LEFT JOIN user_entity u ON urm.user_id = u.id
       WHERE u.id IS NULL
       UNION ALL
       SELECT 'user_group_membership sin group', COUNT(*)
       FROM user_group_membership ugm
       LEFT JOIN keycloak_group g ON ugm.group_id = g.id
       WHERE g.id IS NULL`
    );
  }

  async getIntegrityExpiredTokens() {
    const nowSec = Math.floor(Date.now() / 1000);
    return this.query(
      `SELECT COUNT(*) AS tokens_expirados, realm_id
       FROM offline_user_session
       WHERE last_session_refresh + offline_flag::int < $1
       GROUP BY realm_id`,
      [nowSec]
    );
  }

  // ── Performance ──────────────────────────────────────────────────────────

  async getPerfTableSizes() {
    return this.query(
      `SELECT relname AS tabla,
         pg_size_pretty(pg_total_relation_size(relid)) AS tamanio,
         pg_total_relation_size(relid) AS bytes
       FROM pg_catalog.pg_statio_user_tables
       ORDER BY bytes DESC
       LIMIT 20`
    );
  }

  async getPerfIndexes() {
    return this.query(
      `SELECT schemaname, tablename, indexname,
         idx_scan AS escaneos,
         pg_size_pretty(pg_relation_size(indexrelid)) AS tamanio
       FROM pg_stat_user_indexes
       WHERE schemaname = 'public'
       ORDER BY idx_scan ASC
       LIMIT 20`
    );
  }

  // ── Raw Query (SELECT only) ───────────────────────────────────────────────

  async rawQuery(sql: string, params: unknown[] = []) {
    const trimmed = sql.trim().toLowerCase();
    if (!trimmed.startsWith('select') && !trimmed.startsWith('with')) {
      throw new DbInspectorError(
        'Solo se permiten consultas SELECT o WITH (CTEs). No se permiten operaciones DML/DDL.'
      );
    }
    return this.query(sql, params);
  }
}

export const dbInspector = new DbInspectorService();
