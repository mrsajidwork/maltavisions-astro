/**
 * Posts CF7-marked forms on the Astro site to the WordPress CF7 REST endpoint.
 * Expects form markup from WP (wpcf7-form) and optional window.__MV_CF7__.
 */
(function () {
  var cfg = window.__MV_CF7__ || {};
  var origin = (cfg.origin || "https://staging4.maltavisions.com").replace(/\/$/, "");
  var formId = cfg.formId || 66;
  var endpoint = origin + "/wp-json/contact-form-7/v1/contact-forms/" + formId + "/feedback";

  function closestForm(el) {
    return el && el.closest ? el.closest("form.wpcf7-form, form.ct-form") : null;
  }

  document.addEventListener(
    "submit",
    function (event) {
      var form = closestForm(event.target);
      if (!form) return;
      event.preventDefault();

      var status = form.querySelector(".wpcf7-response-output") || form.querySelector("[data-cf7-status]");
      if (status) {
        status.textContent = "Sending…";
        status.setAttribute("aria-hidden", "false");
      }

      var data = new FormData(form);
      if (!data.has("_wpcf7")) data.set("_wpcf7", String(formId));
      if (!data.has("_wpcf7_unit_tag")) data.set("_wpcf7_unit_tag", "wpcf7-f" + formId + "-o1");

      fetch(endpoint, {
        method: "POST",
        body: data,
        credentials: "omit",
      })
        .then(function (res) {
          return res.json().then(function (json) {
            return { ok: res.ok, json: json };
          });
        })
        .then(function (result) {
          var json = result.json || {};
          var message = json.message || (result.ok ? "Thank you." : "Something went wrong.");
          if (status) status.textContent = message;

          if (json.status === "mail_sent" || json.status === "mail_sent".toUpperCase()) {
            form.dispatchEvent(new CustomEvent("wpcf7mailsent", { bubbles: true, detail: json }));
            form.reset();
          } else if (json.invalid_fields && status) {
            status.textContent = message;
          }
        })
        .catch(function () {
          if (status) status.textContent = "Could not send. Please email hello@maltavisions.com.";
        });
    },
    true
  );
})();
