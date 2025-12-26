## 2024-05-23 - Insecure Hashing Algorithm
**Vulnerability:** The API key hashing function was using `DefaultHasher` (SipHash), which is designed for hash maps and is not cryptographically secure. It allows for potential collisions and is too fast for password/token hashing.
**Learning:** `DefaultHasher` is often the default choice when looking for a "hasher" in the standard library, but it is not suitable for security purposes. Always verify the cryptographic properties of the hashing algorithm.
**Prevention:** Use established cryptographic libraries like `sha2` (SHA-256) or `argon2` (for passwords) and explicitly document the algorithm choice.
