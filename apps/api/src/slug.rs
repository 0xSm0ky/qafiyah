use crate::error::AppError;

pub fn transliterated(raw: &str) -> Result<&str, AppError> {
    let mut chars = raw.chars();
    let starts_lower = matches!(chars.next(), Some('a'..='z'));
    if starts_lower && chars.all(|c| c.is_ascii_lowercase() || c == '-') {
        Ok(raw)
    } else {
        Err(AppError::BadRequest)
    }
}

pub fn four_letters(raw: &str) -> Result<&str, AppError> {
    if raw.chars().count() == 4 && raw.chars().all(|c| c.is_ascii_alphabetic()) {
        Ok(raw)
    } else {
        Err(AppError::BadRequest)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn accepts_the_contract_examples() {
        assert!(transliterated("abbasi").is_ok());
        assert!(transliterated("al-tawil").is_ok());
        assert!(four_letters("TnKK").is_ok());
    }

    #[test]
    fn rejects_what_the_contract_regex_rejects() {
        for raw in ["", "-abbasi", "Abbasi", "abbasi1", "abbasi_x", "عربي"] {
            assert!(transliterated(raw).is_err(), "should reject {raw}");
        }
        for raw in ["", "abc", "abcde", "ab1d", "عربي"] {
            assert!(four_letters(raw).is_err(), "should reject {raw}");
        }
    }

    #[test]
    fn validation_never_panics_and_never_accepts_a_byte_outside_the_alphabet() {
        let mut rng = crate::test_support::Rng::new(5);
        for _ in 0..5_000 {
            let len = usize::try_from(rng.below(12)).expect("bounded length");
            let raw = String::from_utf8_lossy(&rng.bytes(len)).into_owned();
            if transliterated(&raw).is_ok() {
                assert!(raw.bytes().all(|b| b.is_ascii_lowercase() || b == b'-'));
                assert!(raw.as_bytes()[0].is_ascii_lowercase());
            }
            if four_letters(&raw).is_ok() {
                assert_eq!(raw.len(), 4);
                assert!(raw.bytes().all(|b| b.is_ascii_alphabetic()));
            }
        }
    }

    #[test]
    fn a_transliterated_slug_has_no_length_cap_pinned_not_endorsed() {
        assert!(transliterated(&"a".repeat(10_000)).is_ok());
    }
}
