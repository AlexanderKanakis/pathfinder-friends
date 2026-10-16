(function () {
  const FIELD = "needsReview";

  function isMarked(record) {
    return record?.[FIELD] === true;
  }

  function setMarked(record, marked) {
    if (!record || typeof record !== "object") return false;
    if (marked) record[FIELD] = true;
    else delete record[FIELD];
    return marked;
  }

  function toggle(record) {
    return setMarked(record, !isMarked(record));
  }

  function buttonHtml(record, attributes = "", noun = "entry") {
    const marked = isMarked(record);
    const label = marked
      ? `Remove ${noun} from revisit list`
      : `Mark ${noun} for revisit`;
    return `
      <button class="btn btn-outline-warning btn-sm btn-icon admin-review-marker${marked ? " is-marked" : ""}" type="button" ${attributes} aria-label="${label}" title="${label}" aria-pressed="${marked}">
        <i class="bi ${marked ? "bi-star-fill" : "bi-star"}" aria-hidden="true"></i>
      </button>
    `;
  }

  window.PFAdminReviewMarker = { buttonHtml, isMarked, setMarked, toggle };
})();
