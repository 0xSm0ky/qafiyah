use serde_json::json;

pub(crate) fn line(stage: &str, detail: &str) -> String {
    json!({ "source": "search-indexer", "stage": stage, "error": detail }).to_string()
}

pub(crate) fn event(stage: &str, fields: serde_json::Value) -> String {
    let mut base = json!({ "source": "search-indexer", "stage": stage });
    if let (Some(obj), Some(extra)) = (base.as_object_mut(), fields.as_object()) {
        for (k, v) in extra {
            obj.insert(k.clone(), v.clone());
        }
    }
    base.to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn an_event_merges_object_fields_over_the_source_and_stage() {
        let parsed: serde_json::Value = serde_json::from_str(&event(
            "reindex",
            json!({ "poems": 3, "stage": "overridden" }),
        ))
        .expect("JSON");
        assert_eq!(parsed["source"], "search-indexer");
        assert_eq!(parsed["stage"], "overridden");
        assert_eq!(parsed["poems"], 3);
    }

    #[test]
    fn a_non_object_detail_is_ignored_and_a_line_carries_its_error() {
        let parsed: serde_json::Value =
            serde_json::from_str(&event("boot", json!("not an object"))).expect("JSON");
        assert_eq!(
            parsed,
            json!({ "source": "search-indexer", "stage": "boot" })
        );
        let line: serde_json::Value =
            serde_json::from_str(&line("env", "DATABASE_URL is required")).expect("JSON");
        assert_eq!(line["error"], "DATABASE_URL is required");
    }
}
