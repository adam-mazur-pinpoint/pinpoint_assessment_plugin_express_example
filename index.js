import {
  fileToBase64,
  createAssessment,
  updateAssessmentStatus,
  getReportById,
} from "./helpers.mjs";
import express from "express";

const TITLE = "Example Node Assessments Service";
const API_KEY_HEADER = "X_EXAMPLE_ASSESSMENTS_KEY";
const API_BASE_URL_HEADER = "X_EXAMPLE_BASE_URL";

const CORRECT_API_KEY = "ABCDEFG123456789";

const CREATE_ASSESSMENT_META_ENDPOINT = "/createAssessment/meta";
const CREATE_ASSESSMENT_SUBMIT_ENDPOINT = "/createAssessment/submit";
const WEBHOOK_PROCESS_ENDPOINT = "/webhook/process";

// Initialize Express app
const app = express();

// Middleware for logging requests
const loggingMiddleware = (req, res, next) => {
  console.log(
    `${new Date().toISOString()} - ${req.method} ${req.url} ${res.statusCode}`
  );
  next();
};

// set up a logger method
const logger = (message, type = "info") => {
  const timestamp = new Date().toISOString();
  switch (type) {
    case "warn":
      console.warn(`${timestamp} - WARN: ${message}`);
      break;
    case "error":
      console.error(`${timestamp} - ERROR: ${message}`);
      break;
    default:
      console.log(`${timestamp} - INFO: ${message}`);
      break;
  }
};

// Apply middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(loggingMiddleware);

// Define routes
app.get("/healthcheck", (_req, res) => {
  res.send({ message: "OK" });
});

app.post("/", (req, res) => {
  res.send({
    version: "1.0.0",
    name: TITLE,
    logoBase64: fileToBase64("logo.png"),
    actions: [
      {
        key: "createAssessment",
        label: "Send to Node ExampleAssessments",
        iconSvgBase64: fileToBase64("action-logo.svg"),
        metaEndpoint: CREATE_ASSESSMENT_META_ENDPOINT,
        mappings: [
          {
            key: "firstName",
            label: "First Name",
            value: "{{candidate_first_name}}",
          },
          {
            key: "lastName",
            label: "Last Name",
            value: "{{candidate_last_name}}",
          },
          { key: "email", label: "Email", value: "{{candidate_email}}" },
          { key: "cvDocument", value: "{{candidate_cv}}" },
        ],
      },
    ],
    webhookProcessEndpoint: WEBHOOK_PROCESS_ENDPOINT,
    webhookAuthenticationHeader: "X-Verify",
    configurationFormFields: [
      {
        key: "apiKey",
        label: "API Key",
        description:
          "Your API key for ExampleAssessments. The correct key is #{CORRECT_API_KEY}",
        type: "string",
        required: true,
        sensitive: true,
        useAsHttpHeader: API_KEY_HEADER,
        placeholder: "For example: uogKYdo4Foufve82P_*Mrpm7uu-bY2AwG7ur.usf",
      },
      {
        key: "apiBaseUrl",
        label: "Base URL",
        description:
          "Your Base URL for ExampleAssessments. Use `http://localhost:14568` if running local Sinatra server.",
        type: "string",
        required: true,
        sensitive: false,
        useAsHttpHeader: API_BASE_URL_HEADER,
        placeholder: "For example: http://localhost:14568",
      },
    ],
  });
});

