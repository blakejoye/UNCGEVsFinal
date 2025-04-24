
document.addEventListener("DOMContentLoaded", function () {
    fetchMaintenanceReports();
    fetchOpenTickets();

    document.getElementById("resolveBtn").addEventListener("click", resolveIssue);
    document.querySelector("#viewModal .delete-btn").addEventListener("click", deleteReport);

    document.getElementById("reportIssueBtn").addEventListener("click", function () {
        document.getElementById("reportForm").reset();
        document.getElementById("reportModal").style.display = "flex";
    });

    document.getElementById("reportForm").addEventListener("submit", async function (e) {
        e.preventDefault();

        const chargerid = document.getElementById("chargerIdInput").value;
        const reported_by = document.getElementById("reportedByInput").value;
        const issue_description = document.getElementById("issueDescriptionInput").value;

        try {
            const res = await fetch("/api/maintenance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chargerid, reported_by, issue_description })
            });

            if (res.ok) {
                alert("✅ Issue reported successfully!");
                closeModal();
                fetchMaintenanceReports();
            } else {
                alert("❌ Failed to report issue.");
            }
        } catch (err) {
            console.error("Error submitting report:", err);
        }
    });

    document.querySelector(".tab-btn.active").addEventListener("click", function (event) {
        showTab(event, 'pending');
    });

    document.querySelectorAll(".tab-btn")[1].addEventListener("click", function (event) {
        showTab(event, 'tickets');
    });
});

function showTab(event, tab) {
    document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

    document.getElementById(tab + 'Tab').style.display = 'block';
    event.target.classList.add('active');

    if (tab === 'tickets') fetchOpenTickets();
}

async function fetchMaintenanceReports() {
    const maintenanceTable = document.getElementById("maintenanceTable");

    try {
        const response = await fetch("/maintenance");
        if (!response.ok) throw new Error("Bad response from server");

        const reports = await response.json();

        if (reports.length === 0) {
            maintenanceTable.innerHTML = `<tr><td colspan="6" style="text-align:center;">No pending reports found.</td></tr>`;
            return;
        }

        maintenanceTable.innerHTML = reports.map(report => `
            <tr>
                <td>${report.report_id}</td>
                <td>${report.location || "Unknown"}</td>
                <td>${report.reported_by_name || report.reported_by}</td>
                <td>${report.issue_description}</td>
                <td>${report.status}</td>
                <td>
                    <button class="view-btn" onclick="openReport(${report.report_id}, '${report.location || "Unknown"}', '${report.reported_by_name || report.reported_by}', '${report.issue_description}', '${report.status}')">View</button>
                    <button onclick="assignTicket(${report.report_id})">Open Ticket</button>
                </td>
            </tr>
        `).join("");
    } catch (error) {
        console.error("❌ Error fetching maintenance reports:", error);
        maintenanceTable.innerHTML = `<tr><td colspan="6" style="text-align:center; color: red;">Failed to load reports.</td></tr>`;
    }
}

async function fetchOpenTickets() {
    const ticketsTable = document.getElementById("ticketsTable");

    try {
        const response = await fetch("/maintenance");
        const reports = await response.json();
        const openTickets = reports.filter(r => r.status === 'in_progress');

        if (openTickets.length === 0) {
            ticketsTable.innerHTML = `<tr><td colspan="6" style="text-align:center;">No open tickets found.</td></tr>`;
            return;
        }

        ticketsTable.innerHTML = openTickets.map(report => `
            <tr>
                <td>${report.report_id}</td>
                <td>${report.location || "Unknown"}</td>
                <td>${report.assigned_to || "Unassigned"}</td>
                <td>${report.issue_description}</td>
                <td><textarea id="resolution_${report.report_id}" placeholder="Add resolution note"></textarea></td>
                <td><button style="background-color: green; color: white;" onclick="submitResolution(${report.report_id})">Resolve</button></td>
            </tr>
        `).join("");
    } catch (err) {
        console.error("Failed to fetch open tickets:", err);
    }
}

async function submitResolution(reportId) {
    const note = document.getElementById(`resolution_${reportId}`).value;
    if (!note) return alert("Please enter a resolution note.");

    const res = await fetch(`/maintenance/${reportId}/resolve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolution_note: note })
    });

    if (res.ok) {
        alert("Ticket resolved!");
        fetchOpenTickets();
        fetchMaintenanceReports();
    } else {
        console.error("Failed to resolve ticket.");
    }
}

function openReport(id, chargerName, reportedBy, description, status) {
    document.getElementById("modalReportId").textContent = id;
    document.getElementById("modalChargerId").textContent = chargerName;
    document.getElementById("modalReportedBy").textContent = reportedBy;
    document.getElementById("modalDescription").textContent = description;
    document.getElementById("modalStatus").textContent = status;

    const resolveBtn = document.getElementById("resolveBtn");
    resolveBtn.style.display = status === "resolved" ? "none" : "inline-block";

    document.getElementById("viewModal").style.display = "flex";
}

async function resolveIssue() {
    const reportId = document.getElementById("modalReportId").innerText;

    const response = await fetch(`/maintenance/${reportId}/resolve`, {
        method: "PUT"
    });

    if (response.ok) {
        closeModal();
        fetchMaintenanceReports();
    } else {
        console.error("Failed to resolve issue");
    }
}

async function deleteReport() {
    const reportId = document.getElementById("modalReportId").innerText;

    if (confirm("Are you sure you want to close this report?")) {
        const response = await fetch(`/maintenance/${reportId}`, { method: "DELETE" });

        if (response.ok) {
            closeModal();
            fetchMaintenanceReports();
        } else {
            console.error("Failed to delete report");
        }
    }
}

async function assignTicket(reportId) {
    const assignedTo = prompt("Assign this ticket to (technician name or ID):");

    if (!assignedTo) {
        alert("Ticket assignment cancelled.");
        return;
    }

    try {
        const res = await fetch(`/maintenance/${reportId}/assign`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ assigned_to: assignedTo })
        });

        if (res.ok) {
            alert("Ticket opened and assigned.");
            fetchMaintenanceReports();
            fetchOpenTickets();
        } else {
            throw new Error("Ticket assignment failed.");
        }
    } catch (err) {
        console.error("❌ Assign failed:", err);
        alert("Could not assign ticket.");
    }
}

function openModal() {
    document.getElementById("reportModal").style.display = "flex";
}

function closeModal() {
    document.getElementById("reportModal").style.display = "none";
    document.getElementById("viewModal").style.display = "none";
}
