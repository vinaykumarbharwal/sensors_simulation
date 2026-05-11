package com.forestfire.controller;

import com.forestfire.model.AccountPasswordChangeRequest;
import com.forestfire.model.AccountProfileResponse;
import com.forestfire.model.AccountProfileUpdateRequest;
import com.forestfire.service.UserAccountService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/account")
public class AccountController {

    private final UserAccountService userAccountService;

    public AccountController(UserAccountService userAccountService) {
        this.userAccountService = userAccountService;
    }

    @GetMapping
    public ResponseEntity<AccountProfileResponse> getProfile(Authentication authentication) {
        return ResponseEntity.ok(userAccountService.getProfile(authentication.getName()));
    }

    @PutMapping("/profile")
    public ResponseEntity<AccountProfileResponse> updateProfile(Authentication authentication,
                                                                @RequestBody AccountProfileUpdateRequest request) {
        return ResponseEntity.ok(userAccountService.updateDisplayName(authentication.getName(), request.getDisplayName()));
    }

    @PutMapping("/password")
    public ResponseEntity<AccountProfileResponse> changePassword(Authentication authentication,
                                                                 @RequestBody AccountPasswordChangeRequest request) {
        return ResponseEntity.ok(userAccountService.changePassword(authentication.getName(), request));
    }
}