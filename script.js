// ==============================
// Google Apps Script Web App URL
// ==============================
const BASE_URL = "https://script.google.com/macros/s/AKfycbx-wNqwK7Ag1bjM2G3Yg1cwiDG45uR7R4d7NGBN2Kmb0SskZJZA-jLIUy3RbaXwbm4H/exec";

// ==============================
// Global Variables
// ==============================
let employees = [];
let filteredEmployees = [];
let allData = [];
let Report = [];
let allLinks = [];
let dataReady = false;

// ==============================
// Helper: Safe Date Parser
// ==============================
function parseDate(value) {

    if (!value) return null;


    if (value instanceof Date) {
        return isNaN(value.getTime()) ? null : value;
    }


    if (typeof value === "string" && value.includes("/")) {

        const parts = value.split("/");

        if(parts.length === 3){

            const month = parts[0];
            const day = parts[1];
            const year = parts[2];

            return new Date(
                `${year}-${month}-${day}`
            );

        }

    }


    const d = new Date(value);

    return isNaN(d.getTime()) ? null : d;
}

// ==============================
// WAIT FOR DATA
// ==============================
function waitForDataAndRender(name) {
    if (!dataReady) {
        setTimeout(() => waitForDataAndRender(name), 300);
        return;
    }
    renderMistakes(name);
}

// ==============================
// LOAD DATA
// ==============================

document.addEventListener("DOMContentLoaded", () => {
    loadData();
});

  let firstLoad = true;

function loadData() {

    Promise.all([
        fetch(BASE_URL + "?type=employee").then(r => r.json()),
        fetch(BASE_URL + "?type=links").then(r => r.json()),
        fetch(BASE_URL + "?type=mistake").then(r => r.json()),
        fetch(BASE_URL + "?type=report").then(r => r.json())
    ])
    .then(([employeeData, linksData, mistakeData, reportData]) => {

        employees = employeeData || [];
        filteredEmployees = employeeData || [];
        allLinks = linksData || [];
        allData = Array.isArray(mistakeData) ? mistakeData : [];
        Report = Array.isArray(reportData) ? reportData : [];

        // শুধু প্রথমবার Link Render হবে
        if (firstLoad) {

            renderLinks("BO","boLinks");
            renderLinks("Website Link","wbLinks");
            renderLinks("Chat Link","ctLinks");
            renderLinks("Deposit PLY","depositPlyLinks");
            renderLinks("Deposit Sheet","depositSheetLinks");
            renderLinks("SOP","sopLinks");
            renderLinks("Sports BO","sportsBoLinks");
            renderLinks("Sports","sportsGameLinks");
            renderLinks("Other","otherLinks");

            if (employees.length > 0) {
                showEmployeeByObject(employees[0]);
            }

            firstLoad = false;
        }

        // যদি কোনো CS Select থাকে
        const empName = document.getElementById("empName")?.innerText;

        if (empName && empName !== "Select Employee") {
            renderMistakes(empName);
        }

        // Report Page Auto Refresh
        if (document.getElementById("reportPage").style.display !== "none") {
            renderAllMistakes();
        }

    })
    .catch(console.error);
}



// প্রতি ১০ সেকেন্ডে নতুন Data Load
setInterval(loadData, 10000);

// ==============================
// EMPLOYEE LIST
// ==============================
function renderEmployeeList(list) {

    const container = document.getElementById("employeeList");
    if (!container) return;

    container.innerHTML = "";

    list.forEach(emp => {

        const card = document.createElement("div");
        card.className = "employee";

        card.innerHTML = `
            <h4>${emp["CS Name"] || "-"}</h4>
            <p>${emp["STAFF Position"] || "-"}</p>
        `;

        card.onclick = () => {
            showEmployeeByObject(emp);
            document.getElementById("search").value = emp["CS Name"] || "";
            container.innerHTML = "";
        };

        container.appendChild(card);
    });
}

// ==============================
// LOAD MONTHS
// ==============================
function loadMonths(allData) {

    const select = document.getElementById("monthSelect");
    if (!select) return;

    select.innerHTML = '<option value="All">All Months</option>';

    const months = [];

    allData.forEach(item => {

        const d = parseDate(item["Date"]);
        if (!d) return;

        const month = d.toLocaleString("default", {
            month: "long",
            year: "numeric"
        });

        if (!months.includes(month)) {
            months.push(month);
        }
    });

    months.forEach(month => {
        const option = document.createElement("option");
        option.value = month;
        option.textContent = month;
        select.appendChild(option);
    });
}

// ==============================
// SEARCH
// ==============================
document.getElementById("search").addEventListener("keyup", function () {

    const txt = this.value.trim().toLowerCase();

    if (!txt) {
        document.getElementById("employeeList").innerHTML = "";
        return;
    }

    const filtered = employees.filter(emp =>
        String(emp["CS Name"] || "").toLowerCase().includes(txt)
    );

    renderEmployeeList(filtered);
});

