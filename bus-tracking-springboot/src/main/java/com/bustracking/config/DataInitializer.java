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
 * After first run you will see these rows in your `users` table:
 *   username=admin,  password=admin,  role=admin
 *   username=admin,  password=admin1, role=admin   ← second password variant
 *   username=driver, password=driver, role=driver
 *   username=driver, password=driver1,role=driver  ← second password variant
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
                userRepository.save(new User(null, "admin",  "admin",   "admin"));
                userRepository.save(new User(null, "admin1", "admin1",  "admin"));  // password2 variant
                userRepository.save(new User(null, "driver", "driver",  "driver"));
                userRepository.save(new User(null, "driver1","driver1", "driver")); // password2 variant
                System.out.println("✅ Default users seeded into MySQL.");
            } else {
                System.out.println("✅ Users already exist in MySQL — skipping seed.");
            }
        };
    }
}
