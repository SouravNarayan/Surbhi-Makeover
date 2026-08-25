(function () {
  "use strict";

  var CONFIG = window.__SALON_CONFIG__ || {};

  /* ---------------- nav scroll state ---------------- */
  var nav = document.getElementById("nav");
  function onScroll() {
    if (window.scrollY > 12) nav.classList.add("scrolled");
    else nav.classList.remove("scrolled");
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------------- mobile menu ---------------- */
  var burger = document.getElementById("navBurger");
  var mobileMenu = document.getElementById("navMobile");
  burger.addEventListener("click", function () {
    var isOpen = mobileMenu.classList.toggle("open");
    burger.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });
  mobileMenu.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", function () {
      mobileMenu.classList.remove("open");
      burger.setAttribute("aria-expanded", "false");
    });
  });

  /* ---------------- scroll-draw motifs & dividers ---------------- */
  var drawTargets = document.querySelectorAll(".motif, [data-animate-line]");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3 }
    );
    drawTargets.forEach(function (el) { io.observe(el); });
  } else {
    drawTargets.forEach(function (el) { el.classList.add("in-view"); });
  }

  /* ---------------- footer year ---------------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------------- booking modal open/close ---------------- */
  var backdrop = document.getElementById("bookingBackdrop");
  var closeBtn = document.getElementById("bookingClose");
  var closeSuccessBtn = document.getElementById("closeSuccessBtn");
  var formWrap = document.getElementById("bookingFormWrap");
  var successWrap = document.getElementById("bookingSuccessWrap");
  var lastFocused = null;

  function openModal() {
    lastFocused = document.activeElement;
    backdrop.classList.add("open");
    document.body.style.overflow = "hidden";
    var firstInput = backdrop.querySelector("input, select, button");
    if (firstInput) firstInput.focus();
  }

  function closeModal() {
    backdrop.classList.remove("open");
    document.body.style.overflow = "";
    if (lastFocused) lastFocused.focus();
    // reset to form view after the close transition
    setTimeout(function () {
      formWrap.hidden = false;
      successWrap.hidden = true;
    }, 250);
  }

  document.querySelectorAll("[data-open-booking]").forEach(function (btn) {
    btn.addEventListener("click", openModal);
  });
  closeBtn.addEventListener("click", closeModal);
  closeSuccessBtn.addEventListener("click", closeModal);
  backdrop.addEventListener("click", function (e) {
    if (e.target === backdrop) closeModal();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && backdrop.classList.contains("open")) closeModal();
  });

  /* ---------------- form validation + submission ---------------- */
  var form = document.getElementById("bookingForm");
  var errorEl = document.getElementById("formError");
  var submitBtn = document.getElementById("submitBtn");

  function formatDate(iso) {
    if (!iso) return "";
    var d = new Date(iso + "T00:00:00");
    if (isNaN(d)) return iso;
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  }

  function formatTime(t) {
    if (!t) return "";
    var parts = t.split(":");
    var h = parseInt(parts[0], 10);
    var m = parts[1];
    var suffix = h >= 12 ? "PM" : "AM";
    var h12 = h % 12 === 0 ? 12 : h % 12;
    return h12 + ":" + m + " " + suffix;
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    errorEl.textContent = "";

    var visitTypeEl = form.querySelector('input[name="visitType"]:checked');
    var name = form.name.value.trim();
    var mobile = form.mobile.value.trim();
    var date = form.date.value;
    var time = form.time.value;
    var purpose = form.purpose.value;

    if (!visitTypeEl) {
      errorEl.textContent = "Please choose home visit or salon visit.";
      return;
    }
    if (!name) {
      errorEl.textContent = "Please enter your name.";
      form.name.focus();
      return;
    }
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      errorEl.textContent = "Please enter a valid 10-digit mobile number.";
      form.mobile.focus();
      return;
    }
    if (!date) {
      errorEl.textContent = "Please choose a booking date.";
      form.date.focus();
      return;
    }

    var visitType = visitTypeEl.value;
    var payload = {
      visitType: visitType,
      name: name,
      mobile: mobile,
      date: date,
      time: time,
      purpose: purpose,
      submittedAt: new Date().toISOString()
    };

    submitBtn.disabled = true;
    submitBtn.textContent = "Booking…";

    var gasUrl = CONFIG.gasWebAppUrl;
    var sendPromise;

    if (!gasUrl || gasUrl.indexOf("PASTE_YOUR") === 0) {
      // Backend not configured yet — still show the customer a confirmation
      // so the site is demoable, but log a console warning for the owner.
      console.warn("Google Apps Script URL is not configured in config.json — booking was not saved.");
      sendPromise = Promise.resolve();
    } else {
      // text/plain avoids a CORS preflight, which Apps Script Web Apps don't handle.
      sendPromise = fetch(gasUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload)
      }).then(function (res) {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json().catch(function () { return {}; });
      });
    }

    sendPromise
      .then(function () {
        showSuccess(payload);
      })
      .catch(function (err) {
        console.error(err);
        errorEl.textContent = "Something went wrong sending your booking. Please call or WhatsApp us directly.";
      })
      .finally(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = "Confirm Booking";
      });
  });

  function showSuccess(payload) {
    var dateStr = formatDate(payload.date);
    var timeStr = payload.time ? formatTime(payload.time) : "";
    var whenStr = timeStr ? dateStr + " at " + timeStr : dateStr;

    var msgEl = document.getElementById("successMessage");
    msgEl.textContent =
      "Thank you, " + payload.name + "! Your " + payload.visitType.toLowerCase() +
      " appointment is booked for " + whenStr + ". We'll see you soon.";

    var mapLink = document.getElementById("successMapLink");
    mapLink.href = "https://www.google.com/maps/search/?api=1&query=" + CONFIG.mapLat + "," + CONFIG.mapLng;

    var waText =
      "Hi " + CONFIG.salonName + ", confirming my appointment:\n" +
      "Name: " + payload.name + "\n" +
      "Visit type: " + payload.visitType + "\n" +
      "Date: " + dateStr + (timeStr ? "\nTime: " + timeStr : "") +
      (payload.purpose ? "\nPurpose: " + payload.purpose : "");
    var waLink = document.getElementById("successWaLink");
    waLink.href = "https://wa.me/" + CONFIG.whatsappOwnerNumber + "?text=" + encodeURIComponent(waText);

    formWrap.hidden = true;
    successWrap.hidden = false;
  }
})();
