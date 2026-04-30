package com.bustracking.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * User entity — maps to the `users` table in MySQL.
 * Table is auto-created by Hibernate on first run.
 *
 * Table: users
 * Columns: id, username, password, role
 */
@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String username;

    @Column(nullable = false, length = 100)
    private String password;

    // Role: "admin" or "driver"
    @Column(nullable = false, length = 20)
    private String role;
}
