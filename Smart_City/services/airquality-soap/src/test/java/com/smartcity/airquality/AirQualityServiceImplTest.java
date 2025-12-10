package com.smartcity.airquality;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class AirQualityServiceImplTest {
  private final AirQualityServiceImpl service = new AirQualityServiceImpl();

  @Test
  void returnsReportForZone() {
    var report = service.getAQI("CENTRE");
    assertEquals("CENTRE", report.getZoneCode());
  }
}
