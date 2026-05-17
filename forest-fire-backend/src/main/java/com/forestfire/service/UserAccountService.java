package com.forestfire.service;

import com.forestfire.model.AccountPasswordChangeRequest;
import com.forestfire.model.AccountProfileResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class UserAccountService implements UserDetailsService {

    private final PasswordEncoder passwordEncoder;
    private final Map<String, AccountRecord> accounts = new ConcurrentHashMap<>();

    public UserAccountService(PasswordEncoder passwordEncoder,
                              @Value("${app.security.employee.username:employee}") String employeeUsername,
                              @Value("${app.security.employee.password:employee123}") String employeePassword,
                              @Value("${app.security.head.username:head}") String headUsername,
                              @Value("${app.security.head.password:head123}") String headPassword) {
        this.passwordEncoder = passwordEncoder;
        registerAccount(employeeUsername, employeePassword, "EMPLOYEE", defaultDisplayName(employeeUsername, "Field operator"), "Central India");
        registerAccount(headUsername, headPassword, "HEAD", defaultDisplayName(headUsername, "District head"), null);
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        AccountRecord account = getAccount(username);
        return User.builder()
                .username(account.username())
                .password(account.passwordHash())
                .roles(account.role())
                .build();
    }

    public AccountProfileResponse getProfile(String username) {
        AccountRecord account = getAccount(username);
        return new AccountProfileResponse(account.username(), account.displayName(), account.role());
    }

    public AccountProfileResponse updateDisplayName(String username, String displayName) {
        if (!StringUtils.hasText(displayName)) {
            throw new IllegalArgumentException("displayName is required");
        }

        AccountRecord account = getAccount(username);
        account.setDisplayName(displayName.trim());
        return getProfile(username);
    }

    public AccountProfileResponse changePassword(String username, AccountPasswordChangeRequest request) {
        if (request == null || !StringUtils.hasText(request.getCurrentPassword()) || !StringUtils.hasText(request.getNewPassword())) {
            throw new IllegalArgumentException("currentPassword and newPassword are required");
        }

        AccountRecord account = getAccount(username);
        if (!passwordEncoder.matches(request.getCurrentPassword(), account.passwordHash())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }

        account.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        return getProfile(username);
    }

    public String getRole(String username) {
        return getAccount(username).role();
    }

    public String getAssignedZone(String username) {
        return getAccount(username).assignedZone();
    }

    public void registerAccount(String username, String password, String role, String displayName, String assignedZone) {
        accounts.put(normalize(username), new AccountRecord(username, passwordEncoder.encode(password), role, displayName, assignedZone));
    }

    private AccountRecord getAccount(String username) {
        AccountRecord account = accounts.get(normalize(username));
        if (account == null) {
            throw new UsernameNotFoundException("Account not found: " + username);
        }
        return account;
    }

    private String normalize(String username) {
        return username == null ? "" : username.toLowerCase(Locale.ROOT).trim();
    }

    private String defaultDisplayName(String username, String fallback) {
        return StringUtils.hasText(username) ? username.trim() : fallback;
    }

    private static final class AccountRecord {
        private final String username;
        private volatile String passwordHash;
        private final String role;
        private volatile String displayName;
        private final String assignedZone;

        private AccountRecord(String username, String passwordHash, String role, String displayName, String assignedZone) {
            this.username = username;
            this.passwordHash = passwordHash;
            this.role = role;
            this.displayName = displayName;
            this.assignedZone = assignedZone;
        }

        private String username() {
            return username;
        }

        private String passwordHash() {
            return passwordHash;
        }

        private void setPasswordHash(String passwordHash) {
            this.passwordHash = passwordHash;
        }

        private String role() {
            return role;
        }

        private String displayName() {
            return displayName;
        }

        private void setDisplayName(String displayName) {
            this.displayName = displayName;
        }

        private String assignedZone() {
            return assignedZone;
        }
    }
}