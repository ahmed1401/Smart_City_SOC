package com.smartcity.directory.graphql;

import com.smartcity.directory.graphql.dto.ServiceDto;
import com.smartcity.directory.graphql.dto.TicketDto;
import com.smartcity.directory.graphql.input.ServiceFilterInput;
import com.smartcity.directory.graphql.input.TicketFilterInput;
import com.smartcity.directory.graphql.input.TicketInput;
import java.util.List;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

@Controller
public class DirectoryGraphQlController {

  private final DirectoryGraphQlService service;

  public DirectoryGraphQlController(DirectoryGraphQlService service) {
    this.service = service;
  }

  @QueryMapping
  public List<ServiceDto> services(@Argument ServiceFilterInput filter) {
    return service.listServices(filter);
  }

  @QueryMapping
  public List<TicketDto> tickets(@Argument TicketFilterInput filter) {
    return service.listTickets(filter);
  }

  @MutationMapping
  public TicketDto createTicket(@Argument TicketInput input) {
    return service.createTicket(input);
  }

  @MutationMapping
  public TicketDto closeTicket(@Argument String id) {
    return service.closeTicket(id);
  }
}
