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
import java.util.Optional;

/**
 * Apache Camel route, using camel-irc to connect to Twitch Chat (which is IRC Based).
 */
@ApplicationScoped
public class CamelRoute extends RouteBuilder {

    private static final Logger LOG = LoggerFactory.getLogger(CamelRoute.class);

    @ConfigProperty(name = "twitch.channel")
    Optional<String> channelOpt;
    @ConfigProperty(name = "twitch.auth")
    Optional<String> authTokenOpt;

    // Store last 100 messages for analysis
    private final List<String> recentMessages = new CopyOnWriteArrayList<>();
    private static final int MAX_MESSAGES = 100;
    
    // Helper methods to get config values
    private String getChannel() {
        return channelOpt.orElse("");
    }
    
    private String getAuthToken() {
        return authTokenOpt.orElse("");
    }

    @Override
    public void configure() throws Exception {
        String channel = getChannel();
        String authToken = getAuthToken();
        
        // Always define routes to keep app running and tool listing available,
        // regardless of Twitch config. Routes will be started on-demand when needed.
        from("direct:sendToIrc")
                .routeId("sendMessageToTwitch")
                .errorHandler(deadLetterChannel("direct:sendError").maximumRedeliveries(3).redeliveryDelay(1000))
                .process(exchange -> {
                    String chan = getChannel();
                    String auth = getAuthToken();
                    
                    if (chan == null || chan.isBlank() || auth == null || auth.isBlank()) {
                        String message = exchange.getMessage().getBody(String.class);
                        LOG.info("Twitch config not provided; skipping send: {}", message);
                        return;
                    }
                    
                    String twitchIrcUrl = "irc:%s@irc.chat.twitch.tv:6667?nickname=%s&password=oauth:%s&channels=#%s&autoRejoin=true&persistent=true&colors=false&onReply=true&onNick=false&onQuit=false&onJoin=false&onKick=false&onMode=false&onPart=false&onTopic=false&commandTimeout=5000"
                            .formatted(chan, chan, auth, chan);
                    
                    LOG.info("Sending to Twitch: {}", exchange.getMessage().getBody(String.class));
                    exchange.getMessage().setHeader("irc.sendTo", "#" + chan);
                    
                    // Dynamically set the destination endpoint
                    exchange.setProperty("twitchIrcUrl", twitchIrcUrl);
                })
                .toD("${exchangeProperty.twitchIrcUrl}")
                .log("Message sent successfully");

        // Define a route to receive messages from Twitch Chat, but don't auto-start it
        from("direct:startTwitchReceiver")
                .routeId("startTwitchReceiver")
                .process(exchange -> {
                    String chan = getChannel();
                    String auth = getAuthToken();
                    
                    if (chan == null || chan.isBlank() || auth == null || auth.isBlank()) {
                        LOG.info("Twitch config not provided; not starting receiver");
                        return;
                    }
                    
                    String twitchIrcUrl = "irc:%s@irc.chat.twitch.tv:6667?nickname=%s&password=oauth:%s&channels=#%s&autoRejoin=true&persistent=true&colors=false&onReply=true&onNick=false&onQuit=false&onJoin=false&onKick=false&onMode=false&onPart=false&onTopic=false&commandTimeout=5000"
                            .formatted(chan, chan, auth, chan);
                    
                    // Start the receiver route dynamically
                    getContext().getRouteController().startRoute("receiveMessageFromTwitch");
                });

        // Receives messages from Twitch Chat and logs them.
        from("irc:dummy@irc.chat.twitch.tv:6667?nickname=dummy&channels=#dummy&autoRejoin=true&persistent=true&colors=false&onReply=true&onNick=false&onQuit=false&onJoin=false&onKick=false&onMode=false&onPart=false&onTopic=false&commandTimeout=5000")
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
