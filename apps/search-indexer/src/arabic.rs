fn is_tashkeel(c: char) -> bool {
    matches!(c, '\u{0610}'..='\u{061A}' | '\u{064B}'..='\u{065F}' | '\u{06D6}'..='\u{06ED}' | '\u{0640}')
}

fn is_js_whitespace(c: char) -> bool {
    matches!(
        c,
        '\u{0009}'..='\u{000D}'
            | '\u{0020}'
            | '\u{00A0}'
            | '\u{1680}'
            | '\u{2000}'..='\u{200A}'
            | '\u{2028}'
            | '\u{2029}'
            | '\u{202F}'
            | '\u{205F}'
            | '\u{3000}'
            | '\u{FEFF}'
    )
}

fn js_trim(text: &str) -> &str {
    text.trim_matches(is_js_whitespace)
}

pub(crate) fn strip_tashkeel(text: &str) -> String {
    text.chars().filter(|c| !is_tashkeel(*c)).collect()
}

pub(crate) fn fold_for_sort(text: &str, rules: &[(String, String)]) -> String {
    let mut folded = strip_tashkeel(text);
    for (from, to) in rules {
        if !from.is_empty() {
            folded = folded.replace(from.as_str(), to);
        }
    }
    js_trim(&folded).to_string()
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde::Deserialize;

    const VECTORS_JSON: &str = include_str!("../arabic-text.vectors.json");

    #[derive(Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct Vector {
        note: String,
        input: String,
        strip_tashkeel: String,
        fold_for_sort: String,
    }

    #[test]
    fn matches_the_shared_vectors() {
        let vectors: Vec<Vector> = serde_json::from_str(VECTORS_JSON).expect("vectors malformed");
        let rules = qafiyah_elasticsearch::folding_rules(&qafiyah_elasticsearch::load().poems);
        assert!(vectors.len() >= 26, "expected the full vector set");
        for v in &vectors {
            assert_eq!(
                strip_tashkeel(&v.input),
                v.strip_tashkeel,
                "strip: {}",
                v.note
            );
            assert_eq!(
                fold_for_sort(&v.input, &rules),
                v.fold_for_sort,
                "fold: {}",
                v.note
            );
        }
    }

    #[test]
    fn tashkeel_ranges_do_not_swallow_arabic_letters() {
        assert_eq!(strip_tashkeel("أحمد"), "أحمد");
        assert_eq!(strip_tashkeel("عروة"), "عروة");
    }
}
