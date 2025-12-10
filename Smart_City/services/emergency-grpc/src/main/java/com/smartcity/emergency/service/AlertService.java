package com.smartcity.emergency.service;

import com.smartcity.emergency.model.AlertQuery;
import com.smartcity.emergency.model.AlertRecord;
import com.smartcity.emergency.streaming.AlertBroadcaster;
import com.smartcity.emergency.store.AlertRepository;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

@Service
public class AlertService {

  private final AlertRepository repository;
  private final AlertBroadcaster broadcaster;
  private final Clock clock;

  public AlertService(AlertRepository repository,
                      AlertBroadcaster broadcaster,
                      Clock clock) {
    this.repository = repository;
    this.broadcaster = broadcaster;
    this.clock = clock;
  }

  public AlertRecord persist(AlertRecord alert) {
    AlertRecord saved = repository.save(alert);
    broadcaster.publish(saved);
    return saved;
  }

  public List<AlertRecord> recent(int limit) {
    return recent(AlertQuery.empty(), limit);
  }

  public List<AlertRecord> recent(AlertQuery query, int limit) {
    return repository.findRecent(resolve(query), limit);
  }

  public Flux<AlertRecord> stream() {
    return broadcaster.stream();
  }

  public Flux<AlertRecord> stream(AlertQuery query) {
    AlertQuery effectiveQuery = resolve(query);
    return broadcaster.stream().filter(effectiveQuery::matches);
  }

  private AlertQuery resolve(AlertQuery query) {
    return query == null ? AlertQuery.empty() : query;
  }

  public Instant now() {
    return Instant.now(clock);
  }
}
