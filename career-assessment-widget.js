(function () {
      var root = document.getElementById("wrkit-aptitude-test");
      if (!root) return;

      var form = root.querySelector("#wrkitAssessmentForm");
      var formArea = root.querySelector("#wrkitFormArea");
      var resultArea = root.querySelector("#wrkitResult");
      var steps = Array.prototype.slice.call(root.querySelectorAll(".wrkit-step"));
      var progressBar = root.querySelector("#wrkitProgressBar");
      var stepCount = root.querySelector("#wrkitStepCount");
      var currentStep = 1;
      var totalSteps = steps.length;
      var latestAnswers = null;
      var latestResult = null;
      var emailEndpoint = "/send-test-result";
      var wrkitEmail = "WRKIT.10@GMAIL.COM";

      var fieldOptions = ["WordPress Development", "Prompt Engineering", "AI Image Creation", "AI Video Creation", "YouTube Automation", "YouTube Editing", "Short Form Editing", "Graphic Design", "Google Ads", "Facebook Ads", "Copywriting", "Affiliate Marketing", "Digital Product Selling", "AI Agent Development", "AI SaaS Building", "Webflow Development", "SaaS Development / No-code", "Automation Development", "AI Chatbot Development", "UI/UX Design", "SEO", "Ecommerce / Dropshipping", "Vibe Coding", "Freelancing", "Not sure yet"];
      var toolOptions = ["Canva", "CapCut", "Adobe Photoshop", "Adobe Illustrator", "Figma", "WordPress", "Shopify", "Webflow", "ChatGPT", "AI image tools", "Google Ads", "Facebook Ads Manager", "Google Analytics", "Excel / Google Sheets", "VS Code", "No-code tools", "None of these"];
      var clusterLabels = { technical: "Technical / Development", creative: "Creative / Visual", marketing: "Marketing / Growth", content: "Content / Media", ai: "AI / Automation", business: "Business / Freelancing" };
      var fieldClusterMap = {
        "WordPress Development": ["technical"], "Webflow Development": ["technical"], "AI Agent Development": ["technical", "ai"], "AI SaaS Building": ["technical", "ai"], "Automation Development": ["technical", "ai"], "AI Chatbot Development": ["technical", "ai"], "Vibe Coding": ["technical", "ai"], "SaaS Development / No-code": ["technical"],
        "Graphic Design": ["creative"], "UI/UX Design": ["creative"], "AI Image Creation": ["creative", "ai"], "AI Video Creation": ["creative", "content", "ai"], "YouTube Editing": ["creative", "content"], "Short Form Editing": ["creative", "content"],
        "Google Ads": ["marketing", "business"], "Facebook Ads": ["marketing", "business"], "SEO": ["marketing"], "Copywriting": ["marketing", "content", "business"], "Affiliate Marketing": ["marketing", "business"], "Digital Product Selling": ["marketing", "business"], "Ecommerce / Dropshipping": ["marketing", "business"],
        "YouTube Automation": ["content"], "Prompt Engineering": ["ai"], "Freelancing": ["business"]
      };
      var clusterData = {
        "Technical / Development": { fields: ["WordPress Development", "Webflow Development", "Website Development", "No-code Development", "AI Chatbot Development"], firstPath: "WordPress Development Basics", secondPath: "SEO Basics or UI/UX Basics", internshipMessage: "You may move toward a website development or web support internship after completing focused training.", explanation: "You show strong indicators for structured problem-solving and building practical digital products." },
        "Creative / Visual": { fields: ["Graphic Design", "UI/UX Design", "AI Image Creation", "Short Form Editing", "Brand / Social Media Design"], firstPath: "Graphic Design Basics", secondPath: "UI/UX Design or Short Form Editing", internshipMessage: "You may move toward a design or visual content internship after building a basic portfolio.", explanation: "You show strong indicators for visual thinking, presentation, and improving how ideas look and feel." },
        "Marketing / Growth": { fields: ["Facebook Ads", "Google Ads", "SEO", "Copywriting", "Social Media Marketing"], firstPath: "Copywriting or Social Media Marketing Basics", secondPath: "Facebook Ads or Google Ads Basics", internshipMessage: "You may move toward a marketing or ads internship after learning campaign basics and reporting.", explanation: "You show strong indicators for understanding audiences, communication, and online growth." },
        "Content / Media": { fields: ["Short Form Editing", "YouTube Editing", "YouTube Automation", "AI Video Creation", "Content Writing"], firstPath: "Short Form Editing Basics", secondPath: "YouTube Automation or AI Video Creation", internshipMessage: "You may move toward video editing, content production, or AI content internship after practice.", explanation: "You show strong indicators for explaining ideas, creating messages, and communicating with an audience." },
        "AI / Automation": { fields: ["Prompt Engineering", "AI Automation", "AI Chatbot Development", "AI Agent Development", "No-code Automation"], firstPath: "Prompt Engineering Basics", secondPath: "AI Automation or AI Chatbot Development", internshipMessage: "You may move toward AI workflow or automation internship after learning tools and logic.", explanation: "You show strong indicators for using modern tools, improving speed, and finding smarter workflows." },
        "Business / Freelancing": { fields: ["Freelancing", "Ecommerce", "Affiliate Marketing", "Digital Product Selling", "Business Development"], firstPath: "Freelancing Basics", secondPath: "Copywriting, Ecommerce, or Facebook Ads Basics", internshipMessage: "You may move toward business support, ecommerce support, or client communication roles after training.", explanation: "You show strong indicators for planning, service thinking, and turning skills into practical opportunities." }
      };

      function createCheckboxes(containerId, name, options) {
        var container = root.querySelector(containerId);
        options.forEach(function (option) {
          var label = document.createElement("label");
          label.className = "wrkit-option";
          label.innerHTML = '<input type="checkbox" name="' + name + '" value="' + option + '"><span>' + option + '</span>';
          container.appendChild(label);
        });
      }

      function fillSelect(selector, options) {
        var select = root.querySelector(selector);
        options.forEach(function (option) {
          var item = document.createElement("option");
          item.value = option;
          item.textContent = option;
          select.appendChild(item);
        });
      }

      createCheckboxes("#wrkitResearchedFields", "researchedFields", fieldOptions);
      createCheckboxes("#wrkitToolsUsed", "toolsUsed", toolOptions);
      fillSelect("#wrkitFirstInterest", fieldOptions);
      fillSelect("#wrkitSecondInterest", fieldOptions);

      function updateSelectedStyles() {
        root.querySelectorAll(".wrkit-option").forEach(function (option) {
          var input = option.querySelector("input");
          option.classList.toggle("is-selected", !!input && input.checked);
        });
      }

      function hideErrors() {
        root.querySelectorAll(".wrkit-error").forEach(function (error) { error.classList.remove("is-visible"); });
      }

      function goToStep(stepIndex) {
        currentStep = Math.max(1, Math.min(totalSteps, stepIndex));
        steps.forEach(function (step) { step.classList.toggle("is-active", Number(step.getAttribute("data-step")) === currentStep); });
        progressBar.style.width = ((currentStep / totalSteps) * 100) + "%";
        stepCount.textContent = "Step " + currentStep + " of " + totalSteps;
        hideErrors();
        updateSelectedStyles();
      }

      function validateStep(stepIndex) {
        var activeStep = root.querySelector('.wrkit-step[data-step="' + stepIndex + '"]');
        var requiredQuestions = Array.prototype.slice.call(activeStep.querySelectorAll("[data-required]"));
        var valid = requiredQuestions.every(function (question) {
          var name = question.getAttribute("data-required");
          var field = question.querySelector('[name="' + name + '"]');
          if (!field) return false;
          if (field.type === "checkbox" || field.type === "radio") return !!root.querySelector('input[name="' + name + '"]:checked');
          return String(field.value || "").trim().length > 0;
        });
        var error = activeStep.querySelector(".wrkit-error");
        if (error) error.classList.toggle("is-visible", !valid);
        return valid;
      }

      function getCheckedValue(name) {
        var checked = root.querySelector('input[name="' + name + '"]:checked');
        return checked ? checked.value : "";
      }

      function getCheckedValues(name) {
        return Array.prototype.slice.call(root.querySelectorAll('input[name="' + name + '"]:checked')).map(function (input) { return input.value; });
      }

      function getFieldValue(name) {
        var field = root.querySelector('[name="' + name + '"]');
        return field ? String(field.value || "").trim() : "";
      }

      function collectAnswers() {
        return {
          studentName: getFieldValue("studentName"), studentEmail: getFieldValue("studentEmail"), ageGroup: getCheckedValue("ageGroup"), educationLevel: getCheckedValue("educationLevel"), fieldOfStudy: getFieldValue("fieldOfStudy"),
          researchedFields: getCheckedValues("researchedFields"), firstInterest: getFieldValue("firstInterest"), secondInterest: getFieldValue("secondInterest"), interestReason: getCheckedValue("interestReason"), careerAttraction: getCheckedValue("careerAttraction"),
          computerSkillLevel: getCheckedValue("computerSkillLevel"), toolsUsed: getCheckedValues("toolsUsed"), easiestTask: getCheckedValue("easiestTask"), difficultTask: getCheckedValue("difficultTask"),
          newToolApproach: getCheckedValue("newToolApproach"), problemTypeEnjoyed: getCheckedValue("problemTypeEnjoyed"), unclearInstructionsResponse: getCheckedValue("unclearInstructionsResponse"), thinkingStyle: getCheckedValue("thinkingStyle"), workSatisfaction: getCheckedValue("workSatisfaction"),
          learningConsistency: getCheckedValue("learningConsistency"), feedbackHandling: getCheckedValue("feedbackHandling"), workingStyle: getCheckedValue("workingStyle"), environmentPreference: getCheckedValue("environmentPreference"), deadlinePerformance: getCheckedValue("deadlinePerformance"),
          learningHours: getCheckedValue("learningHours"), deviceAvailability: getCheckedValue("deviceAvailability"), internetAvailability: getCheckedValue("internetAvailability"), internshipInterest: getCheckedValue("internshipInterest"), communicationComfort: getCheckedValue("communicationComfort")
        };
      }

      function getClusterForField(fieldName) {
        return fieldClusterMap[fieldName] || [];
      }

      function calculateScores(answers) {
        var careerScores = { technical: 0, creative: 0, marketing: 0, content: 0, ai: 0, business: 0 };
        var readinessScores = { discipline: 0, workStyle: 0, practical: 0, communication: 0, risk: 0, guidanceNeed: 0 };
        function addCareer(key, amount) { if (careerScores[key] !== undefined) careerScores[key] += amount; }
        function scoreField(field, amount) { getClusterForField(field).forEach(function (key) { addCareer(key, amount); }); }
        function direct(value, amount, map) { if (map[value]) addCareer(map[value], amount); }

        answers.researchedFields.forEach(function (field) { scoreField(field, 1); });
        scoreField(answers.firstInterest, 8);
        scoreField(answers.secondInterest, 5);

        if (answers.interestReason === "I genuinely enjoy this type of work") scoreField(answers.firstInterest, 3);
        else if (answers.interestReason === "It has good income potential") { addCareer("business", 1); scoreField(answers.firstInterest, 1); }
        else if (answers.interestReason === "It looks easy to start") readinessScores.risk += 2;
        else if (answers.interestReason === "It is trending nowadays") { readinessScores.risk += 2; readinessScores.guidanceNeed += 1; }
        else if (answers.interestReason === "Someone recommended it to me") readinessScores.risk += 1;
        else if (answers.interestReason === "I already have some basic skill in it") scoreField(answers.firstInterest, 3);
        else if (answers.interestReason === "I am not fully sure yet") readinessScores.risk += 2;

        if (answers.careerAttraction === "High income") { addCareer("business", 4); addCareer("marketing", 2); }
        else if (answers.careerAttraction === "Creative work") addCareer("creative", 5);
        else if (answers.careerAttraction === "Technical problem solving") { addCareer("technical", 5); addCareer("ai", 2); }
        else if (answers.careerAttraction === "Remote work / freelancing") addCareer("business", 5);
        else if (answers.careerAttraction === "Business and growth") { addCareer("marketing", 4); addCareer("business", 3); }
        else if (answers.careerAttraction === "Stability and long-term job") { readinessScores.practical += 3; readinessScores.discipline += 2; }
        else if (answers.careerAttraction === "Learning modern AI tools") addCareer("ai", 5);
        else if (answers.careerAttraction === "Helping or communicating with people") { addCareer("marketing", 3); readinessScores.communication += 3; }

        if (answers.computerSkillLevel === "Very weak") { readinessScores.risk += 3; readinessScores.guidanceNeed += 2; }
        else if (answers.computerSkillLevel === "Basic") readinessScores.practical += 1;
        else if (answers.computerSkillLevel === "Average") readinessScores.practical += 3;
        else if (answers.computerSkillLevel === "Good") { readinessScores.practical += 4; addCareer("technical", 1); }
        else if (answers.computerSkillLevel === "Very good") { readinessScores.practical += 5; addCareer("technical", 2); addCareer("ai", 1); }

        var toolMap = { "Canva": "creative", "CapCut": "content", "Adobe Photoshop": "creative", "Adobe Illustrator": "creative", "Figma": "creative", "WordPress": "technical", "Shopify": "business", "Webflow": "technical", "ChatGPT": "ai", "AI image tools": "ai", "Google Ads": "marketing", "Facebook Ads Manager": "marketing", "Google Analytics": "marketing", "Excel / Google Sheets": "business", "VS Code": "technical", "No-code tools": "ai" };
        answers.toolsUsed.forEach(function (tool) { if (toolMap[tool]) addCareer(toolMap[tool], 1.5); });
        if (answers.toolsUsed.indexOf("None of these") !== -1) { readinessScores.guidanceNeed += 2; readinessScores.risk += 1; }

        var easiestMap = { "Designing visuals": "creative", "Editing videos": "content", "Writing captions or content": "content", "Solving technical problems": "technical", "Managing social media or ads": "marketing", "Researching information": "ai", "Organizing tasks and processes": "ai", "Talking to people or clients": "business", "Building websites or apps": "technical" };
        direct(answers.easiestTask, 5, easiestMap);
        if (answers.easiestTask === "I am not sure") readinessScores.guidanceNeed += 2;

        if (answers.difficultTask === "Understanding technical tools") careerScores.technical -= 2;
        else if (answers.difficultTask === "Designing attractive visuals") careerScores.creative -= 2;
        else if (answers.difficultTask === "Writing good content") careerScores.content -= 2;
        else if (answers.difficultTask === "Speaking confidently") readinessScores.communication -= 2;
        else if (answers.difficultTask === "Working with numbers or data") careerScores.marketing -= 1;
        else if (answers.difficultTask === "Staying consistent") { readinessScores.discipline -= 3; readinessScores.risk += 3; }
        else if (answers.difficultTask === "Following detailed instructions") readinessScores.practical -= 2;
        else if (answers.difficultTask === "Learning alone") readinessScores.guidanceNeed += 3;
        else if (answers.difficultTask === "Managing deadlines") { readinessScores.discipline -= 2; readinessScores.risk += 2; }

        if (answers.newToolApproach === "Explore it myself and test things") { addCareer("technical", 3); addCareer("ai", 2); readinessScores.practical += 3; }
        else if (answers.newToolApproach === "Watch tutorials first") readinessScores.practical += 3;
        else if (answers.newToolApproach === "Ask someone to guide me") readinessScores.guidanceNeed += 2;
        else if (answers.newToolApproach === "Read documentation or instructions") { addCareer("technical", 2); readinessScores.practical += 2; }
        else if (answers.newToolApproach === "Avoid it until necessary") readinessScores.risk += 3;
        else if (answers.newToolApproach === "I get confused quickly") { readinessScores.risk += 4; readinessScores.guidanceNeed += 3; }

        var problemMap = { "Visual/design problem": "creative", "Technical/software problem": "technical", "Marketing/sales problem": "marketing", "Writing/communication problem": "content", "Business/income problem": "business", "Organization/process problem": "ai" };
        direct(answers.problemTypeEnjoyed, 5, problemMap);
        if (answers.problemTypeEnjoyed === "I do not enjoy problem solving much") readinessScores.risk += 2;

        if (answers.unclearInstructionsResponse === "Ask questions to clarify") { readinessScores.communication += 3; readinessScores.practical += 2; }
        else if (answers.unclearInstructionsResponse === "Start with my best understanding") readinessScores.practical += 3;
        else if (answers.unclearInstructionsResponse === "Search examples online") { addCareer("ai", 2); readinessScores.practical += 2; }
        else if (answers.unclearInstructionsResponse === "Wait until someone explains everything") readinessScores.guidanceNeed += 2;
        else if (answers.unclearInstructionsResponse === "Feel stuck and lose motivation") { readinessScores.risk += 4; readinessScores.guidanceNeed += 2; }

        var thinkingMap = { "I think visually": "creative", "I think logically": "technical", "I think creatively": "content", "I think practically": "business", "I think through examples": "ai", "I think through people and communication": "marketing" };
        direct(answers.thinkingStyle, 4, thinkingMap);
        if (answers.thinkingStyle === "I am still discovering this") readinessScores.guidanceNeed += 2;

        var satisfactionMap = { "Creating something beautiful": "creative", "Building something functional": "technical", "Getting measurable results": "marketing", "Helping people understand something": "content", "Solving a difficult issue": "ai", "Completing organized tasks": "ai", "Earning from a skill": "business" };
        direct(answers.workSatisfaction, 5, satisfactionMap);

        if (answers.learningConsistency === "Very consistent") readinessScores.discipline += 5;
        else if (answers.learningConsistency === "Mostly consistent") readinessScores.discipline += 4;
        else if (answers.learningConsistency === "Sometimes consistent") readinessScores.discipline += 2;
        else if (answers.learningConsistency === "I start with excitement but stop later") { readinessScores.discipline -= 1; readinessScores.risk += 3; }
        else if (answers.learningConsistency === "I struggle with consistency") { readinessScores.discipline -= 3; readinessScores.risk += 4; }

        if (answers.feedbackHandling === "I like feedback and improve from it") { readinessScores.practical += 4; readinessScores.discipline += 2; }
        else if (answers.feedbackHandling === "I accept feedback but need time") readinessScores.practical += 3;
        else if (answers.feedbackHandling === "I feel bad first but later improve") readinessScores.practical += 2;
        else if (answers.feedbackHandling === "I usually get demotivated") readinessScores.risk += 3;
        else if (answers.feedbackHandling === "I do not like being corrected") { readinessScores.risk += 5; readinessScores.practical -= 2; }

        if (answers.workingStyle === "Working alone") { addCareer("technical", 1); addCareer("creative", 1); }
        else if (answers.workingStyle === "Working in a team") { readinessScores.communication += 3; addCareer("marketing", 1); }
        else if (answers.workingStyle === "Mixed: alone + team") { readinessScores.practical += 3; readinessScores.communication += 2; }
        else if (answers.workingStyle === "Working under direct supervision") readinessScores.practical += 1;
        else if (answers.workingStyle === "Not sure yet") readinessScores.risk += 1;

        if (answers.environmentPreference === "Structured tasks with clear steps") { addCareer("technical", 2); readinessScores.practical += 4; }
        else if (answers.environmentPreference === "Creative freedom") addCareer("creative", 4);
        else if (answers.environmentPreference === "Fast-paced work") { addCareer("marketing", 3); addCareer("business", 2); }
        else if (answers.environmentPreference === "Slow and detailed work") { addCareer("technical", 3); addCareer("creative", 1); }
        else if (answers.environmentPreference === "Client-facing work") { addCareer("marketing", 3); addCareer("business", 3); readinessScores.communication += 3; }
        else if (answers.environmentPreference === "Backend work without much communication") { addCareer("technical", 3); addCareer("ai", 2); }

        if (answers.deadlinePerformance === "I perform better under deadlines") { readinessScores.discipline += 4; readinessScores.practical += 2; }
        else if (answers.deadlinePerformance === "I can manage deadlines normally") { readinessScores.discipline += 3; readinessScores.practical += 2; }
        else if (answers.deadlinePerformance === "I need reminders") readinessScores.risk += 2;
        else if (answers.deadlinePerformance === "I become stressed but try") { readinessScores.discipline += 1; readinessScores.risk += 1; }
        else if (answers.deadlinePerformance === "I struggle badly with deadlines") { readinessScores.discipline -= 3; readinessScores.risk += 4; }

        if (answers.learningHours === "Less than 1 hour") { readinessScores.practical += 1; readinessScores.risk += 3; }
        else if (answers.learningHours === "1–2 hours") readinessScores.practical += 2;
        else if (answers.learningHours === "2–3 hours") readinessScores.practical += 4;
        else if (answers.learningHours === "3–5 hours") readinessScores.practical += 5;
        else if (answers.learningHours === "More than 5 hours") { readinessScores.practical += 5; readinessScores.discipline += 1; }

        if (answers.deviceAvailability === "Yes, personal laptop/computer") readinessScores.practical += 5;
        else if (answers.deviceAvailability === "Yes, shared laptop/computer") readinessScores.practical += 3;
        else if (answers.deviceAvailability === "No, but I can arrange") { readinessScores.practical += 1; readinessScores.risk += 2; }
        else if (answers.deviceAvailability === "No") readinessScores.risk += 5;

        if (answers.internetAvailability === "Strong and reliable") readinessScores.practical += 5;
        else if (answers.internetAvailability === "Average but manageable") readinessScores.practical += 3;
        else if (answers.internetAvailability === "Weak") { readinessScores.practical += 1; readinessScores.risk += 3; }
        else if (answers.internetAvailability === "Not available regularly") readinessScores.risk += 5;

        if (answers.internshipInterest === "Yes, definitely") { readinessScores.practical += 4; readinessScores.discipline += 2; }
        else if (answers.internshipInterest === "Yes, if I feel ready") readinessScores.practical += 3;
        else if (answers.internshipInterest === "Maybe") readinessScores.practical += 1;
        else if (answers.internshipInterest === "Not sure") readinessScores.risk += 1;
        else if (answers.internshipInterest === "No") readinessScores.risk += 2;

        if (answers.communicationComfort === "I can confidently talk to clients") { readinessScores.communication += 5; addCareer("marketing", 2); addCareer("business", 2); }
        else if (answers.communicationComfort === "I can communicate with team only") readinessScores.communication += 3;
        else if (answers.communicationComfort === "I prefer written communication") { readinessScores.communication += 2; addCareer("content", 2); }
        else if (answers.communicationComfort === "I feel shy but can improve") { readinessScores.communication += 1; readinessScores.risk += 1; }
        else if (answers.communicationComfort === "I avoid communication-heavy work") { readinessScores.communication -= 2; addCareer("technical", 1); }

        Object.keys(careerScores).forEach(function (key) { careerScores[key] = Math.max(0, careerScores[key]); });
        return { careerScores: careerScores, readinessScores: readinessScores };
      }

      function generateRecommendations(scores, answers) {
        var careerScores = scores.careerScores;
        var readinessScores = scores.readinessScores;
        var sortedKeys = Object.keys(careerScores).sort(function (a, b) { return careerScores[b] - careerScores[a]; });
        var primaryKey = sortedKeys[0];
        var secondaryKey = sortedKeys[1];
        var topScore = careerScores[primaryKey];
        var secondScore = careerScores[secondaryKey];
        var totalCareerScore = Object.keys(careerScores).reduce(function (sum, key) { return sum + careerScores[key]; }, 0);
        var selectedInterestKeys = getClusterForField(answers.firstInterest);
        var selectedInterestKey = selectedInterestKeys[0] || "";
        var fitStatus = "Needs Guidance";

        if (topScore < 8 || totalCareerScore < 20 || Math.abs(topScore - secondScore) <= 2) fitStatus = "Unclear";
        else if (selectedInterestKey === primaryKey) fitStatus = "Strong Match";
        else if (selectedInterestKey === secondaryKey) fitStatus = "Partial Match";

        var careerConfidence = Math.min(100, Math.max(0, 45 + (topScore * 2.2)));
        var readinessRaw = Math.max(0, readinessScores.discipline) + Math.max(0, readinessScores.practical) + Math.max(0, readinessScores.communication);
        var readinessScore = Math.min(100, (readinessRaw / 45) * 100);
        var riskAdjustment = Math.max(0, 100 - (readinessScores.risk * 7));
        var overallScore = Math.round((careerConfidence * 0.45) + (readinessScore * 0.40) + (riskAdjustment * 0.15));
        overallScore = Math.max(35, Math.min(95, overallScore));

        var internshipReadiness = "Student needs foundation, consistency, or practical support first.";
        if (overallScore >= 80) internshipReadiness = "Strong readiness. Student may be ready after 1 focused course.";
        else if (overallScore >= 65) internshipReadiness = "Good readiness. Student may be ready after 1–2 courses.";
        else if (overallScore >= 50) internshipReadiness = "Basic readiness. Student needs training and guidance first.";

        return { score: overallScore, primary: clusterLabels[primaryKey], secondary: clusterLabels[secondaryKey], interest: answers.firstInterest || "Not sure yet", fitStatus: fitStatus, internshipReadiness: internshipReadiness, careerScores: careerScores, readinessScores: readinessScores };
      }

      function renderResult(result) {
        var primaryData = clusterData[result.primary];
        var explanation = "You selected " + result.interest + " as your main interest. Your answers show stronger indicators toward " + result.primary + ". ";
        if (result.fitStatus === "Strong Match") explanation += "This confirms a strong starting direction, so beginning with " + primaryData.firstPath + " may be a good first step.";
        else if (result.fitStatus === "Partial Match") explanation += "Your interest is useful and connected, but " + result.primary + " may be a stronger first path before expanding further.";
        else if (result.fitStatus === "Needs Guidance") explanation += "Your selected interest was considered, but your answers show stronger indicators in another direction, so guided training can help confirm the best path.";
        else explanation += "Your answers are close across multiple directions, so guided exploration and a short beginner project can help confirm the best path.";
        explanation += " " + primaryData.explanation;

        root.querySelector("#wrkitScore").textContent = result.score + "%";
        root.querySelector("#wrkitScoreCircle").style.setProperty("--wrkit-score-angle", (result.score * 3.6) + "deg");
        root.querySelector("#wrkitPositiveExplanation").textContent = explanation;
        root.querySelector("#wrkitFitStatus").textContent = result.fitStatus;
        root.querySelector("#wrkitFitStatusBox").textContent = result.fitStatus;
        root.querySelector("#wrkitPrimaryBadge").textContent = "Primary: " + result.primary;
        root.querySelector("#wrkitSecondaryBadge").textContent = "Secondary: " + result.secondary;
        root.querySelector("#wrkitPrimaryDirection").textContent = result.primary;
        root.querySelector("#wrkitSecondaryDirection").textContent = result.secondary;
        root.querySelector("#wrkitSelectedInterest").textContent = result.interest;

        var futureFields = root.querySelector("#wrkitFutureFields");
        futureFields.innerHTML = "";
        primaryData.fields.forEach(function (field) {
          var li = document.createElement("li");
          li.textContent = field;
          futureFields.appendChild(li);
        });

        root.querySelector("#wrkitFirstPath").textContent = primaryData.firstPath;
        root.querySelector("#wrkitSecondPath").textContent = primaryData.secondPath;
        root.querySelector("#wrkitInternshipReadiness").textContent = primaryData.internshipMessage + " " + result.internshipReadiness;
        formArea.style.display = "none";
        resultArea.classList.add("is-active");
        root.scrollIntoView({ behavior: "smooth", block: "start" });
      }


      function buildResultText(answers, result) {
        var futureFields = clusterData[result.primary].fields.join(", ");
        var firstPath = clusterData[result.primary].firstPath;
        var secondPath = clusterData[result.primary].secondPath;
        var explanation = root.querySelector("#wrkitPositiveExplanation").textContent;
        var internshipReadiness = root.querySelector("#wrkitInternshipReadiness").textContent;
        return [
          "WRKIT Incubator Career Direction / Aptitude Assessment",
          "",
          "Student Name: " + answers.studentName,
          "Student Email: " + answers.studentEmail,
          "Aptitude Score: " + result.score + "%",
          "Fit Status: " + result.fitStatus,
          "Selected Interest: " + result.interest,
          "Primary Career Direction: " + result.primary,
          "Secondary Career Direction: " + result.secondary,
          "Recommended Future Fields: " + futureFields,
          "First Learning Path: " + firstPath,
          "Second Learning Path: " + secondPath,
          "Internship Readiness: " + internshipReadiness,
          "",
          "Explanation:",
          explanation,
          "",
          "Guidance disclaimer: This is a practical career direction assessment for WRKIT Incubator guidance. It is not a pass/fail test and not a scientific psychological test."
        ].join("\n");
      }

      function setEmailStatus(message, isError) {
        var status = root.querySelector("#wrkitEmailStatus");
        if (!status) return;
        status.textContent = message;
        status.classList.add("is-visible");
        status.classList.toggle("is-error", !!isError);
      }

      function downloadTestResult() {
        if (!latestAnswers || !latestResult) return;
        if (typeof html2canvas === "undefined") {
          setEmailStatus("Screenshot download is not ready. Please check your internet connection and try again.", true);
          return;
        }

        var resultCard = root.querySelector(".wrkit-result-card");
        var downloadButton = root.querySelector("#wrkitDownloadTest");
        var safeName = (latestAnswers.studentName || "student").replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() || "student";
        downloadButton.disabled = true;
        downloadButton.textContent = "Preparing Image...";

        html2canvas(resultCard, {
          backgroundColor: "#ffffff",
          scale: Math.min(2, window.devicePixelRatio || 1),
          useCORS: true
        }).then(function (canvas) {
          var link = document.createElement("a");
          link.href = canvas.toDataURL("image/png");
          link.download = "wrkit-career-assessment-" + safeName + ".png";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }).catch(function () {
          setEmailStatus("Screenshot could not be downloaded. Please try again.", true);
        }).then(function () {
          downloadButton.disabled = false;
          downloadButton.textContent = "Download Test";
        });
      }

      function sendResultEmail(answers, result) {
        setEmailStatus("Sending result to " + answers.studentEmail + " and " + wrkitEmail + "...", false);
        return fetch(emailEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentEmail: answers.studentEmail,
            wrkitEmail: wrkitEmail,
            subject: "WRKIT Career Assessment Result - " + answers.studentName,
            resultText: buildResultText(answers, result),
            answers: answers,
            result: result
          })
        }).then(function (response) {
          if (!response.ok) throw new Error("Email request failed");
          setEmailStatus("Result sent to " + answers.studentEmail + " and " + wrkitEmail + ".", false);
        }).catch(function () {
          setEmailStatus("Result is ready, but email could not be sent. Please check the backend email setup.", true);
        });
      }
      function resetAssessment() {
        form.reset();
        currentStep = 1;
        latestAnswers = null;
        latestResult = null;
        resultArea.classList.remove("is-active");
        formArea.style.display = "block";
        root.querySelector("#wrkitScoreCircle").style.setProperty("--wrkit-score-angle", "0deg");
        goToStep(1);
        root.scrollIntoView({ behavior: "smooth", block: "start" });
      }

      root.querySelectorAll("[data-next]").forEach(function (button) {
        button.addEventListener("click", function () {
          if (!validateStep(currentStep)) return;
          goToStep(currentStep + 1);
        });
      });

      root.querySelectorAll("[data-back]").forEach(function (button) {
        button.addEventListener("click", function () { goToStep(currentStep - 1); });
      });

      root.addEventListener("change", function (event) {
        if (event.target && (event.target.matches("input[type='radio']") || event.target.matches("input[type='checkbox']"))) updateSelectedStyles();
      });

      form.addEventListener("submit", function (event) {
        event.preventDefault();
        if (!validateStep(currentStep)) return;
        var answers = collectAnswers();
        var scores = calculateScores(answers);
        var result = generateRecommendations(scores, answers);
        latestAnswers = answers;
        latestResult = result;
        renderResult(result);
        sendResultEmail(answers, result);
      });

      root.querySelector("#wrkitDownloadTest").addEventListener("click", downloadTestResult);
      root.querySelector("#wrkitRetake").addEventListener("click", resetAssessment);
      root.querySelector("#wrkitCloseResult").addEventListener("click", resetAssessment);
      goToStep(1);
    })();
