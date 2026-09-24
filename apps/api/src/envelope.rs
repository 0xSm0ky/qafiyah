use serde::Serialize;
use utoipa::ToSchema;

#[derive(Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct Pagination {
    #[schema(example = 1)]
    pub page: u32,
    #[schema(example = 20)]
    pub page_size: u32,
    #[schema(example = 5)]
    pub total_pages: u32,
    #[schema(example = 93)]
    pub total_items: u32,
}

#[derive(Serialize, ToSchema)]
pub struct ListEnvelope<T> {
    pub data: Vec<T>,
    pub pagination: Pagination,
}

#[derive(Serialize, ToSchema)]
pub struct ItemEnvelope<T> {
    pub data: T,
}

pub fn build_pagination(page: u32, page_size: u32, total_items: u32) -> Pagination {
    Pagination {
        page,
        page_size,
        total_pages: std::cmp::max(1, total_items.div_ceil(page_size.max(1))),
        total_items,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn total_pages_rounds_up_and_never_drops_below_one() {
        assert_eq!(build_pagination(1, 30, 0).total_pages, 1);
        assert_eq!(build_pagination(1, 30, 1).total_pages, 1);
        assert_eq!(build_pagination(1, 30, 30).total_pages, 1);
        assert_eq!(build_pagination(1, 30, 31).total_pages, 2);
        assert_eq!(build_pagination(1, 0, 5).total_pages, 5);
        assert_eq!(
            build_pagination(7, 20, u32::MAX).total_pages,
            u32::MAX / 20 + 1
        );
        let page = build_pagination(7, 20, 93);
        assert_eq!((page.page, page.page_size, page.total_items), (7, 20, 93));
    }
}
