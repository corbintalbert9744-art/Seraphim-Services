const input = document.getElementById("licenseInput");
const error = document.getElementById("error");
const activateBtn = document.getElementById("activateBtn");

function showError(message) {
  error.textContent = message;
  error.classList.remove("hidden");
}

activateBtn.addEventListener("click", async () => {
  error.classList.add("hidden");
  activateBtn.disabled = true;

  try {
    const result = await window.seraphim.activateLicense(input.value.trim());
    if (!result?.ok) {
      showError(result?.reason || "Activation failed");
    }
  } catch (err) {
    showError(err?.message || "Activation failed");
  } finally {
    activateBtn.disabled = false;
  }
});

input.addEventListener("keydown", (event) => {
  if (event.key === "Enter") activateBtn.click();
});