// ==============================
// SHOW EMPLOYEE
// ==============================
function showEmployeeByObject(emp, showrport = true) {
    if (!emp) return;

    const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.innerText = value || "-";
    };

    setText("empName", emp["CS Name"]);
    setText("empPosition", emp["STAFF Position"]);
    setText("psd", emp["PSD ID"]);
    setText("office", emp["Office Location"] || emp["Office Locaton"] || "-");
    setText("teamid", emp["STAFF MS Team ID"]);
    setText("agent", emp["ICX Agent"]);
    setText("group", emp["Group"]);
    setText("mistake", emp["Mistake"]);

    const search = document.getElementById("search");
    if (search) search.value = emp["CS Name"] || "";

    const list = document.getElementById("employeeList");
    if (list) list.innerHTML = "";

    // Avatar SAFE
    const avatar = document.getElementById("avatar");
    if (avatar) {
        const name = (emp?.["CS Name"] || "").trim();
avatar.innerText = name.length ? name.charAt(0).toUpperCase() : "?";
    }

    // Brands (safe call assumed setBrand exists)
    setBrand("superbo", emp["Super BO"]);
    setBrand("dp", emp["DP"]);
    setBrand("kv", emp["KV"]);
    setBrand("hb", emp["HB"]);
    setBrand("jb", emp["JB"]);
    setBrand("jway", emp["JWAY"]);
    setBrand("sb", emp["SB"]);
    setBrand("slb", emp["SLB"]);
    setBrand("bjdb", emp["BJDB"]);
    setBrand("bn", emp["BN"]);
    setBrand("bdvegas", emp["BDVegas"]);
    setBrand("cpc88", emp["CPC88"]);
    setBrand("deshi777", emp["Deshi777"]);

    if (showrport) {
        renderMistakes(emp["CS Name"]);
    }
}

// ==============================
// BRAND CARD
// ==============================
function setBrand(id, value) {

    const box = document.getElementById(id);
    if (!box) return;

    const title = box.dataset?.title || "";

    if (value && value.toString().trim() !== "") {

        box.className = "brand-card active-brand";

        box.innerHTML = `
            <div class="brand-name">${title}</div>
            <div class="brand-value">${value}</div>
        `;

    } else {

        box.className = "brand-card inactive-brand";

        box.innerHTML = `
            <div class="brand-name">${title}</div>
            <div class="brand-value">No Access</div>
        `;
    }
}

// ==============================
// PAGE SWITCH
// ==============================
function showPage(page, element) {

    ["employeePage", "reportPage", "linksPage", "WebsitePage", "depositPage", "SOPPage", "SportsPage", "OtherPage"]
        .forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = "none";
        });

    document.querySelectorAll(".menu-item")
        .forEach(item => item.classList.remove("active"));

    const target = document.getElementById(page + "Page");
    if (target) target.style.display = "block";

    if (element) element.classList.add("active");
}

// ==============================
// S10 Page MISTAKES
// ==============================

function getRunningMonth() {
    const now = new Date();

    return now.toLocaleString("default", {
        month: "long",
        year: "numeric"
    });
}

function renderMistakes(csName) {

    const container = document.getElementById("mistakeContainer");
    if (!container) return;

    container.innerHTML = "";

    const cleanName = String(csName || "")
        .trim()
        .toLowerCase();

    if (!cleanName) {
        container.innerHTML = "<p>No employee selected</p>";
        return;
    }

    const runningMonth = getRunningMonth();
container.innerHTML = `
<div class="mistake-header">
    <div>
        <h2>Showing mistakes for current month
</h2>
        
    </div>

    <div class="month-badge">
        📅 ${runningMonth}
    </div>
</div>
`;

    const mistakes = Report.filter(item => {

        const itemName = String(item["CS Name"] || "")
            .trim()
            .toLowerCase();
       const d = parseDate(item["Date"]);
        if (!d) return false;
       const itemMonth = d.toLocaleString("default", {
            month: "long",
            year: "numeric"
        });

        return (
            itemName === cleanName &&
            itemMonth === runningMonth
        );
    });

    if (mistakes.length === 0) {
    container.innerHTML += `
        <p class="no-data">
            No mistakes found for ${runningMonth}
        </p>
    `;
    return;
}

container.innerHTML += mistakes.map(item => {

    const date = parseDate(item["Date"]);

    const badgeColor = {
        "Wrong Information": "wrong-information",
        "Not Follow SOP": "not-follow-sop",
        "Late Reply": "late-reply",
        "No Reply": "no-reply",
        "Angry With Player": "angry-player",
        "Non Professional": "non-professional",
        "No solution": "no-solution",
        "No explanation": "no-explanation",
        "Verbal warning": "verbal-warning",
        "Warning letter": "warning-letter"
    };

    const colorClass = badgeColor[item["Subject"]] || "default";

    return `
    <div class="mistake-card ${colorClass}">

        <div class="card-top">

            <span class="subject ${colorClass}">
                ${item["Subject"]}
            </span>

            <span class="date ${colorClass}">
                📅 ${date ? date.toLocaleDateString("en-GB") : "-"}
            </span>

        </div>

        <p class="remarks">
            <strong>REMARKS:</strong>
            ${item["Detailed Remark"] || "-"}
        </p>

        <hr>

        <p class="link">
            🔗
            ${
                item["Screenshot link"]
                ? `<a href="${item["Screenshot link"]}" target="_blank">View Screenshot</a>`
                : "No Screenshot"
            }
        </p>

    </div>
    `;

}).join("");

container.innerHTML += `
<div class="end-list">
    <hr>
    <span>ⓘ End of list</span>
    <hr>
</div>
`;
}
// ==============================
// ALL MISTAKES REPORT (Report Page)
// ==============================

