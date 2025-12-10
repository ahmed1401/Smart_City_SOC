package com.smartcity.emergency.store;

import com.smartcity.emergency.model.AlertQuery;
import com.smartcity.emergency.model.AlertRecord;
import com.smartcity.emergency.model.AlertSeverity;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class AlertRepository {

  private final NamedParameterJdbcTemplate jdbcTemplate;
  private final RowMapper<AlertRecord> rowMapper = this::mapRow;

  public AlertRepository(NamedParameterJdbcTemplate jdbcTemplate) {
    this.jdbcTemplate = jdbcTemplate;
  }

  public AlertRecord save(AlertRecord alert) {
    String sql =
        "INSERT INTO emergency_alert " +
        "  (id, type, zone, description, event_timestamp, severity, source, acknowledged, created_at) " +
        "VALUES (:id, :type, :zone, :description, :eventTimestamp, :severity, :source, :acknowledged, :createdAt) " +
        "ON CONFLICT (id) DO UPDATE SET " +
        "  type = EXCLUDED.type, " +
        "  zone = EXCLUDED.zone, " +
        "  description = EXCLUDED.description, " +
        "  event_timestamp = EXCLUDED.event_timestamp, " +
        "  severity = EXCLUDED.severity, " +
        "  source = EXCLUDED.source, " +
        "  acknowledged = EXCLUDED.acknowledged";
    MapSqlParameterSource params = new MapSqlParameterSource()
        .addValue("id", alert.id())
        .addValue("type", alert.type())
        .addValue("zone", alert.zone())
        .addValue("description", alert.description())
        .addValue("eventTimestamp", Timestamp.from(alert.eventTimestamp()))
        .addValue("severity", alert.severity().level())
        .addValue("source", alert.source())
        .addValue("acknowledged", alert.acknowledged())
        .addValue("createdAt", Timestamp.from(alert.createdAt()));
    jdbcTemplate.update(sql, params);
    return alert;
  }

  public List<AlertRecord> findRecent(int limit) {
    return findRecent(AlertQuery.empty(), limit);
  }

  public List<AlertRecord> findRecent(AlertQuery query, int limit) {
    int safeLimit = limit <= 0 ? 10 : Math.min(limit, 100);
    AlertQuery effectiveQuery = query == null ? AlertQuery.empty() : query;

    StringBuilder sql = new StringBuilder(
        "SELECT id, type, zone, description, event_timestamp, severity, source, acknowledged, created_at " +
            "FROM emergency_alert WHERE 1=1");
    MapSqlParameterSource params = new MapSqlParameterSource().addValue("limit", safeLimit);

    if (effectiveQuery.minimumSeverity().level() > AlertSeverity.INFO.level()) {
      sql.append(" AND severity >= :minSeverity");
      params.addValue("minSeverity", effectiveQuery.minimumSeverity().level());
    }
    if (!effectiveQuery.types().isEmpty()) {
      sql.append(" AND LOWER(type) IN (:types)");
      params.addValue("types", effectiveQuery.types());
    }
    if (!effectiveQuery.zones().isEmpty()) {
      sql.append(" AND LOWER(zone) IN (:zones)");
      params.addValue("zones", effectiveQuery.zones());
    }

    sql.append(" ORDER BY event_timestamp DESC LIMIT :limit");
    return jdbcTemplate.query(sql.toString(), params, rowMapper);
  }

  private AlertRecord mapRow(ResultSet rs, int rowNum) throws SQLException {
    return new AlertRecord(
        rs.getString("id"),
        rs.getString("type"),
        rs.getString("zone"),
        rs.getString("description"),
        rs.getTimestamp("event_timestamp").toInstant(),
        AlertSeverity.fromCode(rs.getInt("severity")),
        rs.getString("source"),
        rs.getBoolean("acknowledged"),
        rs.getTimestamp("created_at").toInstant()
    );
  }
}
