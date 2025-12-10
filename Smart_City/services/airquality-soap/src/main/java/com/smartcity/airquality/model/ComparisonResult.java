package com.smartcity.airquality.model;

import jakarta.xml.bind.annotation.XmlAccessType;
import jakarta.xml.bind.annotation.XmlAccessorType;
import jakarta.xml.bind.annotation.XmlType;

@XmlAccessorType(XmlAccessType.FIELD)
@XmlType(name = "ComparisonResult")
public class ComparisonResult {
  private int deltaAQI;
  private String higherZone;
  private String dominantPollutant;

  public int getDeltaAQI() {
    return deltaAQI;
  }

  public void setDeltaAQI(int deltaAQI) {
    this.deltaAQI = deltaAQI;
  }

  public String getHigherZone() {
    return higherZone;
  }

  public void setHigherZone(String higherZone) {
    this.higherZone = higherZone;
  }

  public String getDominantPollutant() {
    return dominantPollutant;
  }

  public void setDominantPollutant(String dominantPollutant) {
    this.dominantPollutant = dominantPollutant;
  }
}
