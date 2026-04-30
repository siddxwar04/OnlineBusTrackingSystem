package com.bustracking.config;

import com.bustracking.model.User;
import com.bustracking.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * DataInitializer
 *
 * Runs once when the application starts.
 * Seeds default admin and driver accounts into MySQL
 * if they don't already exist.
 *
 * Each user gets two rows — same username, different passwords —
 * matching the two-password login UI:
 *
 *   username=admin,  password=admin,   role=admin   ← Password 1
 *   username=admin,  password=admin1,  role=admin   ← Password 2
 *   username=driver, password=driver,  role=driver  ← Password 1
 *   username=driver, password=driver1, role=driver  ← Password 2
 *
 * Note: username column has no UNIQUE constraint so duplicate
 * usernames with different passwords are allowed.
 *
 * You can add more users directly in MySQL:
 *   INSERT INTO users (username, password, role) VALUES ('driver2','pass123','driver');
 */
@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner seedUsers(UserRepository userRepository) {
        return args -> {
            // Only insert if table is empty
            if (userRepository.count() == 0) {
                // admin: password1=admin, password2=admin1
                userRepository.save(new User(null, "admin",  "admin",   "admin"));
                userRepository.save(new User(null, "admin",  "admin1",  "admin"));
                // driver: password1=driver, password2=driver1
                userRepository.save(new User(null, "driver", "driver",  "driver"));
                userRepository.save(new User(null, "driver", "driver1", "driver"));
                System.out.println("✅ Default users seeded into MySQL.");
            } else {
                System.out.println("✅ Users already exist in MySQL — skipping seed.");
            }
        };
    }
}
