//! Cryptographic utilities for password and API key hashing

use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};

/// Hash a password using Argon2id (recommended for password storage)
/// Returns the PHC string format hash which includes algorithm, salt, and hash
pub fn hash_password(password: &str) -> Result<String, argon2::password_hash::Error> {
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    let hash = argon2.hash_password(password.as_bytes(), &salt)?;
    Ok(hash.to_string())
}

/// Verify a password against an Argon2 hash
/// The hash should be in PHC string format (as produced by hash_password)
pub fn verify_password(password: &str, hash: &str) -> bool {
    let parsed_hash = match PasswordHash::new(hash) {
        Ok(h) => h,
        Err(_) => return false,
    };
    Argon2::default()
        .verify_password(password.as_bytes(), &parsed_hash)
        .is_ok()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_password_hashing() {
        let password = "my_secure_password";
        let hash = hash_password(password).unwrap();
        
        // Hash should be in PHC format
        assert!(hash.starts_with("$argon2"));
        
        // Verification should work
        assert!(verify_password(password, &hash));
        
        // Wrong password should fail
        assert!(!verify_password("wrong_password", &hash));
    }
    
    #[test]
    fn test_different_hashes_each_time() {
        let password = "test_password";
        let hash1 = hash_password(password).unwrap();
        let hash2 = hash_password(password).unwrap();
        
        // Each hash should be different (due to random salt)
        assert_ne!(hash1, hash2);
        
        // But both should verify
        assert!(verify_password(password, &hash1));
        assert!(verify_password(password, &hash2));
    }
}
