package com.forestfire.controller;

import com.forestfire.service.SensorSimulationService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;

@WebMvcTest(ForestFireController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
@SuppressWarnings("null")
class ForestFireControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private SensorSimulationService simulationService;

    @Test
    void getZoneWhenMissingReturnsStructuredNotFoundError() throws Exception {
        when(simulationService.getZoneStatus("unknown-zone")).thenReturn(null);

        mockMvc.perform(get("/api/v1/zones/unknown-zone").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("Not Found"))
                .andExpect(jsonPath("$.message").value("Zone not found: unknown-zone"))
                .andExpect(jsonPath("$.path").value("/api/v1/zones/unknown-zone"));
    }

    @Test
    void invalidHistoryLimitReturnsStructuredBadRequestError() throws Exception {
        mockMvc.perform(get("/api/v1/readings/history")
                        .param("limit", "abc")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.path").value("/api/v1/readings/history"));
    }
}
