package be.tomcools.twitchmcp.client;

import jakarta.enterprise.context.ApplicationScoped;
import org.apache.camel.Exchange;
import org.apache.camel.builder.RouteBuilder;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Apache Camel route, using camel-irc to connect to Twitch Chat (which is IRC Based).
 */
@ApplicationScoped
public class CamelRoute extends RouteBuilder {

    private static final Logger LOG = LoggerFactory.getLogger(CamelRoute.class);

    @ConfigProperty(name = "twitch.channel", defaultValue = "")
    String channel;
    @ConfigProperty(name = "twitch.auth", defaultValue = "")
    String authToken;

    // Store last 100 messages for analysis
    private final List<String> recentMessages = new CopyOnWriteArrayList<>();
    private static final int MAX_MESSAGES = 100;

    @Override
    public void configure() throws Exception {
        if (channel == null || channel.isBlank() || authToken == null || authToken.isBlank()) {
            // No Twitch config provided: define stub routes to keep app running and tool listing available
            from("direct:sendToIrc")
                    .routeId("sendMessageToTwitch-disabled")
                    .log("Twitch config not provided; skipping send: ${body}");
            return;
        }

        String twitchIrcUrl = "irc:%s@irc.chat.twitch.tv:6667?nickname=%s&password=oauth:%s&channels=#%s&autoRejoin=true&persistent=true&colors=false&onReply=true&onNick=false&onQuit=false&onJoin=false&onKick=false&onMode=false&onPart=false&onTopic=false&commandTimeout=5000"
                .formatted(channel, channel, authToken, channel);

        // Receives messages from Twitch Chat and logs them.
        from(twitchIrcUrl)
                .routeId("receiveMessageFromTwitch")
                .autoStartup(false)
                .process(exchange -> {
                    String message = exchange.getMessage().getBody(String.class);
                    String messageType = exchange.getMessage().getHeader("irc.messageType", String.class);
                    
                    // Only store chat messages (PRIVMSG), not system messages
                    if ("PRIVMSG".equals(messageType)) {
                        String username = exchange.getMessage().getHeader("irc.user.nick", String.class);
                        
                        if (username != null) {
                            String content = message;
                            
                            // Extract the actual message content if it's in the format ":username!username@username.tmi.twitch.tv PRIVMSG #channel :message"
                            if (content.contains("PRIVMSG")) {
                                int lastColon = content.lastIndexOf(':');
                                if (lastColon != -1) {
                                    content = content.substring(lastColon + 1);
                                }
                            }
                            
                            synchronized (recentMessages) {
                                recentMessages.add(username + ": " + content);
                                if (recentMessages.size() > MAX_MESSAGES) {
                                    recentMessages.remove(0);
                                }
                            }
                        }
                    }
                })
                .to("log:info");

        // Allows us to send messages to Twitch
        from("direct:sendToIrc")
                .routeId("sendMessageToTwitch")
                .errorHandler(deadLetterChannel("direct:sendError").maximumRedeliveries(3).redeliveryDelay(1000))
                .log("Sending to Twitch: ${body}")
                .setHeader("irc.sendTo", constant("#" + channel))
                .setBody(simple("${body}"))
                .to(twitchIrcUrl)
                .log("Message sent successfully");

        // Error handling for failed sends
        from("direct:sendError")
                .routeId("handleSendError")
                .process(exchange -> {
                    String message = exchange.getMessage().getBody(String.class);
                    Exception cause = exchange.getProperty(Exchange.EXCEPTION_CAUGHT, Exception.class);
                    LOG.error("Failed to send message after retries: {}", message);
                    if (cause != null) {
                        LOG.error("Error: {}", cause.getMessage());
                    }
                });
    }

    public List<String> getRecentMessages() {
        return new ArrayList<>(recentMessages);
    }

    public void clearMessages() {
        recentMessages.clear();
    }
}
