package com.forestfire.controller;

import com.forestfire.model.AuthLoginRequest;
import com.forestfire.model.AuthLoginResponse;
import com.forestfire.service.JwtService;
import com.forestfire.service.UserAccountService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserAccountService userAccountService;

    public AuthController(AuthenticationManager authenticationManager, JwtService jwtService, UserAccountService userAccountService) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.userAccountService = userAccountService;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthLoginResponse> login(@RequestBody AuthLoginRequest request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
            );

            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            String token = jwtService.generateToken(userDetails);
                String displayName = userAccountService.getProfile(userDetails.getUsername()).getDisplayName();
            String role = userDetails.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .findFirst()
                    .map(authority -> authority.startsWith("ROLE_") ? authority.substring(5) : authority)
                    .orElse("UNKNOWN");

            String assignedZone = userAccountService.getAssignedZone(userDetails.getUsername());

            return ResponseEntity.ok(new AuthLoginResponse(
                    token,
                    "Bearer",
                    userDetails.getUsername(),
                    displayName,
                    role,
                    jwtService.getJwtExpirationMs(),
                    assignedZone
            ));
        } catch (BadCredentialsException ex) {
            throw new IllegalArgumentException("Invalid username or password");
        }
    }
}
