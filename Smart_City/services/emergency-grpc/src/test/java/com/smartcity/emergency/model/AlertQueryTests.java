package com.smartcity.emergency.model;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.Set;
import org.junit.jupiter.api.Test;

class AlertQueryTests {

  @Test
  void matchesFiltersByTypeZoneAndSeverity() {
    AlertRecord record = new AlertRecord(
        "alert-1",
        "INCIDENT_TRANSPORT",
        "CENTRE",
        "Manifestation en cours",
        Instant.parse("2024-10-10T10:15:30Z"),
        AlertSeverity.CRITICAL,
        "grpc",
        false,
        Instant.parse("2024-10-10T10:16:00Z"));

    AlertQuery query = AlertQuery.of(Set.of("incident_transport"), Set.of("centre"), AlertSeverity.WARNING);

    assertThat(query.matches(record)).isTrue();
  }

  @Test
  void matchesRejectsLowerSeverityOrMismatchedZone() {
    AlertRecord record = new AlertRecord(
        "alert-2",
        "VENT_FORT",
        "SUD",
        "Rafales attendues",
        Instant.parse("2024-10-10T11:00:00Z"),
        AlertSeverity.INFO,
        "grpc",
        false,
        Instant.parse("2024-10-10T11:01:00Z"));

    AlertQuery query = AlertQuery.of(Set.of("vent_fort"), Set.of("centre"), AlertSeverity.WARNING);

    assertThat(query.matches(record)).isFalse();
  }
}
