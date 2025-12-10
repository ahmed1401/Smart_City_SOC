package com.smartcity.mobility.controller;

import java.util.Collection;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.smartcity.mobility.model.Arrival;
import com.smartcity.mobility.model.Booking;
import com.smartcity.mobility.model.BookingRequest;
import com.smartcity.mobility.model.Line;
import com.smartcity.mobility.model.Schedule;
import com.smartcity.mobility.service.MobilityService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api")
public class MobilityController {
  private final MobilityService service;

  public MobilityController(MobilityService service) {
    this.service = service;
  }

  @GetMapping("/lines")
  public List<Line> listLines(@RequestParam(required = false) String mode,
                              @RequestParam(required = false) String status) {
    return service.listLines(mode, status);
  }

  @GetMapping("/lines/{id}")
  public Line getLine(@PathVariable String id) {
    return service.getLine(id).orElseThrow(() -> new ResourceNotFoundException("Line %s".formatted(id)));
  }

  @GetMapping("/lines/{id}/schedule")
  public Schedule getSchedule(@PathVariable String id) {
    return service.getSchedule(id);
  }

  @GetMapping("/stops/{stopId}/arrivals")
  public List<Arrival> getArrivals(@PathVariable String stopId) {
    return service.getArrivals(stopId);
  }

  @PostMapping("/bookings")
  @ResponseStatus(HttpStatus.CREATED)
  public Booking createBooking(@RequestBody @Valid BookingRequest request) {
    return service.createBooking(request);
  }

  @GetMapping("/bookings")
  public Collection<Booking> listBookings(@RequestParam(required = false) String userId) {
    return service.listBookings(userId);
  }
}
