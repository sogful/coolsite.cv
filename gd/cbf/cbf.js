(() => {
  
  const form = document.querySelector(".passwordform");
  const field = document.querySelector(".passwordfield");
  const input = document.querySelector(".passwordinput");
  const submit = document.querySelector(".passwordsubmit");
  const result = document.querySelector(".lookupresult");
  const labels = {username: "Username", email: "Email", password: "Password", phone: "Phone number"};
  const choices = [...document.querySelectorAll(".lookupchoice")];
  const stats = document.querySelector(".cbfstats");
  const endpoint = "https://cbf.coolsite.cv";
  const requestoptions = {cache: "no-store", credentials: "omit", referrerPolicy: "no-referrer"};
  let checking = false;
  let mode = "password";

  function showresult(message, tone = "") {
    result.classList.toggle("isunsafe", tone === "unsafe");
    result.classList.toggle("isclear", tone === "clear");
    result.textContent = message;
  }

  for (const choice of choices) {
    choice.addEventListener("click", () => {
      if (checking || mode === choice.dataset.field) return;
      mode = choice.dataset.field;
      const label = labels[mode];
      for (const button of choices) button.setAttribute("aria-pressed", String(button === choice));
      input.value = "";
      input.type = mode === "password" ? "password" : "text";
      input.inputMode = mode === "phone" ? "tel" : mode === "email" ? "email" : "text";
      input.placeholder = label;
      field.querySelector(".screenreadertext").textContent = label + " to check";
      submit.querySelector("img").alt = "Check " + label.toLowerCase();
      showresult("");
      input.focus();
    });
  }

  window.addEventListener("pageshow", () => {
    input.value = "";
  });

  /*//////////////////////////////////////////////////////////////////////*/

  function requesturl(path) {
    return endpoint + path + (path === "/api/identifier/check" ? "" : "?key=cbfsrch");
  }

  async function loadstats() {
    const response = await fetch(requesturl("/api/stats"), {...requestoptions, signal: AbortSignal.timeout(8000)});
    if (!response.ok) throw Error("Record totals unavailable.");
    const totals = await response.json();
    for (const item of stats.querySelectorAll(".cbfstat")) {
      const count = totals[item.dataset.field];
      if (!Number.isSafeInteger(count) || count <= 0) {
        item.hidden = true;
        continue;
      }
      item.querySelector(".cbfstatnumber").textContent = count.toLocaleString();
    }
    stats.hidden = !stats.querySelector(".cbfstat:not([hidden])");
  }

  loadstats().catch(() => {
    if (!checking && !result.textContent) showresult("Checker unavailable.", "unsafe");
  });

  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (!input.value || checking) return;
    const value = input.value;
    checking = true;
    submit.disabled = true;
    showresult("Checking...");
    try {
      let path = "/api/identifier/check";
      let body;
      if (mode === "password") {
        path = "/api/password/check";
        const password = new TextEncoder().encode(value);
        const bytes = await crypto.subtle.digest("SHA-256", password).finally(() => password.fill(0));
        body = Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, "0")).join("");
      } else {
        body = JSON.stringify({field: mode, value});
      }
      const response = await fetch(requesturl(path), {
        ...requestoptions, method: "POST", body, signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) throw Error("Check unavailable.");
      const {count} = await response.json();
      if (!Number.isSafeInteger(count) || count < 0) throw Error("Invalid password count.");
      if (count) showresult(`Oh no!\nThis ${labels[mode].toLowerCase()} appears in ${count.toLocaleString()} records.`, "unsafe");
      else showresult("Nothing found, you're probably safe!", "clear");
    } catch {
      showresult("The check is unavailable. Try again shortly.", "unsafe");
    } finally {
      checking = false;
      submit.disabled = false;
    }
  });
})();
