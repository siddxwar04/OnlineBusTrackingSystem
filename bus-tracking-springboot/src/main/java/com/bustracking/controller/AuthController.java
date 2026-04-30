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
 *   - Checks password1 field against the DB (username + password1)
 *   - If that fails, checks password2 field (username + password2)
 *   - Both passwords are stored as separate rows in the users table
 *     with the same username, so a single findByUsernameAndPassword
 *     call handles either case cleanly.
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

        // Require at least one password field
        boolean hasP1 = password1 != null && !password1.isBlank();
        boolean hasP2 = password2 != null && !password2.isBlank();

        if (!hasP1 && !hasP2) {
            return ResponseEntity.status(401).body(Map.of(
                "success", false,
                "message", "Password is required"
            ));
        }

        // Try password1 first, then password2.
        // Each is stored as a separate row in the users table under the same username,
        // so findByUsernameAndPassword handles both without any extra logic.
        Optional<User> userOpt = hasP1
            ? userRepository.findByUsernameAndPassword(username, password1)
            : Optional.empty();

        if (userOpt.isEmpty() && hasP2) {
            userOpt = userRepository.findByUsernameAndPassword(username, password2);
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
