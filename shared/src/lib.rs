//! Shared types and utilities for Jules Mac Runner
//! 
//! This crate contains common data structures used across the orchestrator,
//! worker, and CLI components.

pub mod models;
pub mod error;

pub use models::*;
pub use error::*;
