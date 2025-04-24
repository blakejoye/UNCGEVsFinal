document.addEventListener("DOMContentLoaded", () => {
    // Populate dropdown with charger names
    fetch("/chargers")
        .then(res => res.json())
        .then(chargers => {
            const dropdown = document.getElementById("chargerId");
            dropdown.innerHTML = '<option value="">Select a charger</option>';
            chargers.forEach(c => {
                const option = document.createElement("option");
                option.value = c.chargerid;
                option.textContent = c.location;
                dropdown.appendChild(option);
            });
        })
        .catch(err => console.error("❌ Error loading chargers:", err));

    const form = document.getElementById("reportForm");
    const message = document.getElementById("reportMessage");
    const reportedByInput = document.getElementById("reportedBy");

    const storedUsername = localStorage.getItem("username");
    const storedUserId = localStorage.getItem("userId");

    // Show username but send ID
    if (storedUsername && reportedByInput) {
        reportedByInput.value = storedUsername;
        reportedByInput.disabled = true;
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const chargerId = document.getElementById("chargerId").value;
        const issueDescription = document.getElementById("issueDescription").value;

        const reportedBy = storedUserId;  // Send user ID to backend

        try {
            const res = await fetch("/maintenance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    chargerid: chargerId,
                    reported_by: reportedBy,
                    issue_description: issueDescription
                })
            });

            const data = await res.json();
            if (res.ok) {
                message.textContent = "✅ Issue reported successfully!";
                message.style.color = "lime";
                message.classList.remove("hidden");
                form.reset();
                reportedByInput.value = storedUsername;
            } else {
                throw new Error(data.message || "Failed to report issue.");
            }
        } catch (err) {
            console.error("❌ Report failed:", err);
            message.textContent = "❌ Could not submit report. Try again.";
            message.style.color = "red";
            message.classList.remove("hidden");
        }
    });
});
