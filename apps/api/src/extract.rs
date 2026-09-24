use axum::extract::FromRequestParts;
use axum::extract::Path;
use axum::http::request::Parts;

use crate::error::AppError;

pub struct SafePath<T>(pub T);

impl<S, T> FromRequestParts<S> for SafePath<T>
where
    S: Send + Sync,
    T: serde::de::DeserializeOwned + Send,
{
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        match Path::<T>::from_request_parts(parts, state).await {
            Ok(path) => Ok(SafePath(path.0)),
            Err(_) => Err(AppError::BadRequest),
        }
    }
}
