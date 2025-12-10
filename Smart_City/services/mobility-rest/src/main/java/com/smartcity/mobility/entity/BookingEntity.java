package com.smartcity.mobility.entity;

import java.time.OffsetDateTime;

import com.smartcity.mobility.model.Booking;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "bookings")
public class BookingEntity {
  @Id
  private String id;

  @Column(name = "line_id", nullable = false)
  private String lineId;

  @Column(name = "stop_from", nullable = false)
  private String stopFrom;

  @Column(name = "stop_to", nullable = false)
  private String stopTo;

  @Column(nullable = false)
  private OffsetDateTime datetime;

  @Column(name = "user_id", nullable = false)
  private String userId;

  @Column(nullable = false)
  private String status;

  public BookingEntity() {
  }

  public BookingEntity(String id, String lineId, String stopFrom, String stopTo, OffsetDateTime datetime, String userId, String status) {
    this.id = id;
    this.lineId = lineId;
    this.stopFrom = stopFrom;
    this.stopTo = stopTo;
    this.datetime = datetime;
    this.userId = userId;
    this.status = status;
  }

  public static BookingEntity fromBooking(Booking booking) {
    return new BookingEntity(
        booking.id(),
        booking.lineId(),
        booking.stopFrom(),
        booking.stopTo(),
        booking.datetime(),
        booking.userId(),
        booking.status()
    );
  }

  public Booking toDomain() {
    return new Booking(id, lineId, stopFrom, stopTo, datetime, userId, status);
  }

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public String getLineId() {
    return lineId;
  }

  public void setLineId(String lineId) {
    this.lineId = lineId;
  }

  public String getStopFrom() {
    return stopFrom;
  }

  public void setStopFrom(String stopFrom) {
    this.stopFrom = stopFrom;
  }

  public String getStopTo() {
    return stopTo;
  }

  public void setStopTo(String stopTo) {
    this.stopTo = stopTo;
  }

  public OffsetDateTime getDatetime() {
    return datetime;
  }

  public void setDatetime(OffsetDateTime datetime) {
    this.datetime = datetime;
  }

  public String getUserId() {
    return userId;
  }

  public void setUserId(String userId) {
    this.userId = userId;
  }

  public String getStatus() {
    return status;
  }

  public void setStatus(String status) {
    this.status = status;
  }
}
