package com.forestfire.exception;

import org.springframework.http.HttpStatus;

public class ResourceNotFoundException extends ForestFireException {

    public ResourceNotFoundException(String message) {
        super(HttpStatus.NOT_FOUND, message);
    }
}
