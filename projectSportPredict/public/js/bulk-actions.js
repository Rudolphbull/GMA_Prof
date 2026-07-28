document.addEventListener("DOMContentLoaded", () => {
  const bulkForm = document.getElementById("bulkActionForm");
  const bulkAction = document.getElementById("bulkAction");
  const selectAll = document.getElementById("selectAll");

  const checkboxes = document.querySelectorAll("[data-bulk-checkbox]");

  if (!bulkForm) return;

  // ==========================
  // Select All
  // ==========================
  if (selectAll) {
    selectAll.addEventListener("change", () => {
      checkboxes.forEach((box) => {
        box.checked = selectAll.checked;
      });
    });
  }

  // ==========================
  // Keep Select All In Sync
  // ==========================
  checkboxes.forEach((box) => {
    box.addEventListener("change", () => {
      if (!selectAll) return;

      selectAll.checked =
        document.querySelectorAll("[data-bulk-checkbox]:checked").length ===
        checkboxes.length;
    });
  });

  // ==========================
  // Bulk Submit
  // ==========================
  bulkForm.addEventListener("submit", (e) => {
    const selected = document.querySelectorAll("[data-bulk-checkbox]:checked");

        // Remove previously added hidden inputs
    bulkForm.querySelectorAll("input[name='predictionIds']").forEach(input => input.remove());

    // Add checked prediction IDs to the form
    selected.forEach(box => {
        const hidden = document.createElement("input");
        hidden.type = "hidden";
        hidden.name = "predictionIds";
        hidden.value = box.value;
        bulkForm.appendChild(hidden);
    });

    if (!selected.length) {
      e.preventDefault();

      if (window.showFlash) {
        window.showFlash("Please select at least one record.", "warning");
      }

      return;
    }

    if (!bulkAction || !bulkAction.value) {
      e.preventDefault();

      if (window.showFlash) {
        window.showFlash("Please choose a bulk action.", "warning");
      }

      return;
    }

    if (bulkAction.value === "delete") {
      e.preventDefault();

      if (window.openDeleteModal) {
        window.openDeleteModal({
          form: bulkForm,

          title: "Confirm Bulk Delete",

          messageText: `Are you sure you want to delete ${selected.length} selected record(s)?`,

          buttonText: "Delete",

          buttonClass: "btn-danger",
        });
      }
    }
  });
});
