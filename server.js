require("dotenv").config();

const express = require("express");
const nodemailer = require("nodemailer");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;
const wrkitEmail = process.env.WRKIT_EMAIL || "WRKIT.10@GMAIL.COM";

app.use(express.json({ limit: "1mb" }));
app.use(express.static(__dirname));

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ""));
}

function createTransporter() {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error("SMTP_USER and SMTP_PASS are required");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

app.post("/send-test-result", async (req, res) => {
  try {
    const { studentEmail, subject, resultText } = req.body;

    if (!isValidEmail(studentEmail)) {
      return res.status(400).json({ error: "A valid student email is required." });
    }

    if (!resultText || typeof resultText !== "string") {
      return res.status(400).json({ error: "Result text is required." });
    }

    const transporter = createTransporter();
    const recipients = [studentEmail, wrkitEmail];

    await transporter.sendMail({
      from: `WRKIT Career Assessment <${process.env.SMTP_USER}>`,
      to: recipients.join(","),
      subject: subject || "WRKIT Career Assessment Result",
      text: resultText
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Email sending failed:", error.message);
    res.status(500).json({ error: "Email could not be sent." });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "career-assessment-widget.html"));
});

app.listen(port, () => {
  console.log(`WRKIT assessment server running at http://localhost:${port}`);
});