function renderAllMistakes() {

    const container = document.getElementById("reportMistakeContainer");
    if (!container) return;

    // সব রিপোর্ট নাও
    let mistakes = [...allData];

// True / False Count
const trueCount = mistakes.filter(item =>
    String(item["Reported in file"] || "").trim().toUpperCase() === "TRUE"
).length;

const notCounted = mistakes.length - trueCount;

    // নতুন থেকে পুরাতন সাজাও
    mistakes.sort((a, b) => {
        const dateA = parseDate(a["Date"]) || new Date(0);
        const dateB = parseDate(b["Date"]) || new Date(0);
            if (dateB - dateA !== 0) {
        return dateB - dateA;
    }

    // একই তারিখ হলে, বড় Row আগে
    return b.Row - a.Row;
});

    // Header
container.innerHTML = `
<div class="mistake-header">

    <div>
        <h2>All Mistakes Reports</h2>
    </div>

    <div style="display:flex;gap:10px;align-items:center;">

        <div class="count-badge">
            📊 ${mistakes.length} Reports
        </div>

        <div class="count-badge success">
           🔴 ${trueCount} Counted
        </div>

        <div class="count-badge danger">
            🟢 ${notCounted} Not Counted
        </div>

    </div>

</div>
`;

    if (!mistakes.length) {
        container.innerHTML += `
            <p class="no-data">
                No reports found.
            </p>
        `;
        return;
    }

    const badgeColor = {
        "Wrong Information": "wrong-information",
        "Not Follow SOP": "not-follow-sop",
        "Late Reply": "late-reply",
        "No Reply": "no-reply",
        "Angry With Player": "angry-player",
        "Non Professional": "non-professional",
        "No solution": "no-solution",
        "No explanation": "no-explanation",
        "Verbal warning": "verbal-warning",
        "Warning letter": "warning-letter"
    };

    const html = mistakes.map(item => {

        const date = parseDate(item["Date"]);
        const colorClass = badgeColor[item["Subject"]] || "default";

        const feedback = String(item["Feedback from (TL/Senior)"] || "").trim();
        const chatLink = String(item["Chat link"] || "").trim();
        const screenshotLink = String(item["Screenshot link"] || "").trim();
const reported =
    String(item["Reported in file"] || "").trim().toUpperCase();

const reportClass =
    reported === "TRUE"
        ? "reported-true"
        : "reported-false";

const feedbackClass =
    feedback
        ? ""
        : "feedback-empty";
        return `
            <div class="mistake-card ${colorClass} ${reportClass}">

                <p class="cs-name">
                    👤 <strong>${item["CS Name"] || "-"}</strong>
                </p>

                <div class="card-top">

                    <span class="subject ${colorClass}">
                        ${item["Subject"] || "-"}
                    </span>

                    <span class="date ${colorClass}">
                        📅 ${date ? date.toLocaleDateString("en-GB") : "-"}
                    </span>

                </div>

                <p class="remarks ${feedbackClass}">
                    <strong>Mon REMARKS:</strong><br>
                    ${item["Detailed Remark"] || "-"}
                </p>

                <hr>

                <p class="remarks">
                    <strong>Feedback from (TL/Senior):</strong><br>
                    ${feedback || "-"}
                </p>

                <hr>

                <div class="links">

                    ${
                        chatLink
                        ? `<a href="${chatLink}" target="_blank" class="chat-link">💬 View Chat</a>`
                        : ""
                    }

                    ${
                        screenshotLink
                        ? `<a href="${screenshotLink}" target="_blank" class="ss-link">🖼 View Screenshot</a>`
                        : ""
                    }

                    ${
                        !chatLink && !screenshotLink
                        ? `<span>No Attachment</span>`
                        : ""
                    }

                </div>

            </div>
        `;

    }).join("");

container.insertAdjacentHTML("beforeend", html);

    container.innerHTML += `
        <div class="end-list">
            <hr>
            <span>ⓘ End of list</span>
            <hr>
        </div>
    `;
}

// ==============================
// LINKS
// ==============================
function renderLinks(category, containerId) {

    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = "";

    allLinks
        .filter(item =>
            item.Category === category &&
            String(item.Active).toUpperCase() === "TRUE"
        )
        .forEach(item => {

            container.innerHTML += `
                <div class="link-card ${item.Color}">
                    <a href="${item.URL}" target="_blank">${item.Name}</a>
                </div>
            `;
        });
}

function logout(){

    if(confirm("Are you sure you want to logout?")){

        localStorage.removeItem("user");
        window.location.href="login.html";

    }

}
