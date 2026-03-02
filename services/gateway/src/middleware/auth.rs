//! Authentication middleware

use actix_web::{
    Error, HttpMessage, HttpResponse,
    body::EitherBody,
    dev::{Service, ServiceRequest, ServiceResponse, Transform},
    http::header::AUTHORIZATION,
    web,
};
use futures::future::LocalBoxFuture;
use serde_json::json;
use std::future::{Ready, ready};
use std::rc::Rc;
use std::task::{Context, Poll};

use crate::services::AuthService;
use shared_types::TokenClaims;

/// Authentication middleware
pub struct Auth;

impl<S, B> Transform<S, ServiceRequest> for Auth
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<EitherBody<B>>;
    type Error = Error;
    type Transform = AuthMiddleware<S>;
    type InitError = ();
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ready(Ok(AuthMiddleware {
            service: Rc::new(service),
        }))
    }
}

pub struct AuthMiddleware<S> {
    service: Rc<S>,
}

impl<S, B> Service<ServiceRequest> for AuthMiddleware<S>
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

        Box::pin(async move {
            // Get auth service from app data
            let auth_service = req.app_data::<web::Data<AuthService>>().cloned();

            if auth_service.is_none() {
                let (req, _pl) = req.into_parts();
                let response = HttpResponse::InternalServerError().json(json!({
                    "status": "error",
                    "error": {
                        "code": "INTERNAL_ERROR",
                        "message": "Auth service not configured"
                    }
                }));
                return Ok(ServiceResponse::new(req, response).map_into_right_body());
            }

            let auth_service = auth_service.unwrap();

            // Extract token from Authorization header
            let token = req
                .headers()
                .get(AUTHORIZATION)
                .and_then(|h| h.to_str().ok())
                .and_then(|h| h.strip_prefix("Bearer "));

            if token.is_none() {
                let (req, _pl) = req.into_parts();
                let response = HttpResponse::Unauthorized().json(json!({
                    "status": "error",
                    "error": {
                        "code": "UNAUTHORIZED",
                        "message": "Missing or invalid authorization token"
                    }
                }));
                return Ok(ServiceResponse::new(req, response).map_into_right_body());
            }

            let token = token.unwrap().to_string();

            // Validate token
            match auth_service.validate_token(&token) {
                Ok(claims) => {
                    // Add claims to request extensions
                    let req = req;
                    req.extensions_mut().insert(claims);

                    let res = svc.call(req).await?;
                    Ok(res.map_into_left_body())
                }
                Err(_e) => {
                    let (req, _pl) = req.into_parts();
                    let response = HttpResponse::Unauthorized().json(json!({
                        "status": "error",
                        "error": {
                            "code": "INVALID_TOKEN",
                            "message": "Invalid or expired token"
                        }
                    }));
                    Ok(ServiceResponse::new(req, response).map_into_right_body())
                }
            }
        })
    }
}

/// Extract authenticated user claims from request
#[allow(dead_code)]
pub fn get_auth_claims(req: &ServiceRequest) -> Option<TokenClaims> {
    req.extensions().get::<TokenClaims>().cloned()
}

/// Require specific permission
#[allow(dead_code)]
pub fn require_permission(req: &ServiceRequest, permission: &str) -> bool {
    if let Some(claims) = get_auth_claims(req) {
        claims.permissions.contains(&permission.to_string())
    } else {
        false
    }
}
