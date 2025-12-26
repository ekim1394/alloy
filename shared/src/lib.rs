//! Shared types and utilities for Jules Mac Runner
//!
//! This crate contains common data structures used across the orchestrator,
//! worker, and CLI components.

pub mod error;
pub mod models;

pub use error::*;
pub use models::*;
