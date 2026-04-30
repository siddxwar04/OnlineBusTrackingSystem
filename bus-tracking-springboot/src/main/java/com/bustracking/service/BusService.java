package com.bustracking.service;

import com.bustracking.model.BusInfo;
import com.bustracking.model.TripLog;
import com.bustracking.repository.TripLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * BusService
 *
 * In-memory:  current live bus state (temp, oil, GPS, speed, etc.)
 *             → fast reads for the 5s dashboard poll
 *
 * MySQL:      trip logs → saved to `trip_logs` table via TripLogRepository
 *             → persisted across restarts, exported as CSV
 */
@Service
public class BusService {

    private static final int    TOTAL_SEATS = 60;
    private static final String UPI_ID      = ""; // set your UPI ID here
    private static final DateTimeFormatter FMT =
        DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    @Autowired
    private TripLogRepository tripLogRepository;

    // ── In-memory state per bus ────────────────────────────────────────────
    private static class BusState {
        volatile String temp      = null;
        volatile String oil       = null;
        volatile String ticket    = null;
        volatile String latitude  = null;
        volatile String longitude = null;
        volatile String seatCount = null;
        volatile String speed     = null;
        volatile boolean tripActive    = false;
        volatile String  tripStartTime = null;
        volatile String  tripEndTime   = null;
    }

    private final Map<String, BusState> buses = new ConcurrentHashMap<>();

    public BusService() {
        buses.put("BUS001", new BusState());
        buses.put("BUS002", new BusState());
        buses.put("BUS003", new BusState());
    }

    private BusState getOrCreate(String busId) {
        return buses.computeIfAbsent(busId, k -> new BusState());
    }

    public List<String> getAllBusIds() {
        List<String> ids = new ArrayList<>(buses.keySet());
        Collections.sort(ids);
        return ids;
    }

    // ── Receive sensor update from IoT device ──────────────────────────────
    @Transactional
    public void updateBusData(String busId, String temp, String oil, String ticket,
                              String latitude, String longitude,
                              String seatCount, String speed) {
        BusState s = getOrCreate(busId);
        s.temp      = temp;
        s.oil       = "1".equals(oil) ? "1" : "45";
        s.ticket    = ticket;
        s.speed     = speed;
        s.seatCount = seatCount;
        s.latitude  = String.valueOf(convertNMEA(latitude,  true));
        s.longitude = String.valueOf(convertNMEA(longitude, false));

        // If a trip is active → save this data point to MySQL
        if (s.tripActive) {
            TripLog log = new TripLog(
                null,
                busId,
                LocalDateTime.now().format(FMT),
                temp,
                s.oil,
                s.latitude,
                s.longitude,
                seatCount,
                ticket,
                speed
            );
            tripLogRepository.save(log); // INSERT INTO trip_logs ...
        }
    }

    // ── Trip control ───────────────────────────────────────────────────────
    @Transactional
    public void startTrip(String busId) {
        // Delete previous trip logs for this bus from MySQL
        tripLogRepository.deleteByBusId(busId);
        BusState s = getOrCreate(busId);
        s.tripStartTime = LocalDateTime.now().format(FMT);
        s.tripEndTime   = null;
        s.tripActive    = true;
    }

    public void stopTrip(String busId) {
        BusState s = getOrCreate(busId);
        s.tripActive  = false;
        s.tripEndTime = LocalDateTime.now().format(FMT);
    }

    public boolean isTripActive(String busId)     { return getOrCreate(busId).tripActive;    }
    public String  getTripStartTime(String busId)  { return getOrCreate(busId).tripStartTime; }
    public String  getTripEndTime(String busId)    { return getOrCreate(busId).tripEndTime;   }

    // Count from MySQL
    public int getTripLogCount(String busId) {
        return tripLogRepository.countByBusId(busId);
    }

    // ── Build BusInfo response for dashboard ───────────────────────────────
    public BusInfo getBusInfo(String busId) {
        BusState s = getOrCreate(busId);

        String fTemp   = (s.temp   != null ? s.temp   : "0") + " °C";
        String fOil    = (s.oil    != null ? s.oil    : "100");
        String fTicket = "₹" + (s.ticket != null ? s.ticket : "0");
        String fSpeed  = (s.speed  != null ? s.speed  : "100") + " km/h";
        String fLat    = (s.latitude  != null ? s.latitude  : "0.0");
        String fLng    = (s.longitude != null ? s.longitude : "0.0");

        int availableSeats = 0;
        try {
            if (s.seatCount != null && !s.seatCount.isBlank())
                availableSeats = Integer.parseInt(s.seatCount);
        } catch (NumberFormatException ignored) {}
        String fSeats = availableSeats + "(" + TOTAL_SEATS + ")";

        String qrUrl   = "/qr-payment.jpeg";
        String upiLink = "";
        try {
            upiLink = "upi://pay?pa=" + UPI_ID + "&pn=BusTicket&am=" +
                      (s.ticket != null ? s.ticket : "0") + "&cu=INR";
        } catch (Exception ignored) {}

        return new BusInfo(
            fTemp, fOil, fTicket, fLat, fLng, fSeats,
            "", qrUrl, upiLink,
            fSpeed, s.tripActive, s.tripStartTime,
            getTripLogCount(busId), availableSeats, TOTAL_SEATS
        );
    }

    // ── CSV export — reads trip_logs from MySQL ────────────────────────────
    public String exportCsv(String busId) {
        List<TripLog> logs = tripLogRepository.findByBusIdOrderByTimestampAsc(busId);
        StringBuilder sb = new StringBuilder();
        sb.append("Timestamp,Temperature (°C),Oil Status,Latitude,Longitude,Seats Available,Ticket (₹),Speed (km/h)\n");
        for (TripLog log : logs) {
            sb.append(log.getTimestamp()).append(",")
              .append(log.getTemp()).append(",")
              .append("1".equals(log.getOil()) ? "OK" : "LOW").append(",")
              .append(log.getLatitude()).append(",")
              .append(log.getLongitude()).append(",")
              .append(log.getSeatCount()).append(",")
              .append(log.getTicket()).append(",")
              .append(log.getSpeed()).append("\n");
        }
        return sb.toString();
    }

    // ── NMEA → Decimal degrees ─────────────────────────────────────────────
    private double convertNMEA(String nmea, boolean isLatitude) {
        if (nmea == null || nmea.isBlank()) return 0.0;
        try {
            int    degLen  = isLatitude ? 2 : 3;
            int    degrees = Integer.parseInt(nmea.substring(0, degLen));
            double minutes = Double.parseDouble(nmea.substring(degLen));
            return Math.round((degrees + minutes / 60.0) * 1_000_000.0) / 1_000_000.0;
        } catch (Exception e) { return 0.0; }
    }
}
