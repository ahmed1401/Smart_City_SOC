package com.smartcity.directory.graphql;

import com.smartcity.directory.graphql.dto.AqiInsightDto;
import com.smartcity.directory.graphql.dto.ContactInfoDto;
import com.smartcity.directory.graphql.dto.LocationDto;
import com.smartcity.directory.graphql.dto.OpeningHourDto;
import com.smartcity.directory.graphql.dto.ServiceDto;
import com.smartcity.directory.graphql.dto.TicketDto;
import com.smartcity.directory.graphql.input.ServiceFilterInput;
import com.smartcity.directory.graphql.input.TicketFilterInput;
import com.smartcity.directory.graphql.input.TicketInput;
import com.smartcity.directory.model.DirectoryServiceEntity;
import com.smartcity.directory.model.DirectoryTicketEntity;
import com.smartcity.directory.model.ServiceHourEntity;
import com.smartcity.directory.model.TicketPriority;
import com.smartcity.directory.model.TicketStatus;
import com.smartcity.directory.repository.DirectoryServiceRepository;
import com.smartcity.directory.repository.DirectoryTicketRepository;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.stream.Stream;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class DirectoryGraphQlService {

  private static final DateTimeFormatter ISO_FORMATTER = DateTimeFormatter.ISO_OFFSET_DATE_TIME;

  private final DirectoryServiceRepository serviceRepository;
  private final DirectoryTicketRepository ticketRepository;

  public DirectoryGraphQlService(DirectoryServiceRepository serviceRepository, DirectoryTicketRepository ticketRepository) {
    this.serviceRepository = serviceRepository;
    this.ticketRepository = ticketRepository;
  }

  public List<ServiceDto> listServices(ServiceFilterInput filter) {
    Stream<DirectoryServiceEntity> stream = serviceRepository.findAllWithHours().stream();
    if (filter != null) {
      if (StringUtils.hasText(filter.getCategory())) {
        String category = filter.getCategory().trim().toLowerCase(Locale.ROOT);
        stream = stream.filter(service -> category.equalsIgnoreCase(service.getCategory()));
      }
      if (StringUtils.hasText(filter.getText())) {
        String text = filter.getText().trim().toLowerCase(Locale.ROOT);
        stream = stream.filter(service -> containsIgnoreCase(service.getName(), text) || containsIgnoreCase(service.getDescription(), text));
      }
      if (StringUtils.hasText(filter.getNearZone())) {
        String zone = filter.getNearZone().trim().toUpperCase(Locale.ROOT);
        stream = stream.filter(service -> {
          String serviceZone = emptyToNull(service.getRelatedAqiZone());
          return serviceZone != null && zone.equalsIgnoreCase(serviceZone);
        });
      }
    }
    return stream.map(this::toServiceDto).toList();
  }

  public List<TicketDto> listTickets(TicketFilterInput filter) {
    Stream<DirectoryTicketEntity> stream = ticketRepository.findAllByOrderByUpdatedAtDesc().stream();
    if (filter != null) {
      if (filter.getStatus() != null) {
        stream = stream.filter(ticket -> ticket.getStatus() == filter.getStatus());
      }
      if (StringUtils.hasText(filter.getServiceId())) {
        String serviceId = filter.getServiceId().trim();
        stream = stream.filter(ticket -> ticket.getService() != null && serviceId.equals(ticket.getService().getId()));
      }
      if (StringUtils.hasText(filter.getCitizenId())) {
        String citizenId = filter.getCitizenId().trim();
        stream = stream.filter(ticket -> citizenId.equalsIgnoreCase(ticket.getCitizenId()));
      }
    }
    return stream.map(this::toTicketDto).toList();
  }

  @Transactional
  public TicketDto createTicket(TicketInput input) {
    validateTicketInput(input);
    DirectoryServiceEntity service = serviceRepository
      .findByIdWithHours(input.getServiceId().trim())
        .orElseThrow(() -> new IllegalArgumentException("Service introuvable pour l'identifiant fourni."));

    DirectoryTicketEntity entity = new DirectoryTicketEntity();
    entity.setId(generateTicketId());
    entity.setSubject(input.getSubject().trim());
    entity.setDescription(input.getDescription().trim());
    entity.setPriority(input.getPriority() != null ? input.getPriority() : TicketPriority.MEDIUM);
    entity.setStatus(TicketStatus.OPEN);
    entity.setCitizenId(input.getCitizenId().trim());
    entity.setService(service);
    OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
    entity.setCreatedAt(now);
    entity.setUpdatedAt(now);

    DirectoryTicketEntity saved = ticketRepository.save(entity);
    return toTicketDto(saved);
  }

  @Transactional
  public TicketDto closeTicket(String id) {
    if (!StringUtils.hasText(id)) {
      throw new IllegalArgumentException("L'identifiant du ticket est requis.");
    }
    DirectoryTicketEntity ticket = ticketRepository
      .findById(id.trim())
        .orElseThrow(() -> new IllegalArgumentException("Ticket introuvable."));
    ticket.setStatus(TicketStatus.CLOSED);
    ticket.setUpdatedAt(OffsetDateTime.now(ZoneOffset.UTC));
    return toTicketDto(ticketRepository.save(ticket));
  }

  private void validateTicketInput(TicketInput input) {
    if (input == null) {
      throw new IllegalArgumentException("Les données du ticket sont requises.");
    }
    if (!StringUtils.hasText(input.getSubject())) {
      throw new IllegalArgumentException("Le sujet est requis.");
    }
    if (!StringUtils.hasText(input.getDescription())) {
      throw new IllegalArgumentException("La description est requise.");
    }
    if (!StringUtils.hasText(input.getServiceId())) {
      throw new IllegalArgumentException("Le service est requis.");
    }
    if (!StringUtils.hasText(input.getCitizenId())) {
      throw new IllegalArgumentException("L'identifiant citoyen est requis.");
    }
  }

  private ServiceDto toServiceDto(DirectoryServiceEntity entity) {
    ContactInfoDto contact = new ContactInfoDto(entity.getContactPhone(), entity.getContactEmail(), entity.getContactUrl());
    LocationDto location = new LocationDto(entity.getAddress(), entity.getLatitude(), entity.getLongitude());
    AqiInsightDto relatedAQI = toInsight(entity);
    List<OpeningHourDto> hours = entity.getHours().stream()
        .map(this::toOpeningHourDto)
        .toList();
    return new ServiceDto(entity.getId(), entity.getName(), entity.getCategory(), entity.getDescription(), contact, hours, location, relatedAQI);
  }

  private OpeningHourDto toOpeningHourDto(ServiceHourEntity hour) {
    return new OpeningHourDto(hour.getDayLabel(), hour.getOpenTime(), hour.getCloseTime());
  }

  private AqiInsightDto toInsight(DirectoryServiceEntity entity) {
    if (!StringUtils.hasText(entity.getRelatedAqiZone())) {
      return null;
    }
    return new AqiInsightDto(entity.getRelatedAqiZone(), entity.getRelatedAqiValue(), entity.getRelatedAqiCategory());
  }

  private TicketDto toTicketDto(DirectoryTicketEntity entity) {
    ServiceDto service = toServiceDto(entity.getService());
    String createdAt = entity.getCreatedAt() != null ? ISO_FORMATTER.format(entity.getCreatedAt()) : null;
    String updatedAt = entity.getUpdatedAt() != null ? ISO_FORMATTER.format(entity.getUpdatedAt()) : null;
    return new TicketDto(
        entity.getId(),
        entity.getSubject(),
        entity.getDescription(),
        entity.getStatus(),
        entity.getPriority(),
        createdAt,
        updatedAt,
        entity.getCitizenId(),
        service);
  }

  private static boolean containsIgnoreCase(String source, String needle) {
    if (!StringUtils.hasText(source) || !StringUtils.hasText(needle)) {
      return false;
    }
    return source.toLowerCase(Locale.ROOT).contains(needle.toLowerCase(Locale.ROOT));
  }

  private static String emptyToNull(String value) {
    return StringUtils.hasText(value) ? value : null;
  }

  private static String generateTicketId() {
    return "tkt-" + UUID.randomUUID().toString().replace("-", "").substring(0, 10);
  }
}
