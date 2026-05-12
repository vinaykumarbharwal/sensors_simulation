package com.forestfire.exception;

import org.springframework.http.HttpStatus;

public class ForestFireException extends RuntimeException {

    private final HttpStatus status;

    public ForestFireException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
