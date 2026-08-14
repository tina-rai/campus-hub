function validateEvent(data) {

    const {
        title,
        description,
        category,
        location,
        date,
        time,
        capacity
    } = data;

    if (!title || title.trim() === "") {
        return "Title is required";
    }

    if (!description || description.trim() === "") {
        return "Description is required";
    }

    if (!category || category.trim() === "") {
        return "Category is required";
    }

    if (!location || location.trim() === "") {
        return "Location is required";
    }

    if (!date || date.trim() === "") {
        return "Date is required";
    }

    if (!time || time.trim() === "") {
        return "Time is required";
    }

    if (
        capacity === undefined ||
        capacity === null ||
        capacity === ""
    ) {
        return "Capacity is required";
    }

    if (!Number.isInteger(Number(capacity))) {
        return "Capacity must be a whole number";
    }

    if (Number(capacity) <= 0) {
        return "Capacity must be greater than 0";
    }

    return null;
}

module.exports = validateEvent;