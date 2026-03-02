//! WebSocket handler for real-time features

use actix_web::{HttpRequest, HttpResponse, web};
use actix_ws::{Message, Session};
use serde::{Deserialize, Serialize};
use std::time::{Duration, Instant};
use tokio::sync::broadcast;
use tokio::time::interval;
use tracing::{debug, error, info, warn};

use crate::services::AuthService;

/// Global message broker for broadcasting
#[derive(Clone)]
pub struct MessageBroker {
    sender: broadcast::Sender<WsMessage>,
}

impl Default for MessageBroker {
    fn default() -> Self {
        let (sender, _) = broadcast::channel(1000);
        Self { sender }
    }
}

impl MessageBroker {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn subscribe(&self) -> broadcast::Receiver<WsMessage> {
        self.sender.subscribe()
    }

    #[allow(dead_code)]
    pub fn send(&self, msg: WsMessage) {
        let _ = self.sender.send(msg);
    }
}

/// WebSocket message types
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "payload")]
pub enum WsMessage {
    /// Authentication
    #[serde(rename = "auth")]
    Auth { token: String },

    /// Ping/Pong for keepalive
    #[serde(rename = "ping")]
    Ping,
    #[serde(rename = "pong")]
    Pong,

    /// System notifications
    #[serde(rename = "notification")]
    Notification {
        title: String,
        body: String,
        level: String,
    },

    /// Real-time stats update
    #[serde(rename = "stats_update")]
    StatsUpdate { xp: i32, level: i32, streak: i32 },

    /// Challenge progress update
    #[serde(rename = "challenge_progress")]
    ChallengeProgress {
        challenge_id: String,
        day: i32,
        completed: bool,
    },

    /// Protocol completion
    #[serde(rename = "protocol_complete")]
    ProtocolComplete { date: String, score: i32 },

    /// Subscribe to a channel
    #[serde(rename = "subscribe")]
    Subscribe { channel: String },

    /// Unsubscribe from a channel
    #[serde(rename = "unsubscribe")]
    Unsubscribe { channel: String },

    /// Error message
    #[serde(rename = "error")]
    Error { code: String, message: String },
}

/// WebSocket connection handler
pub async fn ws_handler(
    req: HttpRequest,
    body: web::Payload,
    auth_service: web::Data<AuthService>,
    broker: web::Data<MessageBroker>,
) -> Result<HttpResponse, actix_web::Error> {
    // Extract token from query parameter or header
    let token = req
        .query_string()
        .split('&')
        .find(|p| p.starts_with("token="))
        .and_then(|p| p.split('=').nth(1))
        .map(|t| t.to_string())
        .or_else(|| {
            req.headers()
                .get("Authorization")
                .and_then(|h| h.to_str().ok())
                .and_then(|h| h.strip_prefix("Bearer "))
                .map(|t| t.to_string())
        });

    // Validate token if provided
    let user_id = if let Some(token) = token {
        match auth_service.validate_token(&token) {
            Ok(claims) => Some(claims.sub),
            Err(_) => None,
        }
    } else {
        None
    };

    // Start WebSocket connection
    let (response, session, msg_stream) = actix_ws::handle(&req, body)?;

    // Clone broker before moving into spawn
    let broker_clone = MessageBroker::clone(&broker);

    // Spawn WebSocket handler
    actix_web::rt::spawn(handle_ws(session, msg_stream, user_id, broker_clone));

    Ok(response)
}

/// Handle WebSocket session
async fn handle_ws(
    mut session: Session,
    mut msg_stream: actix_ws::MessageStream,
    user_id: Option<String>,
    broker: MessageBroker,
) {
    let mut last_ping = Instant::now();
    let mut ping_interval = interval(Duration::from_secs(30));
    let mut subscribed_channels: Vec<String> = Vec::new();
    let mut broker_rx = broker.subscribe();

    // Send welcome message
    let welcome = if user_id.is_some() {
        WsMessage::Notification {
            title: "Connected".to_string(),
            body: "Real-time updates enabled".to_string(),
            level: "info".to_string(),
        }
    } else {
        WsMessage::Notification {
            title: "Connected (Guest)".to_string(),
            body: "Authenticate for personalized updates".to_string(),
            level: "warning".to_string(),
        }
    };

    if let Err(e) = send_message(&mut session, &welcome).await {
        warn!("Failed to send welcome message: {}", e);
        return;
    }

    info!("WebSocket connected: user={:?}", user_id);

    loop {
        tokio::select! {
            // Handle incoming messages from client
            msg = msg_stream.recv() => {
                match msg {
                    Some(Ok(msg)) => {
                        match handle_client_message(msg, &mut session, &user_id, &broker, &mut subscribed_channels).await {
                            Ok(should_close) => {
                                if should_close {
                                    break;
                                }
                                last_ping = Instant::now();
                            }
                            Err(e) => {
                                error!("Error handling message: {}", e);
                                let _ = send_message(&mut session, &WsMessage::Error {
                                    code: "MESSAGE_ERROR".to_string(),
                                    message: e.to_string(),
                                }).await;
                            }
                        }
                    }
                    Some(Err(e)) => {
                        error!("WebSocket error: {}", e);
                        break;
                    }
                    None => {
                        // Stream closed
                        break;
                    }
                }
            }

            // Handle broadcast messages
            Ok(msg) = broker_rx.recv() => {
                // Only send if user is subscribed to the channel or it's a broadcast
                if should_send_to_user(&msg, &user_id, &subscribed_channels) {
                    if let Err(e) = send_message(&mut session, &msg).await {
                        warn!("Failed to send broadcast: {}", e);
                        break;
                    }
                }
            }

            // Send periodic ping
            _ = ping_interval.tick() => {
                // Check for timeout
                if last_ping.elapsed() > Duration::from_secs(120) {
                    warn!("WebSocket timeout");
                    break;
                }

                // Send ping
                if let Err(e) = session.ping(b"").await {
                    warn!("Failed to send ping: {}", e);
                    break;
                }
            }
        }
    }

    // Close session
    let _ = session.close(None).await;
    info!("WebSocket disconnected: user={:?}", user_id);
}

