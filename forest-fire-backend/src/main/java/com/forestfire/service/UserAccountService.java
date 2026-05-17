package com.forestfire.service;

import com.forestfire.dao.UserAccountRepository;
import com.forestfire.entity.UserAccountEntity;
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

@Service
public class UserAccountService implements UserDetailsService {

    private final PasswordEncoder passwordEncoder;
    private final UserAccountRepository userAccountRepository;

    public UserAccountService(PasswordEncoder passwordEncoder,
                              UserAccountRepository userAccountRepository,
                              @Value("${app.security.employee.username:employee}") String employeeUsername,
                              @Value("${app.security.employee.password:employee123}") String employeePassword,
                              @Value("${app.security.head.username:head}") String headUsername,
                              @Value("${app.security.head.password:head123}") String headPassword) {
        this.passwordEncoder = passwordEncoder;
        this.userAccountRepository = userAccountRepository;

        // Auto-seed default accounts on start if they don't already exist in database
        if (!userAccountRepository.existsByUsernameIgnoreCase(employeeUsername)) {
            registerAccount(employeeUsername, employeePassword, "EMPLOYEE", defaultDisplayName(employeeUsername, "Field operator"), "Central India");
        }
        if (!userAccountRepository.existsByUsernameIgnoreCase(headUsername)) {
            registerAccount(headUsername, headPassword, "HEAD", defaultDisplayName(headUsername, "District head"), null);
        }
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        UserAccountEntity account = getAccount(username);
        return User.builder()
                .username(account.getUsername())
                .password(account.getPasswordHash())
                .roles(account.getRole())
                .build();
    }

    public AccountProfileResponse getProfile(String username) {
        UserAccountEntity account = getAccount(username);
        return new AccountProfileResponse(account.getUsername(), account.getDisplayName(), account.getRole());
    }

    public AccountProfileResponse updateDisplayName(String username, String displayName) {
        if (!StringUtils.hasText(displayName)) {
            throw new IllegalArgumentException("displayName is required");
        }

        UserAccountEntity account = getAccount(username);
        account.setDisplayName(displayName.trim());
        userAccountRepository.save(account);
        return getProfile(username);
    }

    public AccountProfileResponse changePassword(String username, AccountPasswordChangeRequest request) {
        if (request == null || !StringUtils.hasText(request.getCurrentPassword()) || !StringUtils.hasText(request.getNewPassword())) {
            throw new IllegalArgumentException("currentPassword and newPassword are required");
        }

        UserAccountEntity account = getAccount(username);
        if (!passwordEncoder.matches(request.getCurrentPassword(), account.getPasswordHash())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }

        account.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userAccountRepository.save(account);
        return getProfile(username);
    }

    public String getRole(String username) {
        return getAccount(username).getRole();
    }

    public String getAssignedZone(String username) {
        return getAccount(username).getAssignedZone();
    }

    public void registerAccount(String username, String password, String role, String displayName, String assignedZone) {
        // Normalize username (case-insensitive check)
        String normalizedUsername = normalize(username);
        if (userAccountRepository.existsByUsernameIgnoreCase(normalizedUsername)) {
            // Update password & metadata if we are re-registering
            UserAccountEntity existing = getAccount(normalizedUsername);
            existing.setPasswordHash(passwordEncoder.encode(password));
            existing.setRole(role);
            existing.setDisplayName(displayName);
            existing.setAssignedZone(assignedZone);
            userAccountRepository.save(existing);
        } else {
            UserAccountEntity newAccount = new UserAccountEntity(
                    username.trim(), // Keep original casing display but lookup is case-insensitive
                    passwordEncoder.encode(password),
                    role,
                    displayName,
                    assignedZone
            );
            userAccountRepository.save(newAccount);
        }
    }

    private UserAccountEntity getAccount(String username) {
        return userAccountRepository.findByUsernameIgnoreCase(normalize(username))
                .orElseThrow(() -> new UsernameNotFoundException("Account not found: " + username));
    }

    private String normalize(String username) {
        return username == null ? "" : username.toLowerCase(Locale.ROOT).trim();
    }

    private String defaultDisplayName(String username, String fallback) {
        return StringUtils.hasText(username) ? username.trim() : fallback;
    }
}