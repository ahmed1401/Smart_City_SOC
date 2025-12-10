package com.smartcity.airquality.model;

import jakarta.xml.bind.annotation.XmlAccessType;
import jakarta.xml.bind.annotation.XmlAccessorType;
import jakarta.xml.bind.annotation.XmlElement;
import jakarta.xml.bind.annotation.XmlType;

import java.util.ArrayList;
import java.util.List;

@XmlAccessorType(XmlAccessType.FIELD)
@XmlType(name = "PollutantResponse")
public class PollutantResponse {
  private String zoneCode;
  @XmlElement(name = "pollutants")
  private List<PollutantLevel> pollutants = new ArrayList<>();

  public String getZoneCode() {
    return zoneCode;
  }

  public void setZoneCode(String zoneCode) {
    this.zoneCode = zoneCode;
  }

  public List<PollutantLevel> getPollutants() {
    return pollutants;
  }

  public void setPollutants(List<PollutantLevel> pollutants) {
    this.pollutants = pollutants;
  }
}
