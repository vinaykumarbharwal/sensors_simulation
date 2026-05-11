package com.forestfire.model;

public class AuthLoginResponse {

    private String token;
    private String tokenType;
    private String username;
    private String displayName;
    private String role;
    private long expiresInMs;

    public AuthLoginResponse() {
    }

    public AuthLoginResponse(String token, String tokenType, String username, String displayName, String role, long expiresInMs) {
        this.token = token;
        this.tokenType = tokenType;
        this.username = username;
        this.displayName = displayName;
        this.role = role;
        this.expiresInMs = expiresInMs;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getTokenType() { return tokenType; }
    public void setTokenType(String tokenType) { this.tokenType = tokenType; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public long getExpiresInMs() { return expiresInMs; }
    public void setExpiresInMs(long expiresInMs) { this.expiresInMs = expiresInMs; }
}