/// Handle a message from the client
async fn handle_client_message(
    msg: Message,
    session: &mut Session,
    _user_id: &Option<String>,
    _broker: &MessageBroker,
    subscribed_channels: &mut Vec<String>,
) -> Result<bool, Box<dyn std::error::Error>> {
    match msg {
        Message::Text(text) => {
            debug!("Received text: {}", text);

            match serde_json::from_str::<WsMessage>(&text) {
                Ok(ws_msg) => match ws_msg {
                    WsMessage::Ping => {
                        send_message(session, &WsMessage::Pong).await?;
                    }
                    WsMessage::Pong => {
                        // Keepalive received
                    }
                    WsMessage::Subscribe { channel } => {
                        subscribed_channels.push(channel.clone());
                        send_message(
                            session,
                            &WsMessage::Notification {
                                title: "Subscribed".to_string(),
                                body: format!("Subscribed to {}", channel),
                                level: "info".to_string(),
                            },
                        )
                        .await?;
                    }
                    WsMessage::Unsubscribe { channel } => {
                        subscribed_channels.retain(|c| c != &channel);
                        send_message(
                            session,
                            &WsMessage::Notification {
                                title: "Unsubscribed".to_string(),
                                body: format!("Unsubscribed from {}", channel),
                                level: "info".to_string(),
                            },
                        )
                        .await?;
                    }
                    _ => {
                        // Echo other messages back or handle accordingly
                    }
                },
                Err(e) => {
                    send_message(
                        session,
                        &WsMessage::Error {
                            code: "INVALID_MESSAGE".to_string(),
                            message: format!("Failed to parse message: {}", e),
                        },
                    )
                    .await?;
                }
            }
        }
        Message::Binary(bin) => {
            debug!("Received binary: {} bytes", bin.len());
            // Handle binary data if needed
        }
        Message::Ping(bytes) => {
            session.pong(&bytes).await?;
        }
        Message::Pong(_) => {
            // Keepalive response
        }
        Message::Close(reason) => {
            info!("Client closed connection: {:?}", reason);
            return Ok(true); // Signal to close
        }
        _ => {}
    }

    Ok(false) // Continue
}

/// Send a message to the client
async fn send_message(session: &mut Session, msg: &WsMessage) -> Result<(), actix_ws::Closed> {
    let json = serde_json::to_string(msg).unwrap_or_default();
    session.text(json).await
}

/// Check if a broadcast message should be sent to this user
fn should_send_to_user(msg: &WsMessage, user_id: &Option<String>, _channels: &[String]) -> bool {
    // For now, send all messages to authenticated users
    // In a real implementation, filter based on user preferences and channels
    match msg {
        WsMessage::StatsUpdate { .. } => user_id.is_some(),
        WsMessage::ChallengeProgress { .. } => user_id.is_some(),
        WsMessage::ProtocolComplete { .. } => user_id.is_some(),
        WsMessage::Notification { .. } => true,
        _ => true,
    }
}

/// Trigger a broadcast notification (can be called from other handlers)
#[allow(dead_code)]
pub fn broadcast_notification(broker: &MessageBroker, title: &str, body: &str, level: &str) {
    let msg = WsMessage::Notification {
        title: title.to_string(),
        body: body.to_string(),
        level: level.to_string(),
    };
    broker.send(msg);
}

/// Broadcast stats update
#[allow(dead_code)]
pub fn broadcast_stats_update(broker: &MessageBroker, xp: i32, level: i32, streak: i32) {
    let msg = WsMessage::StatsUpdate { xp, level, streak };
    broker.send(msg);
}