app.post(CREATE_ASSESSMENT_META_ENDPOINT, (req, res) => {
  const headers = req.headers;
  logger(`Headers: ${JSON.stringify(headers)}`);
  logger(`Body: ${JSON.stringify(req.body)}`);

  const options = [
    { value: "js_test_001", label: "JavaScript Developer Test" },
    { value: "py_test_001", label: "Python Developer Test" },
    { value: "rb_test_001", label: "Ruby Developer Test" },
  ];

  if (
    headers.x_example_assessments_key !== CORRECT_API_KEY ||
    !headers.x_example_base_url
  ) {
    return res.send({
      actionVersion: "1.0.0",
      key: "createAssessment",
      label: "Send to ExampleAssessments",
      description:
        "Sends a candidate to the internal ExampleAssessments system",
      formFields: [
        {
          key: "apiKeyCallout",
          type: "callout",
          label: "No API key",
          intent: "danger",
          description: "Please configure the plugin with an API Key.",
        },
      ],
      submitEndpoint: CREATE_ASSESSMENT_SUBMIT_ENDPOINT,
    });
  }

  res.send({
    actionVersion: "1.0.0",
    key: "createAssessment",
    label: "Send to ExampleAssessments",
    description: "Sends a candidate to the internal ExampleAssessments system",
    formFields: [
      {
        key: "selectedTest",
        label: "Selected Test",
        placeholder: "Select test...",
        type: "string",
        required: true,
        value: "",
        singleSelectOptions: options,
      },
      {
        key: "firstName",
        label: "First Name",
        type: "string",
        required: true,
        readonly: false,
        includeValueInRefetch: true,
      },
      {
        key: "lastName",
        label: "Last Name",
        type: "string",
        required: true,
        readonly: false,
      },
      {
        key: "email",
        label: "Email",
        type: "string",
        required: true,
        readonly: false,
      },
    ],
    submitEndpoint: CREATE_ASSESSMENT_SUBMIT_ENDPOINT,
  });
});

app.post(CREATE_ASSESSMENT_SUBMIT_ENDPOINT, (req, res) => {
  logger(`Headers: ${JSON.stringify(req.headers)}`);
  logger(`Body: ${JSON.stringify(req.body)}`);

  const formDataObject = Object.fromEntries(
    req.body.formFields.map((field) => [field.key, field.value])
  );
  const guid = Math.random().toString(36).substring(2, 15);
  const reportUrl = req.headers.x_example_base_url + "/reports/" + guid;
  formDataObject.pinpointId = req.body.generatedUuid;
  formDataObject.id = guid;
  formDataObject.redirectUrl = req.body.generatedUuidRedirectUrl;
  formDataObject.webhookUrl = req.body.webhookUrl;
  formDataObject.reportUrl = reportUrl;
  formDataObject.status = "pending";
  formDataObject.createdAt = new Date().toISOString();
  formDataObject.updatedAt = new Date().toISOString();

  logger(`Form Data Object: ${JSON.stringify(formDataObject)}`);

  createAssessment(formDataObject);
  res.send({
    resultVersion: "1.0.0",
    key: "createAssessment",
    success: true,
    assessmentName: formDataObject.selectedTest,
    message: [
      `${formDataObject.firstName} was successfully sent to the example assessment plugin.`,
      `Last name was ${formDataObject.lastName}.`,
      `The external ID was ${formDataObject.id}.`,
    ].join(" "),
    status: "pending",
    externalIdentifier: guid,
    externalRecordUrl: formDataObject.reportUrl,
    externalLinks: [],
  });

  // Simulate status update after 10 seconds
  setTimeout(() => {
    const newStatus = "completed"; // This could be any status from ALLOWED_STATUSES
    updateAssessmentStatus(guid, newStatus);
  }, 10000);
});

app.post(WEBHOOK_PROCESS_ENDPOINT, (req, res) => {
  const { assessmentData } = JSON.parse(req.body.body);

  logger(`Webhook Body: ${JSON.stringify(assessmentData)}`);
  res.send({
    resultVersion: "1.0.0",
    success: true,
    updateAssessments: [
      {
        externalIdentifier: assessmentData.id,
        status: "completed",
        shouldNotify: true,
        score: 85,
        externalLinks: [
          {
            key: "report",
            label: "Report",
            url: assessmentData.reportUrl,
          },
        ],
      },
    ],
  });
});

app.get("/reports/:id", (req, res) => {
  const reportId = req.params.id;
  logger(`Fetching report for ID: ${reportId}`);
  const report = getReportById(reportId);
  if (!report) {
    return res.status(404).send("Report not found");
  }
  res.send(`
    <h1>Report for ${report.firstName} ${report.lastName}</h1>
    <p>Email: ${report.email}</p>
    <p>Test: ${report.selectedTest}</p>
    <p>Status: ${report.status}</p>
    <h2>Results</h2>
    <pre>${JSON.stringify(report.score, null, 2)}</pre>
  `);
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
