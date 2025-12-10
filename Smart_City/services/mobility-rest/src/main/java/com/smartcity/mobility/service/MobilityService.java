package com.smartcity.mobility.service;

import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.smartcity.mobility.model.Arrival;
import com.smartcity.mobility.model.Booking;
import com.smartcity.mobility.model.BookingRequest;
import com.smartcity.mobility.model.Line;
import com.smartcity.mobility.model.Schedule;
import com.smartcity.mobility.repository.MobilityRepository;

@Service
public class MobilityService {
  private final MobilityRepository repository;

  public MobilityService(MobilityRepository repository) {
    this.repository = repository;
  }

  public List<Line> listLines(String mode, String status) {
    return repository.findLines(mode, status);
  }

  public Optional<Line> getLine(String id) {
    return repository.findLine(id);
  }

  public Schedule getSchedule(String lineId) {
    return repository.findSchedule(lineId);
  }

  public List<Arrival> getArrivals(String stopId) {
    return repository.findArrivals(stopId);
  }

  public Booking createBooking(BookingRequest request) {
    Booking booking = new Booking(
        UUID.randomUUID().toString(),
        request.lineId(),
        request.stopFrom(),
        request.stopTo(),
        request.datetime() == null ? OffsetDateTime.now() : request.datetime(),
        request.userId(),
        "confirmed"
    );
    return repository.saveBooking(booking);
  }

  public Collection<Booking> listBookings(String userId) {
    return repository.findBookings(userId);
  }
}
