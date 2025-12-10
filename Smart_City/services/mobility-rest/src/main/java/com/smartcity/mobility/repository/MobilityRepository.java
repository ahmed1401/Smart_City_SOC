package com.smartcity.mobility.repository;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ThreadLocalRandom;

import org.springframework.stereotype.Repository;

import com.smartcity.mobility.entity.BookingEntity;
import com.smartcity.mobility.model.Arrival;
import com.smartcity.mobility.model.Booking;
import com.smartcity.mobility.model.GeoPoint;
import com.smartcity.mobility.model.Line;
import com.smartcity.mobility.model.Schedule;
import com.smartcity.mobility.model.Stop;
import com.smartcity.mobility.model.StopTime;
import com.smartcity.mobility.model.Trip;

@Repository
public class MobilityRepository {
  private final Map<String, Line> lines = new HashMap<>();
  private final Map<String, List<Arrival>> arrivalsByStop = new HashMap<>();
  private final BookingJpaRepository bookingRepository;
  private static final List<Arrival> DEFAULT_ARRIVALS = List.of(new Arrival("LINE-42", 10));

  public MobilityRepository(BookingJpaRepository bookingRepository) {
    this.bookingRepository = bookingRepository;
    Stop stopA = new Stop("STOP-A", "Place Centrale", new GeoPoint(48.8566, 2.3522));
    Stop stopB = new Stop("STOP-B", "Gare Ouest", new GeoPoint(48.8572, 2.3411));
    Stop stopC = new Stop("STOP-C", "EcoQuartier", new GeoPoint(48.8591, 2.3370));
    Stop stopD = new Stop("STOP-D", "Campus Rive Gauche", new GeoPoint(48.8458, 2.3550));
    Stop stopE = new Stop("STOP-E", "Parc Nord", new GeoPoint(48.8691, 2.3604));

    registerLine(new Line("LINE-42", "Ligne 42", "bus", "active", List.of(stopA, stopB, stopC)));
    registerLine(new Line("LINE-VELO-1", "Boucle Vélo Express", "bike", "available", List.of(stopC, stopD, stopA)));
    registerLine(new Line("LINE-TRAM-T3", "Tram T3", "tram", "limited", List.of(stopB, stopD, stopE)));
    registerLine(new Line("LINE-METRO-14", "Métro 14", "metro", "active", List.of(stopE, stopA, stopB)));

    arrivalsByStop.put("STOP-A", List.of(
        new Arrival("LINE-42", 4),
        new Arrival("LINE-METRO-14", 2),
        new Arrival("LINE-VELO-1", 9)));
    arrivalsByStop.put("STOP-B", List.of(
        new Arrival("LINE-42", 8),
        new Arrival("LINE-TRAM-T3", 6),
        new Arrival("LINE-METRO-14", 3)));
    arrivalsByStop.put("STOP-C", List.of(
        new Arrival("LINE-VELO-1", 5),
        new Arrival("LINE-42", 11)));
    arrivalsByStop.put("STOP-D", List.of(
        new Arrival("LINE-TRAM-T3", 7),
        new Arrival("LINE-VELO-1", 4)));
    arrivalsByStop.put("STOP-E", List.of(
        new Arrival("LINE-METRO-14", 3),
        new Arrival("LINE-TRAM-T3", 12)));
  }

  private void registerLine(Line line) {
    lines.put(line.id(), line);
  }

  public List<Line> findLines(String mode, String status) {
    return lines.values().stream()
        .filter(line -> mode == null || line.mode().equalsIgnoreCase(mode))
        .filter(line -> status == null || line.status().equalsIgnoreCase(status))
        .toList();
  }

  public Optional<Line> findLine(String lineId) {
    return Optional.ofNullable(lines.get(lineId));
  }

  public Schedule findSchedule(String lineId) {
    Line line = lines.getOrDefault(lineId, lines.values().stream().findFirst()
        .orElseThrow(() -> new IllegalStateException("No mobility lines configured")));
    OffsetDateTime departure = OffsetDateTime.now(ZoneOffset.UTC).plusMinutes(5);
    List<StopTime> stopTimes = buildStopTimes(line, departure);
    Trip trip = new Trip(stopTimes.getFirst().time(), stopTimes.getLast().time(), stopTimes);
    return new Schedule(line.id(), LocalDate.now(), List.of(trip));
  }

  private List<StopTime> buildStopTimes(Line line, OffsetDateTime departure) {
    List<StopTime> stopTimes = new ArrayList<>();
    int offsetMinutes = 0;
    for (Stop stop : line.stops()) {
      stopTimes.add(new StopTime(stop.id(), departure.plusMinutes(offsetMinutes)));
      offsetMinutes += 6;
    }
    return stopTimes;
  }

  public List<Arrival> findArrivals(String stopId) {
    ThreadLocalRandom random = ThreadLocalRandom.current();
    List<Arrival> baseline = arrivalsByStop.getOrDefault(stopId, DEFAULT_ARRIVALS);
    return baseline.stream()
        .map(arrival -> {
          int jitter = random.nextInt(3) - 1; // -1, 0, or +1 minute variance
          int eta = Math.max(1, arrival.etaMinutes() + jitter);
          return new Arrival(arrival.lineId(), eta);
        })
        .toList();
  }

  public Booking saveBooking(Booking booking) {
    BookingEntity saved = bookingRepository.save(BookingEntity.fromBooking(booking));
    return saved.toDomain();
  }

  public Collection<Booking> listBookings() {
    return findBookings(null);
  }

  public List<Booking> findBookings(String userId) {
    List<BookingEntity> entities;
    if (userId == null || userId.isBlank()) {
      entities = bookingRepository.findAllByOrderByDatetimeDesc();
    } else {
      entities = bookingRepository.findByUserIdIgnoreCaseOrderByDatetimeDesc(userId);
    }
    return entities.stream()
        .map(BookingEntity::toDomain)
        .sorted(Comparator.comparing(Booking::datetime).reversed())
        .toList();
  }
}
