package com.bustracking.controller;

import com.bustracking.model.BusInfo;
import com.bustracking.service.BusService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/data")
public class BusController {

    @Autowired
    private BusService busService;

    // ── List all registered buses ──────────────────────────────────────────
    @GetMapping("/buses")
    public ResponseEntity<List<String>> listBuses() {
        return ResponseEntity.ok(busService.getAllBusIds());
    }

    // ── IoT push — receives live sensor data ───────────────────────────────
    @GetMapping("/send")
    public ResponseEntity<Map<String, Object>> receiveData(
            @RequestParam(required = false, defaultValue = "BUS001") String busId,
            @RequestParam(required = false, defaultValue = "0")       String temp,
            @RequestParam(required = false, defaultValue = "0")       String oil,
            @RequestParam(required = false, defaultValue = "0")       String ticket,
            @RequestParam(required = false, defaultValue = "0.0")     String latitude,
            @RequestParam(required = false, defaultValue = "0.0")     String longitude,
            @RequestParam(required = false, defaultValue = "0")       String seatCount,
            @RequestParam(required = false, defaultValue = "0")       String speed) {

        busService.updateBusData(busId, temp, oil, ticket,
                                 latitude, longitude, seatCount, speed);
        return ResponseEntity.ok(Map.of(
            "success", true,
            "busId",   busId,
            "message", "Data updated for " + busId
        ));
    }

    // ── Dashboard polls this every 5s ──────────────────────────────────────
    @GetMapping("/view")
    public ResponseEntity<BusInfo> viewData(
            @RequestParam(required = false, defaultValue = "BUS001") String busId) {
        return ResponseEntity.ok(busService.getBusInfo(busId));
    }

    // ── Trip management ────────────────────────────────────────────────────
    @PostMapping("/trip/start")
    public ResponseEntity<Map<String, Object>> startTrip(
            @RequestParam(required = false, defaultValue = "BUS001") String busId) {
        busService.startTrip(busId);
        return ResponseEntity.ok(Map.of(
            "success",   true,
            "busId",     busId,
            "startTime", busService.getTripStartTime(busId)
        ));
    }

    @PostMapping("/trip/stop")
    public ResponseEntity<Map<String, Object>> stopTrip(
            @RequestParam(required = false, defaultValue = "BUS001") String busId) {
        busService.stopTrip(busId);
        return ResponseEntity.ok(Map.of(
            "success",  true,
            "busId",    busId,
            "logCount", busService.getTripLogCount(busId)
        ));
    }

    @GetMapping("/trip/status")
    public ResponseEntity<Map<String, Object>> tripStatus(
            @RequestParam(required = false, defaultValue = "BUS001") String busId) {
        return ResponseEntity.ok(Map.of(
            "busId",     busId,
            "active",    busService.isTripActive(busId),
            "startTime", busService.getTripStartTime(busId) != null ? busService.getTripStartTime(busId) : "",
            "endTime",   busService.getTripEndTime(busId)   != null ? busService.getTripEndTime(busId)   : "",
            "logCount",  busService.getTripLogCount(busId)
        ));
    }

    // ── CSV export (reads from MySQL trip_logs table) ──────────────────────
    @GetMapping("/export")
    public ResponseEntity<byte[]> exportCsv(
            @RequestParam(required = false, defaultValue = "BUS001") String busId) {
        String csv   = busService.exportCsv(busId);
        byte[] bytes = csv.getBytes(StandardCharsets.UTF_8);
        HttpHeaders h = new HttpHeaders();
        h.setContentType(MediaType.parseMediaType("text/csv; charset=UTF-8"));
        h.setContentDispositionFormData("attachment", busId + "-trip-report.csv");
        h.setContentLength(bytes.length);
        return ResponseEntity.ok().headers(h).body(bytes);
    }
}
