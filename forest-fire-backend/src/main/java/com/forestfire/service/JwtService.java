package com.forestfire.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.util.Collection;
import java.util.Date;
import java.util.List;

@Service
public class JwtService {

    private final SecretKey signingKey;
    private final long jwtExpirationMs;

    public JwtService(@Value("${app.security.jwt-secret}") String jwtSecret,
                      @Value("${app.security.jwt-expiration-ms:86400000}") long jwtExpirationMs) {
        this.signingKey = Keys.hmacShaKeyFor(resolveSecret(jwtSecret));
        this.jwtExpirationMs = jwtExpirationMs;
    }

    public String generateToken(UserDetails userDetails) {
        List<String> roles = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .toList();

        Instant now = Instant.now();
        Instant expiresAt = now.plusMillis(jwtExpirationMs);

        return Jwts.builder()
                .subject(userDetails.getUsername())
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiresAt))
                .claim("roles", roles)
                .signWith(signingKey)
                .compact();
    }

    public String extractUsername(String token) {
        return extractAllClaims(token).getSubject();
    }

    public List<String> extractRoles(String token) {
        Object value = extractAllClaims(token).get("roles");
        if (value instanceof Collection<?> collection) {
            return collection.stream().map(String::valueOf).toList();
        }
        return List.of();
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        String username = extractUsername(token);
        return username.equals(userDetails.getUsername()) && !isTokenExpired(token);
    }

    public long getJwtExpirationMs() {
        return jwtExpirationMs;
    }

    private boolean isTokenExpired(String token) {
        Date expiration = extractAllClaims(token).getExpiration();
        return expiration.before(new Date());
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private byte[] resolveSecret(String jwtSecret) {
        try {
            return Decoders.BASE64.decode(jwtSecret);
        } catch (RuntimeException ignore) {
            return jwtSecret.getBytes();
        }
    }
}
