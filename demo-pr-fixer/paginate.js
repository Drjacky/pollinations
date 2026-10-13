/** Split items into pages of `size`; page numbers start at 1. */
export function paginate(items, page, size) {
    if (size <= 0) throw new Error("size must be positive");
    const start = (page - 1) * size;
    return items.slice(start, start + size);
}
