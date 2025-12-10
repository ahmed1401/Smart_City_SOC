package com.smartcity.emergency.simulator;

import java.security.SecureRandom;
import java.time.Clock;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.smartcity.emergency.model.AlertRecord;
import com.smartcity.emergency.model.AlertSeverity;
import com.smartcity.emergency.service.AlertService;

@Component
@ConditionalOnProperty(prefix = "emergency.simulator", name = "enabled", havingValue = "true", matchIfMissing = true)
public class SyntheticAlertScheduler {

  private static final Logger LOGGER = LoggerFactory.getLogger(SyntheticAlertScheduler.class);
  private static final List<String> DEFAULT_TYPES = List.of(
      "INCIDENT_TRANSPORT",
      "QUALITE_AIR",
      "VENT_FORT",
      "INONDATION",
      "CYBER_ATTAQUE",
      "PERTURBATION_RESEAU"
  );
  private static final List<String> DEFAULT_ZONES = List.of("CENTRE", "NORD", "SUD", "RIVE-DROITE", "RIVE-GAUCHE");
  private static final List<String> DEFAULT_MESSAGES = List.of(
      "Surveillance active des capteurs terrain.",
      "Relai SOC en phase d'analyse.",
      "Escalade potentielle en cours.",
      "Demande d'intervention préventive.",
      "Coordination en cours avec les équipes locales."
  );

  private final AlertService alertService;
  private final Clock clock;
  private final SecureRandom random = new SecureRandom();
  private final List<String> types;
  private final List<String> zones;
  private final List<String> messages;

  public SyntheticAlertScheduler(AlertService alertService,
                                 Clock clock,
                                 @Value("${emergency.simulator.types:}") List<String> configuredTypes,
                                 @Value("${emergency.simulator.zones:}") List<String> configuredZones,
                                 @Value("${emergency.simulator.messages:}") List<String> configuredMessages) {
    this.alertService = alertService;
    this.clock = clock;
    this.types = configuredTypes == null || configuredTypes.isEmpty() ? DEFAULT_TYPES : normalize(configuredTypes);
    this.zones = configuredZones == null || configuredZones.isEmpty() ? DEFAULT_ZONES : normalize(configuredZones);
    this.messages = configuredMessages == null || configuredMessages.isEmpty() ? DEFAULT_MESSAGES : configuredMessages;
  }

  @Scheduled(initialDelayString = "${emergency.simulator.initial-delay-ms:2000}",
             fixedDelayString = "${emergency.simulator.period-ms:5000}")
  public void produceAlert() {
    String id = "sim-" + UUID.randomUUID().toString().replace("-","").substring(0, 10);
    AlertRecord record = new AlertRecord(
        id,
        pick(types),
        pick(zones),
        pick(messages),
        alertService.now(),
        AlertSeverity.fromCode(random.nextInt(AlertSeverity.CRITICAL.level()) + 1),
        "simulator",
        false,
        alertService.now()
    );
    alertService.persist(record);
    LOGGER.info("[Simulator] Injected synthetic alert {}", id);
  }

  private List<String> normalize(List<String> values) {
    return values.stream().map(value -> value.toUpperCase(Locale.ROOT)).toList();
  }

  private String pick(List<String> list) {
    if (list.isEmpty()) {
      return "UNKNOWN";
    }
    return list.get(random.nextInt(list.size()));
  }
}
