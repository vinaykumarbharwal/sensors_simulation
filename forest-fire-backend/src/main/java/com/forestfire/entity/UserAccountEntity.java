package com.forestfire.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "forest_users")
public class UserAccountEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 128)
    private String username;

    @Column(nullable = false, length = 256)
    private String passwordHash;

    @Column(nullable = false, length = 64)
    private String role;

    @Column(nullable = false, length = 128)
    private String displayName;

    @Column(length = 64)
    private String assignedZone;

    public UserAccountEntity() {}

    public UserAccountEntity(String username, String passwordHash, String role, String displayName, String assignedZone) {
        this.username = username;
        this.passwordHash = passwordHash;
        this.role = role;
        this.displayName = displayName;
        this.assignedZone = assignedZone;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public String getAssignedZone() { return assignedZone; }
    public void setAssignedZone(String assignedZone) { this.assignedZone = assignedZone; }
}
