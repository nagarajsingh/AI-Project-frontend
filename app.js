const uploadForm = document.querySelector("#upload-form");
const statusMessage = document.querySelector("#status-message");
const statusContainer = document.querySelector(".status");
const submitButton = document.querySelector("#submit-button");
const validateButton = document.querySelector("#validate-button");
const clearButton = document.querySelector("#clear-button");
const resetEndpointButton = document.querySelector("#reset-endpoint");
const endpointInput = document.querySelector("#endpoint");
const validateEndpointInput = document.querySelector("#validate-endpoint");
const documentInput = document.querySelector("#document");
const jsonOutput = document.querySelector("#json-output");
const jsonOutputContainer = document.querySelector(".json-output");

const defaultEndpoint = "https://api.example.com/documents/upload";
const defaultValidateEndpoint = "https://api.example.com/documents/validate";
const maxFileSizeMb = 25;
let extractedPayload = null;

const updateStatus = (message, variant = "") => {
  statusMessage.textContent = message;
  statusContainer.classList.remove("success", "error");
  if (variant) {
    statusContainer.classList.add(variant);
  }
};

const clearJsonOutput = () => {
  jsonOutput.textContent = "{}";
  jsonOutputContainer.classList.remove("visible");
};

const renderJsonOutput = (payload) => {
  jsonOutput.textContent = JSON.stringify(payload, null, 2);
  jsonOutputContainer.classList.add("visible");
};

const parseResponsePayload = async (response) => {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return { raw_response: text };
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
  validateButton.disabled = true;
  updateStatus("Uploading document and triggering pipeline...", "");

  try {
    const response = await fetch(endpointInput.value, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed with status ${response.status}.`);
    }

    const responsePayload = await parseResponsePayload(response);
    extractedPayload = responsePayload;
    renderJsonOutput(responsePayload);
    validateButton.disabled = false;
    updateStatus(
      "Upload completed! The backend is extracting data and triggering the Azure DevOps pipeline.",
      "success"
    );
  } catch (error) {
    updateStatus(error.message || "Upload failed. Please try again.", "error");
    clearJsonOutput();
    extractedPayload = null;
  } finally {
    submitButton.disabled = false;
  }
});

validateButton.addEventListener("click", async () => {
  if (!extractedPayload) {
    updateStatus("Upload a document first so there is data to validate.", "error");
    return;
  }

  validateButton.disabled = true;
  updateStatus("Validating extracted data...", "");

  const payload = {
    metadata: {
      pipeline: uploadForm.pipeline.value.trim(),
      project: uploadForm.project.value.trim(),
      notes: uploadForm.notes.value.trim(),
    },
    extracted_data: extractedPayload,
  };

  try {
    const response = await fetch(validateEndpointInput.value, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Validation failed with status ${response.status}.`);
    }

    const responsePayload = await parseResponsePayload(response);
    extractedPayload = responsePayload;
    renderJsonOutput(responsePayload);
    updateStatus("Validation completed! See the JSON output below.", "success");
  } catch (error) {
    updateStatus(error.message || "Validation failed. Please try again.", "error");
  } finally {
    validateButton.disabled = false;
  }
});

clearButton.addEventListener("click", () => {
  uploadForm.reset();
  updateStatus("Ready to upload.");
  clearJsonOutput();
  extractedPayload = null;
  validateButton.disabled = true;
});

resetEndpointButton.addEventListener("click", () => {
  endpointInput.value = defaultEndpoint;
  validateEndpointInput.value = defaultValidateEndpoint;
  updateStatus("Endpoints reset to default.");
});

endpointInput.addEventListener("change", () => {
  if (!endpointInput.value) {
    updateStatus("Please provide a backend endpoint URL.", "error");
  }
});

validateEndpointInput.addEventListener("change", () => {
  if (!validateEndpointInput.value) {
    updateStatus("Please provide a validation endpoint URL.", "error");
  }
});

uploadForm.addEventListener("reset", () => {
  statusContainer.classList.remove("success", "error");
});

clearJsonOutput();
