const uploadForm = document.querySelector("#upload-form");
const statusMessage = document.querySelector("#status-message");
const statusContainer = document.querySelector(".status");
const submitButton = document.querySelector("#submit-button");
const clearButton = document.querySelector("#clear-button");
const resetEndpointButton = document.querySelector("#reset-endpoint");
const endpointInput = document.querySelector("#endpoint");
const documentInput = document.querySelector("#document");

const defaultEndpoint = "https://api.example.com/documents/upload";
const maxFileSizeMb = 25;

const updateStatus = (message, variant = "") => {
  statusMessage.textContent = message;
  statusContainer.classList.remove("success", "error");
  if (variant) {
    statusContainer.classList.add(variant);
  }
};

const validateFile = (file) => {
  if (!file) {
    return "Please choose a document to upload.";
  }

  const sizeMb = file.size / (1024 * 1024);
  if (sizeMb > maxFileSizeMb) {
    return `File size must be under ${maxFileSizeMb} MB.`;
  }

  return "";
};

uploadForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const file = documentInput.files[0];
  const validationError = validateFile(file);
  if (validationError) {
    updateStatus(validationError, "error");
    return;
  }

  const formData = new FormData(uploadForm);
  formData.append("document", file);

  submitButton.disabled = true;
  updateStatus("Uploading document and triggering pipeline...", "");

  try {
    const response = await fetch(endpointInput.value, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed with status ${response.status}.`);
    }

    updateStatus(
      "Upload completed! The backend is extracting data and triggering the Azure DevOps pipeline.",
      "success"
    );
  } catch (error) {
    updateStatus(error.message || "Upload failed. Please try again.", "error");
  } finally {
    submitButton.disabled = false;
  }
});

clearButton.addEventListener("click", () => {
  uploadForm.reset();
  updateStatus("Ready to upload.");
});

resetEndpointButton.addEventListener("click", () => {
  endpointInput.value = defaultEndpoint;
  updateStatus("Endpoint reset to default.");
});

endpointInput.addEventListener("change", () => {
  if (!endpointInput.value) {
    updateStatus("Please provide a backend endpoint URL.", "error");
  }
});

uploadForm.addEventListener("reset", () => {
  statusContainer.classList.remove("success", "error");
});
