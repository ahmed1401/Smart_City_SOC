package com.smartcity.emergency.streaming;

import com.smartcity.emergency.model.AlertRecord;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Sinks;

@Component
public class AlertBroadcaster {

  private final Sinks.Many<AlertRecord> sink;

  public AlertBroadcaster() {
    this.sink = Sinks.many().multicast().onBackpressureBuffer(64, false);
  }

  public void publish(AlertRecord alert) {
    sink.tryEmitNext(alert);
  }

  public Flux<AlertRecord> stream() {
    return sink.asFlux();
  }
}
