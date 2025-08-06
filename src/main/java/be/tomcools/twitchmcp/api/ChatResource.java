package be.tomcools.twitchmcp.api;

import be.tomcools.twitchmcp.client.TwitchClient;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import io.smallrye.mutiny.Multi;

import java.util.List;

@Path("/api/chat")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ChatResource {

    @Inject
    TwitchClient twitchClient;

    @POST
    public Response sendMessage(ChatMessage message) {
        try {
            twitchClient.sendMessage(message.content());
            return Response.ok().build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(new ErrorResponse("Failed to send message: " + e.getMessage()))
                    .build();
        }
    }

    @GET
    @Path("/stream")
    @Produces(MediaType.SERVER_SENT_EVENTS)
    public Multi<ChatMessage> streamChat() {
        return Multi.createFrom().emitter(emitter -> {
            // Subscribe to chat messages from TwitchClient
            // This is a placeholder - we'll need to implement the actual event emission
            // in TwitchClient
        });
    }

    @GET
    @Path("/recent")
    public Response getRecentMessages() {
        try {
            List<String> messages = twitchClient.getRecentChatLog(20);
            return Response.ok(messages).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(new ErrorResponse("Failed to get recent messages: " + e.getMessage()))
                    .build();
        }
    }
}

record ChatMessage(String content) {}
record ErrorResponse(String error) {} 