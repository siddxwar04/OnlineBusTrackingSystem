package com.bustracking.repository;

import com.bustracking.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * UserRepository — Spring Data JPA handles all SQL automatically.
 *
 * Auto-generated SQL:
 *   findByUsernameAndPassword(...) → SELECT * FROM users WHERE username=? AND password=?
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsernameAndPassword(String username, String password);
}
