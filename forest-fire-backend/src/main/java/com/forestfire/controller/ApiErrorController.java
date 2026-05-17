package com.forestfire.controller;

import com.forestfire.model.ErrorDetail;
import jakarta.servlet.RequestDispatcher;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.boot.web.servlet.error.ErrorController;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;

@RestController
public class ApiErrorController implements ErrorController {

    @RequestMapping("/error")
    public ResponseEntity<ErrorDetail> handleError(HttpServletRequest request) {
        Object statusAttr = request.getAttribute(RequestDispatcher.ERROR_STATUS_CODE);
        HttpStatus status = HttpStatus.INTERNAL_SERVER_ERROR;

        if (statusAttr instanceof Integer statusCode) {
            HttpStatus resolved = HttpStatus.resolve(statusCode);
            if (resolved != null) {
                status = resolved;
            }
        }

        String path = (String) request.getAttribute(RequestDispatcher.ERROR_REQUEST_URI);
        String message = (String) request.getAttribute(RequestDispatcher.ERROR_MESSAGE);

        ErrorDetail body = new ErrorDetail(
                LocalDateTime.now(),
                status.value(),
                status.getReasonPhrase(),
                message != null ? message : "The requested API route was not found.",
                path
        );

        return ResponseEntity.status(status).body(body);
    }
}
