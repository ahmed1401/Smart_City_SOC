package com.smartcity.airquality;

import java.util.List;
import java.util.Map;

import com.smartcity.airquality.model.AQIReport;
import com.smartcity.airquality.model.ComparisonResult;
import com.smartcity.airquality.model.PollutantLevel;
import com.smartcity.airquality.model.PollutantResponse;

import jakarta.jws.WebMethod;
import jakarta.jws.WebParam;
import jakarta.jws.WebService;

@WebService(serviceName = "AirQualityService", portName = "AirQualityPort",
    targetNamespace = "http://smartcity.example.com/airquality")
public class AirQualityServiceImpl {
  private static final Map<String, Integer> SAMPLE_AQI = Map.ofEntries(
      Map.entry("TUNIS-CENTRE", 112),
      Map.entry("LAC-2", 74),
      Map.entry("LA-MARSA", 58),
      Map.entry("SIDI-BOU-SAID", 52),
      Map.entry("ARIANA", 88),
      Map.entry("BEN-AROUS", 95)
  );

  private static final Map<String, List<PollutantLevel>> POLLUTANT_PROFILES = Map.ofEntries(
      Map.entry("TUNIS-CENTRE", List.of(
          new PollutantLevel("PM2.5", 38.2, "µg/m3"),
          new PollutantLevel("PM10", 64.0, "µg/m3"),
          new PollutantLevel("NO2", 44.0, "ppb"),
          new PollutantLevel("O3", 56.0, "ppb"),
          new PollutantLevel("SO2", 9.0, "ppb")
      )),
      Map.entry("LAC-2", List.of(
          new PollutantLevel("PM2.5", 24.5, "µg/m3"),
          new PollutantLevel("PM10", 38.0, "µg/m3"),
          new PollutantLevel("NO2", 21.0, "ppb"),
          new PollutantLevel("O3", 62.0, "ppb"),
          new PollutantLevel("SO2", 6.0, "ppb")
      )),
      Map.entry("LA-MARSA", List.of(
          new PollutantLevel("PM2.5", 19.0, "µg/m3"),
          new PollutantLevel("PM10", 32.0, "µg/m3"),
          new PollutantLevel("NO2", 15.0, "ppb"),
          new PollutantLevel("O3", 70.0, "ppb"),
          new PollutantLevel("SO2", 5.0, "ppb")
      )),
      Map.entry("SIDI-BOU-SAID", List.of(
          new PollutantLevel("PM2.5", 17.3, "µg/m3"),
          new PollutantLevel("PM10", 29.0, "µg/m3"),
          new PollutantLevel("NO2", 12.0, "ppb"),
          new PollutantLevel("O3", 72.0, "ppb"),
          new PollutantLevel("SO2", 4.0, "ppb")
      )),
      Map.entry("ARIANA", List.of(
          new PollutantLevel("PM2.5", 30.4, "µg/m3"),
          new PollutantLevel("PM10", 52.0, "µg/m3"),
          new PollutantLevel("NO2", 33.0, "ppb"),
          new PollutantLevel("O3", 60.0, "ppb"),
          new PollutantLevel("SO2", 7.5, "ppb")
      )),
      Map.entry("BEN-AROUS", List.of(
          new PollutantLevel("PM2.5", 34.1, "µg/m3"),
          new PollutantLevel("PM10", 58.0, "µg/m3"),
          new PollutantLevel("NO2", 39.0, "ppb"),
          new PollutantLevel("O3", 55.0, "ppb"),
          new PollutantLevel("SO2", 10.0, "ppb")
      ))
  );

  private static final List<PollutantLevel> DEFAULT_PROFILE = List.of(
      new PollutantLevel("PM2.5", 22.0, "µg/m3"),
      new PollutantLevel("PM10", 36.0, "µg/m3"),
      new PollutantLevel("NO2", 18.0, "ppb"),
      new PollutantLevel("O3", 65.0, "ppb"),
      new PollutantLevel("SO2", 5.0, "ppb")
  );

  @WebMethod(operationName = "GetAQI")
  public AQIReport getAQI(@WebParam(name = "zoneCode") String zoneCode) {
    AQIReport report = new AQIReport();
    String normalizedZone = normalizeZone(zoneCode);
    int value = SAMPLE_AQI.getOrDefault(normalizedZone, 68);
    report.setZoneCode(normalizedZone);
    report.setValue(value);
    report.setCategory(value >= 120 ? "Très élevé" : value >= 90 ? "Élevé" : value >= 60 ? "Modéré" : "Bon");
    report.setTrend(value >= 100 ? "hausse" : value <= 55 ? "baisse" : "stable");
    report.setRecommendation(recommendationForValue(value));
    return report;
  }

  @WebMethod(operationName = "GetPollutants")
  public PollutantResponse getPollutants(@WebParam(name = "zoneCode") String zoneCode) {
    String normalizedZone = normalizeZone(zoneCode);
    PollutantResponse response = new PollutantResponse();
    response.setZoneCode(normalizedZone);
    List<PollutantLevel> profile = POLLUTANT_PROFILES.getOrDefault(normalizedZone, DEFAULT_PROFILE);
    response.setPollutants(profile);
    return response;
  }

  @WebMethod(operationName = "CompareZones")
  public ComparisonResult compareZones(@WebParam(name = "zoneA") String zoneA,
                                       @WebParam(name = "zoneB") String zoneB) {
    ComparisonResult result = new ComparisonResult();
    String normalizedA = normalizeZone(zoneA);
    String normalizedB = normalizeZone(zoneB);
    int valueA = SAMPLE_AQI.getOrDefault(normalizedA, 68);
    int valueB = SAMPLE_AQI.getOrDefault(normalizedB, 68);
    result.setDeltaAQI(Math.abs(valueA - valueB));
    result.setHigherZone(valueA >= valueB ? normalizedA : normalizedB);
    result.setDominantPollutant("PM2.5");
    return result;
  }

  private static String normalizeZone(String zoneCode) {
    return zoneCode == null || zoneCode.isBlank() ? "TUNIS-CENTRE" : zoneCode.toUpperCase();
  }

  private static String recommendationForValue(int value) {
    if (value >= 120) {
      return "Limiter les déplacements motorisés sur Tunis centre et privilégier le métro léger.";
    }
    if (value >= 90) {
      return "Réduire les activités industrielles autour de Ben Arous et porter un masque filtrant.";
    }
    if (value >= 70) {
      return "Surveiller les populations sensibles autour du Lac de Tunis et aérer aux heures fraîches.";
    }
    return "Conditions favorables sur le Grand Tunis, activités extérieures autorisées.";
  }
}
