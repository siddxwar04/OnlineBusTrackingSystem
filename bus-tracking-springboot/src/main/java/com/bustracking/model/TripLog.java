package com.bustracking.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * TripLog entity — maps to the `trip_logs` table in MySQL.
 * Each row = one sensor reading captured during an active trip.
 *
 * Table: trip_logs
 * Columns: id, bus_id, timestamp, temp, oil, latitude, longitude,
 *          seat_count, ticket, speed
 */
@Entity
@Table(name = "trip_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TripLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "bus_id", nullable = false, length = 20)
    private String busId;

    @Column(name = "timestamp", nullable = false, length = 25)
    private String timestamp;

    @Column(length = 10)
    private String temp;

    @Column(length = 5)
    private String oil;

    @Column(length = 20)
    private String latitude;

    @Column(length = 20)
    private String longitude;

    @Column(name = "seat_count", length = 5)
    private String seatCount;

    @Column(length = 10)
    private String ticket;

    @Column(length = 10)
    private String speed;
}
