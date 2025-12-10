package com.smartcity.emergency.model;

import java.util.Collection;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Value object describing filters applied to alert queries.
 */
public record AlertQuery(Set<String> types, Set<String> zones, AlertSeverity minimumSeverity) {

  private static final AlertQuery EMPTY = new AlertQuery(Set.of(), Set.of(), AlertSeverity.INFO);

  public static AlertQuery empty() {
    return EMPTY;
  }

  public static AlertQuery of(Collection<String> types,
                              Collection<String> zones,
                              AlertSeverity minimumSeverity) {
    AlertSeverity severity = Objects.requireNonNullElse(minimumSeverity, AlertSeverity.INFO);
    return new AlertQuery(normalize(types), normalize(zones), severity);
  }

  public boolean matches(AlertRecord record) {
    if (record == null) {
      return false;
    }
    if (!types.isEmpty() && !types.contains(normalize(record.type()))) {
      return false;
    }
    if (!zones.isEmpty() && !zones.contains(normalize(record.zone()))) {
      return false;
    }
    return record.severity().level() >= minimumSeverity.level();
  }

  public boolean hasFilters() {
    return !types.isEmpty() || !zones.isEmpty() || minimumSeverity.level() > AlertSeverity.INFO.level();
  }

  private static Set<String> normalize(Collection<String> values) {
    if (values == null || values.isEmpty()) {
      return Set.of();
    }
    return values.stream()
        .filter(value -> value != null && !value.isBlank())
        .map(AlertQuery::normalize)
        .collect(Collectors.toUnmodifiableSet());
  }

  private static String normalize(String value) {
    return value == null ? "" : value.toLowerCase(Locale.ROOT);
  }
}
