package com.smartcity.emergency.grpc;

import com.smartcity.emergency.model.AlertQuery;
import com.smartcity.emergency.model.AlertRecord;
import com.smartcity.emergency.model.AlertSeverity;
import com.smartcity.emergency.service.AlertService;
import io.grpc.Status;
import io.grpc.stub.ServerCallStreamObserver;
import io.grpc.stub.StreamObserver;
import java.time.Instant;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import net.devh.boot.grpc.server.service.GrpcService;
import reactor.core.Disposable;
import com.smartcity.emergency.Alert;
import com.smartcity.emergency.AlertAck;
import com.smartcity.emergency.AlertFilter;
import com.smartcity.emergency.AlertList;
import com.smartcity.emergency.EmergencyServiceGrpc;
import com.smartcity.emergency.RecentRequest;

@GrpcService
public class EmergencyGrpcService extends EmergencyServiceGrpc.EmergencyServiceImplBase {

  private static final int DEFAULT_LIMIT = 10;
  private static final int MAX_LIMIT = 50;

  private final AlertService alertService;

  public EmergencyGrpcService(AlertService alertService) {
    this.alertService = alertService;
  }

  @Override
  public void sendAlert(Alert request, StreamObserver<AlertAck> responseObserver) {
    try {
      Alert enriched = ensureDefaults(request);
      AlertSeverity severity = AlertSeverity.fromProto(enriched.getSeverity());
      Instant eventTimestamp = enriched.getTimestamp() > 0
          ? Instant.ofEpochSecond(enriched.getTimestamp())
          : alertService.now();
      Instant createdAt = alertService.now();
      AlertRecord record = AlertMapper.fromRequest(enriched, severity, eventTimestamp, createdAt, "grpc");
      alertService.persist(record);
      AlertAck ack = AlertAck.newBuilder()
          .setAlertId(record.id())
          .setAccepted(true)
          .build();
      responseObserver.onNext(ack);
      responseObserver.onCompleted();
    } catch (Exception ex) {
      responseObserver.onError(Status.INTERNAL.withDescription("Failed to persist alert").withCause(ex).asRuntimeException());
    }
  }

  @Override
  public void getRecentAlerts(RecentRequest request, StreamObserver<AlertList> responseObserver) {
    try {
      int limit = normalizeLimit(request.getLimit());
      AlertQuery query = buildQuery(request.hasFilter() ? request.getFilter() : null);
        List<Alert> alerts = alertService.recent(query, limit).stream()
          .map(AlertMapper::toProto)
          .collect(Collectors.toList());
      AlertList list = AlertList.newBuilder().addAllAlerts(alerts).build();
      responseObserver.onNext(list);
      responseObserver.onCompleted();
    } catch (Exception ex) {
      responseObserver.onError(Status.INTERNAL.withDescription("Failed to load alerts").withCause(ex).asRuntimeException());
    }
  }

  @Override
  public void subscribeAlerts(AlertFilter request, StreamObserver<Alert> responseObserver) {
    ServerCallStreamObserver<Alert> serverObserver = (ServerCallStreamObserver<Alert>) responseObserver;
    int snapshotLimit = normalizeLimit(DEFAULT_LIMIT);
    AlertQuery query = buildQuery(request);
    try {
      alertService.recent(query, snapshotLimit).stream()
          .map(AlertMapper::toProto)
          .forEach(serverObserver::onNext);
    } catch (Exception ex) {
      responseObserver.onError(Status.INTERNAL.withDescription("Failed to load initial alerts").withCause(ex).asRuntimeException());
      return;
    }

    Disposable subscription = alertService.stream(query)
        .map(AlertMapper::toProto)
        .subscribe(
            serverObserver::onNext,
            throwable -> serverObserver.onError(Status.UNKNOWN.withCause(throwable).asRuntimeException()));

    serverObserver.setOnCancelHandler(subscription::dispose);
    serverObserver.setOnCloseHandler(subscription::dispose);
  }

  private Alert ensureDefaults(Alert original) {
    Alert.Builder builder = original.toBuilder();
    if (original.getId().isBlank()) {
      builder.setId("live-" + UUID.randomUUID().toString().replace("-", "").substring(0, 10));
    }
    if (original.getTimestamp() <= 0) {
      builder.setTimestamp(alertService.now().getEpochSecond());
    }
    if (original.getSeverity() == null || original.getSeverity().getNumber() == 0) {
      builder.setSeverity(AlertSeverity.INFO.toProto());
    }
    return builder.build();
  }

  private AlertQuery buildQuery(AlertFilter filter) {
    if (filter == null) {
      return AlertQuery.empty();
    }
    Set<String> types = filter.getTypesList().stream()
        .filter(Objects::nonNull)
        .collect(Collectors.toUnmodifiableSet());
    Set<String> zones = filter.getZonesList().stream()
        .filter(Objects::nonNull)
        .collect(Collectors.toUnmodifiableSet());
    AlertSeverity minimum = AlertSeverity.fromProto(filter.getMinimumSeverity());
    return AlertQuery.of(types, zones, minimum);
  }

  private int normalizeLimit(int requested) {
    if (requested <= 0) {
      return DEFAULT_LIMIT;
    }
    return Math.min(requested, MAX_LIMIT);
  }
}
