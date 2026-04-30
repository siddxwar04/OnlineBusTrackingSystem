package com.bustracking.controller;

import com.bustracking.model.User;
import com.bustracking.repository.UserRepository;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

/**
 * AuthController
 *
 * POST /data/login  — validates credentials against MySQL `users` table
 * GET  /data/logout — invalidates the session
 *
 * Login logic:
 *   - Tries password1 field first (username + password1)
 *   - Falls back to password2 field (username + password2)
 *   - Returns { success, role, username } on success
 *   - Returns 401 on failure
 */
@RestController
@RequestMapping("/data")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public ResponseEntity<Map<String, String>> index() {
        return ResponseEntity.ok(Map.of("message", "Online Bus Tracking System"));
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(
            @RequestParam String username,
            @RequestParam(required = false) String password1,
            @RequestParam(required = false) String password2,
            HttpSession session) {

        // Try password1 first, then password2
        String passwordAttempt = (password1 != null && !password1.isBlank()) ? password1 : password2;

        if (passwordAttempt == null || passwordAttempt.isBlank()) {
            return ResponseEntity.status(401).body(Map.of(
                "success", false,
                "message", "Password is required"
            ));
        }

        // Query MySQL users table
        Optional<User> userOpt = userRepository.findByUsernameAndPassword(username, passwordAttempt);

        // Also try by username only (to support both password fields with same username)
        if (userOpt.isEmpty()) {
            Optional<User> byName = userRepository.findByUsername(username);
            if (byName.isPresent()) {
                User u = byName.get();
                // Check if either password matches this user's stored password
                // For the two-password system we store two separate rows per role
                // so try the second password as well
                String altPassword = (password1 != null && password1.equals(passwordAttempt)) ? password2 : password1;
                if (altPassword != null && !altPassword.isBlank()) {
                    userOpt = userRepository.findByUsernameAndPassword(username, altPassword);
                }
            }
        }

        if (userOpt.isPresent()) {
            User user = userOpt.get();
            session.setAttribute("loggedIn", true);
            session.setAttribute("role",     user.getRole());
            session.setAttribute("username", user.getUsername());
            return ResponseEntity.ok(Map.of(
                "success",  true,
                "message",  "Login successful",
                "role",     user.getRole(),
                "username", user.getUsername()
            ));
        }

        return ResponseEntity.status(401).body(Map.of(
            "success", false,
            "message", "Invalid username or password"
        ));
    }

    @GetMapping("/logout")
    public ResponseEntity<Map<String, Object>> logout(HttpSession session) {
        session.invalidate();
        return ResponseEntity.ok(Map.of("success", true, "message", "Logged out"));
    }
}
