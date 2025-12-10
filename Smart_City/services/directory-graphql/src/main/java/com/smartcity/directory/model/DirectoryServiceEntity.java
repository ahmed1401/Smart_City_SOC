package com.smartcity.directory.model;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "directory_service")
public class DirectoryServiceEntity {

  @Id
  private String id;

  private String name;

  private String category;

  private String description;

  @Column(name = "contact_phone")
  private String contactPhone;

  @Column(name = "contact_email")
  private String contactEmail;

  @Column(name = "contact_url")
  private String contactUrl;

  private String address;

  @Column(name = "latitude", columnDefinition = "NUMERIC(9,6)")
  private Double latitude;

  @Column(name = "longitude", columnDefinition = "NUMERIC(9,6)")
  private Double longitude;

  @Column(name = "related_aqi_zone")
  private String relatedAqiZone;

  @Column(name = "related_aqi_value")
  private Integer relatedAqiValue;

  @Column(name = "related_aqi_category")
  private String relatedAqiCategory;

  @OneToMany(mappedBy = "service", cascade = CascadeType.ALL, orphanRemoval = false)
  @OrderBy("id ASC")
  private List<ServiceHourEntity> hours = new ArrayList<>();

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public String getCategory() {
    return category;
  }

  public void setCategory(String category) {
    this.category = category;
  }

  public String getDescription() {
    return description;
  }

  public void setDescription(String description) {
    this.description = description;
  }

  public String getContactPhone() {
    return contactPhone;
  }

  public void setContactPhone(String contactPhone) {
    this.contactPhone = contactPhone;
  }

  public String getContactEmail() {
    return contactEmail;
  }

  public void setContactEmail(String contactEmail) {
    this.contactEmail = contactEmail;
  }

  public String getContactUrl() {
    return contactUrl;
  }

  public void setContactUrl(String contactUrl) {
    this.contactUrl = contactUrl;
  }

  public String getAddress() {
    return address;
  }

  public void setAddress(String address) {
    this.address = address;
  }

  public Double getLatitude() {
    return latitude;
  }

  public void setLatitude(Double latitude) {
    this.latitude = latitude;
  }

  public Double getLongitude() {
    return longitude;
  }

  public void setLongitude(Double longitude) {
    this.longitude = longitude;
  }

  public String getRelatedAqiZone() {
    return relatedAqiZone;
  }

  public void setRelatedAqiZone(String relatedAqiZone) {
    this.relatedAqiZone = relatedAqiZone;
  }

  public Integer getRelatedAqiValue() {
    return relatedAqiValue;
  }

  public void setRelatedAqiValue(Integer relatedAqiValue) {
    this.relatedAqiValue = relatedAqiValue;
  }

  public String getRelatedAqiCategory() {
    return relatedAqiCategory;
  }

  public void setRelatedAqiCategory(String relatedAqiCategory) {
    this.relatedAqiCategory = relatedAqiCategory;
  }

  public List<ServiceHourEntity> getHours() {
    return hours;
  }

  public void setHours(List<ServiceHourEntity> hours) {
    this.hours = hours;
  }
}
