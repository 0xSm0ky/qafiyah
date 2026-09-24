#![expect(clippy::print_stdout, reason = "the document is this command's output")]
#![expect(
    clippy::expect_used,
    reason = "a built document is always serializable"
)]

fn main() {
    let doc = qafiyah_api::document();
    println!(
        "{}",
        serde_json::to_string_pretty(&doc).expect("a built document is always serializable")
    );
}
