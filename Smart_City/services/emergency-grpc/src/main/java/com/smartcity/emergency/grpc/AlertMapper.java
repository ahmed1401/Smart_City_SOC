package com.smartcity.emergency.grpc;

import com.smartcity.emergency.model.AlertRecord;
import com.smartcity.emergency.model.AlertSeverity;
import java.time.Instant;
import com.smartcity.emergency.Alert;

final class AlertMapper {

  private AlertMapper() {
  }

  static Alert toProto(AlertRecord record) {
    return Alert.newBuilder()
        .setId(record.id())
        .setType(record.type())
        .setZone(record.zone())
        .setDescription(record.description())
        .setTimestamp(record.eventTimestamp().getEpochSecond())
        .setSeverity(record.severity().toProto())
        .build();
  }

  static AlertRecord fromRequest(Alert request,
                                 AlertSeverity severity,
                                 Instant eventTimestamp,
                                 Instant createdAt,
                                 String source) {
    return new AlertRecord(
        request.getId(),
        request.getType(),
        request.getZone(),
        request.getDescription(),
        eventTimestamp,
        severity,
        source,
        false,
        createdAt
    );
  }
}
