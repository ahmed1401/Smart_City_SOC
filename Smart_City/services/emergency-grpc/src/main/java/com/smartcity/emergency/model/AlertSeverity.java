package com.smartcity.emergency.model;

import com.smartcity.emergency.Severity;

public enum AlertSeverity {
  INFO(1, Severity.SEVERITY_INFO),
  WARNING(2, Severity.SEVERITY_WARNING),
  CRITICAL(3, Severity.SEVERITY_CRITICAL);

  private final int level;
  private final Severity proto;

  AlertSeverity(int level, Severity proto) {
    this.level = level;
    this.proto = proto;
  }

  public int level() {
    return level;
  }

  public Severity toProto() {
    return proto;
  }

  public static AlertSeverity fromProto(Severity severity) {
    if (severity == null) {
      return INFO;
    }
    switch (severity) {
      case SEVERITY_CRITICAL:
        return CRITICAL;
      case SEVERITY_WARNING:
        return WARNING;
      case SEVERITY_INFO:
      case SEVERITY_UNSPECIFIED:
      case UNRECOGNIZED:
      default:
        return INFO;
    }
  }

  public static AlertSeverity fromCode(int code) {
    if (code >= CRITICAL.level) {
      return CRITICAL;
    }
    if (code >= WARNING.level) {
      return WARNING;
    }
    return INFO;
  }
}
