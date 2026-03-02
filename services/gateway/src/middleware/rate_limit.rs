//! Rate limiting middleware with Redis support

use actix_web::{
    Error, HttpResponse,
    body::EitherBody,
    dev::{Service, ServiceRequest, ServiceResponse, Transform},
};
use futures::future::LocalBoxFuture;
use serde_json::json;
use std::future::{Ready, ready};
use std::rc::Rc;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::{Arc, Mutex};
use std::task::{Context, Poll};
use std::time::{Duration, Instant};

// use crate::services::CacheService; // Will use when Redis is fully integrated

/// Rate limiting middleware
pub struct RateLimit {
    requests_per_minute: usize,
    use_redis: bool,
}

impl RateLimit {
    pub fn new(requests_per_minute: usize) -> Self {
        Self {
            requests_per_minute,
            use_redis: false, // Will be set to true if Redis is available
        }
    }

    #[allow(dead_code)]
    pub fn with_redis(mut self, use_redis: bool) -> Self {
        self.use_redis = use_redis;
        self
    }
}

impl<S, B> Transform<S, ServiceRequest> for RateLimit
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<EitherBody<B>>;
    type Error = Error;
    type Transform = RateLimitMiddleware<S>;
    type InitError = ();
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ready(Ok(RateLimitMiddleware {
            service: Rc::new(service),
            requests_per_minute: self.requests_per_minute,
            use_redis: self.use_redis,
            // In-memory fallback
            counter: Arc::new(AtomicUsize::new(0)),
            window_start: Arc::new(Mutex::new(Instant::now())),
        }))
    }
}

pub struct RateLimitMiddleware<S> {
    service: Rc<S>,
    requests_per_minute: usize,
    use_redis: bool,
    // In-memory fallback fields
    counter: Arc<AtomicUsize>,
    window_start: Arc<Mutex<Instant>>,
}

impl<S, B> Service<ServiceRequest> for RateLimitMiddleware<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<EitherBody<B>>;
    type Error = Error;
    type Future = LocalBoxFuture<'static, Result<Self::Response, Self::Error>>;

    fn poll_ready(&self, cx: &mut Context<'_>) -> Poll<Result<(), Self::Error>> {
        self.service.poll_ready(cx)
    }

    fn call(&self, req: ServiceRequest) -> Self::Future {
        let svc = self.service.clone();
        let limit = self.requests_per_minute;
        let use_redis = self.use_redis;

        // Get client IP
        let client_ip = get_client_ip(&req);
        let _rate_limit_key = format!("ratelimit:{}:{}", client_ip, req.path());

        // In-memory fallback
        let counter = self.counter.clone();
        let window_start = self.window_start.clone();

        Box::pin(async move {
            // Check rate limit (using in-memory for now)
            let is_rate_limited = if use_redis {
                // TODO: Implement Redis-based rate limiting
                check_rate_limit_memory(counter, window_start, limit).await
            } else {
                check_rate_limit_memory(counter, window_start, limit).await
            };

            if is_rate_limited {
                let (req, _pl) = req.into_parts();
                let response = HttpResponse::TooManyRequests().json(json!({
                    "status": "error",
                    "error": {
                        "code": "RATE_LIMITED",
                        "message": "Too many requests, please try again later",
                        "retry_after": 60
                    }
                }));
                return Ok(ServiceResponse::new(req, response).map_into_right_body());
            }

            // Continue to service
            let res = svc.call(req).await?;
            Ok(res.map_into_left_body())
        })
    }
}

/// Get client IP from request
fn get_client_ip(req: &ServiceRequest) -> String {
    // Try X-Forwarded-For header first (for proxied requests)
    if let Some(forwarded) = req.headers().get("X-Forwarded-For") {
        if let Ok(forwarded_str) = forwarded.to_str() {
            // Get first IP in the chain
            if let Some(first_ip) = forwarded_str.split(',').next() {
                return first_ip.trim().to_string();
            }
        }
    }

    // Try X-Real-IP header
    if let Some(real_ip) = req.headers().get("X-Real-IP") {
        if let Ok(ip_str) = real_ip.to_str() {
            return ip_str.to_string();
        }
    }

    // Fall back to connection address
    if let Some(addr) = req.peer_addr() {
        return addr.ip().to_string();
    }

    "unknown".to_string()
}

/// In-memory rate limit check
async fn check_rate_limit_memory(
    counter: Arc<AtomicUsize>,
    window_start: Arc<Mutex<Instant>>,
    limit: usize,
) -> bool {
    // Check if we need to reset the window
    let mut window = window_start.lock().unwrap();
    let now = Instant::now();
    if now.duration_since(*window) >= Duration::from_secs(60) {
        *window = now;
        counter.store(0, Ordering::SeqCst);
    }
    drop(window);

    // Increment counter and check limit
    let current = counter.fetch_add(1, Ordering::SeqCst);
    current >= limit
}

/// Per-client rate limiter using in-memory storage (for auth endpoints)
#[allow(dead_code)]
pub struct ClientRateLimiter {
    clients: Arc<Mutex<std::collections::HashMap<String, (Instant, usize)>>>,
    max_requests: usize,
    window_secs: u64,
}

#[allow(dead_code)]
impl ClientRateLimiter {
    pub fn new(max_requests: usize, window_secs: u64) -> Self {
        Self {
            clients: Arc::new(Mutex::new(std::collections::HashMap::new())),
            max_requests,
            window_secs,
        }
    }

    pub fn check_rate_limit(&self, client_id: &str) -> bool {
        let mut clients = self.clients.lock().unwrap();
        let now = Instant::now();

        // Clean up old entries periodically (simple approach)
        if clients.len() > 10000 {
            clients.clear();
        }

        match clients.get_mut(client_id) {
            Some((window_start, count)) => {
                if now.duration_since(*window_start).as_secs() > self.window_secs {
                    // Reset window
                    *window_start = now;
                    *count = 1;
                    false
                } else {
                    // Increment and check
                    *count += 1;
                    *count > self.max_requests
                }
            }
            None => {
                clients.insert(client_id.to_string(), (now, 1));
                false
            }
        }
    }
}

#[allow(dead_code)]
impl Default for ClientRateLimiter {
    fn default() -> Self {
        Self::new(5, 60) // 5 requests per minute default
    }
}
