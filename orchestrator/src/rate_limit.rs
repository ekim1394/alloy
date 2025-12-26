//! Rate limiting configuration using tower_governor

use axum::http::Request;
use std::sync::Arc;
use tower_governor::{
    governor::GovernorConfigBuilder,
    key_extractor::KeyExtractor,
    GovernorError,
    GovernorLayer,
};
use ::governor::middleware::NoOpMiddleware;

/// Extract rate limit key from request (API key or IP address)
#[derive(Clone)]
pub struct RateLimitKey;

impl KeyExtractor for RateLimitKey {
    type Key = String;

    fn extract<T>(&self, req: &Request<T>) -> Result<Self::Key, GovernorError> {
        // Try to get API key first for authenticated clients
        if let Some(auth) = req.headers().get("authorization") {
            if let Ok(auth_str) = auth.to_str() {
                if auth_str.starts_with("ApiKey ") {
                    // Use a prefix of the API key to identify the client
                    let key_end = 15.min(auth_str.len());
                    return Ok(format!("api:{}", &auth_str[7..key_end]));
                }
            }
        }

        // Fall back to IP from X-Forwarded-For (for proxied requests)
        if let Some(forwarded) = req.headers().get("x-forwarded-for") {
            if let Ok(ip) = forwarded.to_str() {
                return Ok(format!("ip:{}", ip.split(',').next().unwrap_or("unknown").trim()));
            }
        }

        // Fall back to X-Real-IP
        if let Some(real_ip) = req.headers().get("x-real-ip") {
            if let Ok(ip) = real_ip.to_str() {
                return Ok(format!("ip:{}", ip));
            }
        }

        // Default fallback for requests without identifiable source
        Ok("unknown".to_string())
    }
}

/// Create rate limiting layer
/// Default: 100 requests per 60 seconds per client
pub fn create_rate_limiter() -> GovernorLayer<RateLimitKey, NoOpMiddleware> {
    let config = Arc::new(
        GovernorConfigBuilder::default()
            .per_second(60)           // Time window
            .burst_size(100)          // Max requests in window
            .key_extractor(RateLimitKey)
            .finish()
            .expect("Failed to create rate limiter config"),
    );

    GovernorLayer { config }
}
